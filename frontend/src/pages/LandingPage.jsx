import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
 const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="landing-page" style={{
      fontFamily: "'Poppins', sans-serif",
      overflow: 'hidden'
    }}>

      {/* Navbar */}

      {/* Hero Section */}
      <section className="hero-section position-relative liquid-bg code-bg" style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: '80px',
        paddingBottom: '40px'
      }}>
        <div className="floating-orbs">
          <div className="orb"></div>
          <div className="orb"></div>
          <div className="orb"></div>
          <div className="orb"></div>
        </div>
        
        <div className="container text-center">
          <div className="row justify-content-center">
            <div className="col-lg-11 col-xl-10">
              {/* Glassmorphism Hero Card */}
              <div className="liquid-glass p-4 p-md-5">
                <h1 className="display-2 fw-bold mb-4 ms-3" style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                  lineHeight: '1.1'
                }}>
                  Level Up Your Competitive Programming Journey 🚀
                </h1>
                
                <p className="lead mb-4 text-light" style={{ 
                  opacity: 0.9,
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: '300',
                  fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  Track, analyze, and improve your problem-solving skills across multiple platforms
                </p>
                
                <div className="d-flex gap-3 justify-content-center flex-wrap mt-4">
                  <a href="#features" className="cyber-button">
                    Get Started
                    <i className="bi bi-arrow-right ms-2"></i>
                  </a>
                  <a href="#problems" className="cyber-button" style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  }}>
                    Explore Problems
                    <i className="bi bi-code-slash ms-2"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-3 fw-bold mb-4 glow-text" style={{
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Powerful Features
            </h2>
            <p className="lead fs-4 text-light" style={{ fontWeight: '300' }}>
              Everything you need to excel in competitive programming
            </p>
          </div>
          
          <div className="row g-5">
            {[
              { icon: '🧑‍💻', title: 'Multi-Platform Tracking', desc: 'Track your progress across Codeforces, Codechef, Leetcode, and more platforms in one unified dashboard.', gradient: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))' },
              { icon: '📊', title: 'Smart Recommendations', desc: 'Get personalized problem recommendations based on your skill level and areas that need improvement.', gradient: 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2))' },
              { icon: '🏆', title: 'ICPC Problems', desc: 'Access previous year ICPC problems with built-in judge system for authentic contest practice.', gradient: 'linear-gradient(135deg, rgba(79, 172, 254, 0.2), rgba(0, 242, 254, 0.2))' },
              { icon: '⚡', title: 'Interactive Analytics', desc: 'Detailed stats, contest insights, and performance analytics to track your competitive programming journey.', gradient: 'linear-gradient(135deg, rgba(168, 237, 234, 0.2), rgba(254, 214, 227, 0.2))' }
            ].map((feature, index) => (
              <div key={index} className="col-lg-6 col-md-6">
                <div className="ultra-glass p-5 h-100">
                  <div className="hologram-icon">
                    <span className="feature-icon">{feature.icon}</span>
                  </div>
                  <h4 className="fw-bold mb-4 text-center holographic-text" style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.5rem'
                  }}>
                    {feature.title}
                  </h4>
                  <p className="text-light text-center" style={{ 
                    opacity: 0.9,
                    lineHeight: '1.7',
                    fontSize: '1.1rem'
                  }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ICPC Section */}
      <section id="icpc" className="py-5" style={{ 
        background: 'rgba(255, 255, 255, 0.01)',
        paddingTop: '120px',
        paddingBottom: '120px'
      }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-3 fw-bold mb-4 glow-text" style={{
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Solve Previous Year ICPC Problems
            </h2>
            <p className="lead fs-4 text-light" style={{ fontWeight: '300' }}>
              Practice with authentic ICPC problems from past contests
            </p>
          </div>
          
          <div className="ultra-glass p-5 mb-5">
            <div className="text-center mb-5">
                
            </div>

            {/* Sample Problems Preview */}
            <div className="row g-4 mb-5">
              <div className="col-lg-4 col-md-6">
                <div className="ultra-glass p-4 h-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="fw-bold text-light mb-2" style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '1.1rem'
                    }}>
                      Maximum Subarray Sum
                    </h5>
                    <span 
                      className="badge"
                      style={{ 
                        background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                        color: 'white',
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        borderRadius: '12px'
                      }}
                    >
                      Easy
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-light opacity-75 mb-1" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-code-slash me-2"></i>
                      Code: MAXSUBARRAY
                    </p>
                    <p className="text-light opacity-75 mb-2" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-trophy me-2"></i>
                      ICPC Asia-Pacific 2023
                    </p>
                    <p className="text-light opacity-75" style={{ fontSize: '0.85rem' }}>
                      Find the contiguous subarray with the largest sum in a given array of integers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-lg-4 col-md-6">
                <div className="ultra-glass p-4 h-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="fw-bold text-light mb-2" style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '1.1rem'
                    }}>
                      Graph Traversal
                    </h5>
                    <span 
                      className="badge"
                      style={{ 
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        color: 'white',
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        borderRadius: '12px'
                      }}
                    >
                      Medium
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-light opacity-75 mb-1" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-code-slash me-2"></i>
                      Code: GRAPHTRAV
                    </p>
                    <p className="text-light opacity-75 mb-2" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-trophy me-2"></i>
                      ICPC World Finals 2022
                    </p>
                    <p className="text-light opacity-75" style={{ fontSize: '0.85rem' }}>
                      Implement efficient graph traversal algorithms to solve connectivity problems.
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-lg-4 col-md-6">
                <div className="ultra-glass p-4 h-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="fw-bold text-light mb-2" style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '1.1rem'
                    }}>
                      Dynamic Programming
                    </h5>
                    <span 
                      className="badge"
                      style={{ 
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        borderRadius: '12px'
                      }}
                    >
                      Hard
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-light opacity-75 mb-1" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-code-slash me-2"></i>
                      Code: DPOPTIMAL
                    </p>
                    <p className="text-light opacity-75 mb-2" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-trophy me-2"></i>
                      ICPC North America 2024
                    </p>
                    <p className="text-light opacity-75" style={{ fontSize: '0.85rem' }}>
                      Solve complex optimization problems using advanced dynamic programming techniques.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Link to="/icpc" className="cyber-button" style={{ 
                fontSize: '1.2rem', 
                padding: '16px 40px',
                textDecoration: 'none' 
              }}>
                Explore All Problems
                <i className="bi bi-collection ms-2"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Codeforces + Codechef Tracker */}
      <section id="tracker" className="py-5" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-3 fw-bold mb-4 glow-text" style={{
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Platform Tracker
            </h2>
            <p className="lead fs-4 text-light" style={{ fontWeight: '300' }}>
              Monitor your progress across competitive programming platforms
            </p>
          </div>
          
          <div className="row g-10">
            <div className="col-lg-6">
              <div className="liquid-glass p-5">
                <div className="d-flex align-items-center mb-4">
                  <div className="hologram-icon" style={{
                    width: '80px',
                    height: '80px',
                    marginRight: '25px',
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3))'
                  }}>
                    <i className="bi bi-code-square text-white fs-2"></i>
                  </div>
                  <div> 
                    <h4 className="fw-bold holographic-text" style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                    //   marginLeft: "100px",
                    }}>
                      Codeforces Tracker
                    </h4>
                    <p className="text-light mb-0" style={{ opacity: 0.8, }}>
                      Real-time rating and contest data
                    </p>
                  </div>
                </div>
                
                <div></div>
                <div className="row g-4 mb-4">
                  <div className="col-6">
                    <div className="neural-card">
                      <h3 className="fw-bold holographic-text mb-2">1847</h3>
                      <p className="small text-light mb-0">Current Rating</p>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="neural-card">
                      <h3 className="fw-bold holographic-text mb-2">342</h3>
                      <p className="small text-light mb-0">Problems Solved</p>
                    </div>
                  </div>
                </div>
                
                <a href="#" className="cyber-button w-100 text-center justify-content-center d-flex">
                  Connect Codeforces
                  <i className="bi bi-link-45deg ms-2"></i>
                </a>
              </div>
            </div>
            
            <div className="col-lg-6">
              <div className="liquid-glass p-5">
                <div className="d-flex align-items-center mb-4">
                  <div className="hologram-icon" style={{
                    width: '80px',
                    height: '80px',
                    marginRight: '25px',
                    background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3))'
                  }}>
                    <i className="bi bi-trophy text-white fs-2"></i>
                  </div>
                  <div>
                    <h4 className="fw-bold mb-2 holographic-text" style={{
                      fontFamily: "'Space Grotesk', sans-serif"
                    }}>
                      Codechef Tracker
                    </h4>
                    <p className="text-light mb-0" style={{ opacity: 0.8 }}>
                      Contest performance analytics
                    </p>
                  </div>
                </div>
                
                <div className="row g-4 mb-4">
                  <div className="col-6">
                    <div className="neural-card">
                      <h3 className="fw-bold holographic-text mb-2">4⭐</h3>
                      <p className="small text-light mb-0">Current Stars</p>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="neural-card">
                      <h3 className="fw-bold holographic-text mb-2">189</h3>
                      <p className="small text-light mb-0">Problems Solved</p>
                    </div>
                  </div>
                </div>
                
                <a href="#" className="cyber-button w-100 text-center justify-content-center d-flex">
                  Connect Codechef
                  <i className="bi bi-link-45deg ms-2"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-5" style={{ 
        background: 'rgba(255, 255, 255, 0.01)',
        paddingTop: '120px',
        paddingBottom: '120px'
      }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-3 fw-bold mb-4 glow-text" style={{
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Why GenZ Loves Programmerz
            </h2>
            <p className="lead fs-4 text-light" style={{ fontWeight: '300' }}>
              Join thousands of competitive programmers
            </p>
          </div>
          
          <div className="row g-5">
            {[
              { name: 'Alex Chen', role: 'Candidate Master', feedback: '"The multi-platform tracking is a game-changer! Finally, I can see all my progress in one place."', gradient: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3))' },
              { name: 'Priya Sharma', role: 'Expert', feedback: '"The ICPC problem archive helped me prepare for regionals. The interface is so clean and modern!"', gradient: 'linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3))' },
              { name: 'Ryan Kim', role: 'Specialist', feedback: '"Smart recommendations actually work! I\'ve improved my rating by 300 points in 3 months."', gradient: 'linear-gradient(135deg, rgba(79, 172, 254, 0.3), rgba(0, 242, 254, 0.3))' }
            ].map((testimonial, index) => (
              <div key={index} className="col-lg-4">
                <div className="quantum-testimonial">
                  <div className="d-flex align-items-center mb-4">
                    <div className="avatar-glow" style={{ background: testimonial.gradient }}>
                    </div>
                    <div>
                      <h5 className="fw-bold mb-1 holographic-text" style={{
                        fontFamily: "'Space Grotesk', sans-serif"
                      }}>
                        {testimonial.name}
                      </h5>
                      <small className="text-light" style={{ opacity: 0.8 }}>
                        {testimonial.role}
                      </small>
                    </div>
                  </div>
                  <p className="text-light" style={{ 
                    lineHeight: '1.7',
                    fontSize: '1.1rem',
                    fontStyle: 'italic'
                  }}>
                    {testimonial.feedback}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action Section */}
      <section className="py-5 text-center liquid-cta" style={{
        paddingTop: '120px',
        paddingBottom: '120px',
        position: 'relative'
      }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="ultra-glass p-5 border border-gray border-2 bg-dark">
                <h2 className="display-2 fw-bold mb-4 glow-text" style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  textShadow: '0 0 40px rgba(255, 255, 255, 0.3)',
                  fontSize: 'clamp(2rem, 6vw, 4rem)'
                }}>
                  Ready to Dominate Competitive Programming?
                </h2>
                <p className="lead fs-3 mb-5" style={{ 
                  opacity: 0.95,
                  fontWeight: '300',
                  textShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
                }}>
                  Join thousands of programmers who are already leveling up their skills
                </p>
                <a href="#" className="cyber-button" style={{
                  fontSize: '1.3rem',
                  padding: '20px 50px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(20px)'
                }}>
                  Join Now
                  <i className="bi bi-rocket-takeoff ms-3"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5" style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        paddingTop: '80px',
        paddingBottom: '40px'
      }}>
        <div className="container">
          <div className="ultra-glass p-5">
            <div className="row g-5">
              <div className="col-lg-6">
                <h3 className="fw-bold holographic-text mb-4" style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '2rem'
                }}>
                  Programmerz
                </h3>
                <p className="text-light" style={{ 
                  fontSize: '1.1rem',
                  lineHeight: '1.7',
                  opacity: 0.9
                }}>
                  The ultimate platform for competitive programmers to track, learn, and excel in the world of algorithmic problem solving.
                </p>
              </div>
              
              <div className="col-lg-3">
                <h5 className="fw-bold mb-4 holographic-text" style={{
                  fontFamily: "'Space Grotesk', sans-serif"
                }}>
                  Quick Links
                </h5>
                <ul className="list-unstyled">
                  {['About', 'Contact', 'Privacy Policy', 'Terms of Service'].map((link, index) => (
                    <li key={index} className="mb-3">
                      <a href="#" className="text-light text-decoration-none" style={{
                        transition: 'all 0.3s ease',
                        fontSize: '1.05rem'
                      }} onMouseOver={(e) => {
                        e.target.style.color = '#667eea';
                        e.target.style.textShadow = '0 0 10px rgba(102, 126, 234, 0.5)';
                      }} onMouseOut={(e) => {
                        e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                        e.target.style.textShadow = 'none';
                      }}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="col-lg-3">
                <h5 className="fw-bold mb-4 holographic-text" style={{
                  fontFamily: "'Space Grotesk', sans-serif"
                }}>
                  Follow Us
                </h5>
                <div className="d-flex flex-wrap">
                  {[
                    { icon: 'bi-twitter', name: 'Twitter' },
                    { icon: 'bi-github', name: 'GitHub' },
                    { icon: 'bi-discord', name: 'Discord' },
                    { icon: 'bi-linkedin', name: 'LinkedIn' }
                  ].map((social, index) => (
                    <a key={index} href="#" className="social-orb me-3 mb-3">
                      <i className={`bi ${social.icon} fs-5`}></i>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            
            <hr className="my-5" style={{ 
              borderColor: 'rgba(255, 255, 255, 0.1)',
              opacity: 0.3
            }} />
            
            <div className="text-center">
              <p className="text-light mb-0" style={{
                fontSize: '1.05rem',
                opacity: 0.8
              }}>
                © 2025 Programmerz. All rights reserved. Made with 💜 for competitive programmers.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;