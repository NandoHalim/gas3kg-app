import { useEffect, useState } from "react";

export default function useStocksFromProps(stocks = {}) {
  const [s, setS] = useState({ ISI: 0, KOSONG: 0 });
  useEffect(() => {
    const isi = Number(stocks.ISI || 0);
    const kosong = Number(stocks.KOSONG || 0);
    setS({ ISI: isi, KOSONG: kosong });
  }, [stocks?.ISI, stocks?.KOSONG]);
  return s;
}