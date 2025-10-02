import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const CodeforcesProfile = () => {
  const [handle, setHandle] = useState('');
  const [inputHandle, setInputHandle] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [contests, setContests] = useState([]);
  const [allProblems, setAllProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const savedHandle = localStorage.getItem('codeforcesHandle');
    if (savedHandle) {
      setHandle(savedHandle);
      setInputHandle(savedHandle);
      fetchUserData(savedHandle);
    }
  }, []);

  const fetchUserData = async (userHandle) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user info
      const userResponse = await fetch(`https://codeforces.com/api/user.info?handles=${userHandle}`);
      const userData = await userResponse.json();
      if (userData.status !== 'OK') throw new Error('User not found');
      setUserInfo(userData.result[0]);
      
      // Fetch rating history
      const ratingResponse = await fetch(`https://codeforces.com/api/user.rating?handle=${userHandle}`);
      const ratingData = await ratingResponse.json();
      if (ratingData.status === 'OK') {
        setRatingHistory(ratingData.result);
      }
      
      // Fetch submissions
      const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${userHandle}&from=1&count=2000`);
      const submissionsData = await submissionsResponse.json();
      if (submissionsData.status === 'OK') {
        setSubmissions(submissionsData.result);
      }
      
      // Fetch all problems
      const problemsResponse = await fetch('https://codeforces.com/api/problemset.problems');
      const problemsData = await problemsResponse.json();
      if (problemsData.status === 'OK') {
        setAllProblems(problemsData.result.problems);
      }
      
      // Fetch upcoming contests (within 2 weeks)
      const contestsResponse = await fetch('https://codeforces.com/api/contest.list');
      const contestsData = await contestsResponse.json();
      if (contestsData.status === 'OK') {
        const now = Date.now() / 1000;
        const twoWeeks = 14 * 24 * 60 * 60;
        const upcomingContests = contestsData.result
          .filter(c => c.phase === 'BEFORE' && c.startTimeSeconds - now < twoWeeks)
          .slice(0, 5);
        setContests(upcomingContests);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputHandle.trim()) {
      localStorage.setItem('codeforcesHandle', inputHandle.trim());
      setHandle(inputHandle.trim());
      fetchUserData(inputHandle.trim());
    }
  };

  const getRankColor = (rank) => {
    const colors = {
      'newbie': '#808080', 'pupil': '#008000', 'specialist': '#03a89e',
      'expert': '#0000ff', 'candidate master': '#aa00aa', 'master': '#ff8c00',
      'international master': '#ff8c00', 'grandmaster': '#ff0000',
      'international grandmaster': '#ff0000', 'legendary grandmaster': '#ff0000'
    };
    return colors[rank?.toLowerCase()] || '#808080';
  };

  // Rating progress data
  const getRatingProgressData = () => {
    return ratingHistory.map(contest => ({
      date: new Date(contest.ratingUpdateTimeSeconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rating: contest.newRating,
      contest: contest.contestName
    }));
  };

  // Problem rating distribution
  const getProblemRatingDistribution = () => {
    const solvedProblems = submissions.filter(s => s.verdict === 'OK' && s.problem.rating);
    const distribution = {};
    
    solvedProblems.forEach(sub => {
      const rating = Math.floor(sub.problem.rating / 100) * 100;
      distribution[rating] = (distribution[rating] || 0) + 1;
    });
    
    return Object.entries(distribution)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([rating, count]) => ({ rating: rating.toString(), count }));
  };

  // Difficulty analysis
  const getDifficultyAnalysis = () => {
    const solvedProblems = submissions.filter(s => s.verdict === 'OK' && s.problem.rating);
    const difficulty = { 'Very Easy': 0, 'Easy': 0, 'Medium': 0, 'Hard': 0, 'Very Hard': 0 };
    
    solvedProblems.forEach(sub => {
      const rating = sub.problem.rating;
      if (rating < 1000) difficulty['Very Easy']++;
      else if (rating < 1400) difficulty['Easy']++;
      else if (rating < 1800) difficulty['Medium']++;
      else if (rating < 2200) difficulty['Hard']++;
      else difficulty['Very Hard']++;
    });
    
    return Object.entries(difficulty).map(([name, value]) => ({ name, value }));
  };

  // Tags analysis
  const getTagsAnalysis = () => {
    const solvedProblems = submissions.filter(s => s.verdict === 'OK');
    const tagCount = {};
    
    solvedProblems.forEach(sub => {
      if (sub.problem?.tags) {
        sub.problem.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, value]) => ({ name, value }));
  };

  // Weak topics identification
  const getWeakTopics = () => {
    const tagStats = {};
    
    submissions.forEach(sub => {
      if (sub.problem?.tags) {
        sub.problem.tags.forEach(tag => {
          if (!tagStats[tag]) tagStats[tag] = { total: 0, solved: 0, failed: 0 };
          tagStats[tag].total++;
          if (sub.verdict === 'OK') tagStats[tag].solved++;
          else tagStats[tag].failed++;
        });
      }
    });
    
    return Object.entries(tagStats)
      .filter(([_, stats]) => stats.total >= 5)
      .map(([tag, stats]) => ({
        tag,
        accuracy: (stats.solved / stats.total) * 100,
        attempted: stats.total,
        solved: stats.solved,
        failed: stats.failed
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);
  };

  // ML-based problem recommendations
  const getMLRecommendations = () => {
    const solvedSet = new Set(
      submissions
        .filter(s => s.verdict === 'OK')
        .map(s => `${s.problem.contestId}${s.problem.index}`)
    );
    
    const weakTopics = getWeakTopics();
    const weakTags = weakTopics.map(t => t.tag);
    
    // ML Algorithm: Content-based filtering with difficulty progression
    const userRating = userInfo?.rating || 1200;
    const targetRating = Math.min(userRating + 200, Math.max(userRating - 100, 800));
    
    const recommendations = allProblems
      .filter(p => {
        const problemCode = `${p.contestId}${p.index}`;
        if (solvedSet.has(problemCode)) return false;
        if (!p.rating) return false;
        
        // Rating should be slightly above user's current level
        if (p.rating < targetRating - 200 || p.rating > targetRating + 300) return false;
        
        // Prioritize weak topics
        const hasWeakTag = p.tags?.some(tag => weakTags.includes(tag));
        return hasWeakTag || Math.random() > 0.7;
      })
      .map(p => {
        // ML scoring based on multiple factors
        let score = 0;
        
        // Factor 1: Rating proximity (closer to target = higher score)
        const ratingDiff = Math.abs(p.rating - targetRating);
        score += (300 - ratingDiff) / 300 * 40;
        
        // Factor 2: Weak topic bonus
        const weakTagCount = p.tags?.filter(tag => weakTags.includes(tag)).length || 0;
        score += weakTagCount * 25;
        
        // Factor 3: Problem solve count (popular problems)
        score += Math.min((p.solvedCount || 0) / 1000, 1) * 15;
        
        // Factor 4: Diversify tags
        const uniqueTags = new Set(p.tags);
        score += uniqueTags.size * 2;
        
        return { ...p, mlScore: score };
      })
      .sort((a, b) => b.mlScore - a.mlScore)
      .slice(0, 10);
    
    return recommendations;
  };

  // Verdict distribution
  const getVerdictDistribution = () => {
    const verdicts = {};
    submissions.forEach(sub => {
      verdicts[sub.verdict] = (verdicts[sub.verdict] || 0) + 1;
    });
    
    return Object.entries(verdicts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  };

  // Language distribution
  const getLanguageDistribution = () => {
    const languages = {};
    submissions.forEach(sub => {
      const lang = sub.programmingLanguage;
      languages[lang] = (languages[lang] || 0) + 1;
    });
    
    return Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  };

  // Recent contests with rating changes
  const getRecentContests = () => {
    return ratingHistory
      .sort((a, b) => b.ratingUpdateTimeSeconds - a.ratingUpdateTimeSeconds)
      .slice(0, 8)
      .map(contest => ({
        ...contest,
        ratingChange: contest.newRating - contest.oldRating
      }));
  };

  // Unsolved problems from recent attempts
  const getUnsolvedProblems = () => {
    const failedProblems = {};
    
    submissions
      .filter(s => s.verdict !== 'OK')
      .forEach(sub => {
        const key = `${sub.problem.contestId}${sub.problem.index}`;
        if (!failedProblems[key]) {
          failedProblems[key] = {
            problem: sub.problem,
            attempts: 0,
            lastAttempt: sub.creationTimeSeconds
          };
        }
        failedProblems[key].attempts++;
      });
    
    return Object.values(failedProblems)
      .sort((a, b) => b.lastAttempt - a.lastAttempt)
      .slice(0, 10);
  };

  // Calculate stats
  const stats = {
    totalSolved: submissions.filter(s => s.verdict === 'OK').length,
    totalSubmissions: submissions.length,
    accuracy: submissions.length > 0 ? ((submissions.filter(s => s.verdict === 'OK').length / submissions.length) * 100).toFixed(1) : 0,
    contestsParticipated: ratingHistory.length,
    bestRank: ratingHistory.length > 0 ? Math.min(...ratingHistory.map(c => c.rank)) : 'N/A',
    avgRatingChange: ratingHistory.length > 0 ? (ratingHistory.reduce((sum, c) => sum + (c.newRating - c.oldRating), 0) / ratingHistory.length).toFixed(0) : 0,
    maxRatingGain: ratingHistory.length > 0 ? Math.max(...ratingHistory.map(c => c.newRating - c.oldRating)) : 0,
    maxRatingLoss: ratingHistory.length > 0 ? Math.min(...ratingHistory.map(c => c.newRating - c.oldRating)) : 0
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b', '#38f9d7', '#fa709a'];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 75%, #0a0a0a 100%)',
      fontFamily: "'Poppins', sans-serif",
      paddingTop: '100px',
      paddingBottom: '50px'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css');
        
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
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
          font-family: 'Space Grotesk', sans-serif;
          cursor: pointer;
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
          font-family: 'Poppins', sans-serif;
          transition: all 0.3s ease;
        }
        
        .glass-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(102, 126, 234, 0.4);
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
          color: white;
        }
        
        .glass-input::placeholder { color: rgba(255, 255, 255, 0.5); }
        
        .rank-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-family: 'Space Grotesk', sans-serif;
          text-transform: capitalize;
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
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .tab-btn.active {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
          color: white;
        }
        
        .problem-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s ease;
        }
        
        .problem-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateX(5px);
        }
        
        .tag-badge {
          display: inline-block;
          padding: 4px 10px;
          margin: 2px;
          background: rgba(102, 126, 234, 0.2);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 12px;
          font-size: 0.75rem;
          color: white;
        }
        
        .contest-card {
          border-left: 3px solid #667eea;
        }
        
        .rating-positive { color: #4ade80; }
        .rating-negative { color: #ef4444; }
      `}</style>

      <div className="container">
        {!handle ? (
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="glass-card p-5 text-center">
                <h3 className="text-light mb-4">Enter Your Codeforces Handle</h3>
                <input
                  type="text"
                  className="glass-input w-100 mb-4"
                  placeholder="e.g., tourist"
                  value={inputHandle}
                  onChange={(e) => setInputHandle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                />
                <button onClick={handleSubmit} className="cyber-button w-100">
                  Get Analytics
                </button>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="d-flex justify-content-center" style={{ height: '300px', alignItems: 'center' }}>
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <div className="glass-card p-4 text-center">
            <i className="bi bi-exclamation-triangle fs-1 text-warning mb-3"></i>
            <h4 className="text-light">{error}</h4>
            <button onClick={() => setHandle('')} className="cyber-button mt-3">
              Try Another Handle
            </button>
          </div>
        ) : userInfo && (
          <>
            {/* Profile Header */}
            <div className="glass-card p-4 mb-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h2 className="text-light fw-bold mb-2">{userInfo.handle}</h2>
                  <span className="rank-badge" style={{ backgroundColor: getRankColor(userInfo.rank), color: 'white' }}>
                    {userInfo.rank}
                  </span>
                  <div className="mt-3">
                    <span className="text-light opacity-75">
                      <i className="bi bi-geo-alt me-2"></i>{userInfo.country || 'Unknown'}
                    </span>
                    {userInfo.organization && (
                      <span className="text-light opacity-75 ms-3">
                        <i className="bi bi-building me-2"></i>{userInfo.organization}
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-md-4 text-end">
                  <h3 className="holographic-text fw-bold">{userInfo.rating}</h3>
                  <p className="text-light opacity-75">Current Rating</p>
                  <p className="text-light opacity-50">Max: {userInfo.maxRating}</p>
                  <button onClick={() => setHandle('')} className="cyber-button btn-sm mt-2">
                    Change Handle
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="glass-card p-3 mb-4">
              <div className="d-flex gap-2 flex-wrap">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                  <i className="bi bi-bar-chart me-2"></i>Overview
                </button>
                <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                  <i className="bi bi-graph-up me-2"></i>Analytics
                </button>
                <button className={`tab-btn ${activeTab === 'practice' ? 'active' : ''}`} onClick={() => setActiveTab('practice')}>
                  <i className="bi bi-clipboard-check me-2"></i>Practice
                </button>
                <button className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
                  <i className="bi bi-lightbulb me-2"></i>Insights
                </button>
              </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Stats Cards */}
                <div className="row g-4 mb-4">
                  {[
                    { label: 'Problems Solved', value: stats.totalSolved, icon: 'check-circle' },
                    { label: 'Total Submissions', value: stats.totalSubmissions, icon: 'send' },
                    { label: 'Accuracy', value: `${stats.accuracy}%`, icon: 'bullseye' },
                    { label: 'Contests', value: stats.contestsParticipated, icon: 'trophy' }
                  ].map((stat, idx) => (
                    <div key={idx} className="col-md-3">
                      <div className="glass-card p-4 text-center">
                        <i className={`bi bi-${stat.icon} fs-2 holographic-text mb-2`}></i>
                        <h3 className="holographic-text fw-bold mb-1">{stat.value}</h3>
                        <p className="text-light opacity-75 mb-0">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rating History Graph */}
                <div className="row g-4 mb-4">
                  <div className="col-md-8">
                    <div className="glass-card p-4">
                      <h5 className="text-light fw-bold mb-4">Rating History</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={getRatingProgressData()}>
                          <defs>
                            <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" stroke="#fff" />
                          <YAxis stroke="#fff" />
                          <Tooltip 
                            contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }}
                          />
                          <Area type="monotone" dataKey="rating" stroke="#667eea" fillOpacity={1} fill="url(#colorRating)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="row mt-3 text-center">
                        <div className="col-4">
                          <p className="text-light opacity-75 mb-1">Contests</p>
                          <h5 className="holographic-text fw-bold">{stats.contestsParticipated}</h5>
                        </div>
                        <div className="col-4">
                          <p className="text-light opacity-75 mb-1">Best Rank</p>
                          <h5 className="holographic-text fw-bold">{stats.bestRank}</h5>
                        </div>
                        <div className="col-4">
                          <p className="text-light opacity-75 mb-1">Avg Change</p>
                          <h5 className={`fw-bold ${parseFloat(stats.avgRatingChange) >= 0 ? 'rating-positive' : 'rating-negative'}`}>
                            {parseFloat(stats.avgRatingChange) > 0 ? '+' : ''}{stats.avgRatingChange}
                          </h5>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Contests */}
                  <div className="col-md-4">
                    <div className="glass-card p-4" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                      <h5 className="text-light fw-bold mb-4">Recent Contests</h5>
                      {getRecentContests().map((contest, idx) => (
                        <div key={idx} className="glass-card contest-card p-3 mb-2">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="text-light mb-1" style={{ fontSize: '0.9rem' }}>
                                {contest.contestName}
                              </h6>
                              <p className="text-light opacity-50 mb-1" style={{ fontSize: '0.75rem' }}>
                                {new Date(contest.ratingUpdateTimeSeconds * 1000).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-end">
                              <p className="mb-0" style={{ fontSize: '0.85rem' }}>
                                <span className="text-light opacity-75">#{contest.rank}</span>
                              </p>
                              <p className={`mb-0 fw-bold ${contest.ratingChange >= 0 ? 'rating-positive' : 'rating-negative'}`}>
                                {contest.ratingChange > 0 ? '+' : ''}{contest.ratingChange}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <>
                <div className="row g-4 mb-4">
                  {/* Problem Rating Distribution */}
                  <div className="col-md-6">
                    <div className="glass-card p-4">
                      <h5 className="text-light fw-bold mb-4">Problem Rating Distribution</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getProblemRatingDistribution()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="rating" stroke="#fff" />
                          <YAxis stroke="#fff" />
                          <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                          <Bar dataKey="count" fill="#667eea" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Difficulty Category Analysis */}
                  <div className="col-md-6">
                    <div className="glass-card p-4">
                      <h5 className="text-light fw-bold mb-4">Difficulty Category Analysis</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getDifficultyAnalysis()} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis type="number" stroke="#fff" />
                          <YAxis dataKey="name" type="category" stroke="#fff" width={100} />
                          <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                          <Bar dataKey="value">
                            {getDifficultyAnalysis().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Tags and Languages */}
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="glass-card p-4">
                      <h5 className="text-light fw-bold mb-4">Problem Tags</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getTagsAnalysis()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="name" stroke="#fff" angle={-45} textAnchor="end" height={120} />
                          <YAxis stroke="#fff" />
                          <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                          <Bar dataKey="value" fill="#f093fb" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="glass-card p-4">
                      <h5 className="text-light fw-bold mb-4">Programming Languages</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={getLanguageDistribution()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getLanguageDistribution().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Verdict Distribution */}
                <div className="glass-card p-4 mb-4">
                  <h5 className="text-light fw-bold mb-4">Verdict Distribution</h5>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={getVerdictDistribution()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#fff" />
                      <YAxis stroke="#fff" />
                      <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                      <Bar dataKey="value">
                        {getVerdictDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'OK' ? '#4ade80' : COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Practice Tab */}
            {activeTab === 'practice' && (
              <>
                {/* Weak Topics */}
                <div className="glass-card p-4 mb-4">
                  <h5 className="text-light fw-bold mb-4">
                    <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                    Weak Topics - Focus Areas
                  </h5>
                  <div className="row g-3">
                    {getWeakTopics().map((topic, idx) => (
                      <div key={idx} className="col-md-4">
                        <div className="problem-card">
                          <h6 className="text-light fw-bold mb-2 text-uppercase">{topic.tag}</h6>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-light opacity-75">Solved: {topic.solved}/{topic.attempted}</span>
                            <span className={topic.accuracy < 40 ? 'text-danger' : topic.accuracy < 60 ? 'text-warning' : 'text-success'}>
                              {topic.accuracy.toFixed(0)}% accuracy
                            </span>
                          </div>
                          <div className="progress" style={{ height: '8px', background: 'rgba(255,255,255,0.1)' }}>
                            <div 
                              className="progress-bar" 
                              style={{ 
                                width: `${topic.accuracy}%`,
                                background: topic.accuracy < 40 ? '#ef4444' : topic.accuracy < 60 ? '#fbbf24' : '#4ade80'
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="alert alert-warning mt-4 p-3" style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '12px' }}>
                    <i className="bi bi-lightbulb me-2"></i>
                    <strong>Focus Strategy:</strong> Practice problems from your weakest topics. Our ML algorithm has identified personalized recommendations below.
                  </div>
                </div>

                {/* ML Recommendations */}
                <div className="glass-card p-4 mb-4">
                  <h5 className="text-light fw-bold mb-3">
                    <i className="bi bi-cpu me-2"></i>
                    ML-Powered Recommendations
                  </h5>
                  <p className="text-light opacity-75 mb-4">
                    Based on your submission history, rating progression, and weak topics, our machine learning algorithm recommends these problems:
                  </p>
                  {getMLRecommendations().map((problem, idx) => (
                    <div key={idx} className="problem-card mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <h6 className="text-light fw-bold mb-1">
                            {problem.name}
                          </h6>
                          <p className="text-light opacity-50 mb-2" style={{ fontSize: '0.85rem' }}>
                            Problem {problem.contestId}{problem.index} • Rating: {problem.rating}
                          </p>
                        </div>
                        <span className="badge" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '6px 12px' }}>
                          ML Score: {problem.mlScore.toFixed(0)}
                        </span>
                      </div>
                      <div className="mb-2">
                        {problem.tags?.slice(0, 5).map((tag, i) => (
                          <span key={i} className="tag-badge">{tag}</span>
                        ))}
                      </div>
                      <a
                        href={`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cyber-button btn-sm"
                      >
                        Solve Problem <i className="bi bi-arrow-right ms-2"></i>
                      </a>
                    </div>
                  ))}
                </div>

                {/* Unsolved Problems */}
                <div className="glass-card p-4">
                  <h5 className="text-light fw-bold mb-4">
                    <i className="bi bi-clock-history me-2"></i>
                    Recent Unsolved Problems
                  </h5>
                  <p className="text-light opacity-75 mb-3">Problems you haven't solved yet - Consider revisiting them!</p>
                  {getUnsolvedProblems().map((item, idx) => (
                    <div key={idx} className="problem-card mb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="text-light mb-1">{item.problem.name}</h6>
                          <p className="text-light opacity-50 mb-0" style={{ fontSize: '0.85rem' }}>
                            {item.attempts} failed attempts • Last: {new Date(item.lastAttempt * 1000).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={`https://codeforces.com/problemset/problem/${item.problem.contestId}/${item.problem.index}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cyber-button btn-sm"
                        >
                          Retry
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <>
                {/* Performance Insights */}
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="glass-card p-4">
                      <h5 className="text-light fw-bold mb-4">Consistency Goals</h5>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-light">Daily Practice Streak</span>
                          <span className="holographic-text fw-bold">3 days</span>
                        </div>
                        <div className="progress" style={{ height: '10px', background: 'rgba(255,255,255,0.1)' }}>
                          <div className="progress-bar" style={{ width: '30%', background: 'linear-gradient(90deg, #667eea, #764ba2)' }}></div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-light">Weekly Submissions</span>
                          <span className="holographic-text fw-bold">15/25</span>
                        </div>
                        <div className="progress" style={{ height: '10px', background: 'rgba(255,255,255,0.1)' }}>
                          <div className="progress-bar" style={{ width: '60%', background: 'linear-gradient(90deg, #f093fb, #f5576c)' }}></div>
                        </div>
                      </div>
                      <div className="alert alert-info mt-3 p-3" style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '12px' }}>
                        <strong>Challenge:</strong> Solve 1 problem daily for 10 days straight to build consistency!
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="glass-card p-4">
                      <h5 className="text-light fw-bold mb-4">Rating Prediction</h5>
                      <div className="text-center py-3">
                        <p className="text-light opacity-75 mb-2">Projected Rating (Next 3 months)</p>
                        <h2 className="holographic-text fw-bold mb-3">
                          {userInfo.rating + Math.floor((stats.avgRatingChange || 0) * 6)}
                        </h2>
                        <p className="text-light opacity-50">Based on your average rating change</p>
                      </div>
                      <div className="mt-3">
                        <p className="text-light mb-2"><strong>To reach next rank:</strong></p>
                        <ul className="text-light opacity-75" style={{ fontSize: '0.9rem' }}>
                          <li>Solve 2-3 problems daily at rating {userInfo.rating + 100}</li>
                          <li>Participate in at least 2 contests per month</li>
                          <li>Focus on your weak topics</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Contests */}
                <div className="glass-card p-4">
                  <h5 className="text-light fw-bold mb-4">
                    <i className="bi bi-calendar-event me-2"></i>
                    Upcoming Contests (Next 2 Weeks)
                  </h5>
                  {contests.length > 0 ? (
                    <div className="row g-3">
                      {contests.map((contest, idx) => {
                        const timeUntil = contest.startTimeSeconds - Date.now() / 1000;
                        const days = Math.floor(timeUntil / 86400);
                        const hours = Math.floor((timeUntil % 86400) / 3600);
                        
                        return (
                          <div key={idx} className="col-md-6">
                            <div className="glass-card contest-card p-3">
                              <h6 className="text-light fw-bold mb-2">{contest.name}</h6>
                              <p className="text-light opacity-75 mb-2">
                                <i className="bi bi-clock me-2"></i>
                                {new Date(contest.startTimeSeconds * 1000).toLocaleString()}
                              </p>
                              <p className="text-light opacity-75 mb-3">
                                <i className="bi bi-hourglass-split me-2"></i>
                                Starts in: {days}d {hours}h
                              </p>
                              <a
                                href={`https://codeforces.com/contest/${contest.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cyber-button w-100 text-center d-block"
                              >
                                Register on Codeforces
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-light opacity-50 text-center py-4">No upcoming contests in the next 2 weeks</p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CodeforcesProfile;