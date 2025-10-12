// backend/server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { getCodeChefData } = require('proxor'); // Ensure this package works as expected
const rateLimit = require('express-rate-limit');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Fixed: Remove trailing spaces in CORS origins
const corsOptions = {
  origin: [
    'https://www.programmerz.live',
    'https://programmerz.live',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET'],
  credentials: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting
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

// CodeChef Profile (using proxor)
app.get('/api/codechef/:username', async (req, res) => {
  try {
    const data = await getCodeChefData(req.params.username);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CodeChef rating history
app.get('/api/codechef/:username/rating-history', async (req, res) => {
  const { username } = req.params;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `https://www.codechef.com/users/${username}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    let ratingData = [];

    $('script').each((i, script) => {
      const scriptContent = $(script).html();
      if (scriptContent && scriptContent.includes('all_rating')) {
        const match = scriptContent.match(/all_rating\s*=\s*(\[.*?\]);/s);
        if (match) {
          try {
            const ratingArray = JSON.parse(match[1]);
            ratingData = ratingArray.map(contest => ({
              code: contest.code || '',
              name: contest.name || '',
              rating: contest.rating || 0,
              rank: contest.rank || 0,
              end_date: contest.end_date || '',
              ratingChange: (contest.rating || 0) - (contest.old_rating || 0),
              old_rating: contest.old_rating || 0
            }));
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }
    });

    clearTimeout(timeoutId);
    res.json({ success: true, ratingHistory: ratingData, count: ratingData.length });

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return res.status(408).json({ success: false, message: 'Request timeout' });
    }
    console.error('Rating history error:', error.message);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
});

// ❌ Removed GFG endpoint (or define getGFGData)
// If you don't have getGFGData, comment this out or implement it.
/*
app.get('/api/gfg/:username', async (req, res) => {
  res.status(501).json({ success: false, error: 'GFG endpoint not implemented' });
});
*/

// CodeChef contests
app.get('/api/codechef-contests', async (req, res) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('https://www.codechef.com/api/list/contests/all', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`CodeChef API returned ${response.status}`);

    const data = await response.json();
    clearTimeout(timeoutId);
    res.set({ 'Cache-Control': 'public, max-age=600' });
    res.json(data);

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Contests error:', error);
    res.status(500).json({ status: 'error', error: 'Failed to fetch contests', message: error.message });
  }
});

// Detailed CodeChef profile
app.get('/api/codechef/:username/detailed', async (req, res) => {
  const { username } = req.params;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`https://www.codechef.com/users/${username}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: controller.signal
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

    const globalRank = ranks.find(r => r.includes('Global'))?.match(/\d+/)?.[0] || 'N/A';
    const countryRank = ranks.find(r => r.includes('Country'))?.match(/\d+/)?.[0] || 'N/A';

    const problemCounts = $('.problems-solved').text().match(/\d+/g) || [];

    let ratingHistory = [];
    $('script').each((i, script) => {
      const content = $(script).html();
      if (content && content.includes('rating_data')) {
        const match = content.match(/var\s+rating_data\s*=\s*(\[.*?\]);/s);
        if (match) {
          try {
            ratingHistory = JSON.parse(match[1]);
          } catch (e) {
            console.log('Rating data parse failed');
          }
        }
      }
    });

    clearTimeout(timeoutId);
    res.set({ 'Cache-Control': 'public, max-age=300' });
    res.json({
      success: true,
      username,
      currentRating: rating,
      highestRating,
      stars,
      globalRank,
      countryRank,
      fullysolvedCount: parseInt(problemCounts[0]) || 0,
      partiallysolvedCount: parseInt(problemCounts[1]) || 0,
      ratingHistory
    });

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Detailed profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch detailed profile', message: error.message });
  }
});

// LeetCode profile
app.get('/api/leetcode/:username', async (req, res) => {
  const { username } = req.params;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`https://leetcode.com/${username}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: controller.signal
    });

    if (!response.ok) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const html = await response.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    if (!match) throw new Error('Profile data not found');

    const pageData = JSON.parse(match[1]);
    const profile = pageData.props?.pageProps?.dehydratedState?.queries?.[0]?.state?.data?.matchedUser;
    if (!profile) throw new Error('Profile not found');

    const acStats = profile.submitStatsGlobal?.acSubmissionNum || [];
    const problemsSolved = { easy: 0, medium: 0, hard: 0 };
    acStats.forEach(stat => {
      if (stat.difficulty === 'Easy') problemsSolved.easy = stat.count;
      if (stat.difficulty === 'Medium') problemsSolved.medium = stat.count;
      if (stat.difficulty === 'Hard') problemsSolved.hard = stat.count;
    });

    const totalSolved = problemsSolved.easy + problemsSolved.medium + problemsSolved.hard;

    const tagStats = [];
    if (profile.tagProblemCounts) {
      const allTags = [
        ...(profile.tagProblemCounts.advanced || []),
        ...(profile.tagProblemCounts.intermediate || []),
        ...(profile.tagProblemCounts.fundamental || [])
      ];
      const tagMap = {};
      allTags.forEach(tag => {
        tagMap[tag.tagName] = (tagMap[tag.tagName] || 0) + tag.problemsSolved;
      });
      Object.entries(tagMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([name, count]) => tagStats.push({ subject: name, value: count }));
    }

    const contestHistory = (profile.userContestRankingHistory || []).map(contest => ({
      rating: Math.round(contest.rating),
      ranking: contest.ranking,
      timestamp: contest.contest.startTime,
      date: new Date(contest.contest.startTime * 1000).toLocaleDateString()
    }));

    clearTimeout(timeoutId);
    res.set({ 'Cache-Control': 'public, max-age=300' });
    res.json({
      success: true,
      username,
      ranking: profile.profile?.ranking || 0,
      reputation: profile.profile?.reputation || 0,
      totalSolved,
      problemsSolved,
      contestRating: profile.userContestRanking?.rating || 0,
      contestsAttended: profile.userContestRanking?.attendedContestsCount || 0,
      tagStats,
      contestHistory
    });

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('LeetCode error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile', message: error.message });
  }
});

// HackerRank profile
app.get('/api/hackerrank/:username', async (req, res) => {
  const { username } = req.params;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`https://www.hackerrank.com/rest/hackers/${username}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal
    });

    if (!response.ok) throw new Error('User not found');

    const data = await response.json();
    if (!data.model) return res.status(404).json({ success: false, error: 'User not found' });

    const user = data.model;
    const skills = (user.skills || []).map(s => ({ name: s.name, level: s.level || 'Beginner', score: s.score || 0 }));
    const badges = (user.badges || []).map(b => ({ name: b.name, level: b.level || 'Bronze', category: b.category }));

    const challengesSolved = {};
    (user.solved_challenges || []).forEach(ch => {
      const cat = ch.category || 'General';
      challengesSolved[cat] = (challengesSolved[cat] || 0) + 1;
    });

    clearTimeout(timeoutId);
    res.set({ 'Cache-Control': 'public, max-age=300' });
    res.json({
      success: true,
      username,
      level: user.level || 0,
      skills,
      badges,
      totalChallenges: user.solved_challenges?.length || 0,
      challengesSolved,
      country: user.country,
      school: user.school
    });

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('HackerRank error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile', message: error.message });
  }
});

// ICPC Problems
app.get('/api/icpc-problems', async (req, res) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('https://www.codechef.com/api/practice/syllabus/icpc?roadmapSlug', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Programmerz/1.0'
      },
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`CodeChef API returned ${response.status}`);

    const data = await response.json();
    clearTimeout(timeoutId);
    res.set({ 'Cache-Control': 'public, max-age=3600' });
    res.json(data);

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('ICPC problems error:', error);
    res.status(500).json({ error: 'Failed to fetch ICPC problems', message: error.message });
  }
});

// Codeforces problems
app.get('/api/codeforces-problems', async (req, res) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('https://codeforces.com/api/problemset.problems', {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`Codeforces API returned ${response.status}`);

    const data = await response.json();
    clearTimeout(timeoutId);
    res.set({ 'Cache-Control': 'public, max-age=3600' });
    res.json(data);

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Codeforces problems error:', error);
    res.status(500).json({ error: 'Failed to fetch Codeforces problems', message: error.message });
  }
});

// AtCoder endpoints
app.get('/api/atcoder/submissions/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const url = `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(username)}&from_second=0`;
    const response = await fetch(url);
    if (!response.ok) return res.status(404).json({ error: 'User not found' });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('AtCoder submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

app.get('/api/atcoder/history/:username', async (req, res) => {
  const { username } = req.params;
  try {
    // ✅ Fixed URL: removed spaces
    const url = `https://kenkoooo.com/atcoder/proxy/users/${encodeURIComponent(username)}/history/json`;
    const response = await fetch(url);
    if (!response.ok) return res.status(404).json({ error: 'User history not found' });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('AtCoder history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.get('/api/atcoder/resources/:resource', async (req, res) => {
  const allowed = ['problem-models.json', 'merged-problems.json', 'contests.json', 'contest-problem.json', 'ac.json'];
  if (!allowed.includes(req.params.resource)) {
    return res.status(400).json({ error: 'Invalid resource' });
  }
  try {
    // ✅ Fixed URL
    const url = `https://kenkoooo.com/atcoder/resources/${req.params.resource}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Resource fetch failed');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(await response.json());
  } catch (error) {
    console.error('AtCoder resource error:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// 404 & error handlers
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Allowed origins: ${corsOptions.origin.join(', ')}`);
});

module.exports = app;