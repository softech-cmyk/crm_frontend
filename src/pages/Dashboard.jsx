import { useAuthStore } from "../store/authStore.js";
import ManagerDashboard from "./ManagerDashboard.jsx";
import EmployeeDashboard from "./EmployeeDashboard.jsx";

function Dashboard() {
  const role = useAuthStore((state) => state.user?.role);
  return role === "manager" ? <ManagerDashboard /> : <EmployeeDashboard />;
}

export default Dashboard;
