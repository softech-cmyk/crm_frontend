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

function localToday() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function LeadRow({ lead, meta }) {
  return (
    <li>
      <Link to={`/sales/leads/${lead._id}`} className="emp-dash-row">
        <span className="emp-dash-row-name">{lead.name || lead.organisation || "Unnamed lead"}</span>
        <span className="emp-dash-row-sub">
          {[lead.name ? lead.organisation : "", meta].filter(Boolean).join(" · ")}
        </span>
      </Link>
    </li>
  );
}

function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [live, setLive] = useState(false);

  const load = useCallback(() => {
    apiFetch(`${API_BASE}/api/dashboard/employee?today=${localToday()}&tz=${encodeURIComponent(localTzOffset())}`)
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
      load(); // catch anything missed while disconnected
    });
    socket.on("disconnect", () => setLive(false));
    socket.on("dashboard:refresh", load);
    return () => socket.disconnect();
  }, [load]);

  if (error && !data) return <div className="emp-dash">Could not load dashboard.</div>;
  if (!data) return <div className="emp-dash">Loading...</div>;

  const { stats, recentLeads, todaysFollowUps } = data;
  const daily = buildDailySeries(data.leadsByDay);
  const statuses = sortStatuses(data.leadsByStatus);
  const totalTasks = stats.pendingTasks + stats.completedTasks;
  const completionRate = totalTasks ? Math.round((stats.completedTasks / totalTasks) * 100) : 0;
  const cards = [
    { label: "My Total Leads", value: stats.totalLeads },
    { label: "My Customers", value: stats.customers },
    { label: "Pending Tasks", value: stats.pendingTasks },
    { label: "Completed Tasks", value: stats.completedTasks },
  ];

  return (
    <div className="emp-dash">
      <div className="emp-dash-header">
        <h1 className="emp-dash-title">My Dashboard</h1>
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
          subtitle="Last 14 days"
          data={daily}
          columns={[
            { key: "label", label: "Day" },
            { key: "count", label: "Leads" },
          ]}
        >
          <TrendChart data={daily} name="Leads" />
        </ChartCard>

        <ChartCard
          title="My leads by status"
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
              <h2 className="dc-card-title">Task completion</h2>
              <p className="dc-card-sub">All your tasks</p>
            </div>
          </div>
          <div className="dc-rate-value">{completionRate}%</div>
          <p className="dc-rate-sub">
            {stats.completedTasks} of {totalTasks} tasks completed
          </p>
          <div
            className="dc-rate-track"
            role="progressbar"
            aria-valuenow={completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="dc-rate-fill" style={{ width: `${completionRate}%` }} />
          </div>
        </section>
      </div>

      <div className="emp-dash-panels">
        <section className="emp-dash-panel">
          <h2>My Recent Leads</h2>
          {recentLeads.length === 0 ? (
            <p className="emp-dash-empty">No leads yet.</p>
          ) : (
            <ul>
              {recentLeads.map((l) => (
                <LeadRow key={l._id} lead={l} meta={l.status} />
              ))}
            </ul>
          )}
        </section>

        <section className="emp-dash-panel">
          <h2>Today's Follow-ups</h2>
          {todaysFollowUps.length === 0 ? (
            <p className="emp-dash-empty">No follow-ups scheduled for today.</p>
          ) : (
            <ul>
              {todaysFollowUps.map((l) => (
                <LeadRow key={l._id} lead={l} meta={l.nextFollowUpType} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
