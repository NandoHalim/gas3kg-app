import React from "react";
export default function Card({ title, subtitle, padding = "16px", style = {}, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding, boxShadow: "0 1px 2px rgba(0,0,0,.03)", ...style }}>
      {(title || subtitle) && (
        <div style={{ marginBottom: 10 }}>
          {title && <div style={{ fontWeight: 600, fontSize: 16 }}>{title}</div>}
          {subtitle && <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  );
}