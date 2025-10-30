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

// Helper: last N days in seconds
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

// AtCoder rating color helper
const getAtCoderColor = (rating) => {
  if (rating >= 2800) return 'Red';
  if (rating >= 2400) return 'Orange';
  if (rating >= 2000) return 'Yellow';
  if (rating >= 1600) return 'Blue';
  if (rating >= 1200) return 'Cyan';
  if (rating >= 800) return 'Green';
  if (rating >= 400) return 'Brown';
  return 'Gray';
};

const MultiPlatforms = () => {
  const [platform, setPlatform] = useState('leetcode');
  const [handle, setHandle] = useState('');
  const [inputHandle, setInputHandle] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [contests, setContests] = useState([]);
  const [recommendedProblems, setRecommendedProblems] = useState([]);
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
    if (platform === 'leetcode') {
      fetchContests();
    }
  }, [platform]);

  const fetchContests = async () => {
    try {
      const resp = await fetch('https://kontests.net/api/v1/leetcode');
      if (!resp.ok) return;
      const data = await resp.json();
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
      console.warn('Could not fetch contests', err);
    }
  };

  const fetchUserData = async (userHandle) => {
    setLoading(true);
    setError(null);
    try {
      if (platform === 'leetcode') {
        const response = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${userHandle}`);
        if (!response.ok) {
          throw new Error('User not found. Please verify the username.');
        }
        const data = await response.json();
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
        createRecommendedProblems(transformedData.tagStats || []);
      } else if (platform === 'atcoder') {
          const now = Math.floor(Date.now() / 1000);
          const oneYearAgo = now - 365 * 24 * 3600;
          // ✅ All user data via YOUR backend proxy (CORS-safe)
          const BACKEND_URL = 'https://programmerz.onrender.com';

          const [submissionsResp, historyResp, problemModelsResp, mergedProblemsResp, contestsResp, contestProblemMapResp] = await Promise.all([
            fetch(`${BACKEND_URL}/api/atcoder/submissions/${userHandle}`),
            fetch(`${BACKEND_URL}/api/atcoder/history/${userHandle}`),
            fetch(`${BACKEND_URL}/api/atcoder/resources/problem-models.json`),
            fetch(`${BACKEND_URL}/api/atcoder/resources/merged-problems.json`),
            fetch(`${BACKEND_URL}/api/atcoder/resources/contests.json`),
            fetch(`${BACKEND_URL}/api/atcoder/resources/contest-problem.json`)
          ]);

        if (!submissionsResp.ok) {
          throw new Error('User not found. Please verify the username.');
        }

        const submissions = await submissionsResp.json();
        const history = historyResp.ok ? await historyResp.json() : [];
        const problemModels = problemModelsResp.ok ? await problemModelsResp.json() : {};
        const mergedProblems = mergedProblemsResp.ok ? await mergedProblemsResp.json() : [];
        const contestsMap = contestsResp.ok ? await contestsResp.json() : {};
        const contestProblemMap = contestProblemMapResp.ok ? await contestProblemMapResp.json() : {};

        // Build problem info map
        const problemInfoMap = {};
        mergedProblems.forEach(p => {
          if (p.id) problemInfoMap[p.id] = p;
        });

        const acceptedSubmissions = submissions.filter(s => s.result === 'AC');
        const uniqueProblems = [...new Set(acceptedSubmissions.map(s => s.problem_id))];

        // Rating history
        const ratingHistory = history
          .map(h => {
            // Safely parse RatedTime
            const ratedTime = h.RatedTime;
            let dateStr = null;

            if (ratedTime) {
              const date = new Date(ratedTime);
              if (!isNaN(date.getTime())) {
                dateStr = date.toISOString().split('T')[0];
              }
            }

            return {
              contest: h.ContestName,
              date: dateStr, // may be null, but won't crash
              rating: h.NewRating,
              performance: h.Performance
            };
          })
          .filter(h => h.rating != null && h.date != null); // only keep valid entries
        const latestRating = ratingHistory.length > 0 ? ratingHistory[ratingHistory.length - 1].rating : 0;
        const ratingColor = getAtCoderColor(latestRating);

        // Group problems
        const problemsByRating = {};
        const problemsByContest = {};
        const problemsByPoint = {};

        uniqueProblems.forEach(pid => {
          const model = problemModels[pid];
          const merged = problemInfoMap[pid];
          const difficulty = model?.difficulty || 0;
          const point = merged?.point || (difficulty > 0 ? Math.round(difficulty / 400) * 400 : 0);
          const bucket = Math.floor(difficulty / 400) * 400;

          problemsByRating[bucket] = (problemsByRating[bucket] || 0) + 1;
          problemsByPoint[point] = (problemsByPoint[point] || 0) + 1;

          const contestId = merged?.contest_id || (pid.split('_')[0] || 'unknown');
          const contest = contestsMap[contestId] || { title: contestId };
          const category = contest.title || contestId;
          problemsByContest[category] = (problemsByContest[category] || 0) + 1;
        });

        // Activity data
        const activityMap = {};
        submissions
          .filter(s => s.epoch_second >= oneYearAgo)
          .forEach(s => {
            const day = new Date(s.epoch_second * 1000).toISOString().split('T')[0];
            activityMap[day] = (activityMap[day] || 0) + 1;
          });

        const activityData = Object.entries(activityMap)
          .map(([date, count]) => ({ date, submissions: count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        const transformedData = {
          success: true,
          username: userHandle,
          totalSolved: uniqueProblems.length,
          totalSubmissions: submissions.length,
          acceptedSubmissions: acceptedSubmissions.length,
          rating: latestRating,
          ratingColor,
          ratingHistory,
          problemsByRating,
          problemsByContest,
          problemsByPoint,
          recentSubmissions: submissions.slice(0, 50),
          activityData,
          contestsMap,
          problemInfoMap
        };

        setUserInfo(transformedData);
        createAtCoderRecommendedProblems(transformedData);
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
    setPlatform(newPlatform);
    setActiveTab('overview');
  };

  // LeetCode helpers
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
    return sortedDates.slice(-30).map(timestamp => ({
      date: new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      submissions: calendar[timestamp]
    }));
  };

  const createRecommendedProblems = (tagStats = []) => {
  const topTags = (tagStats || []).slice(0, 5).map(t => t.name);
  const recs = [];

  // Define a mapping of common tags to actual LeetCode problem slugs
  const tagToProblems = {
    'Array': [
      { title: 'Two Sum', slug: 'two-sum' },
      { title: 'Best Time to Buy and Sell Stock', slug: 'best-time-to-buy-and-sell-stock' }
    ],
    'String': [
      { title: 'Valid Parentheses', slug: 'valid-parentheses' },
      { title: 'Longest Substring Without Repeating Characters', slug: 'longest-substring-without-repeating-characters' }
    ],
    'Hash Table': [
      { title: 'Contains Duplicate', slug: 'contains-duplicate' },
      { title: 'Group Anagrams', slug: 'group-anagrams' }
    ],
    'Dynamic Programming': [
      { title: 'Climbing Stairs', slug: 'climbing-stairs' },
      { title: 'House Robber', slug: 'house-robber' }
    ],
    'Tree': [
      { title: 'Binary Tree Inorder Traversal', slug: 'binary-tree-inorder-traversal' },
      { title: 'Maximum Depth of Binary Tree', slug: 'maximum-depth-of-binary-tree' }
    ],
    'Linked List': [
      { title: 'Merge Two Sorted Lists', slug: 'merge-two-sorted-lists' },
      { title: 'Reverse Linked List', slug: 'reverse-linked-list' }
    ],
    'Math': [
      { title: 'Palindrome Number', slug: 'palindrome-number' },
      { title: 'Plus One', slug: 'plus-one' }
    ],
    'Two Pointers': [
      { title: 'Remove Duplicates from Sorted Array', slug: 'remove-duplicates-from-sorted-array' },
      { title: 'Container With Most Water', slug: 'container-with-most-water' }
    ]
  };

  // Generate recommendations based on user's top tags
  topTags.forEach(tag => {
    const problems = tagToProblems[tag] || [];
    if (problems.length > 0) {
      // Add Easy & Medium from this tag
      recs.push(
        { 
          title: `${problems[0].title} (Easy)`, 
          url: `https://leetcode.com/problems/${problems[0].slug}/`
        },
        { 
          title: `${problems[1]?.title || problems[0].title} (Medium)`, 
          url: `https://leetcode.com/problems/${problems[1]?.slug || problems[0].slug}/`
        }
      );
    } else {
      // Fallback: link to tag page
      recs.push(
        { 
          title: `${tag} - Easy Practice`, 
          url: `https://leetcode.com/tag/${encodeURIComponent(tag)}/` 
        },
        { 
          title: `${tag} - Medium Practice`, 
          url: `https://leetcode.com/tag/${encodeURIComponent(tag)}/` 
        }
      );
    }
  });

  // If no tags, fall back to popular problems
  if (recs.length === 0) {
    recs.push(
      { id: 1, title: "Two Sum", slug: "two-sum", difficulty: "Easy" },
      { id: 2, title: "Add Two Numbers", slug: "add-two-numbers", difficulty: "Medium" },
      { id: 3, title: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters", difficulty: "Medium" },
      { id: 20, title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "Easy" },
      { id: 21, title: "Merge Two Sorted Lists", slug: "merge-two-sorted-lists", difficulty: "Easy" },
      { id: 53, title: "Maximum Subarray", slug: "maximum-subarray", difficulty: "Medium" },
      { id: 100, title: "Same Tree", slug: "same-tree", difficulty: "Easy" },
      { id: 104, title: "Maximum Depth of Binary Tree", slug: "maximum-depth-of-binary-tree", difficulty: "Easy" },
      { id: 121, title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "Easy" },
      { id: 125, title: "Valid Palindrome", slug: "valid-palindrome", difficulty: "Easy" },
      { id: 136, title: "Single Number", slug: "single-number", difficulty: "Easy" },
      { id: 141, title: "Linked List Cycle", slug: "linked-list-cycle", difficulty: "Easy" },
      { id: 200, title: "Number of Islands", slug: "number-of-islands", difficulty: "Medium" },
      { id: 206, title: "Reverse Linked List", slug: "reverse-linked-list", difficulty: "Easy" },
      { id: 217, title: "Contains Duplicate", slug: "contains-duplicate", difficulty: "Easy" },
      { id: 234, title: "Palindrome Linked List", slug: "palindrome-linked-list", difficulty: "Easy" },
      { id: 238, title: "Product of Array Except Self", slug: "product-of-array-except-self", difficulty: "Medium" },
      { id: 283, title: "Move Zeroes", slug: "move-zeroes", difficulty: "Easy" },
      { id: 287, title: "Find the Duplicate Number", slug: "find-the-duplicate-number", difficulty: "Medium" },
      { id: 347, title: "Top K Frequent Elements", slug: "top-k-frequent-elements", difficulty: "Medium" },
      { id: 509, title: "Fibonacci Number", slug: "fibonacci-number", difficulty: "Easy" },
      { id: 543, title: "Diameter of Binary Tree", slug: "diameter-of-binary-tree", difficulty: "Easy" },
      { id: 704, title: "Binary Search", slug: "binary-search", difficulty: "Easy" },
      { id: 977, title: "Squares of a Sorted Array", slug: "squares-of-a-sorted-array", difficulty: "Easy" },
      { id: 1480, title: "Running Sum of 1d Array", slug: "running-sum-of-1d-array", difficulty: "Easy" }
    );
  }

  setRecommendedProblems(recs.slice(0, 8));
}; 

  // AtCoder helpers
  const getAtCoderDifficultyData = () => {
    if (!userInfo?.problemsByRating) return [];
    return Object.entries(userInfo.problemsByRating)
      .map(([rating, count]) => ({
        name: `${-rating}+`,
        value: count,
        color: getColorByRating(parseInt(rating))
      }))
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));
  };

  const getColorByRating = (rating) => {
    if (rating >= 2800) return '#ff0000';
    if (rating >= 2400) return '#ff8000';
    if (rating >= 2000) return '#c0c000';
    if (rating >= 1600) return '#0000ff';
    if (rating >= 1200) return '#00c0c0';
    if (rating >= 800) return '#008000';
    if (rating >= 400) return '#804000';
    return '#808080';
  };

  const getAtCoderCategoryData = () => {
    if (!userInfo?.problemsByContest) return [];
    return Object.entries(userInfo.problemsByContest)
      .slice(0, 10)
      .map(([category, count]) => ({
        subject: category.toUpperCase(),
        value: count
      }));
  };

  const getAtCoderActivityData = () => {
    return userInfo?.activityData || [];
  };

  const createAtCoderRecommendedProblems = (data) => {
    const recs = [
      { title: 'AtCoder Beginner Contest', url: 'https://atcoder.jp/contests/archive?ratedType=1&category=0' },
      { title: 'AtCoder Regular Contest', url: 'https://atcoder.jp/contests/archive?ratedType=2&category=0' },
      { title: 'AtCoder Grand Contest', url: 'https://atcoder.jp/contests/archive?ratedType=3&category=0' },
      { title: 'Practice Problems', url: 'https://kenkoooo.com/atcoder/#/table/' },
      { title: 'Virtual Contest', url: 'https://kenkoooo.com/atcoder/#/contest/recent' },
      { title: 'Problem Recommendations', url: `https://kenkoooo.com/atcoder/#/user/${handle}` }
    ];
    setRecommendedProblems(recs);
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b', '#38f9d7', '#fa709a'];

  const renderHeatmap = () => {
    const last30 = getLastNDaysTimestamps(30);
    let calendar = {};
    if (platform === 'leetcode') {
      calendar = userInfo?.submissionCalendar || {};
    } else if (platform === 'atcoder') {
      if (userInfo?.recentSubmissions) {
        userInfo.recentSubmissions.forEach(sub => {
          const ts = sub.epoch_second;
          calendar[ts] = (calendar[ts] || 0) + 1;
        });
      }
    }
    const squares = last30.map(ts => {
      const keyA = String(ts);
      let count = calendar[keyA] || 0;
      if (platform === 'atcoder' && count === 0) {
        const dayStart = ts;
        const dayEnd = ts + 86400;
        count = Object.keys(calendar).filter(k => {
          const subTs = parseInt(k);
          return subTs >= dayStart && subTs < dayEnd;
        }).reduce((sum, k) => sum + calendar[k], 0);
      }
      return { ts, count, date: new Date(ts * 1000) };
    });
    const max = Math.max(...squares.map(s => s.count), 1);
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
          {squares.map((s, i) => {
            const intensity = Math.round((s.count / max) * 4);
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
                <button 
                  className="cyber-button btn-sm" 
                  onClick={() => window.open(
                    platform === 'leetcode' 
                      ? `https://leetcode.com/${handle}` 
                      : `https://atcoder.jp/users/${handle}`, 
                    '_blank'
                  )}
                >
                  View Profile
                </button>
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
            className={`platform-btn ${platform === 'atcoder' ? 'active' : ''}`}
            onClick={() => handlePlatformChange('atcoder')}
          >
            <i className="bi bi-trophy me-2"></i>
            AtCoder
          </button>
        </div>

        {!handle ? (
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="glass-card p-5 text-center">
                <h3 className="text-light mb-4">
                  Enter Your {platform === 'leetcode' ? 'LeetCode' : 'AtCoder'} Username
                </h3>
                <input
                  type="text"
                  className="glass-input w-100 mb-4"
                  placeholder={platform === 'atcoder' ? 'e.g., tourist' : 'e.g., john_doe'}
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
                    {platform === 'leetcode' ? 'LeetCode' : 'AtCoder'} Profile
                  </span>
                  {platform === 'leetcode' && userInfo.ranking && (
                    <div className="mt-3">
                      <span className="text-light opacity-75">
                        <i className="bi bi-trophy me-2"></i>Rank: #{userInfo.ranking.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {platform === 'atcoder' && (
                    <div className="mt-3">
                      <span className="text-light opacity-75">
                        <i className="bi bi-star me-2"></i>Rating: {userInfo.rating} ({userInfo.ratingColor})
                      </span>
                    </div>
                  )}
                  {platform === 'leetcode' && userInfo.contributionPoint > 0 && (
                    <div className="mt-2">
                      <span className="text-light opacity-75">
                        <i className="bi bi-star me-2"></i>Contribution: {userInfo.contributionPoint}
                      </span>
                    </div>
                  )}
                </div>
                <div className="col-md-4 text-end">
                  <h3 className="holographic-text fw-bold">{userInfo.totalSolved || 0}</h3>
                  <p className="text-light opacity-75">Problems Solved</p>
                  {platform === 'leetcode' && userInfo.reputation > 0 && (
                    <div className="mt-2">
                      <span className="text-light opacity-75">
                        Reputation: {userInfo.reputation.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {platform === 'atcoder' && (
                    <div className="mt-2">
                      <span className="text-light opacity-75">
                        Total Submissions: {userInfo.totalSubmissions?.toLocaleString() || 0}
                      </span>
                    </div>
                  )}
                  <button onClick={() => setHandle('')} className="cyber-button btn-sm mt-2">
                    Change Username
                  </button>
                </div>
              </div>
            </div>

            {/* AtCoder Enhanced Stats */}
            {platform === 'atcoder' && userInfo && (
              <div className="row g-4 mb-4">
                <div className="col-md-3">
                  <div className="glass-card p-4 text-center">
                    <i className="bi bi-star fs-2 holographic-text mb-2"></i>
                    <h3 className="holographic-text fw-bold">{userInfo.rating || 0}</h3>
                    <p className="text-light opacity-75 mb-1">Current Rating</p>
                    <small className="text-light opacity-50">{userInfo.ratingColor}</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="glass-card p-4 text-center">
                    <i className="bi bi-send fs-2 text-info mb-2"></i>
                    <h3 className="text-info fw-bold">{userInfo.totalSubmissions || 0}</h3>
                    <p className="text-light opacity-75 mb-1">Total Submissions</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="glass-card p-4 text-center">
                    <i className="bi bi-check2-circle fs-2 text-success mb-2"></i>
                    <h3 className="text-success fw-bold">{userInfo.acceptedSubmissions || 0}</h3>
                    <p className="text-light opacity-75 mb-1">Accepted Submissions</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="glass-card p-4 text-center">
                    <i className="bi bi-check-circle fs-2 holographic-text mb-2"></i>
                    <h3 className="holographic-text fw-bold">{userInfo.totalSolved || 0}</h3>
                    <p className="text-light opacity-75 mb-1">Problems Solved</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="glass-card p-3 mb-4">
              <div className="d-flex gap-2 flex-wrap">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                  <i className="bi bi-bar-chart me-2"></i>Overview
                </button>
                <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                  <i className="bi bi-graph-up me-2"></i>Analytics
                </button>
                {/* <button className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>
                  <i className="bi bi-lightbulb me-2"></i>Skills
                </button> */}
                <button className={`tab-btn ${activeTab === 'problems' ? 'active' : ''}`} onClick={() => setActiveTab('problems')}>
                  <i className="bi bi-list-stars me-2"></i>
                  {platform === 'leetcode' ? 'Problems & Contests' : 'Resources'}
                </button>
              </div>
            </div>

            {/* LeetCode Overview */}
            {activeTab === 'overview' && platform === 'leetcode' && (
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
                            <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
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
                            <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
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

            {/* AtCoder Overview */}
            {activeTab === 'overview' && platform === 'atcoder' && (
              <>
                {/* Rating History */}
                <div className="glass-card p-4 mb-4">
                  <h5 className="text-light fw-bold mb-4">Rating History</h5>
                  {userInfo.ratingHistory && userInfo.ratingHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={userInfo.ratingHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="#fff" angle={-45} textAnchor="end" height={80} fontSize={11} />
                        <YAxis stroke="#fff" />
                        <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="rating" stroke="#667eea" name="Rating" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="performance" stroke="#f093fb" name="Performance" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-light opacity-50">No rating history available.</p>
                  )}
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="glass-card p-4">
                      <h5 className="text-light fw-bold mb-4">Problems by Difficulty Rating</h5>
                      {getAtCoderDifficultyData().length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={getAtCoderDifficultyData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="#fff" />
                            <YAxis stroke="#fff" />
                            <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                            <Bar dataKey="value" name="Problems Solved">
                              {getAtCoderDifficultyData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5">
                          <p className="text-light opacity-50">Start solving problems to see difficulty distribution</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="glass-card p-4">
                      <h5 className="text-light fw-bold mb-4">Problems by Point Value</h5>
                      {Object.keys(userInfo.problemsByPoint || {}).length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={Object.entries(userInfo.problemsByPoint).map(([point, count]) => ({ point, count }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="point" stroke="#fff" />
                            <YAxis stroke="#fff" />
                            <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                            <Bar dataKey="count" fill="#4facfe" name="Solved" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-light opacity-50">No point data available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="glass-card p-4">
                <h5 className="text-light fw-bold mb-4">
                  Submission Activity (Last 30 Days)
                </h5>
                {platform === 'leetcode' ? (
                  getLeetCodeSubmissionCalendar().length > 0 ? (
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
                          <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                          <Area type="monotone" dataKey="submissions" stroke="#667eea" fillOpacity={1} fill="url(#colorSubmissions)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </>
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-light opacity-50">No submission activity data available</p>
                    </div>
                  )
                ) : (
                  getAtCoderActivityData().length > 0 ? (
                    <>
                      <div className="mb-3">{renderHeatmap()}</div>
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={getAtCoderActivityData()}>
                          <defs>
                            <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" stroke="#fff" angle={-45} textAnchor="end" height={80} fontSize={11} />
                          <YAxis stroke="#fff" />
                          <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                          <Area type="monotone" dataKey="submissions" stroke="#667eea" fillOpacity={1} fill="url(#colorActivity)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </>
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-light opacity-50">No activity data available</p>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Skills Tab */}
            {/* {activeTab === 'skills' && (
              <div className="glass-card p-4">
                <h5 className="text-light fw-bold mb-4">
                  {platform === 'leetcode' ? 'Top Tags / Skills' : 'Contest Categories'}
                </h5>
                {platform === 'leetcode' ? (
                  getLeetCodeSkillsData().length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={360}>
                        <RadarChart data={getLeetCodeSkillsData()} cx="50%" cy="50%" outerRadius="80">
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" stroke="#fff" />
                          <PolarRadiusAxis />
                          <Radar name="Problems" dataKey="value" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
                          <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                      <div className="mt-3">
                        {getLeetCodeSkillsData().map((t, i) => (
                          <span key={i} className="skill-badge">{t.subject} — {t.value}</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-light opacity-50">No tag data available. Solve problems to populate tags.</p>
                    </div>
                  )
                ) : (
                  getAtCoderCategoryData().length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={360}>
                        <RadarChart data={getAtCoderCategoryData()} cx="50%" cy="50%" outerRadius="80">
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" stroke="#fff" />
                          <PolarRadiusAxis />
                          <Radar name="Problems" dataKey="value" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
                          <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '10px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                      <div className="mt-3">
                        {getAtCoderCategoryData().map((t, i) => (
                          <span key={i} className="skill-badge">{t.subject} — {t.value}</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-light opacity-50">No category data available.</p>
                    </div>
                  )
                )}
              </div>
            )} */}

            {/* Problems & Resources Tab */}
            {activeTab === 'problems' && (
              <div className="glass-card p-4">
                {platform === 'leetcode' && (
                  <>
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
                  </>
                )}
                <h5 className="text-light fw-bold mb-3">
                  {platform === 'leetcode' ? 'Top Leetcode Problems' : 'AtCoder Resources'}
                </h5>
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
                <div className="mt-3 text-light opacity-75 small">
                  {platform === 'leetcode'
                    ? 'Happy Learning.......'
                    : 'Explore AtCoder contests and practice problems using the resources above.'
                  }
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