import React, { useState } from "react";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { useToast } from "../../context/ToastContext";
import DataService from "../../services/DataService";
import { DEFAULT_PRICE, PRICE_OPTIONS, PAYMENT_METHODS, COLORS, MIN_DATE } from "../../utils/constants";
import { todayStr, maxAllowedDate, fmtIDR } from "../../utils/helpers";
import { isValidCustomerName } from "../../utils/validators";
import useStocksFromProps from "../../hooks/useStocksFromProps";

const PenjualanView = ({ stocks = {}, onSave, onCancel }) => {
  const s = useStocksFromProps(stocks);
  const [formData, setFormData] = useState({
    customer: "",
    date: todayStr(),
    qty: "",
    price: DEFAULT_PRICE,
    method: "TUNAI",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  const stokISI = Number(s.ISI ?? 0);
  const qtyNum = Number(formData.qty) || 0;
  const total = qtyNum * (Number(formData.price) || 0);
  const customerOk = isValidCustomerName(formData.customer || "");

  const incQty = (delta) => setFormData((p) => ({ ...p, qty: Math.max(0, (Number(p.qty) || 0) + delta) || "" }));
  const pickPrice = (p) => setFormData((fd) => ({ ...fd, price: Number(p) || DEFAULT_PRICE }));

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true); setError("");
    try {
      const result = await DataService.createSale({
        ...formData,
        qty: Number(formData.qty),
        price: Number(formData.price),
      });
      if (result?.stocks && typeof onSave === "function") onSave(result.stocks);
      setFormData({ customer: "", date: todayStr(), qty: "", price: DEFAULT_PRICE, method: "TUNAI" });
      show({ type: "success", message: "Penjualan berhasil disimpan!" });
    } catch (e) {
      setError(e.message);
      show({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const disabledSubmit = loading || !Number.isFinite(qtyNum) || qtyNum < 1 || qtyNum > stokISI || !customerOk;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Button onClick={onCancel} icon="←">Kembali</Button>
        <h1 style={{ margin: 0, color: COLORS.text }}>Penjualan Baru</h1>
        <div style={{ marginLeft: "auto", padding: "6px 10px", borderRadius: 999, fontSize: 12, background: COLORS.light, color: COLORS.text }} title="Stok Isi siap jual saat ini">
          Stok Isi: <b>{stokISI}</b>
        </div>
      </div>

      <Card title="Form Penjualan">
        {error && <div style={{ color: COLORS.danger, padding: 12, background: `${COLORS.danger}15`, borderRadius: 8, marginBottom: 16, border: `1px solid ${COLORS.danger}30`, display: "flex", alignItems: "center", gap: 8 }}>⚠️ {error}</div>}

        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: COLORS.text }}>Nama Pelanggan</label>
            <Input placeholder="Contoh: Ayu" value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} disabled={loading} />
            {!customerOk && formData.customer.trim().length > 0 && (
              <div style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>Nama hanya huruf & spasi (tanpa angka/simbol)</div>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: COLORS.text }}>Tanggal</label>
            <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} min={MIN_DATE} max={maxAllowedDate()} disabled={loading} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: COLORS.text }}>Jumlah (Qty)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={() => incQty(-1)} disabled={loading || qtyNum <= 1} title="Kurangi">−</Button>
              <Input type="number" value={formData.qty} onChange={(e) => setFormData({ ...formData, qty: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })} min={1} max={stokISI} disabled={loading} style={{ flex: 1 }} />
              <Button onClick={() => incQty(+1)} disabled={loading || qtyNum >= stokISI} title="Tambah">+</Button>
            </div>
            <div style={{ fontSize: 12, color: COLORS.secondary, marginTop: 4 }}>Stok isi tersedia: <b>{stokISI}</b></div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: COLORS.text }}>Harga Satuan</label>
            <select
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
              style={{ padding: "10px 12px", border: `1px solid ${COLORS.secondary}20`, borderRadius: 8, width: "100%", backgroundColor: COLORS.surface, color: COLORS.text, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
              disabled={loading}
            >
              {PRICE_OPTIONS.map((p) => <option key={p} value={p}>{fmtIDR(p)}</option>)}
            </select>

            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {PRICE_OPTIONS.map((p) => (
                <Button key={p} onClick={() => pickPrice(p)} disabled={loading} title={`Pilih ${fmtIDR(p)}`}>{fmtIDR(p)}</Button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: COLORS.text }}>Metode Pembayaran</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              style={{ padding: "10px 12px", border: `1px solid ${COLORS.secondary}20`, borderRadius: 8, width: "100%", backgroundColor: COLORS.surface, color: COLORS.text, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
              disabled={loading}
            >
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div style={{ padding: 16, background: COLORS.light, borderRadius: 8, marginTop: 8, border: `1px solid ${COLORS.secondary}20` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 500, color: COLORS.text }}>Total:</span>
              <span style={{ fontSize: 18, fontWeight: "bold", color: COLORS.success }}>{fmtIDR(total)}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24, flexWrap: "wrap" }}>
            <Button onClick={onCancel} disabled={loading}>Batal</Button>
            <Button primary onClick={handleSubmit} disabled={disabledSubmit}>{loading ? "Menyimpan..." : "Simpan Transaksi"}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PenjualanView;