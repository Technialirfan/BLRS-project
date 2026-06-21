import { Navigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import LoadingSpinner from "./LoadingSpinner";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isLoggedIn, officer } = useStore((s) => ({
    isLoggedIn: s.isLoggedIn,
    officer: s.officer,
  }));

  if (!isLoggedIn || !officer) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(officer.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
