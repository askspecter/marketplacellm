// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {NeumaBuybackBurn} from "../src/NeumaBuybackBurn.sol";

/**
 * Deploys NeumaBuybackBurn for the $NEUMA / ETH Uniswap v4 pool.
 *
 * Fill these env vars before running (see README):
 *   PRIVATE_KEY         deployer/owner key (never commit)
 *   POOL_MANAGER        Uniswap v4 PoolManager on Robinhood Chain
 *   NEUMA               0xa6f1a20408c8edb181a0e8faa54357c70b8f730a
 *   FUNDING             asset spent to buy back (0x0 = native ETH)
 *   POOL_FEE            pool fee (e.g. 3000 = 0.30%) from graduation
 *   POOL_TICK_SPACING   pool tickSpacing from graduation (e.g. 60)
 *   POOL_HOOKS          hooks address of the pool (0x0 if none)
 *   MAX_SPEND_PER_RUN   per-round cap in funding-asset wei (e.g. a few $ of ETH)
 *
 * Run:
 *   forge script script/DeployBuybackBurn.s.sol \
 *     --rpc-url $ROBINHOOD_RPC_URL --broadcast
 */
contract DeployBuybackBurn is Script {
    function run() external {
        address poolManager = vm.envAddress("POOL_MANAGER");
        address neuma = vm.envAddress("NEUMA");
        address funding = vm.envAddress("FUNDING"); // 0x0 for native ETH
        uint24 fee = uint24(vm.envUint("POOL_FEE"));
        int24 tickSpacing = int24(int256(vm.envInt("POOL_TICK_SPACING")));
        address hooks = vm.envAddress("POOL_HOOKS");
        uint256 maxSpendPerRun = vm.envUint("MAX_SPEND_PER_RUN");

        // v4 orders currencies by address; native ETH (0x0) is always currency0.
        (address c0, address c1) = funding < neuma ? (funding, neuma) : (neuma, funding);

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(c0),
            currency1: Currency.wrap(c1),
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(hooks)
        });

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        NeumaBuybackBurn engine = new NeumaBuybackBurn(
            IPoolManager(poolManager),
            key,
            Currency.wrap(neuma),
            maxSpendPerRun,
            msg.sender // owner
        );
        vm.stopBroadcast();

        console2.log("NeumaBuybackBurn deployed at:", address(engine));
        console2.log("owner:", engine.owner());
    }
}
