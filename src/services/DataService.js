import { supabase } from "../lib/supabase";
import { MIN_YEAR, MAX_YEAR } from "../utils/constants";
import { inAllowedYear } from "../utils/validators";

const HPP = 15500;

function rowsToStockObject(rows) {
  const obj = { ISI: 0, KOSONG: 0 };
  (rows || []).forEach((r) => {
    const code = String(r.code || "").toUpperCase();
    if (code in obj) obj[code] = Number(r.qty || 0);
  });
  return obj;
}
const errMsg = (e, fb) => e?.message || fb;

const DataService = {
  async loadStocks() {
    const { data, error } = await supabase.rpc("get_stock_snapshot");
    if (error) {
      console.error("[loadStocks]", error);
      return { ISI: 0, KOSONG: 0 };
    }
    return rowsToStockObject(data);
  },

  async loadLogs(limit = 500) {
    const { data, error } = await supabase
      .from("stock_logs")
      .select("id, code, qty_change, note, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[loadLogs]", error);
      return [];
    }
    return data || [];
  },

  async loadSales(limit = 500) {
    const { data, error } = await supabase
      .from("sales")
      .select("id, customer, qty, price, total, method, note, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[loadSales]", error);
      return [];
    }
    // derive fields for reports
    return (data || []).map((s) => ({
      ...s,
      date: s.created_at,
      hpp: HPP,
      laba: Number(s.total || 0) - HPP * Number(s.qty || 0),
    }));
  },

  async addKosong({ qty, date, note }) {
    if (!inAllowedYear(date)) throw new Error(`Tanggal harus antara ${MIN_YEAR} dan ${MAX_YEAR}`);
    if (!(qty > 0)) throw new Error("Jumlah harus > 0");
    const { data, error } = await supabase.rpc("stock_add_kosong", {
      p_qty: qty, p_date: date, p_note: note || "beli tabung",
    });
    if (error) throw new Error(errMsg(error, "Gagal tambah stok kosong"));
    return rowsToStockObject(data);
  },

  async addIsi({ qty, date, note }) {
    if (!inAllowedYear(date)) throw new Error(`Tanggal harus antara ${MIN_YEAR} dan ${MAX_YEAR}`);
    if (!(qty > 0)) throw new Error("Jumlah harus > 0");
    const { data, error } = await supabase.rpc("stock_add_isi", {
      p_qty: qty, p_date: date, p_note: note || "isi dari agen",
    });
    if (error) throw new Error(errMsg(error, "Gagal tambah stok isi"));
    return rowsToStockObject(data);
  },

  // Penjualan: gunakan RPC v2 (menyesuaikan SQL yang ada). Customer dimasukkan ke note agar terekam.
  async createSale({ customer = "PUBLIC", date, qty, price, method = "TUNAI" }) {
    if (!inAllowedYear(date)) throw new Error(`Tanggal harus antara ${MIN_YEAR} dan ${MAX_YEAR}`);
    if (!(qty > 0)) throw new Error("Qty harus > 0");
    if (!(price > 0)) throw new Error("Harga tidak valid");

    const note = `customer: ${customer}`;
    const { data, error } = await supabase.rpc("stock_sell_public_v2", {
      p_qty: qty, p_price: price, p_method: method, p_date: date, p_note: note,
    });
    if (error) throw new Error(errMsg(error, "Gagal menyimpan penjualan"));

    const snap = rowsToStockObject(data);
    return { stocks: snap };
  },

  // admin-only (dicek di SQL)
  async resetAllData() {
    const { error } = await supabase.rpc("reset_all_data");
    if (error) {
      throw new Error(errMsg(error, "Reset ditolak (khusus admin)"));
    }
    return this.loadStocks();
  },
};

export default DataService;