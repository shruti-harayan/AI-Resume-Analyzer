import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import StudentDashboard from "./pages/StudentDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import ScoringTransparency from "./pages/ScoringTransparency";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/recruiter" element={<RecruiterDashboard />} />
        <Route path="/scoring-transparency" element={<ScoringTransparency />} />
      </Routes>
    </Layout>
  );
}

export default App;
