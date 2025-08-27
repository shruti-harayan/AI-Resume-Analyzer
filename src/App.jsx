import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import HomePage from "./pages/HomePage";
import ScoringTransparency from "./pages/ScoringTransparency";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/Auth/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/scoring-transparency" element={<ScoringTransparency />} />

            {/* Protected Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute role="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter"
              element={
                <ProtectedRoute role="recruiter">
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />
            
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
