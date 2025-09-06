import React, { useState, useContext, useEffect} from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const { user, login } = useContext(AuthContext); // GET user from context
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Once user is set after login, redirect by role
    if (user) {
      if (user.role === "student") {
        navigate("/student", { replace: true });
      } else if (user.role === "recruiter") {
        navigate("/recruiter", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleBack = () => {
    navigate("/");  // Redirect to homepage
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await login(email, password, role);
      setSuccess("Login successful!");

    } catch (err) {
      setError(err.message); // "Invalid credentials" etc.
    }
    setLoading(false);
  };

  return (
  <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mt-12">
    <button
        onClick={handleBack}
        className="
          absolute top-4 left-4 flex items-center gap-2
          font-bold text-indigo-700
          dark:text-indigo-300
          hover:text-indigo-900 dark:hover:text-indigo-100
          focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded
          "
        aria-label="Back to homepage"
      >
        <span role="img" aria-label="left arrow">⬅️</span> BACK
      </button>
    <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
    {error && <p className="text-red-500 mb-4">{error}</p>}
    {success && <p className="text-green-500 mb-4">{success}</p>}

    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <input
        type="email"
        placeholder="Email"
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {/* Password with show/hide */}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-2.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      {/* Role Dropdown */}
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="student">🎓 Student</option>
        <option value="recruiter">💼 Recruiter</option>
      </select>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Login"} 
      </button>
    </form>
  </div>
);
}

export default Login;
