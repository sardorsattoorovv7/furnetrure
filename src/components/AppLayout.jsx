import { Outlet } from "react-router-dom";
import { MobileNav, Sidebar } from "./Navigation";

export function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
