import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useStore } from "./store/useStore";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoadingSpinner from "./components/shared/LoadingSpinner";

const Landing = lazy(() => import("./pages/Landing"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const PublicSearch = lazy(() => import("./pages/PublicSearch"));
const Login = lazy(() => import("./pages/Login"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));

const AdminDashboard = lazy(() => import("./pages/dashboards/AdminDashboard"));
const PatwariDashboard = lazy(() => import("./pages/dashboards/PatwariDashboard"));
const TehsildarDashboard = lazy(() => import("./pages/dashboards/TehsildarDashboard"));
const DCDashboard = lazy(() => import("./pages/dashboards/DCDashboard"));

const RegisterLand = lazy(() => import("./pages/land/RegisterLand"));
const ManageLands = lazy(() => import("./pages/land/ManageLands"));
const LandDetails = lazy(() => import("./pages/land/LandDetails"));
const TransferLand = lazy(() => import("./pages/land/TransferLand"));
const PrintLandRecord = lazy(() => import("./pages/land/PrintLandRecord"));

const ManageDisputes = lazy(() => import("./pages/disputes/ManageDisputes"));
const DisputeDetails = lazy(() => import("./pages/disputes/DisputeDetails"));

const OfficerProfile = lazy(() => import("./pages/profile/OfficerProfile"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));

const DashboardRedirect = () => {
  const officer = useStore((s) => s.officer);
  if (!officer) return <Navigate to="/login" replace />;
  if (officer.role === "admin") return <Navigate to="/dashboard/admin" replace />;
  if (officer.role === "patwari") return <Navigate to="/dashboard/patwari" replace />;
  if (officer.role === "tehsildar") return <Navigate to="/dashboard/tehsildar" replace />;
  if (officer.role === "dc") return <Navigate to="/dashboard/dc" replace />;
  return <Navigate to="/unauthorized" replace />;
};

const App = () => {
  const { checkAuth, isLoading } = useStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <Suspense fallback={<LoadingSpinner fullPage />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/search" element={<PublicSearch />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          element={
            <ProtectedRoute allowedRoles={["admin", "patwari", "tehsildar", "dc"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/patwari" element={<ProtectedRoute allowedRoles={["patwari"]}><PatwariDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/tehsildar" element={<ProtectedRoute allowedRoles={["tehsildar"]}><TehsildarDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/dc" element={<ProtectedRoute allowedRoles={["dc"]}><DCDashboard /></ProtectedRoute>} />

          <Route path="/land/register" element={<ProtectedRoute allowedRoles={["patwari"]}><RegisterLand /></ProtectedRoute>} />
          <Route path="/land/all" element={<ManageLands />} />
          <Route path="/land/transfer" element={<ProtectedRoute allowedRoles={["patwari"]}><TransferLand /></ProtectedRoute>} />
          <Route path="/land/:parcelId" element={<LandDetails />} />
          <Route path="/land/:parcelId/print" element={<PrintLandRecord />} />

          <Route path="/disputes" element={<ManageDisputes />} />
          <Route path="/disputes/:id" element={<DisputeDetails />} />
          <Route path="/profile" element={<OfficerProfile />} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={["admin"]}><AuditLogs /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
