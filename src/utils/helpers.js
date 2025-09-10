// ==================== UTILITY FUNCTIONS ====================
import { HARD_MAX_DATE } from "./constants";

export const todayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const maxAllowedDate = () => {
  const t = todayStr();
  return t > HARD_MAX_DATE ? HARD_MAX_DATE : t;
};

export const fmtIDR = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export const isDatasetEmpty = (stocks, sales) => {
  const s = stocks || { ISI: 0, KOSONG: 0 };
  const arr = Array.isArray(sales) ? sales : [];
  return (
    (Number(s.ISI) || 0) === 0 &&
    (Number(s.KOSONG) || 0) === 0 &&
    arr.length === 0
  );
};

export const fmtDateTimeID = (d) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date(d));