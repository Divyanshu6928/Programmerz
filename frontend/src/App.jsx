import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import ProblemsPage from './pages/Problem';
import ICPC from './pages/ICPC';

const App = () => {
  return (
    <Router>
      <div>
        {/* Navbar appears on every page */}
        <Navbar />
        
        <Routes>
          {/* Landing Page Route */}
          <Route path="/" element={<LandingPage />} />
          
          {/* ICPC Problems Page Route */}
          <Route path="/icpc" element={<ICPC />} />
          
          {/* Future Routes - Add these as you create more pages */}
          <Route path="/codeforces" element={<div>Codeforces Page Coming Soon</div>} />
          <Route path="/codechef" element={<div>Codechef Page Coming Soon</div>} />
          <Route path="/multi-platforms" element={<div>Multi-platforms Page Coming Soon</div>} />
          <Route path="/problems" element={<ProblemsPage /> } />
          // <Route path="/profile" element={<div>Profile Page Coming Soon</div>} />
          
          {/* 404 Route - Catch all unmatched routes */}
          <Route path="*" element={
            <div style={{
              minHeight: '100vh',
              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              textAlign: 'center',
              fontFamily: "'Poppins', sans-serif",
              paddingTop: '80px'
            }}>
              <div>
                <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
                <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Page Not Found</p>
                <a href="/" style={{
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  borderRadius: '50px',
                  padding: '12px 30px',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}>
                  Go Home
                </a>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;