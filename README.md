# SurplusLLM — Bursa Jual Beli LLM 📈

Website demo bergaya **Robinhood** untuk memperdagangkan kapasitas LLM seperti
saham. Terinspirasi konsep **order book untuk inferensi AI** ala
[Surplus Intelligence](https://www.surplusintelligence.ai/): penjual melisting
kapasitas model yang tak terpakai, pembeli dieksekusi di harga listing terendah,
dan harga bergerak lewat **price discovery** mengikuti supply & demand.

## Fitur

- **Pita ticker berjalan** + **indeks SLLM-12** agregat market cap
- **Pasar LLM** — 12 aset (Claude, GPT-5, Gemini, Llama, Mistral, DeepSeek, dll.)
  dengan harga, perubahan %, kapitalisasi, volume, dan **sparkline** live
- **Harga live** disimulasikan (random walk) tiap 1,5 detik
- **Modal order** beli/jual dengan **order book bid/ask** mini & ringkasan
- **Portofolio** dengan kas, nilai posisi, dan **laba/rugi** otomatis
- Akun demo **$100.000** — semua tersimpan di `localStorage` peramban Anda
- Responsif (desktop → mobile), tema gelap hijau neon

## Menjalankan

Situs sepenuhnya statis — tanpa build step. Buka `index.html` langsung, atau
jalankan server statis apa pun:

```bash
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

## Struktur

| Berkas       | Isi                                                        |
|--------------|------------------------------------------------------------|
| `index.html` | Struktur halaman: hero, tabel pasar, portofolio, modal     |
| `styles.css` | Tema gelap ala Robinhood                                    |
| `data.js`    | Katalog aset LLM + pembangkit deret harga deterministik    |
| `app.js`     | Logika: harga live, chart canvas, order, portofolio        |

## Catatan

⚠️ Ini **demo edukatif**. Harga, order book, dan aset bersifat **fiktif** serta
disimulasikan di peramban — bukan produk keuangan nyata dan bukan afiliasi
vendor mana pun.
