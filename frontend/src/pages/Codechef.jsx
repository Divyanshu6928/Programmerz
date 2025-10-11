import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart, Cell
} from 'recharts';

// Backend API URL
const API_BASE =  'https://programmerz.onrender.com' || 'http://localhost:5000/api';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b'];

const CodeChefProfile = () => {
  const [handle, setHandle] = useState('');
  const [inputHandle, setInputHandle] = useState('');
  const [userData, setUserData] = useState(null);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [recommendedProblems, setRecommendedProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [problemFilter, setProblemFilter] = useState('all');

  useEffect(() => {
    const saved = sessionStorage.getItem('codechefHandle');
    if (saved) {
      setHandle(saved);
      setInputHandle(saved);
      fetchUserData(saved);
    }
  }, []);

  const fetchUserData = async (username) => {
    setLoading(true);
    setError('');
    setUserData(null);

    try {
      // Fetch user data and upcoming contests in parallel
      const [userResponse, contestsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/codechef/${username}`),
        fetch(`${API_BASE}/api/codechef-contests`)
      ]);
      
      if (!userResponse.ok) {
        throw new Error('User not found');
      }
      
      const data = await userResponse.json();
      
      if (data && data.name) {
        setUserData(data);
        // Generate recommended problems based on user rating
        generateRecommendedProblems(data.currentRating);
      } else {
        throw new Error('Invalid user data received');
      }

      // Process upcoming contests
      if (contestsResponse.ok) {
        const contestsData = await contestsResponse.json();
        if (contestsData.status === 'success') {
          const now = Date.now() / 1000;
          const twoWeeks = 14 * 24 * 3600;

          const upcoming = [
            ...(Object.values(contestsData.present_contests || {})),
            ...(Object.values(contestsData.future_contests || {}))
          ]
            .filter(contest => {
              const startTime = new Date(contest.contest_start_date).getTime() / 1000;
              return startTime > now - 86400 && startTime - now < twoWeeks;
            })
            .sort((a, b) => new Date(a.contest_start_date) - new Date(b.contest_start_date))
            .slice(0, 8);

          setUpcomingContests(upcoming);
        }
      }
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendedProblems = (userRating) => {
    // Problem categories based on user rating
    const categories = [
      { name: 'Arrays & Strings', tag: 'arrays', difficulty: 'beginner' },
      { name: 'Dynamic Programming', tag: 'dynamic-programming', difficulty: 'intermediate' },
      { name: 'Graph Algorithms', tag: 'graphs', difficulty: 'advanced' },
      { name: 'Greedy Algorithms', tag: 'greedy', difficulty: 'intermediate' },
      { name: 'Trees & Binary Search', tag: 'trees', difficulty: 'intermediate' },
      { name: 'Mathematics', tag: 'mathematics', difficulty: 'beginner' },
      { name: 'Sorting & Searching', tag: 'sorting', difficulty: 'beginner' },
      { name: 'Backtracking', tag: 'backtracking', difficulty: 'advanced' }
    ];

    // Generate problems based on rating range
    const problems = categories.flatMap(category => {
      const baseRating = userRating || 1400;
      const problems = [];
      
      // Easy problems (50-100 below user rating)
      for (let i = 0; i < 3; i++) {
        problems.push({
          id: `${category.tag}-easy-${i + 1}`,
          name: `${category.name} - Practice ${i + 1}`,
          category: category.name,
          difficulty: 'Easy',
          rating: Math.max(1000, baseRating - 100 - (i * 50)),
          solveCount: Math.floor(Math.random() * 5000) + 1000,
          accuracy: Math.floor(Math.random() * 30) + 60,
          tags: [category.tag, 'practice'],
          link: `https://www.codechef.com/practice/${category.tag}`
        });
      }
      
      // Medium problems (near user rating)
      for (let i = 0; i < 2; i++) {
        problems.push({
          id: `${category.tag}-medium-${i + 1}`,
          name: `${category.name} - Challenge ${i + 1}`,
          category: category.name,
          difficulty: 'Medium',
          rating: baseRating + (i * 50),
          solveCount: Math.floor(Math.random() * 3000) + 500,
          accuracy: Math.floor(Math.random() * 30) + 40,
          tags: [category.tag, 'challenge'],
          link: `https://www.codechef.com/practice/${category.tag}`
        });
      }
      
      // Hard problems (100-200 above user rating)
      problems.push({
        id: `${category.tag}-hard-1`,
        name: `${category.name} - Advanced`,
        category: category.name,
        difficulty: 'Hard',
        rating: baseRating + 150,
        solveCount: Math.floor(Math.random() * 1000) + 100,
        accuracy: Math.floor(Math.random() * 20) + 20,
        tags: [category.tag, 'advanced'],
        link: `https://www.codechef.com/practice/${category.tag}`
      });
      
      return problems;
    });

    setRecommendedProblems(problems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputHandle.trim()) {
      const cleanHandle = inputHandle.trim();
      sessionStorage.setItem('codechefHandle', cleanHandle);
      setHandle(cleanHandle);
      fetchUserData(cleanHandle);
    }
  };

  const getStarColor = (stars) => {
    const starNum = parseInt(stars) || 0;
    if (starNum >= 7) return '#ff0000';
    if (starNum >= 6) return '#ff8c00';
    if (starNum >= 5) return '#aa00aa';
    if (starNum >= 4) return '#0000ff';
    if (starNum >= 3) return '#03a89e';
    if (starNum >= 2) return '#008000';
    return '#808080';
  };

  const getRatingChartData = () => {
    if (!userData?.ratingData) return [];
    
    return userData.ratingData.map(contest => ({
      date: `${contest.getday}/${contest.getmonth}`,
      rating: parseInt(contest.rating),
      name: contest.name.split(' ').slice(0, 3).join(' '),
      rank: parseInt(contest.rank)
    }));
  };

  const getHeatMapData = () => {
    if (!userData?.heatMap) return [];
    
    const monthlyData = {};
    userData.heatMap.forEach(entry => {
      const [year, month] = entry.date.split('-');
      const key = `${year}-${month}`;
      monthlyData[key] = (monthlyData[key] || 0) + entry.value;
    });
    
    return Object.entries(monthlyData)
      .map(([date, value]) => {
        const [year, month] = date.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
          month: `${monthNames[parseInt(month) - 1]} ${year}`,
          submissions: value
        };
      })
      .slice(-12);
  };

  const getRatingDistribution = () => {
    if (!userData?.ratingData) return [];
    
    const ranges = {
      '< 1000': 0,
      '1000-1200': 0,
      '1200-1400': 0,
      '1400-1600': 0,
      '> 1600': 0
    };
    
    userData.ratingData.forEach(contest => {
      const rating = parseInt(contest.rating);
      if (rating < 1000) ranges['< 1000']++;
      else if (rating < 1200) ranges['1000-1200']++;
      else if (rating < 1400) ranges['1200-1400']++;
      else if (rating < 1600) ranges['1400-1600']++;
      else ranges['> 1600']++;
    });
    
    return Object.entries(ranges)
      .filter(([_, count]) => count > 0)
      .map(([range, count]) => ({ range, count }));
  };

  const getContestPerformance = () => {
    if (!userData?.ratingData) return { best: null, worst: null, avg: 0 };
    
    const ranks = userData.ratingData.map(c => parseInt(c.rank));
    return {
      best: Math.min(...ranks),
      worst: Math.max(...ranks),
      avg: Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length)
    };
  };

  const getTimeUntilContest = (startDate) => {
    const now = new Date().getTime();
    const start = new Date(startDate).getTime();
    const diff = start - now;
    
    if (diff <= 0) return 'Live Now!';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  };

  const isContestLive = (startDate, endDate) => {
    const now = new Date().getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return now >= start && now <= end;
  };

  const getFilteredProblems = () => {
    if (!recommendedProblems.length) return [];
    
    if (problemFilter === 'all') return recommendedProblems;
    
    if (problemFilter === 'easy') {
      return recommendedProblems.filter(p => p.difficulty === 'Easy');
    }
    if (problemFilter === 'medium') {
      return recommendedProblems.filter(p => p.difficulty === 'Medium');
    }
    if (problemFilter === 'hard') {
      return recommendedProblems.filter(p => p.difficulty === 'Hard');
    }
    
    // Filter by category
    return recommendedProblems.filter(p => 
      p.category.toLowerCase().includes(problemFilter.toLowerCase())
    );
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty === 'Easy') return '#43e97b';
    if (difficulty === 'Medium') return '#fbbf24';
    return '#ef4444';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 75%, #0a0a0a 100%)',
      fontFamily: "'Poppins', sans-serif",
      padding: '50px 20px'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          margin-top : 40px
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          transition: all 0.4s ease;
        }
        
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(138, 43, 226, 0.2);
        }
        
        .holographic-text {
          background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 400% 400%;
          animation: holographic 4s ease-in-out infinite;
        }
        
        @keyframes holographic {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .cyber-button {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.3));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 50px;
          padding: 12px 30px;
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
        }
        
        .cyber-button:hover {
          transform: scale(1.05);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.4), rgba(118, 75, 162, 0.5));
          box-shadow: 0 0 30px rgba(102, 126, 234, 0.4);
        }
        
        .glass-input {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 12px 20px;
          color: white;
          width: 100%;
        }
        
        .glass-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(102, 126, 234, 0.4);
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
        }
        
        .glass-input::placeholder { color: rgba(255, 255, 255, 0.5); }
        
        .star-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          display: inline-block;
          font-size: 1.1rem;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(102, 126, 234, 0.2);
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .tab-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          padding: 12px 24px;
          border-radius: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .tab-btn.active {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
          color: white;
        }
        
        .stat-card {
          text-align: center;
          padding: 20px;
        }
        
        .contest-row {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 10px;
          transition: all 0.3s ease;
        }
        
        .contest-row:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateX(5px);
        }
        
        .upcoming-contest-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-left: 4px solid #667eea;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 15px;
          transition: all 0.3s ease;
        }
        
        .upcoming-contest-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-left-color: #f093fb;
          transform: translateX(5px);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.2);
        }
        
        .contest-live {
          border-left-color: #43e97b;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(67, 233, 123, 0.4); }
          50% { box-shadow: 0 0 20px 10px rgba(67, 233, 123, 0); }
        }
        
        .contest-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }
        
        .problem-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 15px;
          transition: all 0.3s ease;
        }
        
        .problem-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.15);
        }
        
        .filter-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 8px 16px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(102, 126, 234, 0.3);
        }
        
        .filter-btn.active {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
          border-color: rgba(102, 126, 234, 0.5);
          color: white;
        }
        
        .difficulty-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .tag-chip {
          display: inline-block;
          padding: 4px 10px;
          margin: 2px;
          background: rgba(102, 126, 234, 0.15);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 10px;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', marginTop: '60px' }}>
        {!handle ? (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <h2 style={{ color: 'white', marginBottom: '10px', fontSize: '2rem' }}>
                CodeChef Analytics
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '30px' }}>
                Powered by <strong style={{ color: '#667eea' }}>proxor</strong> 🚀
              </p>
              <input
                type="text"
                className="glass-input"
                placeholder="Enter CodeChef username (e.g., divyanshu6928)"
                value={inputHandle}
                onChange={(e) => setInputHandle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                style={{ marginBottom: '20px' }}
              />
              <button onClick={handleSubmit} className="cyber-button" style={{ width: '100%' }}>
                Get Analytics
              </button>
            </div>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column' }}>
            <div className="spinner" style={{ marginBottom: '20px' }}></div>
            <div style={{ color: 'white', fontSize: '1.1rem' }}>Fetching data from CodeChef...</div>
          </div>
        ) : error ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h4 style={{ color: 'white', marginBottom: '15px' }}>{error}</h4>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>
              Make sure the backend server is running and the username is correct.
            </p>
            <button onClick={() => setHandle('')} className="cyber-button">
              Try Another Handle
            </button>
          </div>
        ) : userData && (
          <>
            {/* Profile Header */}
            <div className="glass-card" style={{ padding: '30px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <img 
                    src={userData.profile} 
                    alt="Profile" 
                    style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #667eea' }}
                  />
                  <div>
                    <h2 style={{ color: 'white', fontWeight: 'bold', marginBottom: '10px' }}>
                      {userData.name}
                    </h2>
                    <span 
                      className="star-badge" 
                      style={{ 
                        backgroundColor: getStarColor(userData.stars), 
                        color: 'white'
                      }}
                    >
                      {userData.stars}
                    </span>
                    <div style={{ marginTop: '15px', color: 'rgba(255,255,255,0.7)', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <span>🌍 Global: #{userData.globalRank}</span>
                      <span>
                        <img src={userData.countryFlag} alt="flag" style={{ width: '20px', marginRight: '5px' }} />
                        {userData.countryName}: #{userData.countryRank}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 className="holographic-text" style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '2.5rem' }}>
                    {userData.currentRating}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '5px' }}>Current Rating</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Max: {userData.highestRating}</p>
                  <button onClick={() => setHandle('')} className="cyber-button" style={{ marginTop: '10px', padding: '8px 20px' }}>
                    Change Handle
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="glass-card" style={{ padding: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['overview', 'contests', 'problems', 'activity'].map(tab => (
                  <button
                    key={tab}
                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  {[
                    { label: 'Problems Solved', value: userData.problemSolved, icon: '✅' },
                    { label: 'Contests', value: userData.ratingData?.length || 0, icon: '🏆' },
                    { label: 'Best Rank', value: `#${getContestPerformance().best}`, icon: '🥇' },
                    { label: 'Avg Rank', value: `#${getContestPerformance().avg}`, icon: '📊' }
                  ].map((stat, idx) => (
                    <div key={idx} className="glass-card stat-card">
                      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{stat.icon}</div>
                      <h3 className="holographic-text" style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '2rem' }}>
                        {stat.value}
                      </h3>
                      <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Rating Chart */}
                {getRatingChartData().length > 0 && (
                  <div className="glass-card" style={{ padding: '30px', marginBottom: '20px' }}>
                    <h5 style={{ color: 'white', fontWeight: 'bold', marginBottom: '20px', fontSize: '1.3rem' }}>
                      📈 Rating Progress
                    </h5>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={getRatingChartData()}>
                        <defs>
                          <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="#fff" fontSize={12} />
                        <YAxis stroke="#fff" fontSize={12} domain={['dataMin - 50', 'dataMax + 50']} />
                        <Tooltip 
                          contentStyle={{
                            background: 'rgba(26, 26, 46, 0.95)', 
                            border: '1px solid rgba(102, 126, 234, 0.3)', 
                            borderRadius: '10px'
                          }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="rating" 
                          stroke="#667eea" 
                          fillOpacity={1} 
                          fill="url(#colorRating)" 
                          strokeWidth={3}
                          dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Rating Distribution */}
                {getRatingDistribution().length > 0 && (
                  <div className="glass-card" style={{ padding: '30px' }}>
                    <h5 style={{ color: 'white', fontWeight: 'bold', marginBottom: '20px', fontSize: '1.3rem' }}>
                      📊 Rating Distribution
                    </h5>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getRatingDistribution()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="range" stroke="#fff" />
                        <YAxis stroke="#fff" />
                        <Tooltip 
                          contentStyle={{
                            background: 'rgba(26, 26, 46, 0.95)', 
                            border: '1px solid rgba(102, 126, 234, 0.3)'
                          }}
                        />
                        <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}

            {/* Contests Tab */}
            {activeTab === 'contests' && (
              <>
                {/* Upcoming Contests Section */}
                {upcomingContests.length > 0 && (
                  <div className="glass-card" style={{ padding: '30px', marginBottom: '20px' }}>
                    <h5 style={{ color: 'white', fontWeight: 'bold', marginBottom: '20px', fontSize: '1.3rem' }}>
                      🔥 Upcoming Contests
                    </h5>
                    <div>
                      {upcomingContests.map((contest, idx) => {
                        const isLive = isContestLive(contest.contest_start_date, contest.contest_end_date);
                        const timeUntil = getTimeUntilContest(contest.contest_start_date);
                        
                        return (
                          <a
                            key={idx}
                            href={`https://www.codechef.com/${contest.contest_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="contest-link"
                          >
                            <div className={`upcoming-contest-card ${isLive ? 'contest-live' : ''}`}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                  <h6 style={{ color: 'white', fontWeight: 'bold', marginBottom: '8px', fontSize: '1.1rem' }}>
                                    {contest.contest_name}
                                  </h6>
                                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '5px' }}>
                                    <span style={{ marginRight: '15px' }}>
                                      📅 {new Date(contest.contest_start_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                    <span>
                                      🕐 {new Date(contest.contest_start_date).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                    Code: {contest.contest_code}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                  {isLive ? (
                                    <span style={{
                                      background: 'linear-gradient(135deg, #43e97b, #38f9d7)',
                                      padding: '8px 16px',
                                      borderRadius: '20px',
                                      color: 'white',
                                      fontWeight: 'bold',
                                      fontSize: '0.9rem',
                                      animation: 'pulse 2s ease-in-out infinite'
                                    }}>
                                      🔴 LIVE NOW
                                    </span>
                                  ) : (
                                    <span style={{
                                      background: 'rgba(102, 126, 234, 0.2)',
                                      border: '1px solid rgba(102, 126, 234, 0.4)',
                                      padding: '8px 16px',
                                      borderRadius: '20px',
                                      color: '#667eea',
                                      fontWeight: 'bold',
                                      fontSize: '0.9rem'
                                    }}>
                                      {timeUntil}
                                    </span>
                                  )}
                                  <span style={{
                                    color: 'rgba(255,255,255,0.5)',
                                    fontSize: '0.85rem'
                                  }}>
                                    Click to register →
                                  </span>
                                </div>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Past Contests Section */}
                <div className="glass-card" style={{ padding: '30px' }}>
                  <h5 style={{ color: 'white', fontWeight: 'bold', marginBottom: '20px', fontSize: '1.3rem' }}>
                    🏆 Past Contest Performance ({userData.ratingData?.length || 0} contests)
                  </h5>
                  <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {userData.ratingData?.map((contest, idx) => (
                      <div key={idx} className="contest-row">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <h6 style={{ color: 'white', fontWeight: 'bold', marginBottom: '5px' }}>
                              {contest.name}
                            </h6>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>
                              {contest.end_date.split(' ')[0]} • Code: {contest.code}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#667eea', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                {contest.rating}
                              </div>
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Rating</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#f093fb', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                #{contest.rank}
                              </div>
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Rank</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No contest data available</p>}
                  </div>
                </div>
              </>
            )}

            {/* Problems Tab */}
            {activeTab === 'problems' && (
              <div className="glass-card" style={{ padding: '30px' }}>
                <div style={{ marginBottom: '25px' }}>
                  <h5 style={{ color: 'white', fontWeight: 'bold', marginBottom: '15px', fontSize: '1.3rem' }}>
                    💡 Recommended Problems for You
                  </h5>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>
                    Problems curated based on your rating ({userData?.currentRating || 1400}). 
                    Start with Easy, progress to Medium, then challenge yourself with Hard!
                  </p>
                  
                  {/* Filter Buttons */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <button 
                      className={`filter-btn ${problemFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setProblemFilter('all')}
                    >
                      All ({recommendedProblems.length})
                    </button>
                    <button 
                      className={`filter-btn ${problemFilter === 'easy' ? 'active' : ''}`}
                      onClick={() => setProblemFilter('easy')}
                    >
                      Easy ({recommendedProblems.filter(p => p.difficulty === 'Easy').length})
                    </button>
                    <button 
                      className={`filter-btn ${problemFilter === 'medium' ? 'active' : ''}`}
                      onClick={() => setProblemFilter('medium')}
                    >
                      Medium ({recommendedProblems.filter(p => p.difficulty === 'Medium').length})
                    </button>
                    <button 
                      className={`filter-btn ${problemFilter === 'hard' ? 'active' : ''}`}
                      onClick={() => setProblemFilter('hard')}
                    >
                      Hard ({recommendedProblems.filter(p => p.difficulty === 'Hard').length})
                    </button>
                    <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }}></div>
                    {['Arrays & Strings', 'Dynamic Programming', 'Graph Algorithms', 'Greedy Algorithms'].map(cat => (
                      <button 
                        key={cat}
                        className={`filter-btn ${problemFilter === cat ? 'active' : ''}`}
                        onClick={() => setProblemFilter(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Problems List */}
                <div style={{ maxHeight: '700px', overflowY: 'auto' }}>
                  {getFilteredProblems().length > 0 ? (
                    getFilteredProblems().map((problem, idx) => (
                      <div key={problem.id} className="problem-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <h6 style={{ color: 'white', fontWeight: 'bold', marginBottom: '8px', fontSize: '1.05rem' }}>
                              {problem.name}
                            </h6>
                            <div style={{ marginBottom: '10px' }}>
                              <span 
                                className="difficulty-badge"
                                style={{ 
                                  background: getDifficultyColor(problem.difficulty),
                                  color: 'white'
                                }}
                              >
                                {problem.difficulty}
                              </span>
                              <span style={{ 
                                color: 'rgba(255,255,255,0.6)', 
                                marginLeft: '15px',
                                fontSize: '0.9rem'
                              }}>
                                ⭐ Rating: ~{problem.rating}
                              </span>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              {problem.tags.map((tag, i) => (
                                <span key={i} className="tag-chip">{tag}</span>
                              ))}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                              <span style={{ marginRight: '15px' }}>
                                👥 {problem.solveCount.toLocaleString()} solved
                              </span>
                              <span>
                                ✓ {problem.accuracy}% accuracy
                              </span>
                            </div>
                          </div>
                          <a
                            href={problem.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cyber-button"
                            style={{ 
                              padding: '10px 24px',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Solve Now →
                          </a>
                        </div>
                        
                        {/* Progress indicator for recommended rating */}
                        {Math.abs(problem.rating - (userData?.currentRating || 1400)) < 100 && (
                          <div style={{ 
                            marginTop: '10px',
                            padding: '8px 12px',
                            background: 'rgba(102, 126, 234, 0.1)',
                            border: '1px solid rgba(102, 126, 234, 0.3)',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#667eea'
                          }}>
                            💡 Perfect for your current rating level!
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔍</div>
                      <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                        No problems found for this filter
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="glass-card" style={{ padding: '30px' }}>
                <h5 style={{ color: 'white', fontWeight: 'bold', marginBottom: '20px', fontSize: '1.3rem' }}>
                  📅 Monthly Activity
                </h5>
                {getHeatMapData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={getHeatMapData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="#fff" angle={-45} textAnchor="end" height={100} fontSize={11} />
                      <YAxis stroke="#fff" />
                      <Tooltip 
                        contentStyle={{
                          background: 'rgba(26, 26, 46, 0.95)', 
                          border: '1px solid rgba(102, 126, 234, 0.3)'
                        }}
                      />
                      <Bar dataKey="submissions" fill="#43e97b" radius={[8, 8, 0, 0]}>
                        {getHeatMapData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '50px' }}>
                    No activity data available
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CodeChefProfile;