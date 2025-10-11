import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Small helper to create last N days timestamps (in seconds)
const getLastNDaysTimestamps = (n) => {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(Math.floor(d.getTime() / 1000));
  }
  return days;
};

const MultiPlatforms = () => {
  const [platform, setPlatform] = useState('leetcode');
  const [handle, setHandle] = useState('');
  const [inputHandle, setInputHandle] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  // For contests & recommended problems
  const [contests, setContests] = useState([]);
  const [recommendedProblems, setRecommendedProblems] = useState([]);
  // Heatmap selection
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const savedHandle = sessionStorage.getItem(`${platform}Handle`);
    if (savedHandle) {
      setHandle(savedHandle);
      setInputHandle(savedHandle);
      fetchUserData(savedHandle);
    } else {
      setHandle('');
      setInputHandle('');
      setUserInfo(null);
    }
  }, [platform]);

  useEffect(() => {
    // fetch contests once when component mounts
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      // kontests.net provides contest lists including LeetCode
      const resp = await fetch('https://kontests.net/api/v1/leetcode');
      if (!resp.ok) return;
      const data = await resp.json();
      // sort by start_time ascending and take next 4
      const upcoming = data
        .map(c => ({
          name: c.name,
          start_time: c.start_time,
          url: c.url,
          duration: c.duration
        }))
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
        .slice(0, 4);
      setContests(upcoming);
    } catch (err) {
      // silently ignore contest failures
      console.warn('Could not fetch contests', err);
    }
  };

  const fetchUserData = async (userHandle) => {
    setLoading(true);
    setError(null);
    try {
      let response, data;
      if (platform === 'leetcode') {
        // Using the public LeetCode API
        response = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${userHandle}`);
        if (!response.ok) {
          throw new Error('User not found. Please verify the username.');
        }
        data = await response.json();
        // Transform the API response to match our component structure
        const transformedData = {
          success: true,
          totalSolved: data.totalSolved || 0,
          ranking: data.ranking || null,
          contributionPoint: data.contributionPoint || 0,
          reputation: data.reputation || 0,
          problemsSolved: {
            easy: data.easySolved || 0,
            medium: data.mediumSolved || 0,
            hard: data.hardSolved || 0
          },
          totalQuestions: {
            easy: data.totalEasy || 0,
            medium: data.totalMedium || 0,
            hard: data.totalHard || 0,
            all: data.totalQuestions || 0
          },
          submissionCalendar: data.submissionCalendar || {},
          totalSubmissions: data.totalSubmissions || [],
          tagStats: data.tagStats || []
        };
        setUserInfo(transformedData);
        // create quick recommended problems based on top tags
        createRecommendedProblems(transformedData.tagStats || []);
      } else if (platform === 'hackerrank') {
        // Keep existing HackerRank API logic
        const API_URL = window.location.hostname === 'localhost'
          ? 'http://localhost:5000'
          : 'https://api.programmerz.live';
        response = await fetch(`${API_URL}/api/${platform}/${userHandle}`);
        if (!response.ok) {
          throw new Error('User not found. Please verify the username.');
        }
        data = await response.json();
        if (!data.success) {
          throw new Error('User not found');
        }
        setUserInfo(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch user data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputHandle.trim()) {
      sessionStorage.setItem(`${platform}Handle`, inputHandle.trim());
      setHandle(inputHandle.trim());
      fetchUserData(inputHandle.trim());
    }
  };

  const handlePlatformChange = (newPlatform) => {
    if (newPlatform === 'hackerrank') {
      // Show "Coming Soon" tooltip
      alert('HackerRank support is coming soon!');
      return;
    }
    setPlatform(newPlatform);
    setActiveTab('overview');
  };

  // LeetCode specific functions
  const getLeetCodeDifficultyData = () => {
    if (!userInfo?.problemsSolved) return [];
    return [
      { name: 'Easy', value: userInfo.problemsSolved.easy || 0, color: '#00b8a3' },
      { name: 'Medium', value: userInfo.problemsSolved.medium || 0, color: '#ffc01e' },
      { name: 'Hard', value: userInfo.problemsSolved.hard || 0, color: '#ef4743' }
    ].filter(d => d.value > 0);
  };

  const getLeetCodeSkillsData = () => {
    if (!userInfo?.tagStats) return [];
    return userInfo.tagStats.slice(0, 10).map(tag => ({
      subject: tag.name,
      value: tag.problemsSolved || tag.problemsSolvedCount || tag.count || 0
    }));
  };

  const getLeetCodeSubmissionCalendar = () => {
    if (!userInfo?.submissionCalendar) return [];
    const calendar = userInfo.submissionCalendar;
    const sortedDates = Object.keys(calendar).sort((a, b) => parseInt(a) - parseInt(b));
    // Get last 30 days of data
    return sortedDates.slice(-30).map(timestamp => ({
      date: new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      submissions: calendar[timestamp]
    }));
  };

  // Create recommended problems: simple approach -> build search links by top tags and diff mix
  const createRecommendedProblems = (tagStats = []) => {
    const topTags = (tagStats || []).slice(0, 5).map(t => t.name);
    const recs = [];
    // For each tag create 2 recommendations (one easy/one medium) as links to LeetCode search/tag pages
    topTags.forEach((tag, idx) => {
      const easy = {
        title: `${tag} - Easy Practice`,
        url: `https://leetcode.com/tag/${encodeURIComponent(tag)}/`
      };
      const medium = {
        title: `${tag} - Medium Practice`,
        url: `https://leetcode.com/tag/${encodeURIComponent(tag)}/`
      };
      recs.push(easy, medium);
    });
    // Fallback: if no tags, suggest popular categories links
    if (recs.length === 0) {
      recs.push(
        { title: 'Two Sum (Easy)', url: 'https://leetcode.com/problems/two-sum/' },
        { title: 'Longest Substring Without Repeating Characters (Medium)', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' }
      );
    }
    // Keep only first 8 recommendations
    setRecommendedProblems(recs.slice(0, 8));
  };

  // HackerRank specific functions
  const getHackerRankSkillsData = () => {
    if (!userInfo?.skills) return [];
    return userInfo.skills.map(skill => ({
      name: skill.name,
      level: skill.level,
      score: skill.score || 0
    }));
  };

  const getHackerRankBadgesData = () => {
    if (!userInfo?.badges) return [];
    const badgeCount = {};
    userInfo.badges.forEach(badge => {
      const level = badge.level || 'Bronze';
      badgeCount[level] = (badgeCount[level] || 0) + 1;
    });
    return Object.entries(badgeCount).map(([name, value]) => ({ name, value }));
  };

  const getHackerRankChallengesData = () => {
    if (!userInfo?.challengesSolved) return [];
    const categories = userInfo.challengesSolved;
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b', '#38f9d7', '#fa709a'];

  // Heatmap renderer (simple CSS-grid based using submissionCalendar object)
  const renderHeatmap = () => {
    // Prepare 30 days (last 30) mapping to counts
    const last30 = getLastNDaysTimestamps(30);
    const calendar = userInfo?.submissionCalendar || {};
    const squares = last30.map(ts => {
      // The API used earlier uses seconds timestamps as keys; try both raw and string
      const keyA = String(ts);
      const count = calendar[keyA] || 0;
      return { ts, count, date: new Date(ts * 1000) };
    });
    const max = Math.max(...squares.map(s => s.count), 1);
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
          {squares.map((s, i) => {
            // intensity scale
            const intensity = Math.round((s.count / max) * 4); // 0-4
            const bg = ['rgba(255,255,255,0.06)', 'rgba(102,126,234,0.12)', 'rgba(102,126,234,0.22)', 'rgba(102,126,234,0.34)', 'rgba(102,126,234,0.6)'][intensity];
            return (
              <div
                key={i}
                title={`${s.date.toLocaleDateString()} • Submissions: ${s.count}`}
                onClick={() => setSelectedDay(s)}
                style={{
                  height: 26,
                  borderRadius: 6,
                  background: bg,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: intensity > 0 ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontSize: 11
                }}
              >
                {s.count > 0 ? s.count : ''}
              </div>
            );
          })}
        </div>
        {selectedDay && (
          <div className="mt-3 p-3" style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="d-flex justify-content-between">
              <div>
                <strong className="text-light">{selectedDay.date.toLocaleDateString()}</strong>
                <div className="text-light opacity-75">Submissions: {selectedDay.count}</div>
              </div>
              <div>
                <button className="cyber-button btn-sm" onClick={() => window.open(`https://leetcode.com/studyplan/?progress=${handle}`, '_blank')}>View on LeetCode</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
        .platform-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .platform-btn {
          flex: 1;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          position: relative;
        }
        .platform-btn.active {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
          border-color: rgba(102, 126, 234, 0.5);
          color: white;
        }
        .platform-btn.hackerrank-disabled {
          cursor: not-allowed !important;
          opacity: 0.6;
          pointer-events: none;
        }
        .platform-btn.hackerrank-disabled::after {
          content: "Coming Soon";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .platform-btn.hackerrank-disabled:hover::after {
          opacity: 1;
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
        .badge-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }
        .skill-badge {
          display: inline-block;
          padding: 6px 14px;
          margin: 4px;
          background: rgba(102, 126, 234, 0.2);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 20px;
          font-size: 0.85rem;
          color: white;
        }
      `}</style>
      <div className="container">
        {/* Platform Selector */}
        <div className="platform-selector">
          <button
            className={`platform-btn ${platform === 'leetcode' ? 'active' : ''}`}
            onClick={() => handlePlatformChange('leetcode')}
          >
            <i className="bi bi-code-square me-2"></i>
            LeetCode
          </button>
          <button
            className={`platform-btn hackerrank-disabled`}
            title="HackerRank support coming soon"
          >
            <i className="bi bi-terminal me-2"></i>
            HackerRank
          </button>
        </div>
        {!handle ? (
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="glass-card p-5 text-center">
                <h3 className="text-light mb-4">
                  Enter Your LeetCode Username
                </h3>
                <input
                  type="text"
                  className="glass-input w-100 mb-4"
                  placeholder="e.g., john_doe"
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
              Try Another Username
            </button>
          </div>
        ) : userInfo && (
          <>
            {/* Profile Header */}
            <div className="glass-card p-4 mb-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h2 className="text-light fw-bold mb-2">{handle}</h2>
                  <span className="skill-badge">
                    LeetCode Profile
                  </span>
                  {userInfo.ranking && (
                    <div className="mt-3">
                      <span className="text-light opacity-75">
                        <i className="bi bi-trophy me-2"></i>Rank: #{userInfo.ranking.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {userInfo.contributionPoint > 0 && (
                    <div className="mt-2">
                      <span className="text-light opacity-75">
                        <i className="bi bi-star me-2"></i>Contribution: {userInfo.contributionPoint}
                      </span>
                    </div>
                  )}
                </div>
                <div className="col-md-4 text-end">
                  <>
                    <h3 className="holographic-text fw-bold">{userInfo.totalSolved || 0}</h3>
                    <p className="text-light opacity-75">Problems Solved</p>
                    {userInfo.reputation > 0 && (
                      <div className="mt-2">
                        <span className="text-light opacity-75">
                          Reputation: {userInfo.reputation.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </>
                  <button onClick={() => setHandle('')} className="cyber-button btn-sm mt-2">
                    Change Username
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
                <button className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>
                  <i className="bi bi-lightbulb me-2"></i>Skills
                </button>
                <button className={`tab-btn ${activeTab === 'problems' ? 'active' : ''}`} onClick={() => setActiveTab('problems')}>
                  <i className="bi bi-list-stars me-2"></i>Problems & Contests
                </button>
              </div>
            </div>
            {/* LeetCode Overview */}
            {activeTab === 'overview' && (
              <>
                <div className="row g-4 mb-4">
                  <div className="col-md-3">
                    <div className="glass-card p-4 text-center">
                      <i className="bi bi-check-circle fs-2 holographic-text mb-2"></i>
                      <h3 className="holographic-text fw-bold">{userInfo.totalSolved || 0}</h3>
                      <p className="text-light opacity-75 mb-1">Total Solved</p>
                      <small className="text-light opacity-50">of {userInfo.totalQuestions?.all || 0}</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="glass-card p-4 text-center">
                      <i className="bi bi-award fs-2 text-success mb-2"></i>
                      <h3 className="text-success fw-bold">{userInfo.problemsSolved?.easy || 0}</h3>
                      <p className="text-light opacity-75 mb-1">Easy</p>
                      <small className="text-light opacity-50">of {userInfo.totalQuestions?.easy || 0}</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="glass-card p-4 text-center">
                      <i className="bi bi-award fs-2 text-warning mb-2"></i>
                      <h3 className="text-warning fw-bold">{userInfo.problemsSolved?.medium || 0}</h3>
                      <p className="text-light opacity-75 mb-1">Medium</p>
                      <small className="text-light opacity-50">of {userInfo.totalQuestions?.medium || 0}</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="glass-card p-4 text-center">
                      <i className="bi bi-award fs-2 text-danger mb-2"></i>
                      <h3 className="text-danger fw-bold">{userInfo.problemsSolved?.hard || 0}</h3>
                      <p className="text-light opacity-75 mb-1">Hard</p>
                      <small className="text-light opacity-50">of {userInfo.totalQuestions?.hard || 0}</small>
                    </div>
                  </div>
                </div>
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="glass-card p-4">
                      <h5 className="text-light fw-bold mb-4">Problem Difficulty Distribution</h5>
                      {getLeetCodeDifficultyData().length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={getLeetCodeDifficultyData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={90}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {getLeetCodeDifficultyData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5">
                          <p className="text-light opacity-50">Start solving problems to see distribution</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="glass-card p-4">
                      <h5 className="text-light fw-bold mb-4">Submission Statistics</h5>
                      {userInfo.totalSubmissions && userInfo.totalSubmissions.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={userInfo.totalSubmissions}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="difficulty" stroke="#fff" />
                            <YAxis stroke="#fff" />
                            <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                            <Legend />
                            <Bar dataKey="count" fill="#667eea" name="Problems Solved" />
                            <Bar dataKey="submissions" fill="#f093fb" name="Total Submissions" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5">
                          <p className="text-light opacity-50">Start solving problems to see submission stats</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="glass-card p-4">
                <h5 className="text-light fw-bold mb-4">Submission Activity (Last 30 Days)</h5>
                {getLeetCodeSubmissionCalendar().length > 0 ? (
                  <>
                    <div className="mb-3">{renderHeatmap()}</div>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={getLeetCodeSubmissionCalendar()}>
                        <defs>
                          <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="#fff" angle={-45} textAnchor="end" height={80} fontSize={11} />
                        <YAxis stroke="#fff" />
                        <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                        <Area type="monotone" dataKey="submissions" stroke="#667eea" fillOpacity={1} fill="url(#colorSubmissions)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-light opacity-50">No submission activity data available</p>
                  </div>
                )}
              </div>
            )}
            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="glass-card p-4">
                <h5 className="text-light fw-bold mb-4">Top Tags / Skills</h5>
                {getLeetCodeSkillsData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={360}>
                    <RadarChart data={getLeetCodeSkillsData()} cx="50%" cy="50%" outerRadius="80">
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" stroke="#fff" />
                      <PolarRadiusAxis />
                      <Radar name="Problems" dataKey="value" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
                      <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-light opacity-50">No tag data available. Solve problems to populate tags.</p>
                  </div>
                )}
                {/* Also show a list of tags as badges for quick glance */}
                {getLeetCodeSkillsData().length > 0 && (
                  <div className="mt-3">
                    {getLeetCodeSkillsData().map((t, i) => (
                      <span key={i} className="skill-badge">{t.subject} — {t.value}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Problems & Contests Tab */}
            {activeTab === 'problems' && (
              <div className="glass-card p-4">
                <h5 className="text-light fw-bold mb-3">Upcoming Contests</h5>
                {contests && contests.length > 0 ? (
                  <div className="row">
                    {contests.map((c, idx) => (
                      <div key={idx} className="col-md-6 mb-3">
                        <div className="badge-card p-3 h-100 text-start">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong className="text-light">{c.name}</strong>
                              <div className="text-light opacity-75 small">Starts: {new Date(c.start_time).toLocaleString()}</div>
                            </div>
                            <div>
                              <a className="cyber-button btn-sm" href={c.url} target="_blank" rel="noreferrer">Go to Contest</a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-light opacity-50">No upcoming contests found.</p>
                )}
                <hr style={{ borderColor: 'rgba(255,255,255,0.04)' }} />
                <h5 className="text-light fw-bold mb-3">Recommended Problems</h5>
                {recommendedProblems && recommendedProblems.length > 0 ? (
                  <div className="row">
                    {recommendedProblems.map((p, i) => (
                      <div key={i} className="col-md-6 mb-2">
                        <div className="badge-card p-2 d-flex justify-content-between align-items-center">
                          <div className="text-start">
                            <div className="text-light small">{p.title}</div>
                          </div>
                          <div>
                            <a className="cyber-button btn-sm" href={p.url} target="_blank" rel="noreferrer">Open</a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-light opacity-50">No recommendations available yet.</p>
                )}
                <div className="mt-3 text-light opacity-75 small">Recommendations are generated from your top solved tags (best-effort). Problem links redirect to LeetCode tag pages or example problems.</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MultiPlatforms;