import React from "react";
import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin } from "react-icons/fa"; 

const Footer = () => (
  <footer className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 mt-16">
    <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
      
      {/* Brand */}
      <div className="text-center md:text-left">
        <span className="block text-xl font-bold text-indigo-600 dark:text-indigo-400">
          CVisionary
        </span>
        <span className="text-sm">Turn Resumes into Offers.</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-wrap justify-center gap-6 text-sm">
        <Link to="/" className="hover:text-indigo-500">Home</Link>
        <Link to="/student" className="hover:text-indigo-500">Student</Link>
        <Link to="/recruiter" className="hover:text-indigo-500">Recruiter</Link>
        <Link to="/scoring-transparency" className="hover:text-indigo-500">How Scoring Works</Link>
      </nav>

      {/* Social Icons */}
      <div className="flex gap-4 text-xl">
        {/* GitHub */}
        <a
          href="https://github.com/shruti-harayan"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="text-gray-500 hover:text-indigo-500 transition"
        >
          <FaGithub size={24} />
        </a>

        {/* LinkedIn */}
        <a
          href="https://linkedin.com/in/shruti-harayan"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="text-gray-500 hover:text-indigo-500 transition"
        >
          <FaLinkedin size={24} />
        </a>
      </div>
    </div>

    {/* Bottom Bar */}
    <div className="bg-gray-200 dark:bg-gray-800 py-2 text-center text-xs">
      © {new Date().getFullYear()} CVisionary. All rights reserved.
    </div>
  </footer>
);

export default Footer;