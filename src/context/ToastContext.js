import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const show = useCallback(({ type = "info", message }) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position: "fixed", top: 12, right: 12, display: "grid", gap: 8, zIndex: 9999 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ padding: "10px 14px", borderRadius: 10, background: "#111827", color: "white", boxShadow: "0 4px 10px rgba(0,0,0,.2)" }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);