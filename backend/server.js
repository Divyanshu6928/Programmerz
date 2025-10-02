// backend/server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for production
const corsOptions = {
  origin: ['https://www.programmerz.live', 'https://programmerz.live'],
  methods: ['GET'],
  credentials: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
        timeout: 10000 // 10 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`CodeChef API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Cache headers
    res.set({
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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

// Codeforces problems endpoint (for future use)
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
});

module.exports = app;