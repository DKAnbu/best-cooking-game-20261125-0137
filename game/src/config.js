// Warung Rush — config: ukuran arena, resep, bahan, dan aturan shift.
// Satu-satunya tempat angka-angka permainan tinggal, supaya penyeimbang
// bisa diubah tanpa menyentuh logika dapur di file lain.
export const VIEW = { width: 1280, height: 720 };

export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 4;
export const RUSH_AFTER_SECONDS = 120;

export const PLAYER = { radius: 22, speed: 300 };

// Bahan: chop = butuh dipotong di talenan, cook = stasiun masak yang dipakai,
// cookSeconds = lama masak sampai zona perfect, burnSeconds = gosong.
export const INGREDIENTS = {
  nasi:   { name: 'Nasi',   emoji: '🍚', color: '#f5f0dc', chop: false, cook: 'wok',   cookSeconds: 5, burnSeconds: 9 },
  mie:    { name: 'Mie',    emoji: '🍜', color: '#f2c94c', chop: false, cook: 'wok',   cookSeconds: 5, burnSeconds: 9 },
  telur:  { name: 'Telur',  emoji: '🥚', color: '#fdf3d0', chop: false, cook: 'wok',   cookSeconds: 4, burnSeconds: 8 },
  ayam:   { name: 'Ayam',   emoji: '🍗', color: '#e8a87c', chop: true,  cook: 'grill', cookSeconds: 6, burnSeconds: 10 },
  sayur:  { name: 'Sayur',  emoji: '🥬', color: '#7bc96f', chop: true,  cook: null,    cookSeconds: 0, burnSeconds: 0 },
  tahu:   { name: 'Tahu',   emoji: '🧈', color: '#f7e8c3', chop: true,  cook: null,    cookSeconds: 0, burnSeconds: 0 },
  teh:    { name: 'Teh',    emoji: '🍵', color: '#c98a4b', chop: false, cook: null,    cookSeconds: 0, burnSeconds: 0 },
  pisang: { name: 'Pisang', emoji: '🍌', color: '#ffe066', chop: true,  cook: 'wok',   cookSeconds: 5, burnSeconds: 9 },
  bumbu:  { name: 'Bumbu',  emoji: '🌶️', color: '#e05252', chop: false, cook: null,    cookSeconds: 0, burnSeconds: 0 },
  tepung: { name: 'Tepung', emoji: '🥣', color: '#efe6d0', chop: false, cook: null,    cookSeconds: 0, burnSeconds: 0 },
};

// Satu entri resep: id bahan + cara olah yang harus dipenuhi di piring.
// olah: 'raw' (langsung), 'chopped', 'cooked', 'perfect' (masak di zona hijau).
export const RECIPES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng', emoji: '🍛', price: 120,
    needs: [
      { id: 'nasi', olah: 'cooked' },
      { id: 'telur', olah: 'cooked' },
      { id: 'bumbu', olah: 'raw' },
    ],
  },
  {
    id: 'mie-goreng', name: 'Mie Goreng', emoji: '🍝', price: 110,
    needs: [
      { id: 'mie', olah: 'cooked' },
      { id: 'sayur', olah: 'chopped' },
      { id: 'bumbu', olah: 'raw' },
    ],
  },
  {
    id: 'sate-ayam', name: 'Sate Ayam', emoji: '🍢', price: 140,
    needs: [
      { id: 'ayam', olah: 'perfect' },
      { id: 'bumbu', olah: 'raw' },
    ],
  },
  {
    id: 'gado-gado', name: 'Gado-Gado', emoji: '🥗', price: 100,
    needs: [
      { id: 'sayur', olah: 'chopped' },
      { id: 'tahu', olah: 'chopped' },
      { id: 'bumbu', olah: 'raw' },
    ],
  },
  {
    id: 'es-teh', name: 'Es Teh', emoji: '🧋', price: 60,
    needs: [{ id: 'teh', olah: 'raw' }],
  },
  {
    id: 'pisang-goreng', name: 'Pisang Goreng', emoji: '🍌', price: 90,
    needs: [
      { id: 'pisang', olah: 'cooked' },
      { id: 'tepung', olah: 'raw' },
    ],
  },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// Urutan bahan di rak pantry (kiri atas), dipakai render + klik mouse.
export const PANTRY_ORDER = ['nasi', 'mie', 'telur', 'ayam', 'sayur', 'tahu', 'teh', 'pisang', 'bumbu', 'tepung'];

// Stasiun dapur: posisi di lantai (koordinat tengah), ukuran, dan label.
export const STATIONS = {
  pantry: { x: 90,  y: 330, w: 120, h: 240, label: 'PANTRY', sub: 'ambil bahan' },
  chop:   { x: 330, y: 180, w: 150, h: 90,  label: 'TALENAN', sub: 'tahan E: potong' },
  wok:    { x: 560, y: 180, w: 150, h: 90,  label: 'WAJAN', sub: 'E: angkat pas hijau' },
  grill:  { x: 790, y: 180, w: 150, h: 90,  label: 'PANGGANGAN', sub: 'E: angkat pas hijau' },
  plate:  { x: 1010, y: 180, w: 150, h: 90, label: 'PIRING', sub: 'E: taruh / ambil' },
  serve:  { x: 1150, y: 420, w: 110, h: 150, label: 'ANTAR', sub: 'E: sajikan' },
  trash:  { x: 90,  y: 620, w: 120, h: 70,  label: 'SAMPAH', sub: 'E: buang' },
};

export const FLOOR = { x: 40, y: 230, w: 1200, h: 440 };

// Pelanggan duduk di baris atas (y ~120), satu per slot order.
export const CUSTOMER_SLOTS = [
  { x: 330, y: 118 },
  { x: 560, y: 118 },
  { x: 790, y: 118 },
  { x: 1020, y: 118 },
];

export const CHOP_SECONDS = 1.4;
export const COMBO_MAX = 5;
export const PATIENCE_EASY = 75;
export const PATIENCE_RUSH = 55;
export const SPAWN_EASY_SECONDS = 14;
export const SPAWN_RUSH_SECONDS = 9;
