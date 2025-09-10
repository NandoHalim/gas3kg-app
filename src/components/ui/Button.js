import React from "react";
export default function Button({ children, primary, icon, ...rest }) {
  const base = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid transparent",
    background: primary ? "#2563eb" : "#fff",
    color: primary ? "#fff" : "#111827",
    boxShadow: "0 1px 1px rgba(0,0,0,.05)",
  };
  if (!primary) base.border = "1px solid #e5e7eb";
  return (
    <button {...rest} style={base}>
      {icon ? <span style={{ marginRight: 6 }}>{icon}</span> : null}
      {children}
    </button>
  );
}