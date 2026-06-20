import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Pricing from "@/pages/Pricing";
import Intake from "@/pages/Intake";
import Appointments from "@/pages/Appointments";
import Sorting from "@/pages/Sorting";
import Sales from "@/pages/Sales";
import Settlement from "@/pages/Settlement";
import ProfitReport from "@/pages/ProfitReport";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/intake" element={<Intake />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/sorting" element={<Sorting />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/settlement" element={<Settlement />} />
          <Route path="/profit" element={<ProfitReport />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
