import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./DashCharts.css";

const AXIS_TICK = { fill: "var(--dc-text-muted)", fontSize: 12 };
const TOOLTIP_STYLE = {
  background: "var(--dc-surface)",
  border: "1px solid var(--dc-grid)",
  borderRadius: 8,
  fontSize: 13,
  color: "var(--dc-text)",
};

/** Card with a title, a chart, and a "Table" toggle so the numbers are always readable. */
export function ChartCard({ title, subtitle, data, columns, children, empty }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className="dc-card">
      <div className="dc-card-head">
        <div>
          <h2 className="dc-card-title">{title}</h2>
          {subtitle && <p className="dc-card-sub">{subtitle}</p>}
        </div>
        {!empty && (
          <button type="button" className="dc-toggle" onClick={() => setShowTable((p) => !p)}>
            {showTable ? "Chart" : "Table"}
          </button>
        )}
      </div>
      {empty ? (
        <p className="dc-empty">{empty}</p>
      ) : showTable ? (
        <table className="dc-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key}>{row[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        children
      )}
    </section>
  );
}

/** Single-series area/line over time. data: [{ label, count }] */
export function TrendChart({ data, name = "Leads" }) {
  return (
    <div className="dc-plot" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="var(--dc-grid)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--dc-grid)" }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "var(--dc-text-muted)" }} />
          <Area
            type="monotone"
            dataKey="count"
            name={name}
            stroke="var(--dc-series-1)"
            strokeWidth={2}
            fill="var(--dc-series-1)"
            fillOpacity={0.12}
            activeDot={{ r: 5, stroke: "var(--dc-surface)", strokeWidth: 2 }}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Horizontal bars. series: [{ key, name, color }] — one entry = plain bars,
 * several = stacked with a legend.
 */
export function HBarChart({ data, nameKey, series }) {
  const stacked = series.length > 1;
  const height = Math.max(160, data.length * 34 + (stacked ? 40 : 16));
  return (
    <div className="dc-plot" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
          barCategoryGap={8}
        >
          <CartesianGrid stroke="var(--dc-grid)" horizontal={false} />
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey={nameKey}
            width={96}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--dc-grid)" }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--dc-grid)", opacity: 0.4 }} />
          {stacked && <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              stackId={stacked ? "a" : undefined}
              fill={s.color}
              stroke={stacked ? "var(--dc-surface)" : undefined}
              strokeWidth={stacked ? 2 : 0}
              barSize={14}
              radius={!stacked || i === series.length - 1 ? [0, 4, 4, 0] : 0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Last `days` calendar days (local time), oldest first, filled with zeros. */
export function buildDailySeries(countsByDate, days = 14) {
  const out = [];
  const pad = (n) => String(n).padStart(2, "0");
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    out.push({
      date: key,
      label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      count: countsByDate?.[key] || 0,
    });
  }
  return out;
}

/** Viewer's UTC offset as "+05:30" so the server groups days in local time. */
export function localTzOffset() {
  const mins = -new Date().getTimezoneOffset();
  const sign = mins >= 0 ? "+" : "-";
  const abs = Math.abs(mins);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

/** Status counts in a stable, meaningful order. */
const STATUS_ORDER = ["New", "Contacted", "Qualified", "Converted", "Lost", "No status"];
export function sortStatuses(rows) {
  const rank = (s) => {
    const i = STATUS_ORDER.indexOf(s);
    return i === -1 ? STATUS_ORDER.length : i;
  };
  return [...rows].sort((a, b) => rank(a.status) - rank(b.status));
}
