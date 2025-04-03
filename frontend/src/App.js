import React, { useEffect } from 'react';
import logo from './logo.svg';
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
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          {testData ? testData : "Loading..."}
        </a>
      </header>
    </div>
  );
}

export default App;
