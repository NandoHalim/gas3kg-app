import { MIN_YEAR, MAX_YEAR } from "./constants";

export const inAllowedYear = (dateStr) => {
  if (!dateStr) return false;
  const y = Number(String(dateStr).slice(0, 4));
  return y >= MIN_YEAR && y <= MAX_YEAR;
};

export const isValidCustomerName = (name) => {
  if (!name) return false;
  return /^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]{2,50}$/.test(name.trim());
};