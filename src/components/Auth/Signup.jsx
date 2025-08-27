import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Signup() {
  const { signup } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [signing, setSigning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSigning(true);
    setError("");
    setSuccess("");
    try {
      const res = await signup(email, password, role);
      setSuccess(res.message);
      setTimeout(() => {
      navigate("/login");
    }, 1000);
    } catch (err) {
      setError(err.message); // shows "User already registered..." etc.
    }
    setSigning(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mt-12">
      <h2 className="text-2xl font-bold text-center mb-6">Signup</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full px-3 py-2 border rounded-lg"
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
          type="submit"  disabled={signing}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
        >
          {signing ? "Signing in..." : "Signup"} 
        </button>
      </form>
    </div>
  );
}

export default Signup;
