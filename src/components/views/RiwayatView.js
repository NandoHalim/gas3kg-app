import React, { useState, useMemo, useEffect } from "react";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { todayStr, fmtIDR, fmtDateTimeID } from "../../utils/helpers";
import { COLORS } from "../../utils/constants";
import DataService from "../../services/DataService";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const RiwayatView = ({ onCancel }) => {
  const [sales, setSales] = useState([]);
  const [logs, setLogs] = useState([]);

  const [filter, setFilter] = useState({ search: "", startDate: "", endDate: "", metode: "SEMUA" });
  const [salesPage, setSalesPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [salesPerPage, setSalesPerPage] = useState(10);
  const [logsPerPage, setLogsPerPage] = useState(10);

  useEffect(() => {
    (async () => {
      setSales(await DataService.loadSales(2000));
      setLogs(await DataService.loadLogs(2000));
    })();
  }, []);

  useEffect(() => {
    let t = null;
    const refresh = () => {
      clearTimeout(t);
      t = setTimeout(async () => {
        setSales(await DataService.loadSales(2000));
        setLogs(await DataService.loadLogs(2000));
      }, 120);
    };
    const chan = supabase
      .channel("history-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_logs" }, refresh)
      .subscribe();
    return () => { try { supabase.removeChannel(chan); } catch {}; clearTimeout(t); };
  }, []);

  const setRangeDays = (days) => {
    const end = new Date(); const start = new Date(); start.setDate(end.getDate() - (days - 1));
    const toISO = (d) => d.toISOString().slice(0, 10);
    setFilter((f) => ({ ...f, startDate: toISO(start), endDate: toISO(end) }));
    setSalesPage(1); setLogsPage(1);
  };
  const resetRange = () => setFilter((f) => ({ ...f, startDate: "", endDate: "" }));

  const filteredSales = useMemo(() => {
    const arr = sales.filter((s) => {
      const d = String(s.date).slice(0, 10);
      const byName = !filter.search || s.customer.toLowerCase().includes(filter.search.toLowerCase());
      const byFrom = !filter.startDate || d >= filter.startDate;
      const byTo   = !filter.endDate   || d <= filter.endDate;
      const byMethod = filter.metode === "SEMUA" || s.method === filter.metode;
      return byName && byFrom && byTo && byMethod;
    });
    return arr.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sales, filter]);

  const filteredLogs = useMemo(() => {
    const arr = logs.filter((l) => {
      const d = String(l.created_at).slice(0, 10);
      const byFrom = !filter.startDate || d >= filter.startDate;
      const byTo   = !filter.endDate   || d <= filter.endDate;
      return byFrom && byTo;
    });
    return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [logs, filter.startDate, filter.endDate]);

  const paginate = (arr, page, perPage) => (perPage === "ALL" ? arr : arr.slice((page - 1) * perPage, page * perPage));
  const totalSalesPages = salesPerPage === "ALL" ? 1 : Math.max(1, Math.ceil(filteredSales.length / salesPerPage));
  const totalLogsPages  = logsPerPage === "ALL"  ? 1 : Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));
  const salesRows = paginate(filteredSales, salesPage, salesPerPage);
  const logsRows  = paginate(filteredLogs,  logsPage,  logsPerPage);

  const totalAmount = filteredSales.reduce((a, s) => a + s.total, 0);
  const totalQty    = filteredSales.reduce((a, s) => a + s.qty, 0);
  const totalHpp    = filteredSales.reduce((a, s) => a + (s.hpp || 0) * (s.qty || 0), 0);
  const totalLaba   = filteredSales.reduce((a, s) => a + (s.laba || 0), 0);

  const periodLabel =
    filter.startDate && filter.endDate
      ? `${new Date(filter.startDate).toLocaleDateString("id-ID")} s/d ${new Date(filter.endDate).toLocaleDateString("id-ID")}`
      : filter.startDate ? `≥ ${new Date(filter.startDate).toLocaleDateString("id-ID")}`
      : filter.endDate ? `≤ ${new Date(filter.endDate).toLocaleDateString("id-ID")}`
      : "Semua Periode";

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Laporan Penjualan & Log Stok", 14, 16);
    doc.setFontSize(10);
    doc.text(`Periode: ${periodLabel}`, 14, 22);

    autoTable(doc, {
      head: [["Waktu", "Pelanggan", "Qty", "Harga", "Total", "Metode"]],
      body: filteredSales.map((s) => [fmtDateTimeID(s.date), s.customer, s.qty, fmtIDR(s.price), fmtIDR(s.total), s.method]),
      startY: 28, styles: { fontSize: 9 }, headStyles: { fillColor: [33, 150, 243] },
    });
    const yAfterSales = (doc.lastAutoTable?.finalY || 28) + 10;
    autoTable(doc, {
      head: [["Waktu", "Kode", "Perubahan", "Catatan"]],
      body: filteredLogs.map((l) => [fmtDateTimeID(l.created_at), l.code, l.qty_change > 0 ? `+${l.qty_change}` : String(l.qty_change), l.note || "-"]),
      startY: yAfterSales, styles: { fontSize: 9 }, headStyles: { fillColor: [76, 175, 80] },
    });
    const yAfterLogs = (doc.lastAutoTable?.finalY || yAfterSales) + 10;
    autoTable(doc, {
      head: [["Total Transaksi", "Total Qty", "Omzet", "HPP", "Laba Bersih"]],
      body: [[String(filteredSales.length), String(totalQty), fmtIDR(totalAmount), fmtIDR(totalHpp), fmtIDR(totalLaba)]],
      startY: yAfterLogs + 4, styles: { fontSize: 10 }, theme: "grid", headStyles: { fillColor: [158, 158, 158] },
    });
    doc.save(`laporan-penjualan-${todayStr()}.pdf`);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const salesSheetData = [["Waktu", "Pelanggan", "Qty", "Harga", "Total", "Metode"],
      ...filteredSales.map((s) => [fmtDateTimeID(s.date), s.customer, s.qty, s.price, s.total, s.method])];
    const wsSales = XLSX.utils.aoa_to_sheet(salesSheetData); XLSX.utils.book_append_sheet(wb, wsSales, "Penjualan");
    const logsSheetData = [["Waktu", "Kode", "Perubahan", "Catatan"],
      ...filteredLogs.map((l) => [fmtDateTimeID(l.created_at), l.code, l.qty_change, l.note || "-"])];
    const wsLogs = XLSX.utils.aoa_to_sheet(logsSheetData); XLSX.utils.book_append_sheet(wb, wsLogs, "Log Stok");
    const summaryData = [["Periode", "Total Transaksi", "Total Qty", "Omzet", "HPP", "Laba Bersih"],
      [periodLabel, filteredSales.length, totalQty, totalAmount, totalHpp, totalLaba]];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData); XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");
    XLSX.writeFile(wb, `laporan-penjualan-${todayStr()}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={onCancel} icon="←">Kembali</Button>
        <h1 className="text-xl font-semibold" style={{ color: COLORS.text }}>Riwayat Transaksi</h1>
        <span className="ml-auto px-3 py-1 rounded-full text-xs shadow-sm" style={{ background: COLORS.light, color: COLORS.text }}>
          Periode: <b>{periodLabel}</b>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Transaksi" value={filteredSales.length} color={COLORS.info} />
        <SummaryCard label="Total Qty" value={totalQty} color={COLORS.danger} />
        <SummaryCard label="Omzet" value={fmtIDR(totalAmount)} color={COLORS.success} />
        <SummaryCard label="Laba Bersih" value={fmtIDR(totalLaba)} color={COLORS.primary} />
      </div>

      <Card title="Filter & Export">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input placeholder="Cari pelanggan…" value={filter.search} onChange={(e) => { setFilter({ ...filter, search: e.target.value }); setSalesPage(1); }} />
          <Input type="date" value={filter.startDate} onChange={(e) => { setFilter({ ...filter, startDate: e.target.value }); setSalesPage(1); setLogsPage(1); }} />
          <Input type="date" value={filter.endDate} onChange={(e) => { setFilter({ ...filter, endDate: e.target.value }); setSalesPage(1); setLogsPage(1); }} />
          <select value={filter.metode} onChange={(e) => { setFilter({ ...filter, metode: e.target.value }); setSalesPage(1); }} className="border p-2 rounded">
            <option value="SEMUA">Semua</option>
            <option value="TUNAI">Tunai</option>
            <option value="HUTANG">Hutang</option>
          </select>
          <div className="flex gap-2">
            <Button onClick={() => setRangeDays(7)}>7H</Button>
            <Button onClick={() => setRangeDays(30)}>30H</Button>
            <Button onClick={resetRange}>Reset</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-end mt-4">
          <Button onClick={exportPDF} icon="📄">Export PDF</Button>
          <Button onClick={exportExcel} icon="📊">Export Excel</Button>
        </div>
      </Card>

      <Card title={`Penjualan (${filteredSales.length} items)`} subtitle="Transaksi penjualan LPG">
        <ToolbarPerPage label="Tampilkan" value={salesPerPage} onChange={(v) => { setSalesPerPage(v); setSalesPage(1); }}
          pageInfo={salesPerPage === "ALL" ? "Menampilkan semua" : `Halaman ${salesPage} dari ${totalSalesPages}`} />
        <TableSales rows={salesRows} />
        {salesPerPage !== "ALL" && (
          <Pager page={salesPage} totalPages={totalSalesPages}
            onPrev={() => setSalesPage((p) => Math.max(1, p - 1))}
            onNext={() => setSalesPage((p) => Math.min(totalSalesPages, p + 1))} />
        )}
      </Card>

      <Card title={`Log Stok (${filteredLogs.length} items)`} subtitle="Perubahan stok ISI & KOSONG">
        <ToolbarPerPage label="Tampilkan" value={logsPerPage} onChange={(v) => { setLogsPerPage(v); setLogsPage(1); }}
          pageInfo={logsPerPage === "ALL" ? "Menampilkan semua" : `Halaman ${logsPage} dari ${totalLogsPages}`} />
        <TableLogs rows={logsRows} />
        {logsPerPage !== "ALL" && (
          <Pager page={logsPage} totalPages={totalLogsPages}
            onPrev={() => setLogsPage((p) => Math.max(1, p - 1))}
            onNext={() => setLogsPage((p) => Math.min(totalLogsPages, p + 1))} />
        )}
      </Card>
    </div>
  );
};

function SummaryCard({ label, value, color }) {
  return (
    <div className="p-4 rounded-xl border shadow-sm" style={{ borderColor: `${color}40`, background: `${color}0D` }}>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
function ToolbarPerPage({ label, value, onChange, pageInfo }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
      <span className="text-sm text-gray-500">
        {label}:
        <select value={value} onChange={(e) => onChange(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))} className="ml-2 border p-1 rounded">
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value="ALL">Semua</option>
        </select>
      </span>
      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">{pageInfo}</span>
    </div>
  );
}
function TableSales({ rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-white">
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <Th>Waktu</Th><Th>Pelanggan</Th><Th right>Qty</Th><Th right>Harga</Th><Th right>Total</Th><Th center>Metode</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-b hover:bg-gray-50">
              <Td>{fmtDateTimeID(s.date)}</Td>
              <Td bold>{s.customer}</Td>
              <Td right>{s.qty}</Td>
              <Td right>{fmtIDR(s.price)}</Td>
              <Td right className="text-green-600 font-semibold">{fmtIDR(s.total)}</Td>
              <Td center>
                <span className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ background: s.method === "HUTANG" ? "#fef2f2" : "#ecfdf5", color: s.method === "HUTANG" ? "#dc2626" : "#16a34a" }}>
                  {s.method}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function TableLogs({ rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-white">
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <Th>Waktu</Th><Th>Kode</Th><Th right>Perubahan</Th><Th>Catatan</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} className="border-b hover:bg-gray-50">
              <Td>{fmtDateTimeID(l.created_at)}</Td>
              <Td>{l.code}</Td>
              <Td right style={{ color: l.qty_change > 0 ? "#16a34a" : "#dc2626" }}>{l.qty_change > 0 ? `+${l.qty_change}` : l.qty_change}</Td>
              <Td>{l.note || "-"}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Th({ children, right, center }) {
  return <th className={`p-2 text-sm ${right ? "text-right" : center ? "text-center" : "text-left"} text-gray-600`}>{children}</th>;
}
function Td({ children, right, center, bold, className = "", ...rest }) {
  return <td className={`p-2 ${right ? "text-right" : center ? "text-center" : "text-left"} ${bold ? "font-medium" : ""} ${className}`} {...rest}>{children}</td>;
}
function Pager({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="flex justify-center items-center gap-3 mt-4">
      <Button onClick={onPrev} disabled={page === 1} icon="←">Prev</Button>
      <span className="text-sm text-gray-600">Hal {page} dari {totalPages}</span>
      <Button onClick={onNext} disabled={page === totalPages} icon="→">Next</Button>
    </div>
  );
}

export default RiwayatView;