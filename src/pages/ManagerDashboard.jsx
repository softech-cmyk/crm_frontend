import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { API_BASE, apiFetch } from "../api.js";
import {
  ChartCard,
  HBarChart,
  TrendChart,
  buildDailySeries,
  localTzOffset,
  sortStatuses,
} from "../components/DashCharts.jsx";
import "./EmployeeDashboard.css";

function timeAgo(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [live, setLive] = useState(false);

  const load = useCallback(() => {
    apiFetch(`${API_BASE}/api/dashboard/manager?tz=${encodeURIComponent(localTzOffset())}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((json) => {
        setData(json);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
    const socket = io(API_BASE, { withCredentials: true });
    socket.on("connect", () => {
      setLive(true);
      load();
    });
    socket.on("disconnect", () => setLive(false));
    socket.on("dashboard:refresh", load);
    return () => socket.disconnect();
  }, [load]);

  if (error && !data) return <div className="emp-dash">Could not load dashboard.</div>;
  if (!data) return <div className="emp-dash">Loading...</div>;

  const { stats, recentLeads, activity, perEmployee } = data;
  const daily = buildDailySeries(data.leadsByDay);
  const statuses = sortStatuses(data.leadsByStatus);
  const conversionRate = stats.totalLeads
    ? Math.round((stats.totalCustomers / stats.totalLeads) * 100)
    : 0;
  const cards = [
    { label: "Total Employees", value: stats.totalEmployees },
    { label: "Total Leads", value: stats.totalLeads },
    { label: "Total Customers", value: stats.totalCustomers },
    { label: "Pending Tasks", value: stats.pendingTasks },
  ];

  return (
    <div className="emp-dash">
      <div className="emp-dash-header">
        <h1 className="emp-dash-title">Manager Dashboard</h1>
        <span className={`emp-dash-live ${live ? "on" : ""}`}>
          <span className="emp-dash-live-dot" />
          {live ? "Live" : "Offline"}
        </span>
      </div>

      <div className="emp-dash-cards">
        {cards.map((c) => (
          <div className="emp-dash-card" key={c.label}>
            <span className="emp-dash-card-value">{c.value}</span>
            <span className="emp-dash-card-label">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="dc-grid">
        <ChartCard
          title="Leads added"
          subtitle="Last 14 days, whole team"
          data={daily}
          columns={[
            { key: "label", label: "Day" },
            { key: "count", label: "Leads" },
          ]}
        >
          <TrendChart data={daily} name="Leads" />
        </ChartCard>

        <ChartCard
          title="Leads by status"
          data={statuses}
          columns={[
            { key: "status", label: "Status" },
            { key: "count", label: "Leads" },
          ]}
          empty={statuses.length === 0 ? "No leads yet." : null}
        >
          <HBarChart
            data={statuses}
            nameKey="status"
            series={[{ key: "count", name: "Leads", color: "var(--dc-series-1)" }]}
          />
        </ChartCard>

        <section className="dc-card">
          <div className="dc-card-head">
            <div>
              <h2 className="dc-card-title">Conversion rate</h2>
              <p className="dc-card-sub">Converted leads out of all leads</p>
            </div>
          </div>
          <div className="dc-rate-value">{conversionRate}%</div>
          <p className="dc-rate-sub">
            {stats.totalCustomers} of {stats.totalLeads} leads converted
          </p>
          <div
            className="dc-rate-track"
            role="progressbar"
            aria-valuenow={conversionRate}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="dc-rate-fill" style={{ width: `${conversionRate}%` }} />
          </div>
        </section>

        <ChartCard
          title="Leads per employee"
          data={perEmployee}
          columns={[
            { key: "name", label: "Employee" },
            { key: "leads", label: "Leads" },
          ]}
          empty={perEmployee.length === 0 ? "No employees yet." : null}
        >
          <HBarChart
            data={perEmployee}
            nameKey="name"
            series={[{ key: "leads", name: "Leads", color: "var(--dc-series-1)" }]}
          />
        </ChartCard>

        <ChartCard
          title="Tasks per employee"
          data={perEmployee}
          columns={[
            { key: "name", label: "Employee" },
            { key: "tasksDone", label: "Done" },
            { key: "tasksPending", label: "Pending" },
          ]}
          empty={perEmployee.length === 0 ? "No employees yet." : null}
        >
          <HBarChart
            data={perEmployee}
            nameKey="name"
            series={[
              { key: "tasksDone", name: "Done", color: "var(--dc-series-1)" },
              { key: "tasksPending", name: "Pending", color: "var(--dc-series-2)" },
            ]}
          />
        </ChartCard>
      </div>

      <div className="emp-dash-panels">
        <section className="emp-dash-panel">
          <h2>Recent Leads</h2>
          {recentLeads.length === 0 ? (
            <p className="emp-dash-empty">No leads yet.</p>
          ) : (
            <ul>
              {recentLeads.map((l) => (
                <li key={l._id}>
                  <Link to={`/sales/leads/${l._id}`} className="emp-dash-row">
                    <span className="emp-dash-row-name">
                      {l.name || l.organisation || "Unnamed lead"}
                    </span>
                    <span className="emp-dash-row-sub">
                      {[l.name ? l.organisation : "", l.status, l.owner?.name && `by ${l.owner.name}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="emp-dash-panel">
          <h2>Employee Activity</h2>
          {activity.length === 0 ? (
            <p className="emp-dash-empty">No activity yet.</p>
          ) : (
            <ul>
              {activity.map((a) => (
                <li key={a.id} className="emp-dash-row">
                  <span className="emp-dash-row-name">
                    {a.user || "Someone"} {a.text}
                  </span>
                  <span className="emp-dash-row-sub">{timeAgo(a.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default ManagerDashboard;
