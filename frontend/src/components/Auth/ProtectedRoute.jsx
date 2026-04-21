import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AccessDenied from "../AccessDenied";

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    // Not logged in → redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    // Wrong role → show access denied message
    return <AccessDenied />;
  }

  // Authorized, show wrapped component
  return children;
}

export default ProtectedRoute;
