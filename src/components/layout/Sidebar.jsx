import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  CheckSquare,
  BarChart2,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Target,
  FileText,
  Package,
  ClipboardList,
  ShieldCheck,
  Info,
  Moon,
  Sun,
  LifeBuoy,
  LogOut,
  UserPlus,
  List,
  Mail,
  Wrench,
  ShoppingCart,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore.js";
import "./Sidebar.css";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  {
    label: "Sales",
    icon: TrendingUp,
    children: [
      { label: "Leads", to: "/sales/leads", icon: Target },
      { label: "Quotations", to: "/sales/quotations/new", icon: FileText },
      { label: "Share Quotation", to: "/sales/share-quotation", icon: Mail },
      { label: "Price List", to: "/sales/products", icon: Package },
      { label: "Product Information", to: "/sales/product-information", icon: Info },
      { label: "Tender Reference", to: "/sales/tender-reference", icon: ClipboardList },
      { label: "EMD_BG_EPBG", to: "/sales/emd-bg-epbg", icon: ShieldCheck },
    ],
  },
  {
    label: "Contact/Marketing",
    icon: Users,
    children: [
      { label: "Add", to: "/contacts", icon: UserPlus, end: true },
      { label: "List", to: "/contacts/list", icon: List },
      { label: "Mail Marketing", to: "/contacts/mail-marketing", icon: Mail },
    ],
  },
  { label: "Tasks", to: "/tasks", icon: CheckSquare },
  { label: "Reports", to: "/reports", icon: BarChart2 },
  {
    label: "Support",
    icon: LifeBuoy,
    children: [
      { label: "Dashboard", to: "/support/dashboard", icon: LayoutDashboard },
      { label: "Details", to: "/support/details", icon: ClipboardList },
      { label: "AMC Support", to: "/support/amc", icon: ShieldCheck },
      { label: "CMC", to: "/support/cmc", icon: FileText },
    ],
  },
  {
    label: "Operations",
    icon: Wrench,
    children: [
      { label: "Purchase Order", to: "/operations/purchase-order", icon: ShoppingCart },
    ],
  },
  { label: "Settings", to: "/settings", icon: Settings },
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    NAV_ITEMS.forEach((item) => {
      if (item.children?.some((child) => location.pathname.startsWith(child.to))) {
        initial[item.label] = true;
      }
    });
    return initial;
  });
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "true"
  );
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute("data-theme") || "light"
  );

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));
   
  

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));0
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">C</span>  
        <span className="sidebar-brand-name">CRM</span>
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          if (item.children) {
            const isOpen = !!openGroups[item.label];
            return (
              <div className="sidebar-group" key={item.label}>
                <button
                  type="button"
                  className="sidebar-link sidebar-group-toggle"
                  onClick={() => toggleGroup(item.label)}
                  title={item.label}
                >
                  <Icon size={18} className="sidebar-icon" />
                  <span>{item.label}</span>
                  <ChevronDown
                    size={16}
                    className={`sidebar-chevron ${isOpen ? "open" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="sidebar-submenu">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end={child.end}
                          className={({ isActive }) =>
                            `sidebar-link sidebar-sublink ${isActive ? "active" : ""}`
                          }
                        >
                          <ChildIcon size={16} className="sidebar-icon" />
                          <span>{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              title={item.label}
            >
              <Icon size={18} className="sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <button
        type="button"
        className="sidebar-link sidebar-theme-toggle"
        onClick={toggleTheme}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? <Sun size={18} className="sidebar-icon" /> : <Moon size={18} className="sidebar-icon" />}
        <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
      </button>

      <div className="sidebar-user">
        {!collapsed && user && <span className="sidebar-user-name">{user.name}</span>}
        <button
          type="button"
          className="sidebar-link sidebar-logout"
          onClick={handleLogout}
          title="Log out"
        >
          <LogOut size={18} className="sidebar-icon" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
