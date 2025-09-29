import React, { useState, useEffect } from 'react';

const ProblemsPage = () => {
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [problemsPerPage] = useState(25);

  // Platform icons mapping
  const platformIcons = {
    'Codeforces': '🏆'
  };

  // Platform colors
  const platformColors = {
    'Codeforces': 'linear-gradient(135deg, #1f8ef1, #1565c0)'
  };

  // Fetch problems from Codeforces API
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);

        const response = await fetch('https://codeforces.com/api/problemset.problems');
        if (!response.ok) throw new Error('Failed to fetch Codeforces problems');

        const data = await response.json();
        if (data.status !== 'OK' || !data.result?.problems) {
          throw new Error('Invalid response from Codeforces API');
        }

        const cfProblems = data.result.problems.slice(0, 200).map(problem => ({
          title: problem.name,
          code: `${problem.contestId}${problem.index}`,
          platform: 'Codeforces',
          rating: problem.rating || 'Unrated',
          url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
          tags: problem.tags || [],
          contestId: problem.contestId,
          index: problem.index
        }));

        // Sort by rating (if numeric)
        cfProblems.sort((a, b) => {
          if (a.rating === 'Unrated') return 1;
          if (b.rating === 'Unrated') return -1;
          return a.rating - b.rating;
        });

        setProblems(cfProblems);
        setFilteredProblems(cfProblems);
      } catch (err) {
        setError('Failed to load Codeforces problems. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // Filtering logic with pagination reset
  useEffect(() => {
    let filtered = problems;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(problem =>
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by platform
    if (platformFilter !== 'All') {
      filtered = filtered.filter(p => p.platform === platformFilter);
    }

    // Filter by rating range or predefined ranges
    if (ratingFilter !== 'All') {
      if (ratingFilter === 'Custom') {
        // Custom range filtering
        const min = parseInt(minRating) || 0;
        const max = parseInt(maxRating) || 9999;
        filtered = filtered.filter(problem => {
          const rating = parseInt(problem.rating);
          return !isNaN(rating) && rating >= min && rating <= max;
        });
      } else {
        // Predefined range filtering
        const [min, max] = ratingFilter.split('-').map(Number);
        filtered = filtered.filter(problem => {
          const rating = parseInt(problem.rating);
          return !isNaN(rating) && rating >= min && rating <= max;
        });
      }
    }

    setFilteredProblems(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, platformFilter, ratingFilter, minRating, maxRating, problems]);

  // Pagination calculations
  const indexOfLastProblem = currentPage * problemsPerPage;
  const indexOfFirstProblem = indexOfLastProblem - problemsPerPage;
  const currentProblems = filteredProblems.slice(indexOfFirstProblem, indexOfLastProblem);
  const totalPages = Math.ceil(filteredProblems.length / problemsPerPage);

  // Change page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css');
        
        .liquid-glass {
          background: linear-gradient(135deg, 
            rgba(102, 126, 234, 0.1) 0%,
            rgba(118, 75, 162, 0.05) 25%,
            rgba(240, 147, 251, 0.1) 50%,
            rgba(245, 87, 108, 0.05) 75%,
            rgba(79, 172, 254, 0.1) 100%);
          backdrop-filter: blur(30px);
          border: 2px solid transparent;
          background-clip: padding-box;
          border-radius: 28px;
          position: relative;
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .liquid-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 2px;
          background: linear-gradient(135deg, 
            rgba(102, 126, 234, 0.4),
            rgba(118, 75, 162, 0.6),
            rgba(240, 147, 251, 0.4),
            rgba(245, 87, 108, 0.6));
          border-radius: 28px;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: xor;
          -webkit-mask-composite: xor;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .liquid-glass:hover::before {
          opacity: 1;
        }
        
        .liquid-glass:hover {
          transform: translateY(-12px) rotateX(5deg);
          box-shadow: 
            0 35px 60px rgba(102, 126, 234, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .holographic-text {
          background: linear-gradient(45deg, 
            #667eea 0%, 
            #764ba2 25%, 
            #f093fb 50%, 
            #f5576c 75%, 
            #4facfe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 400% 400%;
          animation: holographic 4s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(102, 126, 234, 0.3));
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
          padding: 14px 35px;
          color: white;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          display: inline-block;
          position: relative;
          overflow: hidden;
          font-family: 'Space Grotesk', sans-serif;
        }
        
        .cyber-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .cyber-button:hover::before {
          left: 100%;
        }
        
        .cyber-button:hover {
          transform: scale(1.05);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.4), rgba(118, 75, 162, 0.5));
          box-shadow: 
            0 0 40px rgba(102, 126, 234, 0.4),
            0 0 80px rgba(118, 75, 162, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          color: white;
          border-color: rgba(102, 126, 234, 0.6);
        }
        
        .glass-input, .glass-select {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 15px 25px;
          color: white;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 16px;
        }
        
        .glass-input:focus, .glass-select:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(102, 126, 234, 0.4);
          box-shadow: 
            0 0 30px rgba(102, 126, 234, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateY(-2px);
        }
        
        .glass-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
          font-weight: 400;
        }
        
        .glass-select option {
          background: #1a1a2e;
          color: white;
          font-weight: 500;
        }
        
        .neon-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .neon-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent 0%,
            rgba(102, 126, 234, 0.6) 25%,
            rgba(240, 147, 251, 0.6) 50%,
            rgba(245, 87, 108, 0.6) 75%,
            transparent 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .neon-card:hover::before {
          opacity: 1;
        }
        
        .neon-card:hover {
          transform: translateY(-8px) scale(1.02);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(138, 43, 226, 0.3);
          box-shadow: 
            0 25px 50px rgba(138, 43, 226, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .platform-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          color: white;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Space Grotesk', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .rating-badge {
          background: linear-gradient(135deg, #ffd700, #ffb347);
          color: #1a1a1a;
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Space Grotesk', sans-serif;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        
        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(102, 126, 234, 0.2);
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .problems-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }
        
        @media (max-width: 768px) {
          .problems-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
        
        .pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-top: 40px;
          flex-wrap: wrap;
        }
        
        .pagination-btn {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          min-width: 48px;
          text-align: center;
          cursor: pointer;
        }
        
        .pagination-btn:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
          border-color: rgba(102, 126, 234, 0.4);
          color: white;
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.2);
        }
        
        .pagination-btn.active {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.4), rgba(118, 75, 162, 0.4));
          border-color: rgba(102, 126, 234, 0.6);
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
        }
        
        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .pagination-btn:disabled:hover {
          transform: none;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: none;
        }
        
        .glow-text {
          text-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
        }
        
        .floating-orbs {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: -1;
        }
        
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(1px);
          animation: float 8s ease-in-out infinite;
        }
        
        .orb:nth-child(1) {
          width: 150px;
          height: 150px;
          background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
          top: 10%;
          left: 5%;
          animation-delay: 0s;
        }
        
        .orb:nth-child(2) {
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, rgba(240, 147, 251, 0.15) 0%, transparent 70%);
          top: 60%;
          right: 5%;
          animation-delay: 2s;
        }
        
        .orb:nth-child(3) {
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(79, 172, 254, 0.1) 0%, transparent 70%);
          bottom: 10%;
          left: 15%;
          animation-delay: 4s;
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); 
          }
          25% { 
            transform: translateY(-20px) translateX(15px) rotate(90deg) scale(1.1); 
          }
          50% { 
            transform: translateY(-40px) translateX(-10px) rotate(180deg) scale(0.9); 
          }
          75% { 
            transform: translateY(-20px) translateX(-15px) rotate(270deg) scale(1.05); 
          }
        }
      `}</style>

      <div className="container position-relative">
        {/* Floating Orbs */}
        <div className="floating-orbs">
          <div className="orb"></div>
          <div className="orb"></div>
          <div className="orb"></div>
        </div>

        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="display-3 fw-bold holographic-text glow-text mb-4" style={{ 
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(2.5rem, 6vw, 4rem)'
          }}>
            Codeforces Problems
          </h1>
          <p className="lead text-light" style={{ 
            opacity: 0.8,
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            fontWeight: '300'
          }}>
            Practice with real Codeforces problems sorted by rating
          </p>
        </div>

        <div className="row">
          {/* Main Content */}
          <div className="col-12">
            {/* Search and Filter Controls */}
            <div className="liquid-glass p-4 mb-5">
              <div className="row g-4">
                <div className="col-lg-4">
                  <input
                    type="text"
                    className="glass-input w-100"
                    placeholder="Search problems by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-lg-2">
                  <select
                    className="glass-select w-100"
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                  >
                    <option value="All">All Platforms</option>
                    <option value="Codeforces">Codeforces</option>
                  </select>
                </div>
                <div className="col-lg-3">
                  <select
                    className="glass-select w-100"
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                  >
                    <option value="All">All Ratings</option>
                    <option value="800-1199">Newbie (800-1199)</option>
                    <option value="1200-1399">Pupil (1200-1399)</option>
                    <option value="1400-1599">Specialist (1400-1599)</option>
                    <option value="1600-1899">Expert (1600-1899)</option>
                    <option value="1900-2099">Candidate Master (1900-2099)</option>
                    <option value="2100-2299">Master (2100-2299)</option>
                    <option value="2300-9999">Grandmaster (2300+)</option>
                    <option value="Custom">Custom Range</option>
                  </select>
                </div>
                <div className="col-lg-3">
                  {ratingFilter === 'Custom' && (
                    <div className="d-flex gap-2">
                      <input
                        type="number"
                        className="glass-input"
                        placeholder="Min"
                        value={minRating}
                        onChange={(e) => setMinRating(e.target.value)}
                        style={{ width: '50%' }}
                      />
                      <input
                        type="number"
                        className="glass-input"
                        placeholder="Max"
                        value={maxRating}
                        onChange={(e) => setMaxRating(e.target.value)}
                        style={{ width: '50%' }}
                      />
                    </div>
                  )}
                  {ratingFilter !== 'Custom' && (
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <span className="text-light opacity-50" style={{ fontSize: '0.9rem' }}>
                        <i className="bi bi-funnel me-2"></i>
                        Rating Filter Active
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="neon-card p-5 text-center">
                <i className="bi bi-exclamation-triangle fs-1 text-warning mb-4"></i>
                <h4 className="text-light fw-bold">Failed to Load Problems</h4>
                <p className="text-light opacity-75">{error}</p>
              </div>
            )}

            {/* Problems Display */}
            {!loading && !error && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="text-light opacity-75 fw-500" style={{ fontSize: '1.1rem' }}>
                    Showing {indexOfFirstProblem + 1}-{Math.min(indexOfLastProblem, filteredProblems.length)} of {filteredProblems.length} problems
                  </span>
                  <span className="text-light opacity-75 fw-500" style={{ fontSize: '1.1rem' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                
                {/* Problems Grid - 2 problems per row */}
                <div className="problems-grid">
                  {currentProblems.map((problem, index) => (
                    <div key={`${problem.code}-${index}`} className="neon-card p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="fw-bold text-light mb-0" style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: '1.3rem',
                          flex: 1,
                          marginRight: '15px',
                          lineHeight: '1.3'
                        }}>
                          {problem.title}
                        </h5>
                        <span className="rating-badge">
                          <i className="bi bi-star-fill"></i>
                          {problem.rating}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-light opacity-75 mb-2" style={{ fontSize: '1rem', fontWeight: '500' }}>
                          <i className="bi bi-code-slash me-2"></i>
                          Code: <span className="fw-bold">{problem.code}</span>
                        </p>
                        
                        <div className="mb-3">
                          <span
                            className="platform-badge"
                            style={{ background: platformColors[problem.platform] }}
                          >
                            <span>{platformIcons[problem.platform]}</span>
                            {problem.platform}
                          </span>
                        </div>

                        {problem.tags && problem.tags.length > 0 && (
                          <div className="mb-3">
                            <small className="text-light opacity-60" style={{ fontSize: '0.9rem' }}>
                              <i className="bi bi-tags me-2"></i>
                              {problem.tags.slice(0, 3).join(' • ')}
                              {problem.tags.length > 3 && ' • ...'}
                            </small>
                          </div>
                        )}
                      </div>

                      <a
                        href={problem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cyber-button w-100 text-center d-flex align-items-center justify-content-center"
                      >
                        Solve on Codeforces
                        <i className="bi bi-box-arrow-up-right ms-2"></i>
                      </a>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination-container">
                    <button 
                      className="pagination-btn"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    
                    {getPaginationNumbers().map((number, index) => (
                      <React.Fragment key={index}>
                        {number === '...' ? (
                          <span className="text-light opacity-50 px-3" style={{ fontSize: '1.2rem' }}>...</span>
                        ) : (
                          <button
                            className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                            onClick={() => paginate(number)}
                          >
                            {number}
                          </button>
                        )}
                      </React.Fragment>
                    ))}
                    
                    <button 
                      className="pagination-btn"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>
                )}

                {filteredProblems.length === 0 && (
                  <div className="neon-card p-5 text-center">
                    <i className="bi bi-search fs-1 holographic-text mb-4"></i>
                    <h4 className="text-light fw-bold">No problems found</h4>
                    <p className="text-light opacity-75">
                      Try adjusting your search terms or filters.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemsPage;