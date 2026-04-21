import React from "react";
import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin } from "react-icons/fa";

const Footer = () => (
  <footer className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 mt-16 transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
      
      {/* Brand */}
      <div className="text-center md:text-left">
        <span
          className="block text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          CVisionary
        </span>
        <span className="text-sm opacity-80">Turn Resumes into Offers 🚀</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-wrap justify-center gap-6 text-sm font-medium">
        <Link to="/" className="hover:text-indigo-500 transition">Home</Link>
        <Link to="/student" className="hover:text-indigo-500 transition">Student</Link>
        <Link to="/recruiter" className="hover:text-indigo-500 transition">Recruiter</Link>
        <Link to="/scoring-transparency" className="hover:text-indigo-500 transition">
          How Scoring Works
        </Link>
      </nav>

      {/* Social Icons */}
      <div className="flex gap-5 text-xl">
        <a
          href="https://github.com/shruti-harayan"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="text-gray-500 hover:text-indigo-500 transition transform hover:scale-110"
        >
          <FaGithub size={26} />
        </a>
        <a
          href="https://linkedin.com/in/shruti-harayan"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="text-gray-500 hover:text-indigo-500 transition transform hover:scale-110"
        >
          <FaLinkedin size={26} />
        </a>
      </div>
    </div>

    {/* Bottom Bar */}
    <div className="bg-gray-200 dark:bg-gray-800 py-3 text-center text-xs opacity-80">
      © {new Date().getFullYear()} CVisionary. All rights reserved.
    </div>
  </footer>
);

export default Footer;
