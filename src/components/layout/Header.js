import React from "react";
import Button from "../ui/Button";
export default function Header({ onLogout, onResetAll, onToggleTests, isAdmin }) {
  return (
    <header style={{ display: "flex", alignItems: "center", padding: 12, borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
      <div style={{ fontWeight: 800 }}>Gas 3kg</div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        {isAdmin && <Button onClick={onResetAll}>Reset Data</Button>}
        <Button onClick={onToggleTests}>Dev</Button>
        <Button onClick={onLogout}>Logout</Button>
      </div>
    </header>
  );
}