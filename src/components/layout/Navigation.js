import React from "react";
export default function Navigation({ currentView, onNavigate, colors }) {
  const Item = ({ id, label }) => (
    <button
      onClick={() => onNavigate(id)}
      style={{
        padding: "10px 14px",
        width: "100%",
        textAlign: "left",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        background: currentView === id ? colors.primary : "#fff",
        color: currentView === id ? "#fff" : "#111827",
      }}
    >
      {label}
    </button>
  );
  return (
    <aside style={{ width: 220, padding: 12, borderRight: "1px solid #e5e7eb", display: "grid", gap: 8, background: "#fff" }}>
      <Item id="dashboard" label="Dashboard" />
      <Item id="penjualan" label="Penjualan" />
      <Item id="stok" label="Manajemen Stok" />
      <Item id="riwayat" label="Riwayat" />
    </aside>
  );
}