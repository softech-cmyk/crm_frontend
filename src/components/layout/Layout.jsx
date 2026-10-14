import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import "./Layout.css";

function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
