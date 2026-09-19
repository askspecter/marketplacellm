// data.js — Katalog aset LLM yang diperdagangkan di bursa "SurplusLLM".
// Setiap aset diperlakukan seperti saham: punya ticker, harga, perubahan, dan
// riwayat harga intraday yang dibangkitkan secara deterministik (seeded).

// PRNG deterministik sederhana (mulberry32) agar chart konsisten tiap reload.
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bangkitkan deret harga intraday (random walk) berakhir pada `close`.
function buildSeries(seed, close, volatility, points) {
  const rng = makeRng(seed);
  const arr = new Array(points);
  // Mulai dari sedikit di bawah/atas close lalu random walk menuju close.
  let price = close * (0.9 + rng() * 0.2);
  for (let i = 0; i < points; i++) {
    const drift = (close - price) * 0.04; // tarik ke arah close
    const shock = (rng() - 0.5) * 2 * volatility * close * 0.02;
    price = Math.max(close * 0.4, price + drift + shock);
    arr[i] = price;
  }
  arr[points - 1] = close; // pastikan berakhir tepat di close
  return arr;
}

const RAW_ASSETS = [
  {
    ticker: "CLDO", name: "Claude Opus", vendor: "Anthropic", category: "Frontier",
    price: 412.55, prevClose: 398.10, volatility: 1.0, seed: 101,
    marketCap: 2_940e9, volume: 18.4e6, context: "1M tok", speed: "72 tok/s",
    blurb: "Model reasoning kelas berat. Kapasitas surplus dilelang per 1M token.",
  },
  {
    ticker: "CLDS", name: "Claude Sonnet", vendor: "Anthropic", category: "Frontier",
    price: 118.20, prevClose: 121.44, volatility: 0.9, seed: 202,
    marketCap: 1_610e9, volume: 42.1e6, context: "1M tok", speed: "138 tok/s",
    blurb: "Keseimbangan harga/performa terbaik. Likuiditas tertinggi di bursa.",
  },
  {
    ticker: "GPT5", name: "GPT-5", vendor: "OpenAI", category: "Frontier",
    price: 388.90, prevClose: 371.15, volatility: 1.2, seed: 303,
    marketCap: 3_120e9, volume: 51.7e6, context: "400K tok", speed: "94 tok/s",
    blurb: "Kapasitas compute frontier. Volume order paling ramai hari ini.",
  },
  {
    ticker: "GMNI", name: "Gemini Ultra", vendor: "Google", category: "Frontier",
    price: 265.44, prevClose: 268.90, volatility: 1.1, seed: 404,
    marketCap: 2_050e9, volume: 33.2e6, context: "2M tok", speed: "88 tok/s",
    blurb: "Konteks 2 juta token, multimodal. Diskon surplus di jam sepi.",
  },
  {
    ticker: "GROK", name: "Grok", vendor: "xAI", category: "Frontier",
    price: 96.31, prevClose: 88.05, volatility: 1.6, seed: 505,
    marketCap: 610e9, volume: 27.9e6, context: "256K tok", speed: "120 tok/s",
    blurb: "Volatil tinggi. Sentimen sosial menggerakkan harga surplusnya.",
  },
  {
    ticker: "LLMA", name: "Llama 4", vendor: "Meta", category: "Open",
    price: 14.72, prevClose: 13.98, volatility: 1.3, seed: 606,
    marketCap: 210e9, volume: 88.6e6, context: "512K tok", speed: "210 tok/s",
    blurb: "Bobot terbuka, biaya inferensi murah. Favorit trader ritel.",
  },
  {
    ticker: "MSTL", name: "Mistral Large", vendor: "Mistral", category: "Open",
    price: 29.44, prevClose: 30.10, volatility: 1.2, seed: 707,
    marketCap: 145e9, volume: 19.3e6, context: "256K tok", speed: "165 tok/s",
    blurb: "Efisien untuk workload Eropa. Rendah latensi, harga stabil.",
  },
  {
    ticker: "DPSK", name: "DeepSeek R2", vendor: "DeepSeek", category: "Open",
    price: 8.91, prevClose: 7.64, volatility: 1.9, seed: 808,
    marketCap: 96e9, volume: 132.4e6, context: "128K tok", speed: "240 tok/s",
    blurb: "Reasoning murah-meriah. Lonjakan volume mendadak sering terjadi.",
  },
  {
    ticker: "QWEN", name: "Qwen Max", vendor: "Alibaba", category: "Open",
    price: 11.05, prevClose: 11.44, volatility: 1.4, seed: 909,
    marketCap: 88e9, volume: 40.8e6, context: "1M tok", speed: "190 tok/s",
    blurb: "Kuat di multibahasa. Surplus kapasitas region Asia-Pasifik.",
  },
  {
    ticker: "CMDR", name: "Command R+", vendor: "Cohere", category: "Specialist",
    price: 22.18, prevClose: 22.03, volatility: 0.8, seed: 111,
    marketCap: 54e9, volume: 6.2e6, context: "128K tok", speed: "150 tok/s",
    blurb: "Spesialis RAG & enterprise. Pergerakan tenang, cocok jangka panjang.",
  },
  {
    ticker: "PPLX", name: "Sonar Pro", vendor: "Perplexity", category: "Specialist",
    price: 17.60, prevClose: 16.72, volatility: 1.1, seed: 222,
    marketCap: 41e9, volume: 12.9e6, context: "200K tok", speed: "175 tok/s",
    blurb: "Spesialis pencarian real-time. Harga naik saat trafik query tinggi.",
  },
  {
    ticker: "PHI4", name: "Phi-4 Mini", vendor: "Microsoft", category: "Specialist",
    price: 3.42, prevClose: 3.51, volatility: 1.0, seed: 333,
    marketCap: 22e9, volume: 58.1e6, context: "64K tok", speed: "320 tok/s",
    blurb: "Model kecil on-device. Termurah di bursa, ideal untuk pemula.",
  },
];

// Lengkapi tiap aset dengan deret harga & metrik turunan.
const ASSETS = RAW_ASSETS.map((a) => {
  const series = buildSeries(a.seed, a.price, a.volatility, 48);
  return {
    ...a,
    change: a.price - a.prevClose,
    changePct: ((a.price - a.prevClose) / a.prevClose) * 100,
    series,
  };
});

// Indeks pasar agregat sederhana (rata-rata tertimbang market cap).
function computeIndex() {
  let capNow = 0, capPrev = 0;
  ASSETS.forEach((a) => {
    capNow += a.price * (a.marketCap / a.price);
    capPrev += a.prevClose * (a.marketCap / a.price);
  });
  const value = 10000 * (capNow / capPrev);
  return {
    value,
    changePct: ((capNow - capPrev) / capPrev) * 100,
  };
}
