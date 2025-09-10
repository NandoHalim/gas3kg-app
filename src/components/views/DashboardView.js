import React, { useMemo } from "react";
import Card from "../ui/Card";
import StatCard from "../ui/StatCard";
import StockDonut from "../ui/StockDonut";
import useStocksFromProps from "../../hooks/useStocksFromProps";
import { COLORS } from "../../utils/constants";

export default function DashboardView({ stocks = {} }) {
  const s = useStocksFromProps(stocks);
  const isi = Number(s.ISI || 0);
  const kosong = Number(s.KOSONG || 0);
  const totalSemua = isi + kosong;

  const donutData = useMemo(
    () => [
      { label: "ISI", value: isi, color: COLORS.primary },
      { label: "KOSONG", value: kosong, color: COLORS.danger },
    ],
    [isi, kosong]
  );

  return (
    <div className="space-y-6">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 className="text-xl font-semibold" style={{ margin: 0 }}>Dashboard</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>Ringkasan stok terkini</p>
        </div>
        <div style={{ padding: "6px 10px", borderRadius: 999, fontSize: 12, background: "#f3f4f6" }}>
          Total Tabung: <b>{totalSemua}</b>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Stok Isi" value={isi} subtitle="Gas siap jual" color={COLORS.primary} icon="🟢" />
        <StatCard title="Stok Kosong" value={kosong} subtitle="Milik sendiri" color={COLORS.danger} icon="⚪" />
        <StatCard title="Total" value={totalSemua} subtitle="ISI + KOSONG" color={COLORS.info} icon="🧮" />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ alignItems: "stretch" }}>
        <Card title="Distribusi Stok" padding="16px">
          <div style={{ display: "grid", gridTemplateColumns: "1fr", justifyItems: "center", gap: 12 }}>
            <StockDonut data={donutData} size={180} thickness={22} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, width: "100%" }}>
              {donutData.map((d) => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span aria-hidden style={{ width: 10, height: 10, background: d.color, borderRadius: 2, display: "inline-block" }} />
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{d.label}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "#6b7280" }}>
            <span>💡</span>
            <span>Angka diperbarui realtime saat stok berubah.</span>
          </div>
        </Card>
      </section>
    </div>
  );
}