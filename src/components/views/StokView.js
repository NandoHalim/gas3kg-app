import React, { useState, useEffect, useMemo, useRef } from "react";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";
import StatCard from "../ui/StatCard";
import { useToast } from "../../context/ToastContext";
import DataService from "../../services/DataService";
import { todayStr, maxAllowedDate } from "../../utils/helpers";
import { COLORS, MIN_DATE } from "../../utils/constants";
import { supabase } from "../../lib/supabase";
import useStocksFromProps from "../../hooks/useStocksFromProps";

const StokView = ({ stocks, onSave = () => {}, onCancel }) => {
  const s = useStocksFromProps(stocks);
  const [formData, setFormData] = useState({
    jenis: "ISI",
    jumlah: "",
    tanggal: todayStr(),
    keterangan: "Isi dari Agen",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  const prevJenis = useRef(formData.jenis);
  const isKosong = formData.jenis === "KOSONG";

  useEffect(() => {
    if (formData.jenis === "ISI") {
      setFormData((p) => ({ ...p, keterangan: "Isi dari Agen" }));
    } else if (formData.jenis === "KOSONG") {
      if (prevJenis.current !== "KOSONG" && !String(formData.keterangan || "").trim()) {
        setFormData((p) => ({ ...p, keterangan: "Beli Tabung" }));
      }
    }
    prevJenis.current = formData.jenis;
  }, [formData.jenis]);

  useEffect(() => {
    const channel = supabase
      .channel("stocks-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "stocks" }, async () => {
        try {
          const fresh = await DataService.loadStocks();
          onSave(fresh);
        } catch (e) {
          console.error("[realtime] loadStocks error:", e);
        }
      })
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [onSave]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = { qty: Number(formData.jumlah), date: formData.tanggal, note: formData.keterangan };
      const snap = formData.jenis === "KOSONG"
        ? await DataService.addKosong(payload)
        : await DataService.addIsi(payload);
      onSave(snap);
      show({ type: "success", message: "Stok berhasil ditambahkan!" });
      setFormData({
        jenis: formData.jenis,
        jumlah: "",
        tanggal: todayStr(),
        keterangan: formData.jenis === "ISI" ? "Isi dari Agen" : formData.keterangan || "Beli Tabung",
      });
    } catch (e) {
      setError(e.message);
      show({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllData = async () => {
    const ok = window.confirm("Yakin reset SEMUA data (stok & log)? Hanya admin yang boleh.");
    if (!ok) return;
    setLoading(true); setError("");
    try {
      const fresh = await DataService.resetAllData();
      onSave(fresh);
      show({ type: "success", message: "Semua data direset." });
    } catch (e) {
      setError(e.message);
      show({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const totalTabung = useMemo(() => Number(s.ISI || 0) + Number(s.KOSONG || 0), [s.ISI, s.KOSONG]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Button onClick={onCancel} icon="←">Kembali</Button>
        <h1 style={{ margin: 0, color: COLORS.text }}>Manajemen Stok</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16, marginBottom: 16 }}>
        <StatCard title="Stok Isi" value={s.ISI} subtitle="Gas siap jual" color={COLORS.primary} icon="🟢" />
        <StatCard title="Stok Kosong" value={s.KOSONG} subtitle="Tabung milik sendiri" color={COLORS.danger} icon="⚪" />
        <StatCard title="Total Tabung" value={totalTabung} subtitle="ISI + KOSONG" color={COLORS.info} icon="🧮" />
      </div>

      <Card title="Tambah Stok">
        {error && (
          <div style={{ color: COLORS.danger, padding: 12, background: `${COLORS.danger}15`, borderRadius: 8, marginBottom: 16, border: `1px solid ${COLORS.danger}30` }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: COLORS.text }}>Jenis Stok</label>
            <select
              value={formData.jenis}
              onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
              style={{ padding: "10px 12px", border: `1px solid ${COLORS.secondary}20`, borderRadius: 8, width: "100%", backgroundColor: COLORS.surface, color: COLORS.text, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
              disabled={loading}
            >
              <option value="ISI">Stok Isi</option>
              <option value="KOSONG">Tabung Kosong</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: COLORS.text }}>Jumlah</label>
            <Input
              type="number"
              value={formData.jumlah}
              onChange={(e) => setFormData({ ...formData, jumlah: e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0) })}
              min={1}
              disabled={loading}
            />
            {formData.jenis === "ISI" && (
              <div style={{ fontSize: 12, color: COLORS.secondary, marginTop: 4 }}>
                Tambah ISI akan <b>MENGURANGI KOSONG</b> sebanyak jumlah yang diisi. KOSONG saat ini: {s.KOSONG}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: COLORS.text }}>Tanggal</label>
            <Input type="date" value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} min={MIN_DATE} max={maxAllowedDate()} disabled={loading} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: COLORS.text }}>Keterangan {isKosong ? "(Bisa diedit)" : "(Otomatis)"}</label>
            <Input
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              readOnly={!isKosong}
              style={{ backgroundColor: isKosong ? COLORS.surface : COLORS.light, cursor: isKosong ? "text" : "not-allowed", opacity: isKosong ? 1 : 0.8 }}
              placeholder={isKosong ? "Contoh: Beli tabung bekas 5 pcs" : ""}
            />
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24, flexWrap: "wrap" }}>
            <Button onClick={handleResetAllData} disabled={loading} title="Hanya admin">🗑️ Reset Semua Data</Button>
            <div style={{ flex: 1 }} />
            <Button onClick={onCancel} disabled={loading}>Batal</Button>
            <Button primary onClick={handleSubmit} disabled={loading || Number(formData.jumlah) < 1}>
              {loading ? "Menyimpan..." : "Tambah Stok"}
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Detail Stok" style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <Line label="Stok Isi" value={`${s.ISI} unit`} color={COLORS.primary} />
          <Line label="Stok Kosong" value={`${s.KOSONG} unit`} color={COLORS.danger} />
          <Line label="Total Tabung" value={`${totalTabung} unit`} color={COLORS.info} />
        </div>
      </Card>
    </div>
  );
};

function Line({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: COLORS.text }}>{label}:</span>
      <strong style={{ color }}>{value}</strong>
    </div>
  );
}

export default StokView;