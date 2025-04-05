import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import PrivacyPolicy from './pages/PrivacyPolicy';
import DataDeletion from './pages/DataDeletion';
import './App.css';

function App() {
  const [testData, setTestData] = React.useState(null);
  const API_BASE = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetch(`${API_BASE}/api/test`)
      .then((res) => res.text())
      .then((data) => {
        console.log("✅ Backend response:", data);
        setTestData(data);
      })
      .catch((err) => console.error("❌ API error:", err));
  }, []);

  return (
    <Router>
      <nav className="bg-gray-100 p-4 text-center">
        <Link className="mx-4 text-blue-600" to="/privacy">Privacy Policy</Link>
        <Link className="mx-4 text-blue-600" to="/delete-data">Data Deletion</Link>
      </nav>
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/delete-data" element={<DataDeletion />} />
      </Routes>
    </Router>
  );
}

export default App;
