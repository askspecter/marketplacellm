// app.js — logika bursa SurplusLLM: harga live, chart, order, portofolio.
(function () {
  "use strict";

  const STORE_KEY = "surplusllm.account.v1";
  const START_CASH = 100000;
  const fmtUSD = (n, d = 2) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtCompact = (n) => {
    if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
    return fmtUSD(n, 0);
  };
  const fmtVol = (n) => {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(Math.round(n));
  };
  const pct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
  const clsUp = (n) => (n >= 0 ? "up" : "down");

  // Warna logo deterministik dari ticker.
  function logoColor(t) {
    let h = 0;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 360;
    return `hsl(${h}, 68%, 62%)`;
  }

  // ---------- State akun ----------
  let account = loadAccount();
  function loadAccount() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return { cash: START_CASH, positions: {} }; // positions[ticker] = { qty, avg }
  }
  function saveAccount() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(account)); } catch (e) { /* ignore */ }
  }

  const byTicker = Object.fromEntries(ASSETS.map((a) => [a.ticker, a]));
  let activeCat = "all";
  let modalTicker = null;
  let modalSide = "buy";

  // ---------- Ticker berjalan ----------
  function renderTicker() {
    const bar = document.getElementById("tickerbar");
    const items = ASSETS.map((a) =>
      `<span class="ti"><span class="sym">${a.ticker}</span> ${fmtUSD(a.price)} <span class="${clsUp(a.changePct)}">${pct(a.changePct)}</span></span>`
    ).join("");
    bar.innerHTML = `<div class="track">${items}${items}</div>`;
  }

  // ---------- Sparkline & chart ----------
  function drawSpark(canvas, series, positive) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 96, h = canvas.clientHeight || 32;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const min = Math.min(...series), max = Math.max(...series), range = max - min || 1;
    ctx.beginPath();
    series.forEach((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = positive ? "#00c805" : "#ff5000";
    ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.stroke();
  }

  function drawAreaChart(canvas, series, positive) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 400, h = canvas.clientHeight || 150;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const min = Math.min(...series), max = Math.max(...series), range = max - min || 1;
    const pad = 6;
    const xy = series.map((v, i) => [
      (i / (series.length - 1)) * w,
      h - ((v - min) / range) * (h - pad * 2) - pad,
    ]);
    const color = positive ? "#00c805" : "#ff5000";
    // area
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, positive ? "rgba(0,200,5,0.25)" : "rgba(255,80,0,0.25)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.moveTo(xy[0][0], h);
    xy.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(xy[xy.length - 1][0], h);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    // line
    ctx.beginPath();
    xy.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
  }

  // ---------- Hero card ----------
  let heroTicker = "GPT5";
  function renderHero() {
    const a = byTicker[heroTicker];
    document.getElementById("heroName").textContent = a.name;
    document.getElementById("heroTicker").textContent = a.ticker + " · " + a.vendor;
    document.getElementById("heroPrice").textContent = fmtUSD(a.price);
    const hc = document.getElementById("heroChange");
    hc.textContent = `${a.change >= 0 ? "+" : ""}${fmtUSD(a.change)} (${pct(a.changePct)})`;
    hc.className = "hc-change " + clsUp(a.changePct);
    drawAreaChart(document.getElementById("heroChart"), a.series, a.changePct >= 0);
  }

  // ---------- Indeks ----------
  function renderIndex() {
    const idx = computeIndex();
    document.getElementById("idxValue").textContent =
      idx.value.toLocaleString("en-US", { maximumFractionDigits: 0 });
    const el = document.getElementById("idxChange");
    el.textContent = pct(idx.changePct);
    el.className = clsUp(idx.changePct);
  }

  // ---------- Tabel pasar ----------
  function renderMarket() {
    const body = document.getElementById("marketBody");
    const list = ASSETS.filter((a) => activeCat === "all" || a.category === activeCat);
    body.innerHTML = list.map((a) => `
      <tr data-ticker="${a.ticker}">
        <td>
          <div class="asset-cell">
            <div class="asset-logo" style="background:${logoColor(a.ticker)}">${a.ticker.slice(0, 2)}</div>
            <div class="asset-meta">
              <div class="an">${a.name}</div>
              <div class="at">${a.ticker} · ${a.category}</div>
            </div>
          </div>
        </td>
        <td class="num price-strong" data-px="${a.ticker}">${fmtUSD(a.price)}</td>
        <td class="num"><span class="chg-pill ${clsUp(a.changePct)}">${pct(a.changePct)}</span></td>
        <td class="num hide-sm">${fmtCompact(a.marketCap)}</td>
        <td class="num hide-sm">${fmtVol(a.volume)}</td>
        <td class="hide-sm"><canvas class="spark" data-spark="${a.ticker}"></canvas></td>
        <td class="num"><button class="trade-btn" data-trade="${a.ticker}">Trade</button></td>
      </tr>
    `).join("");
    list.forEach((a) => {
      const c = body.querySelector(`[data-spark="${a.ticker}"]`);
      if (c) drawSpark(c, a.series, a.changePct >= 0);
    });
  }

  // ---------- Portofolio ----------
  function renderPortfolio() {
    let holdings = 0;
    const rows = Object.entries(account.positions).filter(([, p]) => p.qty > 1e-9);
    const body = document.getElementById("holdingsBody");
    const empty = document.getElementById("holdingsEmpty");
    body.innerHTML = rows.map(([t, p]) => {
      const a = byTicker[t];
      const value = p.qty * a.price;
      holdings += value;
      const cost = p.qty * p.avg;
      const pnl = value - cost;
      const pnlPct = cost ? (pnl / cost) * 100 : 0;
      return `
        <tr>
          <td>
            <div class="asset-cell">
              <div class="asset-logo" style="background:${logoColor(t)}">${t.slice(0, 2)}</div>
              <div class="asset-meta"><div class="an">${a.name}</div><div class="at">${t}</div></div>
            </div>
          </td>
          <td class="num">${p.qty.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
          <td class="num">${fmtUSD(p.avg)}</td>
          <td class="num price-strong">${fmtUSD(a.price)}</td>
          <td class="num">${fmtUSD(value)}</td>
          <td class="num ${clsUp(pnl)}">${pnl >= 0 ? "+" : ""}${fmtUSD(pnl)} (${pct(pnlPct)})</td>
          <td class="num"><button class="trade-btn" data-trade="${t}">Trade</button></td>
        </tr>`;
    }).join("");
    empty.style.display = rows.length ? "none" : "block";

    const total = account.cash + holdings;
    document.getElementById("portTotal").textContent = fmtUSD(total);
    document.getElementById("portCash").textContent = fmtUSD(account.cash);
    document.getElementById("portHoldings").textContent = fmtUSD(holdings);
    document.getElementById("cashBalance").textContent = fmtUSD(account.cash, 0);

    const totalPnl = total - START_CASH;
    const pe = document.getElementById("portPnl");
    pe.textContent = `${totalPnl >= 0 ? "+" : ""}${fmtUSD(totalPnl)} sepanjang waktu`;
    pe.className = "ps-sub " + clsUp(totalPnl);
  }

  // ---------- Order book sintetis ----------
  function buildBook(price) {
    const asks = [], bids = [];
    let maxSz = 0;
    for (let i = 1; i <= 5; i++) {
      const aSz = Math.round(20 + Math.random() * 180);
      const bSz = Math.round(20 + Math.random() * 180);
      maxSz = Math.max(maxSz, aSz, bSz);
      asks.push({ px: price * (1 + i * 0.0015), sz: aSz });
      bids.push({ px: price * (1 - i * 0.0015), sz: bSz });
    }
    return { asks: asks.reverse(), bids, maxSz };
  }
  function renderBook() {
    const a = byTicker[modalTicker];
    const { asks, bids, maxSz } = buildBook(a.price);
    const row = (o) =>
      `<div class="ob-row"><span class="depth" style="width:${(o.sz / maxSz) * 100}%"></span>` +
      `<span class="px">${fmtUSD(o.px)}</span><span class="sz">${o.sz}</span></div>`;
    document.getElementById("obAsks").innerHTML = asks.map(row).join("");
    document.getElementById("obBids").innerHTML = bids.map(row).join("");
  }

  // ---------- Modal order ----------
  function openModal(ticker) {
    modalTicker = ticker; modalSide = "buy";
    document.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.side === "buy"));
    document.getElementById("qty").value = 1;
    syncModal();
    document.getElementById("modal").hidden = false;
  }
  function closeModal() { document.getElementById("modal").hidden = true; modalTicker = null; }

  function syncModal() {
    const a = byTicker[modalTicker];
    document.getElementById("mName").textContent = a.name;
    document.getElementById("mTicker").textContent = a.ticker + " · " + a.vendor;
    document.getElementById("mPrice").textContent = fmtUSD(a.price);
    const mc = document.getElementById("mChange");
    mc.textContent = pct(a.changePct);
    mc.className = "hc-change " + clsUp(a.changePct);

    const qty = parseFloat(document.getElementById("qty").value) || 0;
    const total = qty * a.price;
    document.getElementById("orderTotal").textContent = fmtUSD(total);
    const owned = account.positions[modalTicker]?.qty || 0;
    document.getElementById("ownedQty").textContent =
      owned.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " unit";

    const err = document.getElementById("orderErr");
    const btn = document.getElementById("confirmBtn");
    const afterEl = document.getElementById("orderAfter");

    if (modalSide === "buy") {
      afterEl.textContent = fmtUSD(account.cash - total);
      btn.textContent = "Konfirmasi beli";
      btn.style.background = "var(--green)"; btn.style.color = "#041400";
      const bad = qty <= 0 || total > account.cash;
      btn.disabled = bad;
      btn.style.opacity = bad ? 0.5 : 1;
      err.hidden = !(qty > 0 && total > account.cash);
      if (!err.hidden) err.textContent = "Kas tidak cukup untuk order ini.";
    } else {
      afterEl.textContent = fmtUSD(account.cash + total);
      btn.textContent = "Konfirmasi jual";
      btn.style.background = "var(--red)"; btn.style.color = "#1a0500";
      const bad = qty <= 0 || qty > owned + 1e-9;
      btn.disabled = bad;
      btn.style.opacity = bad ? 0.5 : 1;
      err.hidden = !(qty > 0 && qty > owned + 1e-9);
      if (!err.hidden) err.textContent = "Unit yang dimiliki tidak cukup.";
    }
    renderBook();
  }

  function executeOrder() {
    const a = byTicker[modalTicker];
    const qty = parseFloat(document.getElementById("qty").value) || 0;
    if (qty <= 0) return;
    const total = qty * a.price;
    const pos = account.positions[modalTicker] || { qty: 0, avg: 0 };

    if (modalSide === "buy") {
      if (total > account.cash) return;
      const newQty = pos.qty + qty;
      pos.avg = (pos.qty * pos.avg + total) / newQty;
      pos.qty = newQty;
      account.positions[modalTicker] = pos;
      account.cash -= total;
      toast(`Beli ${qty} ${a.ticker} @ ${fmtUSD(a.price)}`, "ok");
    } else {
      if (qty > pos.qty + 1e-9) return;
      pos.qty -= qty;
      account.cash += total;
      if (pos.qty <= 1e-9) delete account.positions[modalTicker];
      else account.positions[modalTicker] = pos;
      toast(`Jual ${qty} ${a.ticker} @ ${fmtUSD(a.price)}`, "ok");
    }
    saveAccount();
    renderPortfolio();
    closeModal();
  }

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg, kind) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast " + (kind || "");
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  // ---------- Simulasi harga live ----------
  function tickPrices() {
    ASSETS.forEach((a) => {
      const drift = (Math.random() - 0.5) * 2 * a.volatility * a.price * 0.0025;
      a.price = Math.max(a.prevClose * 0.5, a.price + drift);
      a.change = a.price - a.prevClose;
      a.changePct = (a.change / a.prevClose) * 100;
      a.series = a.series.slice(1).concat(a.price);
    });
    // Perbarui sel harga tanpa render ulang penuh (hindari flicker).
    document.querySelectorAll("[data-px]").forEach((el) => {
      const a = byTicker[el.getAttribute("data-px")];
      el.textContent = fmtUSD(a.price);
    });
    document.querySelectorAll("[data-spark]").forEach((c) => {
      const a = byTicker[c.getAttribute("data-spark")];
      drawSpark(c, a.series, a.changePct >= 0);
    });
    renderTicker();
    renderHero();
    renderIndex();
    // Perbarui nilai portofolio & modal bila terbuka.
    renderPortfolioLite();
    if (modalTicker) syncModal();
  }
  // Versi ringan: hanya angka portofolio, tanpa membangun ulang baris.
  function renderPortfolioLite() {
    let holdings = 0;
    for (const [t, p] of Object.entries(account.positions)) holdings += p.qty * byTicker[t].price;
    const total = account.cash + holdings;
    document.getElementById("portTotal").textContent = fmtUSD(total);
    document.getElementById("portHoldings").textContent = fmtUSD(holdings);
    const totalPnl = total - START_CASH;
    const pe = document.getElementById("portPnl");
    pe.textContent = `${totalPnl >= 0 ? "+" : ""}${fmtUSD(totalPnl)} sepanjang waktu`;
    pe.className = "ps-sub " + clsUp(totalPnl);
    // Perbarui harga kini di tabel holdings.
    document.querySelectorAll("#holdingsBody .price-strong").forEach((el) => {
      const row = el.closest("tr");
      const btn = row?.querySelector("[data-trade]");
      if (btn) el.textContent = fmtUSD(byTicker[btn.dataset.trade].price);
    });
  }

  // ---------- Event wiring ----------
  function wire() {
    document.getElementById("filters").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activeCat = chip.dataset.cat;
      document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
      renderMarket();
    });

    document.body.addEventListener("click", (e) => {
      const trade = e.target.closest("[data-trade]");
      if (trade) { openModal(trade.dataset.trade); return; }
      const row = e.target.closest("tr[data-ticker]");
      if (row && !e.target.closest("button")) { heroTicker = row.dataset.ticker; renderHero(); }
    });

    document.getElementById("modalClose").addEventListener("click", closeModal);
    document.getElementById("modal").addEventListener("click", (e) => {
      if (e.target.id === "modal") closeModal();
    });
    document.getElementById("seg").addEventListener("click", (e) => {
      const b = e.target.closest(".seg-btn");
      if (!b) return;
      modalSide = b.dataset.side;
      document.querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
      document.getElementById("ownedLabel").textContent = modalSide === "sell" ? "Tersedia dijual" : "Dimiliki";
      syncModal();
    });
    document.getElementById("qty").addEventListener("input", syncModal);
    document.getElementById("quick").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const a = byTicker[modalTicker];
      const input = document.getElementById("qty");
      if (b.dataset.q === "max") {
        input.value = modalSide === "buy"
          ? Math.floor((account.cash / a.price) * 100) / 100
          : (account.positions[modalTicker]?.qty || 0);
      } else {
        input.value = b.dataset.q;
      }
      syncModal();
    });
    document.getElementById("confirmBtn").addEventListener("click", executeOrder);

    document.getElementById("resetBtn").addEventListener("click", () => {
      if (confirm("Reset akun ke $100.000 dan hapus semua posisi?")) {
        account = { cash: START_CASH, positions: {} };
        saveAccount();
        renderPortfolio();
        toast("Akun direset ke $100.000", "ok");
      }
    });

    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
    window.addEventListener("resize", () => { renderHero(); renderMarket(); });
  }

  // ---------- Init ----------
  renderTicker();
  renderIndex();
  renderHero();
  renderMarket();
  renderPortfolio();
  wire();
  setInterval(tickPrices, 1500);
})();
