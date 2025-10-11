// backend/server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { getCodeChefData } = require('proxor');
const rateLimit = require('express-rate-limit');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for production
const corsOptions = {
  origin: ['https://www.programmerz.live', 'https://programmerz.live', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET'],
  credentials: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CodeChef Profile endpoint
app.get('/api/codechef/:username', async (req, res) => {
  try {
    const data = await getCodeChefData(req.params.username);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// app.get('/api/codechef/:username', async (req, res) => {
//   try {
//     const { username } = req.params;
//     console.log(`Fetching CodeChef profile for: ${username}`);
    
//     const response = await fetch(`https://www.codechef.com/users/${username}`, {
//       method: 'GET',
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
//         'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
//       },
//       timeout: 10000
//     });

//     if (!response.ok) {
//       return res.status(404).json({ 
//         success: false, 
//         error: 'User not found' 
//       });
//     }

//     const html = await response.text();
//     const $ = cheerio.load(html);
    
//     const ratingText = $('.rating-number').text().trim();
//     const rating = parseInt(ratingText) || 0;
    
//     const starsText = $('.rating-star span').text().trim();
//     const stars = (starsText.match(/★/g) || []).length;
    
//     const highestText = $('.rating-header small').text();
//     const highestRating = parseInt(highestText.match(/\d+/)?.[0]) || rating;
    
//     const ranks = [];
//     $('.rating-ranks li').each((i, el) => {
//       ranks.push($(el).text().trim());
//     });
    
//     const globalRankText = ranks.find(r => r.includes('Global Rank')) || '';
//     const countryRankText = ranks.find(r => r.includes('Country Rank')) || '';
    
//     const globalRank = globalRankText.match(/\d+/)?.[0] || 'N/A';
//     const countryRank = countryRankText.match(/\d+/)?.[0] || 'N/A';
    
//     const problemsText = $('.problems-solved').text();
//     const problemCounts = problemsText.match(/\d+/g) || [];
    
//     const userData = {
//       success: true,
//       username: username,
//       currentRating: rating,
//       highestRating: highestRating,
//       stars: stars,
//       globalRank: globalRank,
//       countryRank: countryRank,
//       fullysolvedCount: parseInt(problemCounts[0]) || 0,
//       partiallysolvedCount: parseInt(problemCounts[1]) || 0
//     };
    
//     res.set({
//       'Cache-Control': 'public, max-age=300',
//       'Content-Type': 'application/json'
//     });
    
//     res.json(userData);
//     console.log(`Successfully fetched profile for ${username}`);
    
//   } catch (error) {
//     console.error('Error fetching CodeChef profile:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch user profile',
//       message: error.message
//     });
//   }
// });

// CodeChef ratings endpoint
app.get('/api/codechef/:username/rating-history', async (req, res) => {
  const { username } = req.params;
  
  try {
    const axios = require('axios');
    const cheerio = require('cheerio');
    
    // Fetch user's CodeChef profile page
    const url = `https://www.codechef.com/users/${username}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    if (response.status !== 200) {
      return res.status(404).json({
        success: false,
        message: 'User not found or CodeChef is unreachable'
      });
    }
    
    const $ = cheerio.load(response.data);
    let ratingData = [];
    
    // Extract rating data from script tags
    $('script').each((i, script) => {
      const scriptContent = $(script).html();
      if (scriptContent && scriptContent.includes('all_rating')) {
        // Extract the all_rating array using regex
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
            console.error('Failed to parse rating data:', e);
          }
        }
      }
    });
    
    return res.json({
      success: true,
      ratingHistory: ratingData,
      count: ratingData.length
    });
    
  } catch (error) {
    console.error('Error fetching rating history:', error.message);
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return res.status(408).json({
        success: false,
        message: 'Request timeout. Please try again.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

// CodeChef Contests endpoint
app.get('/api/codechef-contests', async (req, res) => {
  try {
    console.log('Fetching CodeChef contests...');
    
    const response = await fetch('https://www.codechef.com/api/list/contests/all', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`CodeChef API returned ${response.status}`);
    }

    const data = await response.json();
    
    res.set({
      'Cache-Control': 'public, max-age=600',
      'Content-Type': 'application/json'
    });
    
    res.json(data);
    console.log('Successfully fetched contests');
    
  } catch (error) {
    console.error('Error fetching contests:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch contests',
      message: error.message
    });
  }
});

// Enhanced CodeChef Profile with Historical Data
app.get('/api/codechef/:username/detailed', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Fetching detailed CodeChef data for: ${username}`);
    
    const profileResponse = await fetch(`https://www.codechef.com/users/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!profileResponse.ok) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const html = await profileResponse.text();
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
    
    const scriptTags = $('script').toArray();
    let ratingHistory = [];
    
    for (let script of scriptTags) {
      const scriptContent = $(script).html();
      if (scriptContent && scriptContent.includes('rating_data')) {
        const ratingMatch = scriptContent.match(/var\s+rating_data\s*=\s*(\[.*?\]);/s);
        if (ratingMatch) {
          try {
            ratingHistory = JSON.parse(ratingMatch[1]);
          } catch (e) {
            console.log('Failed to parse rating data');
          }
        }
      }
    }
    
    const userData = {
      success: true,
      username: username,
      currentRating: rating,
      highestRating: highestRating,
      stars: stars,
      globalRank: globalRank,
      countryRank: countryRank,
      fullysolvedCount: parseInt(problemCounts[0]) || 0,
      partiallysolvedCount: parseInt(problemCounts[1]) || 0,
      ratingHistory: ratingHistory
    };
    
    res.set({
      'Cache-Control': 'public, max-age=300',
      'Content-Type': 'application/json'
    });
    
    res.json(userData);
    console.log(`Successfully fetched detailed profile for ${username}`);
    
  } catch (error) {
    console.error('Error fetching detailed profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch detailed profile',
      message: error.message
    });
  }
});

// LeetCode Profile endpoint (SINGLE UNIFIED VERSION)
app.get('/api/leetcode/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Fetching LeetCode profile for: ${username}`);
    
    const response = await fetch(`https://leetcode.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
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
    const problemsSolved = {
      easy: 0,
      medium: 0,
      hard: 0
    };

    acStats.forEach(stat => {
      if (stat.difficulty === 'Easy') problemsSolved.easy = stat.count;
      if (stat.difficulty === 'Medium') problemsSolved.medium = stat.count;
      if (stat.difficulty === 'Hard') problemsSolved.hard = stat.count;
    });

    const totalSolved = problemsSolved.easy + problemsSolved.medium + problemsSolved.hard;

    // Extract tag stats
    const tagStats = [];
    if (profile.tagProblemCounts) {
      const allTags = [
        ...(profile.tagProblemCounts.advanced || []),
        ...(profile.tagProblemCounts.intermediate || []),
        ...(profile.tagProblemCounts.fundamental || [])
      ];
      
      const tagMap = {};
      allTags.forEach(tag => {
        if (tagMap[tag.tagName]) {
          tagMap[tag.tagName] += tag.problemsSolved;
        } else {
          tagMap[tag.tagName] = tag.problemsSolved;
        }
      });
      
      Object.entries(tagMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([name, count]) => {
          tagStats.push({ subject: name, value: count });
        });
    }

    // Extract contest history
    const contestHistory = (profile.userContestRankingHistory || []).map(contest => ({
      rating: Math.round(contest.rating),
      ranking: contest.ranking,
      timestamp: contest.contest.startTime,
      date: new Date(contest.contest.startTime * 1000).toLocaleDateString()
    }));

    const userData = {
      success: true,
      username: username,
      ranking: profile.profile?.ranking || 0,
      reputation: profile.profile?.reputation || 0,
      totalSolved: totalSolved,
      problemsSolved: problemsSolved,
      contestRating: profile.userContestRanking?.rating || 0,
      contestsAttended: profile.userContestRanking?.attendedContestsCount || 0,
      tagStats: tagStats,
      contestHistory: contestHistory
    };

    res.set({
      'Cache-Control': 'public, max-age=300',
      'Content-Type': 'application/json'
    });

    res.json(userData);
    console.log(`Successfully fetched LeetCode profile for ${username}`);

  } catch (error) {
    console.error('Error fetching LeetCode profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// HackerRank Profile endpoint
app.get('/api/hackerrank/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Fetching HackerRank profile for: ${username}`);
    
    const response = await fetch(`https://www.hackerrank.com/rest/hackers/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error('User not found');
    }

    const data = await response.json();
    
    if (!data.model) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = data.model;

    const skills = (user.skills || []).map(skill => ({
      name: skill.name,
      level: skill.level || 'Beginner',
      score: skill.score || 0
    }));

    const badges = (user.badges || []).map(badge => ({
      name: badge.name,
      level: badge.level || 'Bronze',
      category: badge.category
    }));

    const challengesSolved = {};
    if (user.solved_challenges) {
      user.solved_challenges.forEach(challenge => {
        const category = challenge.category || 'General';
        challengesSolved[category] = (challengesSolved[category] || 0) + 1;
      });
    }

    const userData = {
      success: true,
      username: username,
      level: user.level || 0,
      skills: skills,
      badges: badges,
      totalChallenges: user.solved_challenges?.length || 0,
      challengesSolved: challengesSolved,
      country: user.country,
      school: user.school
    };

    res.set({
      'Cache-Control': 'public, max-age=300',
      'Content-Type': 'application/json'
    });

    res.json(userData);
    console.log(`Successfully fetched HackerRank profile for ${username}`);

  } catch (error) {
    console.error('Error fetching HackerRank profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// ICPC Problems endpoint
app.get('/api/icpc-problems', async (req, res) => {
  try {
    console.log('Fetching ICPC problems from CodeChef...');
    
    const response = await fetch(
      'https://www.codechef.com/api/practice/syllabus/icpc?roadmapSlug',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Programmerz/1.0'
        },
        timeout: 10000
      }
    );

    if (!response.ok) {
      throw new Error(`CodeChef API returned ${response.status}`);
    }

    const data = await response.json();
    
    res.set({
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json'
    });
    
    res.json(data);
    console.log('Successfully fetched ICPC problems');
    
  } catch (error) {
    console.error('Error fetching ICPC problems:', error);
    res.status(500).json({
      error: 'Failed to fetch ICPC problems',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Codeforces problems endpoint
app.get('/api/codeforces-problems', async (req, res) => {
  try {
    const response = await fetch(
      'https://codeforces.com/api/problemset.problems',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    if (!response.ok) {
      throw new Error(`Codeforces API returned ${response.status}`);
    }

    const data = await response.json();
    
    res.set({
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json'
    });
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching Codeforces problems:', error);
    res.status(500).json({
      error: 'Failed to fetch Codeforces problems',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
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