import { Link } from "react-router-dom";

function Header({ darkMode, setDarkMode }) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
          CVisionary
        </Link>

        {/* Navigation */}
        <nav className="space-x-6">
          <Link to="/" className="hover:text-indigo-500">Home</Link>
          <Link to="/student" className="hover:text-indigo-500">Student</Link>
          <Link to="/recruiter" className="hover:text-indigo-500">Recruiter</Link>
          <Link to="/scoring-transparency" className="hover:text-indigo-500">How Scoring Works</Link> {/* ✅ New link */}
        </nav>

      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="ml-6 px-3 py-2 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      >
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>
      </div>
    </header>
  );
}

export default Header;