import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navItems = [
    { name: 'ICPC', path: '/icpc' },
    { name: 'Codeforces', path: '/codeforces' },
    { name: 'Codechef', path: '/codechef' },
    { name: 'Multi-platforms', path: '/multi-platforms' },
    { name: 'Problems', path: '/problems' }
  ];

  return (
    <>
      <style>{`
        .navbar-glass {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .navbar-scrolled {
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(30px);
        }
        
        .holographic-text {
          background: linear-gradient(45deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
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
        
        .hologram-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          position: relative;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .hologram-icon::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(45deg, transparent, rgba(102, 126, 234, 0.3), transparent);
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }
        
        .hologram-icon:hover::before {
          opacity: 1;
          animation: rotate 2s linear infinite;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .nav-link.active {
          color: #667eea !important;
          text-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
        }
      `}</style>

      <nav className={`navbar navbar-expand-lg fixed-top navbar-glass ${scrollY > 50 ? 'navbar-scrolled' : ''}`}>
        <div className="container">
          <Link className="navbar-brand fw-bold fs-3 holographic-text" to="/" style={{
            fontFamily: "'Space Grotesk', sans-serif",
            textDecoration: 'none'
          }}>
            Programmerz
          </Link>
          
          <button 
            className="navbar-toggler border-0" 
            type="button"
            onClick={toggleMenu}
            style={{ color: '#fff' }}
          >
            <i className="bi bi-list fs-2"></i>
          </button>

          <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
            <ul className="navbar-nav mx-auto">
              {navItems.map((item, index) => (
                <li key={index} className="nav-item mx-3">
                  <Link 
                    className={`nav-link text-white fw-500 ${location.pathname === item.path ? 'active' : ''}`}
                    to={item.path}
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      transition: 'all 0.3s ease',
                      textDecoration: 'none'
                    }} 
                    onMouseOver={(e) => {
                      if (!e.target.classList.contains('active')) {
                        e.target.style.color = '#667eea';
                        e.target.style.textShadow = '0 0 10px rgba(102, 126, 234, 0.5)';
                      }
                    }} 
                    onMouseOut={(e) => {
                      if (!e.target.classList.contains('active')) {
                        e.target.style.color = 'white';
                        e.target.style.textShadow = 'none';
                      }
                    }}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className="navbar-nav">
              <Link to="/profile" className="nav-link">
                <div className="hologram-icon">
                  <i className="bi bi-person-circle text-white fs-4"></i>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;