// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "v4-core/interfaces/callback/IUnlockCallback.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {SwapParams} from "v4-core/types/PoolOperation.sol";
import {TickMath} from "v4-core/libraries/TickMath.sol";

interface IERC20Min {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address a) external view returns (uint256);
}

/**
 * @title  NeumaBuybackBurn
 * @notice Buys back $NEUMA with the treasury's funding asset on a Uniswap v4
 *         pool and burns it (sends to 0x…dEaD). Designed to be driven by a
 *         keeper on a fixed cadence (e.g. $2 every 60 seconds from round 1).
 *
 *         The contract only executes the swap+burn atomically and safely; the
 *         *schedule* (once per minute) and the *USD sizing* ($2 -> amountIn) are
 *         computed off-chain by the keeper and passed in, with on-chain guards:
 *           - only an authorized keeper may trigger a round,
 *           - a round can fire at most once per `interval` seconds,
 *           - `amountIn` is capped by `maxSpendPerRun`,
 *           - `minNeumaOut` enforces slippage protection.
 *
 * @dev    Uniswap v4 swaps go through PoolManager.unlock -> unlockCallback.
 *         Fill the pool parameters (PoolManager address, the NEUMA pool's fee /
 *         tickSpacing / hooks, and which currency is NEUMA) at construction.
 *
 *         THIS HANDLES REAL FUNDS. Test on a testnet and get it audited before
 *         funding it on mainnet.
 */
contract NeumaBuybackBurn is IUnlockCallback {
    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;

    IPoolManager public immutable poolManager;
    /// @notice The NEUMA token being bought back and burned.
    Currency public immutable neuma;
    /// @notice The asset spent to buy NEUMA (native ETH = address(0), or an ERC20).
    Currency public immutable funding;
    /// @notice True when NEUMA is currency0 of the pool (so funding is currency1).
    bool public immutable neumaIsCurrency0;

    // Pool identity (v4 PoolKey). currency0 < currency1 by address; native = 0.
    PoolKey public poolKey;

    address public owner;
    mapping(address => bool) public isKeeper;
    bool public paused;

    /// @notice Minimum seconds between rounds (60 = once per minute).
    uint32 public interval = 60;
    /// @notice Hard cap on funding spent per round, so a compromised keeper
    ///         cannot drain the treasury in one call. Set to ~a few $ of funding.
    uint256 public maxSpendPerRun;
    uint256 public lastRun;

    uint256 public round;
    uint256 public totalSpent;
    uint256 public totalBurned;

    event Bought(uint256 indexed round, uint256 amountIn, uint256 neumaBurned, uint256 timestamp);
    event KeeperSet(address indexed keeper, bool allowed);
    event ParamsSet(uint32 interval, uint256 maxSpendPerRun);
    event PausedSet(bool paused);
    event OwnerSet(address indexed owner);
    event Rescued(address indexed token, address indexed to, uint256 amount);

    error NotOwner();
    error NotKeeper();
    error IsPaused();
    error TooSoon();
    error OverCap();
    error Slippage();
    error BadCaller();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(
        IPoolManager _poolManager,
        PoolKey memory _poolKey,
        Currency _neuma,
        uint256 _maxSpendPerRun,
        address _owner
    ) {
        poolManager = _poolManager;
        poolKey = _poolKey;
        neuma = _neuma;
        maxSpendPerRun = _maxSpendPerRun;
        owner = _owner == address(0) ? msg.sender : _owner;

        bool _neumaIs0 = Currency.unwrap(_poolKey.currency0) == Currency.unwrap(_neuma);
        neumaIsCurrency0 = _neumaIs0;
        funding = _neumaIs0 ? _poolKey.currency1 : _poolKey.currency0;

        emit OwnerSet(owner);
    }

    /// @notice Fund the engine by sending native ETH (when funding is native).
    receive() external payable {}

    // ─────────────────────────────────────────────────────────────────────
    //  Core: one buyback-and-burn round
    // ─────────────────────────────────────────────────────────────────────

    /**
     * @param amountIn     Amount of the funding asset to spend this round
     *                     (the keeper sizes this to ~$2 worth).
     * @param minNeumaOut  Minimum NEUMA to receive, or the round reverts.
     * @return burned      NEUMA amount bought and burned.
     */
    function buybackAndBurn(uint256 amountIn, uint256 minNeumaOut)
        external
        returns (uint256 burned)
    {
        if (!isKeeper[msg.sender] && msg.sender != owner) revert NotKeeper();
        if (paused) revert IsPaused();
        if (block.timestamp < lastRun + interval) revert TooSoon();
        if (amountIn == 0 || amountIn > maxSpendPerRun) revert OverCap();

        lastRun = block.timestamp;

        // zeroForOne is true when we sell currency0 for currency1. We sell
        // `funding` to buy `neuma`, so zeroForOne == (funding is currency0).
        bool zeroForOne = !neumaIsCurrency0;

        bytes memory res = poolManager.unlock(abi.encode(amountIn, zeroForOne));
        burned = abi.decode(res, (uint256));
        if (burned < minNeumaOut) revert Slippage();

        unchecked {
            round += 1;
            totalSpent += amountIn;
            totalBurned += burned;
        }
        emit Bought(round, amountIn, burned, block.timestamp);
    }

    /// @notice Uniswap v4 settlement callback. Only the PoolManager may call it.
    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        if (msg.sender != address(poolManager)) revert BadCaller();
        (uint256 amountIn, bool zeroForOne) = abi.decode(data, (uint256, bool));

        BalanceDelta delta = poolManager.swap(
            poolKey,
            SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: -int256(amountIn), // negative = exact input
                sqrtPriceLimitX96: zeroForOne
                    ? TickMath.MIN_SQRT_PRICE + 1
                    : TickMath.MAX_SQRT_PRICE - 1
            }),
            "" // no hook data
        );

        // For an exact-input swap: the input currency delta is negative (we owe
        // it) and the output currency delta is positive (we receive it).
        int128 d0 = delta.amount0();
        int128 d1 = delta.amount1();

        Currency inC = zeroForOne ? poolKey.currency0 : poolKey.currency1;
        Currency outC = zeroForOne ? poolKey.currency1 : poolKey.currency0;
        uint256 owed = zeroForOne ? uint256(uint128(-d0)) : uint256(uint128(-d1));
        uint256 out = zeroForOne ? uint256(uint128(d1)) : uint256(uint128(d0));

        _settle(inC, owed);
        // Take NEUMA straight to the burn address: acquired supply is removed.
        poolManager.take(outC, DEAD, out);

        return abi.encode(out);
    }

    /// @dev Pay what we owe to the PoolManager for the input currency.
    function _settle(Currency c, uint256 amount) internal {
        if (Currency.unwrap(c) == address(0)) {
            poolManager.settle{value: amount}();
        } else {
            poolManager.sync(c);
            IERC20Min(Currency.unwrap(c)).transfer(address(poolManager), amount);
            poolManager.settle();
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Admin
    // ─────────────────────────────────────────────────────────────────────

    function setKeeper(address keeper, bool allowed) external onlyOwner {
        isKeeper[keeper] = allowed;
        emit KeeperSet(keeper, allowed);
    }

    function setParams(uint32 _interval, uint256 _maxSpendPerRun) external onlyOwner {
        require(_interval > 0, "interval=0");
        interval = _interval;
        maxSpendPerRun = _maxSpendPerRun;
        emit ParamsSet(_interval, _maxSpendPerRun);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedSet(_paused);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "owner=0");
        owner = newOwner;
        emit OwnerSet(newOwner);
    }

    /// @notice Recover funds/tokens (e.g. to migrate the engine). Owner only.
    function rescue(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "to=0");
        if (token == address(0)) {
            (bool ok, ) = to.call{value: amount}("");
            require(ok, "eth send failed");
        } else {
            IERC20Min(token).transfer(to, amount);
        }
        emit Rescued(token, to, amount);
    }

    /// @notice How much funding the engine currently holds (native or ERC20).
    function treasuryBalance() external view returns (uint256) {
        if (Currency.unwrap(funding) == address(0)) return address(this).balance;
        return IERC20Min(Currency.unwrap(funding)).balanceOf(address(this));
    }
}
