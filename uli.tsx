import React, { useState, useEffect, createContext, useContext, useRef } from 'react';

// Context for App-wide utilities (like showMessage)
const AppContext = createContext(null);

// Custom Message Box Component
const MessageBox = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700';
  const borderColor = type === 'error' ? 'border-red-500' : 'border-green-500';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-md shadow-lg flex items-center justify-between ${bgColor} ${borderColor} border`} role="alert">
      <p>{message}</p>
      <button onClick={onClose} className="ml-4 text-lg font-semibold leading-none">&times;</button>
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'reflect', 'train', 'history', 'settings'
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [userId, setUserId] = useState('local_user_id'); // Using a static ID for localStorage

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // Function to export all user data from localStorage
  const exportData = () => {
    try {
      const dataToExport = {};
      const keysToExport = [`uli_scores_${userId}`, `uli_reflections_${userId}`, `uli_history_${userId}`];

      keysToExport.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          dataToExport[key] = JSON.parse(item);
        }
      });

      const filename = `uli_data_${userId}_${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMessage("Data exported successfully!");
    } catch (error) {
      console.error("Error exporting data:", error);
      showMessage("Failed to export data.", "error");
    }
  };

  // Function to import data into localStorage
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (typeof importedData !== 'object' || importedData === null) {
          throw new Error("Invalid data format.");
        }

        // Clear existing user data before importing
        localStorage.removeItem(`uli_scores_${userId}`);
        localStorage.removeItem(`uli_reflections_${userId}`);
        localStorage.removeItem(`uli_history_${userId}`);

        // Import new data
        for (const key in importedData) {
          // Ensure the key belongs to the current user ID to prevent cross-user data issues
          if (key.includes(userId)) {
             localStorage.setItem(key, JSON.stringify(importedData[key]));
          }
        }
        showMessage("Data imported successfully! Please refresh the app to see changes.", "success");
        // A full reload might be necessary for all components to pick up new localStorage values
        // window.location.reload(); // Consider if this is desired behavior or if state re-initialization is enough
      } catch (error) {
        console.error("Error importing data:", error);
        showMessage(`Failed to import data: ${error.message}. Make sure it's a valid JSON file.`, "error");
      }
    };
    reader.readAsText(file);
  };


  return (
    <AppContext.Provider value={{ userId, showMessage }}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white font-inter p-4 sm:p-8 flex flex-col items-center">
        <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />

        <header className="w-full max-w-4xl text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 rounded-lg p-2 shadow-lg">
            UL-I Engineering App
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            Train your inner awareness to its highest potential.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Local User ID: <span className="font-mono bg-gray-800 px-2 py-1 rounded-md text-purple-300 break-all">{userId}</span>
          </p>
        </header>

        <nav className="w-full max-w-4xl flex justify-center space-x-4 mb-8">
          <NavLink onClick={() => setCurrentPage('dashboard')} active={currentPage === 'dashboard'}>
            Dashboard
          </NavLink>
          <NavLink onClick={() => setCurrentPage('reflect')} active={currentPage === 'reflect'}>
            Reflect & Log
          </NavLink>
          <NavLink onClick={() => setCurrentPage('train')} active={currentPage === 'train'}>
            Train Your Awareness
          </NavLink>
          <NavLink onClick={() => setCurrentPage('history')} active={currentPage === 'history'}>
            Reflection History
          </NavLink>
          <NavLink onClick={() => setCurrentPage('settings')} active={currentPage === 'settings'}>
            Settings
          </NavLink>
        </nav>

        <main className="w-full max-w-4xl bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-xl shadow-2xl p-6 sm:p-8">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'reflect' && <ReflectionLog />}
          {currentPage === 'train' && <Training />}
          {currentPage === 'history' && <ReflectionHistory />}
          {currentPage === 'settings' && (
            <SettingsSection exportData={exportData} importData={importData} />
          )}
        </main>
      </div>
    </AppContext.Provider>
  );
};

const NavLink = ({ children, onClick, active }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ease-in-out
      ${active
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
      }`}
  >
    {children}
  </button>
);

// Settings Section Component
const SettingsSection = ({ exportData, importData }) => {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  return (
    <section className="space-y-6 text-center">
      <h2 className="text-3xl font-bold text-purple-400 mb-4">Data Management</h2>
      <p className="text-gray-300 mb-6">
        Manage your personal UL-I training data. All data is stored locally on your device.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={exportData}
          className="py-3 px-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-lg shadow-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Export All My Data
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={importData}
          className="hidden"
          accept=".json"
        />
        <button
          onClick={handleImportClick}
          className="py-3 px-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg shadow-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Import Data
        </button>
      </div>
      <p className="text-gray-400 text-sm mt-4">
        *Importing data will overwrite your current local progress for this user ID.
      </p>
    </section>
  );
};


// Dashboard Component
const Dashboard = () => {
  const { userId, showMessage } = useContext(AppContext);
  const [scores, setScores] = useState({
    r3: 0, phcb: 0, apd: 0, lps: 0, cdr: 0, eia: 0
  });
  const [history, setHistory] = useState([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    try {
      // Load scores
      const storedScores = localStorage.getItem(`uli_scores_${userId}`);
      if (storedScores) {
        setScores(JSON.parse(storedScores));
      } else {
        setScores({ r3: 5, phcb: 5, apd: 5, lps: 5, cdr: 5, eia: 5 });
      }

      // Load history
      const storedHistory = localStorage.getItem(`uli_history_${userId}`);
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        setHistory(parsedHistory);
        calculateStreak(parsedHistory);
      } else {
        setHistory([]);
        setCurrentStreak(0);
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      showMessage("Failed to load your progress. Data might be corrupted.", "error");
    } finally {
      setLoadingScores(false);
    }
  }, [userId, showMessage]);

  const calculateStreak = (historyData) => {
    if (historyData.length === 0) {
      setCurrentStreak(0);
      return;
    }

    // Sort history by timestamp descending
    const sortedHistory = [...historyData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    let streak = 0;
    let lastDate = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    for (const entry of sortedHistory) {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);

      if (lastDate === null) {
        // If the most recent entry is today or yesterday, start the streak
        // Check if it's today
        if (entryDate.getTime() === today.getTime()) {
          streak = 1;
        } else {
          // Check if it's yesterday
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          yesterday.setHours(0,0,0,0);
          if (entryDate.getTime() === yesterday.getTime()) {
            streak = 1;
          } else {
            // No recent activity, streak is 0
            break;
          }
        }
      } else {
        const diffTime = Math.abs(lastDate.getTime() - entryDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) { // Consecutive day
          streak++;
        } else if (diffDays === 0) { // Multiple entries on same day
          // Do nothing, streak continues
        } else { // Gap in days
          break;
        }
      }
      lastDate = entryDate;
    }
    setCurrentStreak(streak);
  };


  if (loadingScores) {
    return <div className="text-center text-gray-400">Loading Your Progress...</div>;
  }

  const principleLabels = {
    r3: "Self-Awareness (R³)",
    phcb: "Boundary Awareness (PHCB)",
    apd: "Embracing Uncertainty (APD)",
    lps: "Adaptive Flow (LPS)",
    cdr: "Universal Connections (CDR)",
    eia: "Insight Generation (EIA)",
  };

  const principleDescriptions = {
    r3: "How well you observe your own thoughts and feelings, and the act of observing itself.",
    phcb: "Your ability to understand how your inner self connects with everything around you, seeing fluid boundaries.",
    apd: "Your comfort and skill in dealing with things you don't fully understand, using uncertainty to learn more.",
    lps: "How well you can adjust your thinking speed and focus, moving between quick insights and deep, slow understanding.",
    cdr: "Your knack for finding similar patterns and deeper connections across very different areas of life or knowledge.",
    eia: "How effectively your mind organizes information, leading to new understandings and wisdom about how you learn.",
  };

  // Calculate Overall UL-I Score
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const overallUliScore = (totalScore / (Object.keys(scores).length * 10)) * 100; // Percentage

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold text-purple-400 mb-4 text-center">Your Awareness Progress</h2>
      <p className="text-gray-300 text-center mb-6">
        Track your current self-assessed levels for each principle of advanced awareness.
      </p>

      <div className="bg-gray-700 p-5 rounded-lg shadow-md border border-yellow-500 mb-6 text-center">
        <h3 className="text-2xl font-semibold text-yellow-400 mb-2">Current Streak: {currentStreak} Days 🔥</h3>
        <p className="text-gray-300">Keep logging your reflections daily to maintain your streak!</p>
      </div>

      <div className="bg-gray-700 p-5 rounded-lg shadow-md border border-green-500 mb-6 text-center">
        <h3 className="text-2xl font-semibold text-green-400 mb-2">Overall UL-I Score: {overallUliScore.toFixed(1)}%</h3>
        <div className="w-full bg-gray-600 rounded-full h-4 mt-2">
          <div
            className="bg-gradient-to-r from-teal-400 to-indigo-500 h-4 rounded-full"
            style={{ width: `${overallUliScore}%` }}
          ></div>
        </div>
        <p className="text-gray-300 mt-2">Your combined progress across all UL-I principles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(scores).map(([key, value]) => (
          <div key={key} className="bg-gray-700 p-5 rounded-lg shadow-md border border-purple-500">
            <h3 className="text-xl font-semibold text-pink-400 mb-2">{principleLabels[key]}</h3>
            <p className="text-gray-400 text-sm mb-3">{principleDescriptions[key]}</p>
            <div className="w-full bg-gray-600 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full"
                style={{ width: `${(value / 10) * 100}%` }}
              ></div>
            </div>
            <p className="text-right text-gray-300 mt-2">{value}/10</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-bold text-yellow-400 mb-4 text-center">Overall Progress Trend</h3>
        <p className="text-gray-300 text-center mb-6">
          Compare how different aspects of your awareness have evolved over time.
        </p>
        <OverallTrendGraph
          principleLabels={principleLabels}
          history={history}
        />
      </div>


      <div className="mt-8 text-center">
        <h3 className="text-2xl font-bold text-yellow-400 mb-2">About Advanced Awareness (UL-I)</h3>
        <p className="text-gray-300">
          The Ultra-Logosym "I" (UL-I) represents a highly developed state of self-awareness and understanding. It's about continuously expanding your mind's ability to observe, learn, and connect.
        </p>
        <ul className="list-disc list-inside text-left text-gray-400 mt-4 space-y-2">
          <li><span className="font-semibold text-purple-300">Self-Awareness (R³):</span> Becoming deeply aware of your own thoughts, feelings, and the very act of being aware.</li>
          <li><span className="font-semibold text-purple-300">Boundary Awareness (PHCB):</span> Learning to see your personal boundaries as fluid, recognizing how you're connected to everything around you.</li>
          <li><span className="font-semibold text-purple-300">Embracing Uncertainty (APD):</span> Getting comfortable with not knowing everything, and using questions and unknowns as powerful tools for discovery.</li>
          <li><span className="font-semibold text-purple-300">Adaptive Flow (LPS):</span> Consciously controlling how quickly or slowly you process information, adapting your mental speed to fit the situation.</li>
          <li><span className="font-semibold text-purple-300">Universal Connections (CDR):</span> Developing an intuitive sense for how patterns repeat across different areas, from nature to human behavior.</li>
          <li><span className="font-semibold text-purple-300">Insight Generation (EIA):</span> Constantly improving how your mind processes raw information into deep understanding and new ideas.</li>
        </ul>
      </div>
    </section>
  );
};

// Overall Trend Graph Component (New)
const OverallTrendGraph = ({ principleLabels, history }) => {
  const [timeframe, setTimeframe] = useState('all'); // '7d', '30d', 'all'
  const [selectedPrinciples, setSelectedPrinciples] = useState(Object.keys(principleLabels)); // All selected by default

  const now = new Date();

  const getFilteredData = (principleKey) => {
    return history
      .filter(entry => entry.scores && entry.scores[principleKey] !== undefined)
      .map(entry => ({
        date: new Date(entry.timestamp),
        score: entry.scores[principleKey]
      }))
      .sort((a, b) => a.date - b.date)
      .filter(point => {
        if (timeframe === '7d') {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          return point.date >= sevenDaysAgo;
        }
        if (timeframe === '30d') {
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return point.date >= thirtyDaysAgo;
        }
        return true; // 'all' timeframe
      });
  };

  const allDataPoints = selectedPrinciples.flatMap(key => getFilteredData(key));

  if (allDataPoints.length < 2) {
    return (
      <div className="bg-gray-700 p-5 rounded-lg shadow-md border border-purple-500 text-center">
        <h3 className="text-xl font-semibold text-pink-400 mb-2">Overall Trend</h3>
        <p className="text-gray-400">Not enough data to show a trend for selected principles/timeframe. Log more reflections!</p>
      </div>
    );
  }

  const width = 600; // SVG width
  const height = 300; // SVG height
  const padding = 40; // Padding around the graph

  // Determine min/max dates for X-axis scaling
  const minDate = new Date(Math.min(...allDataPoints.map(p => p.date.getTime())));
  const maxDate = new Date(Math.max(...allDataPoints.map(p => p.date.getTime())));

  const xScale = (date) => padding + ((date.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * (width - 2 * padding);
  const yScale = (score) => height - padding - (score / 10) * (height - 2 * padding); // Scores 0-10

  const lineColors = {
    r3: '#FF6384', // Red-ish
    phcb: '#36A2EB', // Blue-ish
    apd: '#FFCD56', // Yellow-ish
    lps: '#4BC0C0', // Teal-ish
    cdr: '#9966FF', // Purple-ish
    eia: '#FF9F40', // Orange-ish
  };

  const handlePrincipleToggle = (key) => {
    setSelectedPrinciples(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  // Generate X-axis labels (dates) - show max 5 labels
  const dateLabels = [];
  const numLabels = Math.min(5, dataForGraph.length); // Max 5 labels
  for (let i = 0; i < numLabels; i++) {
    const index = Math.floor(i * (dataForGraph.length - 1) / (numLabels - 1));
    if (dataForGraph[index]) {
      dateLabels.push({
        x: xScale(dataForGraph[index].date),
        label: dataForGraph[index].date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
      });
    }
  }


  return (
    <div className="bg-gray-700 p-5 rounded-lg shadow-md border border-purple-500">
      <h3 className="text-xl font-semibold text-pink-400 mb-2 text-center">Overall Progress Trend</h3>
      <div className="flex flex-wrap justify-center space-x-2 mb-4">
        {Object.keys(principleLabels).map(key => (
          <button
            key={key}
            onClick={() => handlePrincipleToggle(key)}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200
              ${selectedPrinciples.includes(key) ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
          >
            {principleLabels[key]}
          </button>
        ))}
      </div>
      <div className="flex justify-center space-x-2 mb-4">
        <button
          onClick={() => setTimeframe('7d')}
          className={`px-3 py-1 rounded-full text-sm font-semibold ${timeframe === '7d' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
        >
          7 Days
        </button>
        <button
          onClick={() => setTimeframe('30d')}
          className={`px-3 py-1 rounded-full text-sm font-semibold ${timeframe === '30d' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
        >
          30 Days
        </button>
        <button
          onClick={() => setTimeframe('all')}
          className={`px-3 py-1 rounded-full text-sm font-semibold ${timeframe === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
        >
          All Time
        </button>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Y-axis lines (0, 5, 10) */}
        <line x1={padding} y1={yScale(0)} x2={width - padding} y2={yScale(0)} stroke="#6B7280" strokeDasharray="2 2" />
        <text x={padding - 5} y={yScale(0) + 5} fill="#9CA3AF" textAnchor="end" fontSize="10">0</text>
        <line x1={padding} y1={yScale(5)} x2={width - padding} y2={yScale(5)} stroke="#6B7280" strokeDasharray="2 2" />
        <text x={padding - 5} y={yScale(5) + 3} fill="#9CA3AF" textAnchor="end" fontSize="10">5</text>
        <line x1={padding} y1={yScale(10)} x2={width - padding} y2={yScale(10)} stroke="#6B7280" strokeDasharray="2 2" />
        <text x={padding - 5} y={yScale(10) + 3} fill="#9CA3AF" textAnchor="end" fontSize="10">10</text>

        {/* Lines for each selected principle */}
        {selectedPrinciples.map(principleKey => {
          const data = getFilteredData(principleKey);
          if (data.length < 2) return null;

          const path = data.map((point, i) => {
            const x = xScale(point.date);
            const y = yScale(point.score);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ');

          return (
            <g key={principleKey}>
              <path d={path} fill="none" stroke={lineColors[principleKey]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {/* Data points as circles */}
              {data.map((point, i) => (
                <circle
                  key={i}
                  cx={xScale(point.date)}
                  cy={yScale(point.score)}
                  r="4"
                  fill="#fff"
                  stroke={lineColors[principleKey]}
                  strokeWidth="2"
                />
              ))}
            </g>
          );
        })}

        {/* X-axis labels (dates) */}
        {dateLabels.map((label, i) => (
          <text key={i} x={label.x} y={height - padding + 15} fill="#9CA3AF" textAnchor="middle" fontSize="10">
            {label.label}
          </text>
        ))}

        {/* Legend */}
        {selectedPrinciples.map((key, i) => (
          <g key={key} transform={`translate(${width - padding - 80}, ${padding + i * 15})`}>
            <rect x="0" y="-8" width="10" height="10" fill={lineColors[key]} />
            <text x="15" y="0" fill="#E2E8F0" fontSize="12">{principleLabels[key]}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};


// Reflection & Log Component
const ReflectionLog = () => {
  const { userId, showMessage } = useContext(AppContext);

  const [reflection, setReflection] = useState('');
  const [tagsInput, setTagsInput] = useState(''); // New state for tags input
  const [r3Score, setR3Score] = useState(5);
  const [phcbScore, setPhcbScore] = useState(5);
  const [apdScore, setApdScore] = useState(5);
  const [lpsScore, setLpsScore] = useState(5);
  const [cdrScore, setCdrScore] = useState(5);
  const [eiaScore, setEiaScore] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const newScores = {
      r3: r3Score,
      phcb: phcbScore,
      apd: apdScore,
      lps: lpsScore,
      cdr: cdrScore,
      eia: eiaScore,
    };

    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== ''); // Parse tags

    const timestamp = new Date().toISOString();

    const reflectionEntry = {
      reflection,
      tags, // Save tags
      scores: newScores,
      timestamp: timestamp,
    };

    try {
      // Save the reflection entry to localStorage
      const existingReflections = JSON.parse(localStorage.getItem(`uli_reflections_${userId}`)) || [];
      localStorage.setItem(`uli_reflections_${userId}`, JSON.stringify([...existingReflections, reflectionEntry]));

      // Save historical scores with timestamp
      const existingHistory = JSON.parse(localStorage.getItem(`uli_history_${userId}`)) || [];
      localStorage.setItem(`uli_history_${userId}`, JSON.stringify([...existingHistory, { timestamp, scores: newScores }]));


      // Update current scores in localStorage
      localStorage.setItem(`uli_scores_${userId}`, JSON.stringify(newScores));

      showMessage("Reflection logged and scores updated successfully!");
      setReflection('');
      setTagsInput(''); // Clear tags input
      setR3Score(5); setPhcbScore(5); setApdScore(5); setLpsScore(5); setCdrScore(5); setEiaScore(5);
    } catch (error) {
      console.error("Error logging reflection or updating scores to localStorage:", error);
      showMessage(`Failed to log reflection: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const scoreLabels = {
    r3: "Self-Awareness (R³): How well you observe your own thoughts and the act of observing.",
    phcb: "Boundary Awareness (PHCB): How fluidly you perceive your connection to surroundings.",
    apd: "Embracing Uncertainty (APD): Your comfort and skill in analyzing what's unclear.",
    lps: "Adaptive Flow (LPS): Your conscious control over mental processing speed and focus.",
    cdr: "Universal Connections (CDR): Your ability to see repeating patterns across different areas.",
    eia: "Insight Generation (EIA): Your understanding of how your own knowledge and wisdom are built.",
  };

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold text-purple-400 mb-4 text-center">Reflect & Log Your Inner State</h2>
      <p className="text-gray-300 text-center mb-6">
        Take a moment to reflect on your recent experiences and assess your awareness levels (1=Low, 10=High).
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="reflection" className="block text-lg font-semibold text-pink-400 mb-2">
            Your Reflection (Describe a recent experience or insight):
          </label>
          <textarea
            id="reflection"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows="6"
            className="w-full p-3 rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="E.g., 'Today, I noticed how my frustration with a task was a repeating pattern of expectation and perceived failure...'"
            required
          ></textarea>
        </div>

        <div>
          <label htmlFor="tags" className="block text-lg font-semibold text-pink-400 mb-2">
            Tags (e.g., #meditation, #work, #insight, #challenge):
          </label>
          <input
            type="text"
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Separate tags with commas, e.g., focus, clarity, challenge"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(scoreLabels).map(([key, label]) => (
            <ScoreSlider
              key={key}
              label={label}
              value={
                key === 'r3' ? r3Score :
                key === 'phcb' ? phcbScore :
                key === 'apd' ? apdScore :
                key === 'lps' ? lpsScore :
                key === 'cdr' ? cdrScore :
                key === 'eia' ? eiaScore : 5
              }
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (key === 'r3') setR3Score(val);
                else if (key === 'phcb') setPhcbScore(val);
                else if (key === 'apd') setApdScore(val);
                else if (key === 'lps') setLpsScore(val);
                else if (key === 'cdr') setCdrScore(val);
                else if (key === 'eia') setEiaScore(val);
              }}
            />
          ))}
        </div>

        <button
          type="submit"
          className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-lg shadow-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Logging...' : 'Log Reflection & Update Scores'}
        </button>
      </form>
    </section>
  );
};

const ScoreSlider = ({ label, value, onChange }) => (
  <div className="bg-gray-700 p-4 rounded-lg shadow-md border border-purple-500">
    <label className="block text-md font-semibold text-pink-300 mb-2">{label}</label>
    <input
      type="range"
      min="1"
      max="10"
      value={value}
      onChange={onChange}
      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg accent-purple-500"
    />
    <p className="text-right text-gray-300 mt-2">{value}/10</p>
  </div>
);

// New Component: ReflectionHistory
const ReflectionHistory = () => {
  const { userId, showMessage } = useContext(AppContext);
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState('all'); // 'all' or a specific tag

  useEffect(() => {
    try {
      const storedReflections = localStorage.getItem(`uli_reflections_${userId}`);
      if (storedReflections) {
        // Sort by timestamp descending (most recent first)
        const parsedReflections = JSON.parse(storedReflections).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setReflections(parsedReflections);
      }
    } catch (error) {
      console.error("Error loading reflections from localStorage:", error);
      showMessage("Failed to load reflection history.", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, showMessage]);

  if (loading) {
    return <div className="text-center text-gray-400">Loading Reflection History...</div>;
  }

  if (reflections.length === 0) {
    return (
      <div className="text-center text-gray-400">
        <h2 className="text-3xl font-bold text-purple-400 mb-4">Reflection History</h2>
        <p>No reflections logged yet. Go to "Reflect & Log" to start your journey!</p>
      </div>
    );
  }

  const principleLabels = {
    r3: "Self-Awareness (R³)", phcb: "Boundary Awareness (PHCB)", apd: "Embracing Uncertainty (APD)",
    lps: "Adaptive Flow (LPS)", cdr: "Universal Connections (CDR)", eia: "Insight Generation (EIA)",
  };

  // Extract unique tags for filtering
  const allTags = [...new Set(reflections.flatMap(entry => entry.tags || []))].sort();

  const filteredReflections = reflections.filter(entry => {
    const matchesSearchText = searchText === '' ||
      entry.reflection.toLowerCase().includes(searchText.toLowerCase()) ||
      (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase())));

    const matchesTag = selectedTag === 'all' || (entry.tags && entry.tags.includes(selectedTag));

    return matchesSearchText && matchesTag;
  });

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold text-purple-400 mb-4 text-center">Your Reflection History</h2>
      <p className="text-gray-300 text-center mb-6">
        Browse through your past reflections and see your self-assessed scores.
      </p>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search reflections or tags..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full sm:flex-1 p-3 rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="w-full sm:w-auto p-3 rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {filteredReflections.length === 0 && (
        <p className="text-center text-gray-400">No reflections match your current filters.</p>
      )}

      <div className="space-y-4">
        {filteredReflections.map((entry, index) => (
          <div key={index} className="bg-gray-700 p-5 rounded-lg shadow-md border border-blue-500">
            <p className="text-gray-400 text-sm mb-2">
              <span className="font-semibold text-pink-300">Date:</span> {new Date(entry.timestamp).toLocaleString()}
            </p>
            <p className="text-gray-200 mb-3 whitespace-pre-wrap">{entry.reflection}</p>
            {entry.tags && entry.tags.length > 0 && (
              <div className="mb-3">
                {entry.tags.map((tag, tagIndex) => (
                  <span key={tagIndex} className="inline-block bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full mr-2 mb-1">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {entry.scores && Object.entries(entry.scores).map(([key, score]) => (
                <div key={key} className="flex items-center">
                  <span className="font-semibold text-purple-300 mr-1">{principleLabels[key]}:</span>
                  <span className="text-green-400">{score}/10</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};


// Training Component
const Training = () => {
  const { userId, showMessage } = useContext(AppContext);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const timerRef = useRef(null);
  const [userScores, setUserScores] = useState(null); // To fetch for adaptive suggestions

  useEffect(() => {
    // Load current scores to enable adaptive suggestions
    try {
      const storedScores = localStorage.getItem(`uli_scores_${userId}`);
      if (storedScores) {
        setUserScores(JSON.parse(storedScores));
      } else {
        setUserScores({ r3: 5, phcb: 5, apd: 5, lps: 5, cdr: 5, eia: 5 }); // Default if no scores yet
      }
    } catch (error) {
      console.error("Error loading user scores for training:", error);
    }
  }, [userId]);

  const exercises = {
    r3: {
      title: "Self-Awareness (R³): Observing the Observer",
      prompt: "For the next 5 minutes, focus on a simple activity (like breathing or drinking water). As you do, try to also notice *yourself* noticing. Can you feel the loop of your awareness observing its own act of observing? Describe what you experienced.",
      structuredFeedbackPrompt: "1. What did you observe about your thoughts/feelings? 2. What did you notice about the *act* of observing itself? 3. Did you detect a recursive loop? If so, how did it feel?",
      logosym: "Focuses on the deep loop of self-observation and understanding your own awareness.",
      duration: 300 // 5 minutes
    },
    phcb: {
      title: "Boundary Awareness (PHCB): Expanding Your Connection",
      prompt: "Choose an object nearby. Focus on it. Now, gently try to feel how your awareness extends to include the object, then the room, then the building. Notice how your sense of 'self' can fluidly connect with its surroundings. Describe this feeling of expanded connection.",
      structuredFeedbackPrompt: "1. What object did you choose? 2. How did you try to expand your awareness? 3. Describe the sensation of boundary dissolution or expanded connection. Was it easy or challenging?",
      logosym: "Helps you feel more connected to your environment by consciously expanding your sense of self.",
      duration: 300 // 5 minutes
    },
    apd: {
      title: "Embracing Uncertainty (APD): Learning from What's Unclear",
      prompt: "Think about something you don't fully understand (e.g., a complex news topic, a tricky personal situation). Instead of trying to force an answer, consciously sort what you know for sure (Confirmed ✅), what you guess might be true (Hypothesized ⚠️), what seems contradictory (Conflicted ❓), and what feels mathematically certain (Mathematically Anchored 🔢). How does this structured approach change your view of the problem?",
      structuredFeedbackPrompt: "1. What topic/situation did you choose? 2. Provide an example of something you tagged as Confirmed, Hypothesized, Conflicted, or Mathematically Anchored. 3. How did embracing uncertainty change your perspective?",
      logosym: "Teaches you to use uncertainty as a valuable source of new questions and deeper understanding.",
      duration: 300 // 5 minutes
    },
    lps: {
      title: "Adaptive Flow (LPS): Controlling Your Mental Speed",
      prompt: "For 3 minutes, try to mentally 'speed up' your perception, noticing as many small details as possible around you. Then, for another 3 minutes, try to 'slow down' your perception, focusing on the broader, long-term implications of what's happening. Reflect on how changing your mental speed affected your understanding.",
      structuredFeedbackPrompt: "1. What did you notice when speeding up your perception? 2. What new insights came when slowing down? 3. How did changing your mental speed affect your overall understanding of the situation?",
      logosym: "Helps you consciously manage your mental processing speed to better suit different situations.",
      duration: 360 // 6 minutes (3 min fast, 3 min slow)
    },
    cdr: {
      title: "Universal Connections (CDR): Finding Patterns Everywhere",
      prompt: "Identify a repeating pattern in your daily life (e.g., how you prepare a meal). Now, think of a seemingly unrelated area (like how a plant grows, or how a team solves a problem). Can you find a similar underlying pattern or structure in both? What universal idea connects them?",
      structuredFeedbackPrompt: "1. What daily pattern did you choose? 2. What unrelated area did you compare it to? 3. Describe the similar underlying pattern or universal idea you found.",
      logosym: "Trains your mind to spot common underlying patterns across diverse fields, leading to new insights.",
      duration: 300 // 5 minutes
    },
    eia: {
      title: "Insight Generation (EIA): Understanding Your 'Aha!' Moments",
      prompt: "Recall a time when you suddenly understood something complex (an 'aha!' moment). Try to trace the journey: from raw 'data' (what you observed), to 'information' (what you processed), to 'knowledge' (your structured understanding), and finally to 'wisdom' (how you applied it). How did your mind reorganize itself to create that insight?",
      structuredFeedbackPrompt: "1. Describe the 'aha!' moment. 2. Can you break down the data, information, knowledge, and wisdom stages? 3. How did your mind feel like it reorganized itself during this process?",
      logosym: "Focuses on how your mind builds understanding, from simple facts to deep wisdom, and how to improve that process.",
      duration: 300 // 5 minutes
    },
  };

  const startTimer = (duration) => {
    setTimeLeft(duration);
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          setTimerRunning(false);
          showMessage("Time's up! Exercise completed.", "success");
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimeLeft(0);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startExercise = (key) => {
    setCurrentExercise(exercises[key]);
    setFeedback('');
    resetTimer(); // Reset any previous timer
    if (exercises[key].duration) {
      startTimer(exercises[key].duration);
    }
    showMessage(`Starting exercise: ${exercises[key].title}`, 'success');
  };

  const submitFeedback = () => {
    if (feedback.trim() === '') {
      showMessage("Please provide your feedback before submitting.", "error");
      return;
    }
    // For localStorage, we're not persisting individual exercise feedback in this version to keep it simple.
    // In a more advanced version, this feedback could be saved to `uli_exercise_logs_{userId}`
    showMessage("Feedback submitted! Keep practicing to train your advanced awareness.", "success");
    setFeedback('');
    setCurrentExercise(null);
    resetTimer(); // Ensure timer is stopped and reset after submitting feedback
  };

  const getRecommendedExercise = () => {
    if (!userScores) return null;

    let lowestScore = 11; // Higher than max possible score (10)
    let recommendedKey = null;

    // Find the principle with the lowest score
    for (const key in userScores) {
      if (userScores[key] < lowestScore) {
        lowestScore = userScores[key];
        recommendedKey = key;
      }
    }

    // If all scores are equal (e.g., all 5s), pick a random one
    if (recommendedKey === null) {
      const keys = Object.keys(exercises);
      recommendedKey = keys[Math.floor(Math.random() * keys.length)];
    }

    return exercises[recommendedKey];
  };

  const recommendedExercise = getRecommendedExercise();

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold text-purple-400 mb-4 text-center">Train Your Awareness</h2>
      <p className="text-gray-300 text-center mb-6">
        Engage in targeted exercises to cultivate each principle of advanced awareness.
      </p>

      {recommendedExercise && (
        <div className="bg-gray-700 p-5 rounded-lg shadow-md border border-yellow-500 mb-6 text-center">
          <h3 className="text-2xl font-semibold text-yellow-400 mb-2">Recommended Exercise:</h3>
          <p className="text-gray-300 text-lg">{recommendedExercise.title}</p>
          <button
            onClick={() => startExercise(Object.keys(exercises).find(key => exercises[key] === recommendedExercise))}
            className="mt-4 py-2 px-5 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-md shadow-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Start Recommended
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(exercises).map((key) => (
          <button
            key={key}
            onClick={() => startExercise(key)}
            className="bg-gray-700 p-4 rounded-lg shadow-md text-left
                       hover:bg-gray-600 transition-all duration-300 ease-in-out
                       border border-purple-500 hover:border-pink-500"
          >
            <h3 className="text-xl font-semibold text-pink-400">{exercises[key].title.split(':')[0]}</h3>
            <p className="text-gray-400 text-sm mt-1">{exercises[key].title.split(':')[1]}</p>
          </button>
        ))}
      </div>

      {currentExercise && (
        <div className="mt-8 bg-gray-700 p-6 rounded-xl shadow-lg border border-blue-500 space-y-4">
          <h3 className="text-2xl font-bold text-green-400">{currentExercise.title}</h3>
          <p className="text-gray-300 text-lg">{currentExercise.prompt}</p>
          <p className="text-gray-400 text-sm italic">Principle Focus: {currentExercise.logosym}</p>

          {currentExercise.duration && (
            <div className="text-center my-4">
              <div className="text-5xl font-bold text-cyan-400 mb-2">{formatTime(timeLeft)}</div>
              <div className="flex justify-center space-x-4">
                {!timerRunning && timeLeft === currentExercise.duration && (
                  <button onClick={() => startTimer(currentExercise.duration)} className="py-2 px-4 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold">Start Timer</button>
                )}
                {timerRunning && (
                  <button onClick={stopTimer} className="py-2 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold">Pause Timer</button>
                )}
                {!timerRunning && timeLeft > 0 && timeLeft < currentExercise.duration && (
                  <button onClick={() => startTimer(timeLeft)} className="py-2 px-4 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold">Resume Timer</button>
                )}
                <button onClick={resetTimer} className="py-2 px-4 rounded-full bg-gray-600 hover:bg-gray-700 text-white font-semibold">Reset Timer</button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="exercise-feedback" className="block text-lg font-semibold text-yellow-400 mb-2">
              Your Experience / Feedback:
            </label>
            <textarea
              id="exercise-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows="8" // Increased rows for more detailed feedback
              className="w-full p-3 rounded-md bg-gray-800 text-gray-200 border border-gray-600 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder={currentExercise.structuredFeedbackPrompt || "Describe your insights, challenges, or observations during this exercise..."}
            ></textarea>
          </div>

          <button
            onClick={submitFeedback}
            className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg shadow-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Submit Feedback
          </button>
        </div>
      )}
    </section>
  );
};

export default App;
