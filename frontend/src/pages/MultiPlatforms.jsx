import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const MultiPlatforms = () => {
  const [platform, setPlatform] = useState('leetcode');
  const [handle, setHandle] = useState('');
  const [inputHandle, setInputHandle] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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

  const fetchUserData = async (userHandle) => {
    setLoading(true);
    setError(null);
    
    try {
      const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000'
        : 'https://api.programmerz.live';
      
      console.log(`Fetching ${platform} data for:`, userHandle);
      
      const response = await fetch(`${API_URL}/api/${platform}/${userHandle}`);
      
      if (!response.ok) {
        throw new Error('User not found. Please verify the username.');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('User not found');
      }
      
      setUserInfo(data);
      
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
      value: tag.problemsSolved
    }));
  };

  const getLeetCodeContestData = () => {
    if (!userInfo?.contestHistory) return [];
    return userInfo.contestHistory.slice(0, 15).map(contest => ({
      date: new Date(contest.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rating: contest.rating,
      rank: contest.ranking
    }));
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
        }
        
        .platform-btn.active {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
          border-color: rgba(102, 126, 234, 0.5);
          color: white;
        }
        
        .platform-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
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
            className={`platform-btn ${platform === 'hackerrank' ? 'active' : ''}`}
            onClick={() => handlePlatformChange('hackerrank')}
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
                  Enter Your {platform === 'leetcode' ? 'LeetCode' : 'HackerRank'} Username
                </h3>
                <input
                  type="text"
                  className="glass-input w-100 mb-4"
                  placeholder={platform === 'leetcode' ? 'e.g., john_doe' : 'e.g., jane_coder'}
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
                    {platform === 'leetcode' ? 'LeetCode Profile' : 'HackerRank Profile'}
                  </span>
                  {platform === 'leetcode' && userInfo.ranking && (
                    <div className="mt-3">
                      <span className="text-light opacity-75">
                        <i className="bi bi-trophy me-2"></i>Rank: #{userInfo.ranking}
                      </span>
                    </div>
                  )}
                </div>
                <div className="col-md-4 text-end">
                  {platform === 'leetcode' && userInfo.contestRating && (
                    <>
                      <h3 className="holographic-text fw-bold">{Math.round(userInfo.contestRating)}</h3>
                      <p className="text-light opacity-75">Contest Rating</p>
                    </>
                  )}
                  {platform === 'hackerrank' && userInfo.level && (
                    <>
                      <h3 className="holographic-text fw-bold">Level {userInfo.level}</h3>
                      <p className="text-light opacity-75">Overall Level</p>
                    </>
                  )}
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
              </div>
            </div>

            {/* LeetCode Overview */}
            {platform === 'leetcode' && activeTab === 'overview' && (
              <>
                <div className="row g-4 mb-4">
                  <div className="col-md-3">
                    <div className="glass-card p-4 text-center">
                      <i className="bi bi-check-circle fs-2 holographic-text mb-2"></i>
                      <h3 className="holographic-text fw-bold">{userInfo.totalSolved || 0}</h3>
                      <p className="text-light opacity-75 mb-0">Total Solved</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="glass-card p-4 text-center">
                      <i className="bi bi-award fs-2 text-success mb-2"></i>
                      <h3 className="text-success fw-bold">{userInfo.problemsSolved?.easy || 0}</h3>
                      <p className="text-light opacity-75 mb-0">Easy</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="glass-card p-4 text-center">
                      <i className="bi bi-award fs-2 text-warning mb-2"></i>
                      <h3 className="text-warning fw-bold">{userInfo.problemsSolved?.medium || 0}</h3>
                      <p className="text-light opacity-75 mb-0">Medium</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="glass-card p-4 text-center">
                      <i className="bi bi-award fs-2 text-danger mb-2"></i>
                      <h3 className="text-danger fw-bold">{userInfo.problemsSolved?.hard || 0}</h3>
                      <p className="text-light opacity-75 mb-0">Hard</p>
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
                      <h5 className="text-light fw-bold mb-4">Contest Rating History</h5>
                      {getLeetCodeContestData().length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={getLeetCodeContestData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="#fff" />
                            <YAxis stroke="#fff" />
                            <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                            <Line type="monotone" dataKey="rating" stroke="#667eea" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5">
                          <p className="text-light opacity-50">Participate in contests to see rating history</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* HackerRank Overview */}
            {platform === 'hackerrank' && activeTab === 'overview' && (
              <>
                <div className="row g-4 mb-4">
                  <div className="col-md-3">
                    <div className="glass-card p-4 text-center">
                      <i className="bi bi-trophy fs-2 holographic-text mb-2"></i>
                      <h3 className="holographic-text fw-bold">{userInfo.badges?.length || 0}</h3>
                      <p className="text-light opacity-75 mb-0">Badges Earned</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="glass-card p-4 text-center">
                      <i className="bi bi-star fs-2 holographic-text mb-2"></i>
                      <h3 className="holographic-text fw-bold">{userInfo.skills?.length || 0}</h3>
                      <p className="text-light opacity-75 mb-0">Skills Verified</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="glass-card p-4 text-center">
                      <i className="bi bi-code-square fs-2 holographic-text mb-2"></i>
                      <h3 className="holographic-text fw-bold">{userInfo.totalChallenges || 0}</h3>
                      <p className="text-light opacity-75 mb-0">Challenges Solved</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="glass-card p-4 text-center">
                      <i className="bi bi-graph-up fs-2 holographic-text mb-2"></i>
                      <h3 className="holographic-text fw-bold">{userInfo.level || 0}</h3>
                      <p className="text-light opacity-75 mb-0">Current Level</p>
                    </div>
                  </div>
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="glass-card p-4">
                      <h5 className="text-light fw-bold mb-4">Badge Distribution</h5>
                      {getHackerRankBadgesData().length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={getHackerRankBadgesData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value}`}
                              outerRadius={90}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {getHackerRankBadgesData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5">
                          <p className="text-light opacity-50">Earn badges to see distribution</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="glass-card p-4">
                      <h5 className="text-light fw-bold mb-4">Challenges by Category</h5>
                      {getHackerRankChallengesData().length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={getHackerRankChallengesData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="#fff" angle={-45} textAnchor="end" height={100} fontSize={11} />
                            <YAxis stroke="#fff" />
                            <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                            <Bar dataKey="value" fill="#667eea" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5">
                          <p className="text-light opacity-50">Solve challenges to see distribution</p>
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
                <h5 className="text-light fw-bold mb-4">Coming Soon</h5>
                <p className="text-light opacity-75">Detailed analytics and performance trends will be available soon.</p>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && platform === 'leetcode' && (
              <div className="glass-card p-4">
                <h5 className="text-light fw-bold mb-4">Problem Tags Performance</h5>
                {getLeetCodeSkillsData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={getLeetCodeSkillsData()}>
                      <PolarGrid stroke="rgba(255,255,255,0.2)" />
                      <PolarAngleAxis dataKey="subject" stroke="#fff" />
                      <PolarRadiusAxis stroke="#fff" />
                      <Radar name="Problems Solved" dataKey="value" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
                      <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-light opacity-50">Solve problems to see tag performance</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'skills' && platform === 'hackerrank' && (
              <div className="glass-card p-4">
                <h5 className="text-light fw-bold mb-4">Verified Skills</h5>
                <div className="row g-3">
                  {getHackerRankSkillsData().map((skill, idx) => (
                    <div key={idx} className="col-md-4">
                      <div className="badge-card">
                        <h6 className="text-light fw-bold mb-2">{skill.name}</h6>
                        <span className={`skill-badge ${skill.level === 'Advanced' ? 'bg-success' : skill.level === 'Intermediate' ? 'bg-warning' : 'bg-info'}`}>
                          {skill.level}
                        </span>
                        {skill.score > 0 && (
                          <p className="text-light opacity-75 mt-2 mb-0">Score: {skill.score}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {getHackerRankSkillsData().length === 0 && (
                    <div className="col-12 text-center py-5">
                      <p className="text-light opacity-50">Take skill tests to verify your expertise</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MultiPlatforms;