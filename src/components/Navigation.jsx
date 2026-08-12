import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const customerLinks = [
  { to: "/", label: "Bosh sahifa", icon: "home" },
  { to: "/catalog", label: "Katalog", icon: "grid" },
  { to: "/ar", label: "AR", icon: "camera" },
  { to: "/projects", label: "Loyihalar", icon: "folder" },
];

const staffLinks = [
  { to: "/admin", label: "Dashboard", icon: "chart" },
  { to: "/admin/furniture", label: "Mebel", icon: "box" },
  { to: "/admin/categories", label: "Kategoriyalar", icon: "tag" },
  { to: "/projects", label: "Loyihalar", icon: "folder" },
];

const ICONS = {
  home: "M3 11l9-8 9 8v9a2 2 0 01-2 2h-4a1 1 0 01-1-1v-5H9v5a1 1 0 01-1 1H4a2 2 0 01-2-2v-9z",
  grid: "M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z",
  folder: "M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V6z",
  chart: "M4 19V9m6 10V5m6 14v-8m6 8V3",
  box: "M21 8L12 3 3 8l9 5 9-5zM3 8v8l9 5V13M21 8v8l-9 5",
  tag: "M20.59 13.41L11 3.83A2 2 0 009.59 3H4a1 1 0 00-1 1v5.59a2 2 0 00.59 1.41l9.58 9.58a2 2 0 002.82 0l4.6-4.6a2 2 0 000-2.82z",
  camera: "M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1zM12 17a4 4 0 100-8 4 4 0 000 8z",
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d={ICONS[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Sidebar() {
  const { user, isStaff, logout } = useAuth();
  const links = isStaff ? staffLinks : customerLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">🪑 MebelAR</div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end className="sidebar-link">
            <Icon name={l.icon} />
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div>
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="btn-ghost" onClick={logout}>
          Chiqish
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { isStaff } = useAuth();
  const links = isStaff
    ? [
        { to: "/admin", label: "Dashboard", icon: "chart" },
        { to: "/admin/furniture", label: "Mebel", icon: "box" },
        { to: "/catalog", label: "Katalog", icon: "grid" },
        { to: "/projects", label: "Loyihalar", icon: "folder" },
      ]
    : [
        { to: "/", label: "Bosh", icon: "home" },
        { to: "/catalog", label: "Katalog", icon: "grid" },
        { to: "/ar", label: "AR", icon: "camera" },
        { to: "/projects", label: "Loyihalar", icon: "folder" },
      ];

  return (
    <nav className="mobile-nav">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end className="mobile-nav-link">
          <Icon name={l.icon} />
          <span>{l.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
