import React, { useEffect, useState } from "react";
import Header from "./components/layout/Header";
import Navigation from "./components/layout/Navigation";
import DashboardView from "./components/views/DashboardView";
import LoginView from "./components/views/LoginView";
import PenjualanView from "./components/views/PenjualanView";
import StokView from "./components/views/StokView";
import RiwayatView from "./components/views/RiwayatView";
import ConfirmDialog from "./components/ui/ConfirmDialog";
import { ToastProvider } from "./context/ToastContext";
import { useAuth, AuthProvider } from "./context/AuthContext";
import DataService from "./services/DataService";
import { supabase } from "./lib/supabase";
import { COLORS } from "./utils/constants";

function AppInner() {
  const { user, initializing, signOut } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stocks, setStocks] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await DataService.loadStocks();
        if (alive) setStocks(snap);
      } catch (e) { console.error("fetch stocks error:", e); }
    })();

    const chan = supabase
      .channel("stocks-rt-app")
      .on("postgres_changes", { event: "*", schema: "public", table: "stocks" }, async () => {
        const snap = await DataService.loadStocks();
        setStocks(snap);
      })
      .subscribe();

    // optional: is_admin rpc (if exists)
    (async () => {
      try {
        const { data, error } = await supabase.rpc("is_admin");
        if (!error) setIsAdmin(Boolean(data));
      } catch {}
    })();

    return () => { alive = false; try { supabase.removeChannel(chan); } catch {} };
  }, []);

  const navigateTo = (view) => setCurrentView(view);
  const handleResetAll = () => setConfirmReset(true);

  const proceedReset = async () => {
    setResetting(true);
    try {
      const fresh = await DataService.resetAllData();
      setStocks(fresh);
      setRefreshKey((k) => k + 1);
      setConfirmReset(false);
    } catch (e) {
      alert(e.message || "Gagal mereset data!");
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = async () => {
    try { await signOut(); } catch {}
    setCurrentView("dashboard");
  };

  const renderView = () => {
    switch (currentView) {
      case "dashboard": return <DashboardView key={`dash-${refreshKey}`} stocks={stocks} />;
      case "penjualan": return <PenjualanView key={`sale-${refreshKey}`} stocks={stocks} onSave={(fresh) => fresh ? setStocks(fresh) : null} onCancel={() => setCurrentView("dashboard")} />;
      case "stok": return <StokView key={`stok-${refreshKey}`} stocks={stocks} onSave={(fresh) => setStocks(fresh)} onCancel={() => setCurrentView("dashboard")} />;
      case "riwayat": return <RiwayatView key={`his-${refreshKey}`} onCancel={() => setCurrentView("dashboard")} />;
      default: return <DashboardView key={`dash-${refreshKey}`} stocks={stocks} />;
    }
  };

  if (initializing) return <div className="p-4">Loading…</div>;
  if (!user) return <LoginView />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header onLogout={handleLogout} onResetAll={handleResetAll} onToggleTests={() => setShowTests((s) => !s)} isAdmin={isAdmin} />
      <div className="flex flex-1">
        <Navigation currentView={currentView} onNavigate={navigateTo} colors={COLORS} />
        <main className="flex-1 p-4 overflow-auto" key={`main-${refreshKey}`}>
          {renderView()}
        </main>
      </div>
      <ConfirmDialog open={confirmReset} title="Konfirmasi Reset" message="Apakah Anda yakin ingin mereset semua data? Tindakan ini tidak bisa dibatalkan." onCancel={() => setConfirmReset(false)} onConfirm={proceedReset} loading={resetting} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  );
}