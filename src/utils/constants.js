// ==================== CONSTANTS & CONFIG ====================
export const APP_CONFIG = {
  MIN_YEAR: 2025,
  MAX_YEAR: 2050,

  // Harga default & opsi harga cepat
  DEFAULT_PRICE: 20000,
  PRICE_OPTIONS: [18000, 20000],

  // Metode pembayaran
  PAYMENT_METHODS: ["TUNAI", "HUTANG"],

  // Jenis stok (TITIPAN sudah dihapus, hanya ISI & KOSONG)
  STOCK_TYPES: ["ISI", "KOSONG"],

  // Warna tema
  COLORS: {
    primary: "#2563eb",
    secondary: "#64748b",
    success: "#16a34a",
    danger: "#dc2626",
    warning: "#d97706",
    info: "#0891b2",
    light: "#f8fafc",
    dark: "#1e293b",
    background: "#f1f5f9",
    surface: "#ffffff",
    text: "#334155",
    textOnPrimary: "#ffffff",
  },
};

export const {
  MIN_YEAR,
  MAX_YEAR,
  DEFAULT_PRICE,
  PRICE_OPTIONS,
  PAYMENT_METHODS,
  STOCK_TYPES,
  COLORS,
} = APP_CONFIG;

export const MIN_DATE = `${APP_CONFIG.MIN_YEAR}-01-01`;
export const HARD_MAX_DATE = `${APP_CONFIG.MAX_YEAR}-12-31`;