// src/App.jsx
import React, { useEffect, useState } from "react";

// Layout
import Header from "./components/layout/Header";
import Navigation from "./components/layout/Navigation";

// Views
import DashboardView from "./components/views/DashboardView";
import LoginView from "./components/views/LoginView";
import PenjualanView from "./components/views/PenjualanView";
import StokView from "./components/views/StokView";
import RiwayatView from "./components/views/RiwayatView";
import DevTests from "./components/DevTests";

// UI helpers
import ConfirmDialog from "./components/ui/ConfirmDialog";
import { useToast } from "./context/ToastContext";

// Auth (Supabase)
import { useAuth } from "./context/AuthContext";

// Services
import DataService from "./services/DataService";
import { supabase } from "./lib/supabase";

// Utils
import { COLORS } from "./utils/constants";

function App() {
  const toast = useToast();
  const push = (message, type = "success") =>
    toast?.show ? toast.show({ type, message }) : alert(message);

  // ====== AUTH STATE ======
  const { user, initializing, signOut } = useAuth();

  // ====== UI STATE ======
  const [currentView, setCurrentView] = useState("dashboard");
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // ====== STOCKS STATE ======
  const [stocks, setStocks] = useState({});

  const refreshStocks = async () => {
    try {
      const map = await DataService.loadStocks();
      setStocks(map);
    } catch (e) {
      console.error("refreshStocks error:", e);
    }
  };

  // Fetch awal + cek admin
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const map = await DataService.loadStocks();
        if (alive) setStocks(map);
      } catch (e) {
        console.error("fetch stocks error:", e);
      }
    })();

    (async () => {
      try {
        const { data, error } = await supabase.rpc("is_admin");
        if (!error && alive) setIsAdmin(Boolean(data));
      } catch (e) {
        console.warn("is_admin RPC check failed:", e?.message || e);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ====== NAVIGASI ======
  const navigateTo = (view) => setCurrentView(view);

  // ====== RESET DATA ======
  const handleResetAll = () => setConfirmReset(true);

  const proceedReset = async () => {
    setResetting(true);
    try {
      const fresh = await DataService.resetAllDb();
      setStocks(fresh);
      setRefreshKey((k) => k + 1);
      push("Data berhasil direset", "success");
      setConfirmReset(false);
    } catch (e) {
      console.error("reset_all_data error:", e);
      push(e.message || "Gagal mereset data", "error");
    } finally {
      setResetting(false);
    }
  };

  // ====== LOGOUT ======
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setCurrentView("dashboard");
    }
  };

  // ====== RENDER VIEW ======
  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView key={`dash-${refreshKey}`} stocks={stocks} />;
      case "penjualan":
        return (
          <PenjualanView
            key={`sale-${refreshKey}`}
            stocks={stocks}
            onSave={(fresh) => (fresh ? setStocks(fresh) : refreshStocks())}
            onCancel={() => setCurrentView("dashboard")}
          />
        );
      case "stok":
        return (
          <StokView
            key={`stok-${refreshKey}`}
            stocks={stocks}
            onSave={(fresh) => setStocks(fresh)}
            onCancel={() => setCurrentView("dashboard")}
          />
        );
      case "riwayat":
        return <RiwayatView key={`his-${refreshKey}`} />;
      default:
        return <DashboardView key={`dash-${refreshKey}`} stocks={stocks} />;
    }
  };

  // ====== FIX: jangan pakai short return ======
  if (initializing) {
    return <div className="p-4">Loading…</div>;
  }

  if (!user) {
    return <LoginView />;
  }

  // ====== MAIN RENDER ======
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header
        onLogout={handleLogout}
        onResetAll={handleResetAll}
        onToggleTests={() => setShowTests((s) => !s)}
        isAdmin={isAdmin}
      />

      <div className="flex flex-1">
        <Navigation
          currentView={currentView}
          onNavigate={navigateTo}
          colors={COLORS}
        />
        <main className="flex-1 p-4 overflow-auto" key={`main-${refreshKey}`}>
          {renderView()}
        </main>
      </div>

      {showTests && <DevTests />}

      <ConfirmDialog
        open={confirmReset}
        title="Konfirmasi Reset"
        message="Apakah Anda yakin ingin mereset semua data? Tindakan ini tidak bisa dibatalkan."
        onCancel={() => setConfirmReset(false)}
        onConfirm={proceedReset}
        loading={resetting}
      />
    </div>
  );
}

export default App;
