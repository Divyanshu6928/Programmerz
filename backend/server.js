// backend/server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Fixed: Trim whitespace in origins
const corsOptions = {
  origin: [
    'https://www.programmerz.live',
    'https://programmerz.live',
    'http://localhost:5173',
    'http://localhost:3000'
  ].map(origin => origin.trim()),
  methods: ['GET'],
  credentials: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ======================
// ✅ NEW: AtCoder Proxy Endpoints
// ======================

// Proxy for AtCoder submissions
app.get('/api/atcoder/submissions/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const url = `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(username)}&from_second=0`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(404).json({ error: 'User not found' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('AtCoder submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Proxy for rating history
app.get('/api/atcoder/history/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const url = `https://kenkoooo.com/atcoder/proxy/users/${encodeURIComponent(username)}/history/json`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(404).json({ error: 'User history not found' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('AtCoder history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Proxy for static resources (safe, but included for completeness)
app.get('/api/atcoder/resources/:resource', async (req, res) => {
  const allowed = ['problem-models.json', 'merged-problems.json', 'contests.json', 'contest-problem.json', 'ac.json'];
  if (!allowed.includes(req.params.resource)) {
    return res.status(400).json({ error: 'Invalid resource' });
  }
  try {
    const url = `https://kenkoooo.com/atcoder/resources/${req.params.resource}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Resource fetch failed');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// ======================
// CodeChef Endpoints (FIXED WHITESPACE)
// ======================

app.get('/api/codechef/:username', async (req, res) => {
  try {
    const { username } = req.params;
    // ✅ Fixed: Removed extra spaces in URL
    const response = await fetch(`https://www.codechef.com/users/${username}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    if (!response.ok) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const rating = parseInt($('.rating-number').text().trim()) || 0;
    const stars = ($('.rating-star span').text().trim().match(/★/g) || []).length;
    const highestRating = parseInt($('.rating-header small').text().match(/\d+/)?.[0]) || rating;
    
    const ranks = [];
    $('.rating-ranks li').each((i, el) => {
      ranks.push($(el).text().trim());
    });
    
    const globalRank = ranks.find(r => r.includes('Global Rank'))?.match(/\d+/)?.[0] || 'N/A';
    const countryRank = ranks.find(r => r.includes('Country Rank'))?.match(/\d+/)?.[0] || 'N/A';
    
    const problemCounts = $('.problems-solved').text().match(/\d+/g) || [];
    
    res.json({
      success: true,
      username,
      currentRating: rating,
      highestRating,
      stars,
      globalRank,
      countryRank,
      fullysolvedCount: parseInt(problemCounts[0]) || 0,
      partiallysolvedCount: parseInt(problemCounts[1]) || 0
    });
  } catch (error) {
    console.error('CodeChef error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// ... (keep your other endpoints: /api/codechef/:username/rating-history, /api/gfg/:username, etc.)
// Make sure to fix whitespace in ALL URLs like:
// ❌ `https://www.codechef.com/users/  ${username}`
// ✅ `https://www.codechef.com/users/${username}`

// ======================
// LeetCode (FIXED WHITESPACE)
// ======================

app.get('/api/leetcode/:username', async (req, res) => {
  try {
    const { username } = req.params;
    // ✅ Fixed: Removed extra spaces
    const response = await fetch(`https://leetcode.com/${username}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    if (!response.ok) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const html = await response.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!match) {
      throw new Error('Could not parse profile data');
    }

    const pageData = JSON.parse(match[1]);
    const profile = pageData.props?.pageProps?.dehydratedState?.queries?.[0]?.state?.data?.matchedUser;
    if (!profile) {
      throw new Error('Profile data not found');
    }

    const acStats = profile.submitStatsGlobal?.acSubmissionNum || [];
    const problemsSolved = { easy: 0, medium: 0, hard: 0 };
    acStats.forEach(stat => {
      if (stat.difficulty === 'Easy') problemsSolved.easy = stat.count;
      if (stat.difficulty === 'Medium') problemsSolved.medium = stat.count;
      if (stat.difficulty === 'Hard') problemsSolved.hard = stat.count;
    });

    const totalSolved = problemsSolved.easy + problemsSolved.medium + problemsSolved.hard;
    res.json({
      success: true,
      username,
      ranking: profile.profile?.ranking || 0,
      reputation: profile.profile?.reputation || 0,
      totalSolved,
      problemsSolved,
      tagStats: [] // Add if needed
    });
  } catch (error) {
    console.error('LeetCode error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// ... (keep other endpoints)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`✅ API server running on port ${PORT}`);
  console.log(`🌍 Allowed origins: ${corsOptions.origin.join(', ')}`);
});

module.exports = app;