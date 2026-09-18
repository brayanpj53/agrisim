import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Parcels from "./pages/Parcels";
import Simulations from "./pages/Simulations";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/parcelas"
            element={<Parcels />}
          />

          <Route
            path="/simulaciones"
            element={<Simulations />}
          />

          <Route
            path="/reportes"
            element={<Reports />}
          />

          <Route
            path="/configuracion"
            element={<Settings />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;