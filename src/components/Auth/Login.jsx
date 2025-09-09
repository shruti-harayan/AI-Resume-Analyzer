import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const { user, login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === "student") {
        navigate("/student", { replace: true });
      } else if (user.role === "recruiter") {
        navigate("/recruiter", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleBack = () => {
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await login(email, password, role);
      setSuccess("✅ Login successful!");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 flex items-center gap-2 font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1"
        >
          ⬅ Back
        </button>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">
          Welcome Back 👋
        </h2>

        {/* Feedback */}
        {error && <p className="text-red-500 font-medium mb-4">{error}</p>}
        {success && <p className="text-green-500 font-medium mb-4">{success}</p>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Role */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="student">🎓 Student</option>
            <option value="recruiter">💼 Recruiter</option>
          </select>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-md hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don’t have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
