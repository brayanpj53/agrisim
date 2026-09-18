import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function DashboardLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;