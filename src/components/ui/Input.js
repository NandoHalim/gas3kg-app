import React from "react";
export default function Input({ style = {}, ...rest }) {
  return (
    <input
      {...rest}
      style={{
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        background: "#fff",
        width: "100%",
        ...style,
      }}
    />
  );
}