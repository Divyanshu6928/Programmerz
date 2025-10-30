// backend/server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { getCodeChefData } = require('proxor');
const rateLimit = require('express-rate-limit');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ FIXED: Remove trailing spaces in CORS origins
const corsOptions = {
  origin: [
    'https://www.programmerz.live',
    'https://programmerz.live',
    'http://localhost:5173',
    'http://localhost:3000'
  ].map(origin => origin.trim()), // defensive trim
  methods: ['GET'],
  credentials: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ======================
// CodeChef Endpoints
// ======================

app.get('/api/codechef/:username', async (req, res) => {
  try {
    const data = await getCodeChefData(req.params.username);
    res.json(data);
  } catch (error) {
    console.error('CodeChef error:', error.message);
    res.status(500).json({ error: 'Failed to fetch CodeChef data' });
  }
});

app.get('/api/codechef/:username/rating-history', async (req, res) => {
  const { username } = req.params;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // ✅ FIXED: No extra spaces in URL
    const url = `https://www.codechef.com/users/${encodeURIComponent(username)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProgrammerzBot/1.0)' },
      signal: controller.signal
    });

    if (!response.ok) {
      return res.status(404).json({ success: false, message: 'User not found' });
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
            console.error('Rating parse error:', e.message);
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
    console.error('CodeChef rating history error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/codechef-contests', async (req, res) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // ✅ FIXED: No trailing spaces
    const response = await fetch('https://www.codechef.com/api/list/contests/all', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProgrammerzBot/1.0)',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    clearTimeout(timeoutId);
    res.set('Cache-Control', 'public, max-age=600');
    res.json(data);

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('CodeChef contests error:', error.message);
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
});

app.get('/api/codechef/:username/detailed', async (req, res) => {
  const { username } = req.params;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // ✅ FIXED: Clean URL
    const response = await fetch(`https://www.codechef.com/users/${encodeURIComponent(username)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProgrammerzBot/1.0)' },
      signal: controller.signal
    });

    if (!response.ok) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const rating = parseInt($('.rating-number').text().trim()) || 0;
    const stars = ($('.rating-star span').text().trim().match(/★/g) || []).length;
    const highestMatch = $('.rating-header small').text().match(/\d+/);
    const highestRating = highestMatch ? parseInt(highestMatch[0]) : rating;

    const ranks = [];
    $('.rating-ranks li').each((i, el) => {
      ranks.push($(el).text().trim());
    });

    const globalRank = ranks.find(r => r.includes('Global'))?.match(/\d+/)?.[0] || 'N/A';
    const countryRank = ranks.find(r => r.includes('Country'))?.match(/\d+/)?.[0] || 'N/A';

    const problemCounts = $('.problems-solved').text().match(/\d+/g) || [];

    clearTimeout(timeoutId);
    res.set('Cache-Control', 'public, max-age=300');
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
    clearTimeout(timeoutId);
    console.error('CodeChef detailed error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// ======================
// LeetCode Endpoint
// ======================

app.get('/api/leetcode/:username', async (req, res) => {
  const { username } = req.params;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // ✅ FIXED: Clean URL
    const response = await fetch(`https://leetcode.com/${encodeURIComponent(username)}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProgrammerzBot/1.0)' },
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

    clearTimeout(timeoutId);
    res.set('Cache-Control', 'public, max-age=300');
    res.json({
      success: true,
      username,
      ranking: profile.profile?.ranking || 0,
      reputation: profile.profile?.reputation || 0,
      totalSolved,
      problemsSolved,
      contestRating: profile.userContestRanking?.rating || 0,
      contestsAttended: profile.userContestRanking?.attendedContestsCount || 0,
      tagStats
    });

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('LeetCode error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// ======================
// HackerRank Endpoint
// ======================

app.get('/api/hackerrank/:username', async (req, res) => {
  const { username } = req.params;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // ✅ FIXED: Clean URL
    const response = await fetch(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProgrammerzBot/1.0)' },
      signal: controller.signal
    });

    if (!response.ok) throw new Error('User not found');

    const data = await response.json();
    if (!data.model) return res.status(404).json({ success: false, error: 'User not found' });

    const user = data.model;
    clearTimeout(timeoutId);
    res.set('Cache-Control', 'public, max-age=300');
    res.json({
      success: true,
      username,
      level: user.level || 0,
      skills: (user.skills || []).map(s => ({ name: s.name, level: s.level || 'Beginner', score: s.score || 0 })),
      badges: (user.badges || []).map(b => ({ name: b.name, level: b.level || 'Bronze', category: b.category })),
      totalChallenges: user.solved_challenges?.length || 0,
      country: user.country,
      school: user.school
    });

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('HackerRank error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// ======================
// Problem Set Endpoints
// ======================

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

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    clearTimeout(timeoutId);
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(data);

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('ICPC problems error:', error.message);
    res.status(500).json({ error: 'Failed to fetch ICPC problems' });
  }
});

app.get('/api/codeforces-problems', async (req, res) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // ✅ FIXED: Clean URL
    const response = await fetch('https://codeforces.com/api/problemset.problems', {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    clearTimeout(timeoutId);
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(data);

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Codeforces problems error:', error.message);
    res.status(500).json({ error: 'Failed to fetch Codeforces problems' });
  }
});

// ======================
// AtCoder Endpoints — ✅ CRITICAL FIXES BELOW
// ======================

app.get('/api/atcoder/submissions/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const url = `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(username)}&from_second=0`;
    const response = await fetch(url);
    if (!response.ok) return res.status(404).json({ error: 'User not found' });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('AtCoder submissions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

app.get('/api/atcoder/history/:username', async (req, res) => {
  const { username } = req.params;
  try {
    // ✅ FIXED: Removed ALL spaces
    const url = `https://kenkoooo.com/atcoder/proxy/users/${encodeURIComponent(username)}/history/json`;
    const response = await fetch(url);
    if (!response.ok) return res.status(404).json({ error: 'User history not found' });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('AtCoder history error:', error.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.get('/api/atcoder/resources/:resource', async (req, res) => {
  const allowed = ['problem-models.json', 'merged-problems.json', 'contests.json', 'contest-problem.json', 'ac.json'];
  const resource = req.params.resource;
  if (!allowed.includes(resource)) {
    return res.status(400).json({ error: 'Invalid resource' });
  }
  try {
    // ✅ FIXED: Removed spaces
    const url = `https://kenkoooo.com/atcoder/resources/${resource}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Resource fetch failed');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(await response.json());
  } catch (error) {
    console.error('AtCoder resource error:', error.message);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// ======================
// Final Middleware
// ======================

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`✅ API server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Allowed origins: ${corsOptions.origin.join(', ')}`);
});

module.exports = app;