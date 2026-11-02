import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import { API_BASE, apiFetch } from "../api.js";
import { normalizeDate } from "../utils/excelDate.js";
import "./SupportDashboard.css";

const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const RECENT_LIMIT = 8;
const TOP_PRODUCTS_LIMIT = 5;
const TREND_MONTHS = 6;
const ACCENT = "var(--color-blue)";

const AXIS_TICK = { fill: "var(--text-muted)", fontSize: 11.5 };
const LABEL_STYLE = { fill: "var(--text-muted)", fontSize: 12.5, fontWeight: 600 };

function monthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : null;
}

function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function ticketYear(entry) {
  const match = /^(\d{4})/.exec(normalizeDate(entry.ticketDate));
  return match ? match[1] : "";
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="support-chart-tooltip">
      <div className="support-chart-tooltip-label">{label}</div>
      <div className="support-chart-tooltip-value">
        {value} ticket{value === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function SupportDashboard() {
  const [allEntries, setAllEntries] = useState([]);
  const [yearFilter, setYearFilter] = useState("All");
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const yearMenuRef = useRef(null);

  useEffect(() => {
    if (!yearMenuOpen) return undefined;
    const handleClick = (e) => {
      if (!yearMenuRef.current?.contains(e.target)) setYearMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [yearMenuOpen]);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/support`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load support entries");
        return res.json();
      })
      .then((data) => setAllEntries(data.supportEntries || []))
      .catch(() => {});
  }, []);

  const years = useMemo(
    () => [...new Set(allEntries.map(ticketYear).filter(Boolean))].sort().reverse(),
    [allEntries]
  );

  const supportEntries = useMemo(
    () => (yearFilter === "All" ? allEntries : allEntries.filter((e) => ticketYear(e) === yearFilter)),
    [allEntries, yearFilter]
  );

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    supportEntries.forEach((entry) => {
      if (counts[entry.status] !== undefined) counts[entry.status] += 1;
    });
    return counts;
  }, [supportEntries]);

  const statusChartData = STATUSES.map((s) => ({ label: s, count: statusCounts[s] }));

  const topProducts = useMemo(() => {
    const counts = new Map();
    supportEntries.forEach((entry) => {
      const name = (entry.product || "").trim();
      if (!name) return;
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_PRODUCTS_LIMIT);
  }, [supportEntries]);

  const monthlyTrend = useMemo(() => {
    const counts = new Map();
    supportEntries.forEach((entry) => {
      const key = monthKey(normalizeDate(entry.ticketDate));
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([key, count]) => ({ key, count, label: monthLabel(key) }))
      .sort((a, b) => (a.key < b.key ? -1 : 1))
      .slice(yearFilter === "All" ? -TREND_MONTHS : 0);
  }, [supportEntries, yearFilter]);

  const recentEntries = supportEntries.slice(0, RECENT_LIMIT);
  const productBarHeight = Math.max(120, topProducts.length * 40);

  return (
    <div className="support-dashboard-page">
      <div className="support-dashboard-header">
        <h1 className="support-dashboard-title">Support Dashboard</h1>
        <div className="support-dashboard-actions">
          <div className="support-year-menu" ref={yearMenuRef}>
            <button
              type="button"
              className="support-year-btn"
              aria-haspopup="listbox"
              aria-expanded={yearMenuOpen}
              onClick={() => setYearMenuOpen((open) => !open)}
            >
              {yearFilter === "All" ? "All years" : yearFilter}
              <ChevronDown size={14} />
            </button>
            {yearMenuOpen && (
              <ul className="support-year-list" role="listbox">
                {["All", ...years].map((year) => (
                  <li key={year}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={yearFilter === year}
                      className={`support-year-option ${yearFilter === year ? "active" : ""}`}
                      onClick={() => {
                        setYearFilter(year);
                        setYearMenuOpen(false);
                      }}
                    >
                      {year === "All" ? "All years" : year}
                      {yearFilter === year && <Check size={14} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link to="/support/details" className="btn-primary">
            Go to Details
          </Link>
        </div>
      </div>

      <div className="support-dashboard-stats">
        <div className="support-stat-card">
          <span className="support-stat-value">{supportEntries.length}</span>
          <span className="support-stat-label">Total</span>
        </div>
        {STATUSES.map((s) => (
          <div className="support-stat-card" key={s}>
            <span className="support-stat-value">{statusCounts[s]}</span>
            <span className="support-stat-label">{s}</span>
          </div>
        ))}
      </div>

      <div className="support-chart-card">
        <h2 className="support-dashboard-subtitle">Tickets Over Time</h2>
        {monthlyTrend.length < 2 && (
          <p className="support-dashboard-empty">Not enough data yet to show a trend.</p>
        )}
        {monthlyTrend.length >= 2 && (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyTrend} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border-color)" />
              <XAxis
                dataKey="label"
                tick={AXIS_TICK}
                axisLine={{ stroke: "var(--border-color)" }}
                tickLine={false}
              />
              <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border-color)" }} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={ACCENT}
                strokeWidth={2}
                fill={ACCENT}
                fillOpacity={0.1}
                dot={{ r: 4, fill: ACCENT, stroke: "var(--bg-card)", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: ACCENT, stroke: "var(--bg-card)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="support-dashboard-columns">
        <div className="support-chart-card">
          <h2 className="support-dashboard-subtitle">Tickets by Status</h2>
          {supportEntries.length === 0 && <p className="support-dashboard-empty">No support entries yet.</p>}
          {supportEntries.length > 0 && (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={statusChartData}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--border-color)" />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={90}
                  tick={{ fill: "var(--text-main)", fontSize: 12.5 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--bg-page)" }} />
                <Bar dataKey="count" fill={ACCENT} radius={[0, 4, 4, 0]} barSize={20}>
                  <LabelList dataKey="count" position="right" style={LABEL_STYLE} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="support-chart-card">
          <h2 className="support-dashboard-subtitle">Top Products</h2>
          {topProducts.length === 0 && <p className="support-dashboard-empty">No products logged yet.</p>}
          {topProducts.length > 0 && (
            <ResponsiveContainer width="100%" height={productBarHeight}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--border-color)" />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={90}
                  tick={{ fill: "var(--text-main)", fontSize: 12.5 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--bg-page)" }} />
                <Bar dataKey="count" fill={ACCENT} radius={[0, 4, 4, 0]} barSize={20}>
                  <LabelList dataKey="count" position="right" style={LABEL_STYLE} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <h2 className="support-dashboard-subtitle">Recent Entries</h2>

      {recentEntries.length === 0 && <p className="support-dashboard-empty">No support entries yet.</p>}

      {recentEntries.length > 0 && (
        <div className="support-dashboard-table">
          <div className="support-dashboard-row support-dashboard-head">
            <span>Sr No.</span>
            <span>Ticket Number</span>
            <span>Product</span>
            <span>Customer</span>
            <span>Ticket Date</span>
            <span>Status</span>
          </div>
          {recentEntries.map((entry) => (
            <div className="support-dashboard-row" key={entry._id}>
              <span>{entry.serialNo || "-"}</span>
              <span>{entry.ticketNumber || "-"}</span>
              <span>{entry.product || "-"}</span>
              <span>{entry.customer || "-"}</span>
              <span>{normalizeDate(entry.ticketDate) || "-"}</span>
              <span>{entry.status || "-"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SupportDashboard;
