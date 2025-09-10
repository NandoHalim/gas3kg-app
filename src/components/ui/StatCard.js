import React from "react";
export default function StatCard({ title, value, subtitle, color = "#2563eb", icon }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, display: "grid", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon ? <span>{icon}</span> : null}
        <span style={{ fontSize: 13, color: "#6b7280" }}>{title}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      {subtitle && <div style={{ fontSize: 12, color: "#6b7280" }}>{subtitle}</div>}
    </div>
  );
}