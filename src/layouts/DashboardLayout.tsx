import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function DashboardLayout() {
  return (
    <div className="ag-app-shell">
      <Sidebar />

      <div className="ag-app-main">
        <Topbar />

        <main className="ag-app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;