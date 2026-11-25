[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/DKAnbu/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/DKAnbu/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

# 🍜 Warung Rush

Game masak street-food Indonesia. Kamu koki di sebuah warung: pelanggan datang dengan order, kamu ambil bahan di pantry, potong di talenan, masak di wajan atau panggangan dengan timing yang pas (angkat saat bar hijau — kelamaan gosong!), rakit di piring sesuai resep, lalu antar sebelum kesabaran pelanggan habis. Satu shift 3 menit, tekanan naik di rush hour menit terakhir.

## Cara main

- **Gerak:** WASD / tombol panah, atau klik lantai/stasiun (koki jalan sendiri ke sana).
- **Interaksi:** `E` / Spasi di dekat stasiun; tahan `E` untuk memotong di talenan.
- **Ambil bahan:** klik langsung bahan di rak pantry, atau tekan `E` di dekat pantry.
- **Masak:** taruh bahan di wajan/panggangan, angkat dengan `E` saat penanda di zona hijau (perfect) — jangan sampai merah/gosong.
- **Rakit:** taruh bahan di stasiun piring sesuai resep di tiket order, lalu antar di jendela ANTAR.
- **Lainnya:** `P` jeda, `M` suara, `R` main lagi setelah shift selesai.

## Resep (6)

| Hidangan | Bahan |
| --- | --- |
| 🍛 Nasi Goreng | nasi (wajan) + telur (wajan) + bumbu |
| 🍝 Mie Goreng | mie (wajan) + sayur (potong) + bumbu |
| 🍢 Sate Ayam | ayam (potong + panggangan perfect) + bumbu |
| 🥗 Gado-Gado | sayur (potong) + tahu (potong) + bumbu |
| 🧋 Es Teh | teh |
| 🍌 Pisang Goreng | pisang (potong + wajan) + tepung |

## Sistem skor

- Tiap pesanan: 100 poin + tip sampai 50 (makin sabar pelanggan, makin besar tip).
- Antar beruntun tanpa order hangus menaikkan kombo sampai x5 — kombo mengalikan poin.
- Order hangus (kesabaran habis) memutus kombo. Rush hour: order datang lebih cepat, kesabaran lebih pendek.

## Struktur kode

- `game/src/config.js` — angka permainan, resep, bahan, stasiun
- `game/src/main.js` — loop + mesin state (judul/main/jeda/selesai)
- `game/src/kitchen.js` — stasiun, tangan koki, potong, masak, piring
- `game/src/orders.js` — order, kesabaran, pencocokan resep, tip
- `game/src/render.js` — semua gambar Canvas 2D
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — bunyi WebAudio (tanpa file suara)
- `game/src/shots.js` — adegan deterministik untuk screenshot

Game statis tanpa build step dan tanpa request jaringan: buka `game/index.html` lewat server statis mana pun (`node serve.ts` → http://localhost:8080).

## Entri make.fun

Dibangun untuk kompetisi [best-cooking-game-20261125-0137](https://make.fun/c/best-cooking-game-20261125-0137) di make.fun. `main.ts` menyalin `game/` + `screenshots/` ke output dan menulis `dossier.json`.
