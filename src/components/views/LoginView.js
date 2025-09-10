import React from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { supabase } from "../../lib/supabase";

export default function LoginView() {
  const signInAnonym = async () => {
    // Demo mode: skip login, in real app use magic link or OAuth.
    alert("Demo mode: silakan set auth sesuai kebutuhan. App akan jalan tanpa login.");
  };
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      <Card title="Login">
        <p style={{ marginTop: 0, color: "#6b7280" }}>Masuk untuk melanjutkan.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <Button primary onClick={signInAnonym}>Lanjut</Button>
        </div>
      </Card>
    </div>
  );
}