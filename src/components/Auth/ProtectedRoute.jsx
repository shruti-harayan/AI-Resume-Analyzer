import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    // Not logged in → redirect to login
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    // Wrong role → block access
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
