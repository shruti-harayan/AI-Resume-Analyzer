import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Layout({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  // Hide header/footer on auth pages
  const hideLayout = ["/login", "/signup"].includes(location.pathname);

  // Sync dark mode with <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      {/* Header (only if not on login/signup) */}
      {!hideLayout && <Header darkMode={darkMode} setDarkMode={setDarkMode} />}

      {/* Page Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer (only if not on login/signup) */}
      {!hideLayout && <Footer />}
    </div>
  );
}

export default Layout;