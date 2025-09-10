import React from "react";
import Button from "./Button";
export default function ConfirmDialog({ open, title, message, onCancel, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.2)", display: "grid", placeItems: "center", zIndex: 50 }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 12, width: 360, maxWidth: "92vw" }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
        <div style={{ marginTop: 8, color: "#6b7280" }}>{message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button onClick={onCancel}>Batal</Button>
          <Button primary onClick={onConfirm} disabled={loading}>{loading ? "Memproses..." : "Ya, Lanjut"}</Button>
        </div>
      </div>
    </div>
  );
}