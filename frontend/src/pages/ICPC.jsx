import React, { useState, useEffect } from 'react';

const ICPC = () => {
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [problemsPerPage] = useState(20);

  // Fetch ICPC problems from CodeChef API on component mount
  useEffect(() => {
    const fetchICPCProblems = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://www.codechef.com/api/practice/syllabus/icpc?roadmapSlug');
        
        if (!response.ok) {
          throw new Error('Failed to fetch problems');
        }
        
        const data = await response.json();
        
        // API mapping: Extract problems from nested structure
        const allProblems = [];
        
        if (data && data.modules) {
          data.modules.forEach(module => {
            if (module.submodules) {
              module.submodules.forEach(submodule => {
                if (submodule.problems_with_status) {
                  submodule.problems_with_status.forEach(problemData => {
                    const problem = problemData.problem || problemData;
                    allProblems.push({
                      name: problem.name,
                      code: problem.code,
                      contest_id: problem.contest_id,
                      difficulty_type: problem.difficulty_type || 'medium',
                      submodule_name: submodule.name,
                      link: `https://www.codechef.com/problems/${problem.code}`
                    });
                  });
                }
              });
            }
          });
        }
        
        setProblems(allProblems);
        setFilteredProblems(allProblems);
      } catch (err) {
        setError('Unable to load ICPC problems.');
        console.error('Error fetching ICPC problems:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchICPCProblems();
  }, []);

  // Filtering logic with pagination reset
  useEffect(() => {
    let filtered = problems;

    if (searchTerm) {
      filtered = filtered.filter(problem =>
        problem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (difficultyFilter !== 'All') {
      filtered = filtered.filter(problem =>
        problem.difficulty_type.toLowerCase() === difficultyFilter.toLowerCase()
      );
    }

    setFilteredProblems(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, difficultyFilter, problems]);

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

  // Static statistics
  const stats = {
    total: 288,
    easy: 285,
    medium: 3,
    hard: 0
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'linear-gradient(135deg, #4ade80, #22c55e)';
      case 'medium': return 'linear-gradient(135deg, #fbbf24, #f59e0b)';
      case 'hard': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
    }
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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css');
        
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .glass-card:hover {
          transform: translateY(-8px) scale(1.02);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(138, 43, 226, 0.3);
          box-shadow: 0 25px 50px rgba(138, 43, 226, 0.15);
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
        
        .cyber-button {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.3));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 12px;
          padding: 10px 20px;
          color: white;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          display: inline-block;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.9rem;
        }
        
        .cyber-button:hover {
          transform: scale(1.05);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.4), rgba(118, 75, 162, 0.5));
          box-shadow: 0 0 30px rgba(102, 126, 234, 0.4);
          color: white;
        }
        
        .glass-input, .glass-select {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 12px 20px;
          color: white;
          font-family: 'Poppins', sans-serif;
          transition: all 0.3s ease;
        }
        
        .glass-input:focus, .glass-select:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(102, 126, 234, 0.4);
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
          color: white;
        }
        
        .glass-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .glass-select option {
          background: #1a1a2e;
          color: white;
        }
        
        .difficulty-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
          display: inline-block;
          font-family: 'Space Grotesk', sans-serif;
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
        
        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .stat-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: scale(1.02);
        }
        
        .pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 30px;
          flex-wrap: wrap;
        }
        
        .pagination-btn {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 12px;
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
          font-family: 'Space Grotesk', sans-serif;
          min-width: 40px;
          text-align: center;
        }
        
        .pagination-btn:hover {
          background: rgba(102, 126, 234, 0.3);
          border-color: rgba(102, 126, 234, 0.4);
          color: white;
          transform: translateY(-2px);
        }
        
        .pagination-btn.active {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.4), rgba(118, 75, 162, 0.4));
          border-color: rgba(102, 126, 234, 0.6);
        }
        
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .pagination-btn:disabled:hover {
          transform: none;
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>

      <div className="container">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold holographic-text mb-3" style={{
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            ICPC — Past Year Problems
          </h1>
          <p className="lead text-light" style={{ opacity: 0.8 }}>
            Solve authentic ICPC problems from previous contests
          </p>
        </div>

        <div className="row">
          {/* Main Content */}
          <div className="col-lg-9">
            {/* Search and Filter Controls */}
            <div className="glass-card p-4 mb-4">
              <div className="row g-3">
                <div className="col-md-8">
                  <input
                    type="text"
                    className="glass-input w-100"
                    placeholder="Search problems by title or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <select
                    className="glass-select w-100"
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                  >
                    <option value="All">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                <div className="spinner"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="glass-card p-4 text-center">
                <i className="bi bi-exclamation-triangle fs-1 text-warning mb-3"></i>
                <h4 className="text-light">{error}</h4>
                <p className="text-light opacity-75">Please try again later.</p>
              </div>
            )}

            {/* Problems Display */}
            {!loading && !error && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="text-light opacity-75">
                    Showing {indexOfFirstProblem + 1}-{Math.min(indexOfLastProblem, filteredProblems.length)} of {filteredProblems.length} problems
                  </span>
                  <span className="text-light opacity-75">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                
                {/* Problems Grid - 2 problems per row */}
                <div className="row g-4">
                  {currentProblems.map((problem, index) => (
                    <div key={`${problem.code}-${index}`} className="col-md-6">
                      <div className="glass-card p-4 h-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h5 className="fw-bold text-light mb-2" style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: '1.1rem',
                            flex: 1,
                            marginRight: '15px'
                          }}>
                            {problem.name}
                          </h5>
                          <span 
                            className="difficulty-badge"
                            style={{ background: getDifficultyColor(problem.difficulty_type) }}
                          >
                            {problem.difficulty_type}
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-light opacity-75 mb-1" style={{ fontSize: '0.9rem' }}>
                            <i className="bi bi-code-slash me-2"></i>
                            Code: {problem.code}
                          </p>
                          <p className="text-light opacity-75 mb-1" style={{ fontSize: '0.9rem' }}>
                            <i className="bi bi-trophy me-2"></i>
                            Contest: {problem.submodule_name}
                          </p>
                          {problem.contest_id && (
                            <p className="text-light opacity-75 mb-0" style={{ fontSize: '0.9rem' }}>
                              <i className="bi bi-calendar me-2"></i>
                              Contest ID: {problem.contest_id}
                            </p>
                          )}
                        </div>
                        
                        <a
                          href={problem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cyber-button w-100 text-center d-block"
                        >
                          Solve on CodeChef
                          <i className="bi bi-box-arrow-up-right ms-2"></i>
                        </a>
                      </div>
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
                          <span className="text-light opacity-50 px-2">...</span>
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
                  <div className="glass-card p-5 text-center">
                    <i className="bi bi-search fs-1 text-muted mb-3"></i>
                    <h4 className="text-light">No problems found</h4>
                    <p className="text-light opacity-75">
                      Try adjusting your search terms or filters.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-lg-3">
            <div className="glass-card p-4 sticky-top" style={{ top: '100px' }}>
              <h5 className="fw-bold holographic-text mb-4" style={{
                fontFamily: "'Space Grotesk', sans-serif"
              }}>
                Statistics
              </h5>
              
              <div className="stat-card mb-3">
                <h3 className="fw-bold holographic-text">{stats.total}</h3>
                <p className="text-light mb-0 opacity-75">Total Problems</p>
              </div>
              
              <div className="row g-2 mb-4">
                <div className="col-6">
                  <div className="stat-card">
                    <h5 className="fw-bold text-success">{stats.easy}</h5>
                    <small className="text-light opacity-75">Easy</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="stat-card">
                    <h5 className="fw-bold text-warning">{stats.medium}</h5>
                    <small className="text-light opacity-75">Medium</small>
                  </div>
                </div>
                <div className="col-12">
                  <div className="stat-card">
                    <h5 className="fw-bold text-danger">{stats.hard}</h5>
                    <small className="text-light opacity-75">Hard</small>
                  </div>
                </div>
              </div>
              
              <div className="p-3" style={{
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}>
                <h6 className="fw-bold text-light mb-2">
                  <i className="bi bi-info-circle me-2"></i>
                  About ICPC Problems
                </h6>
                <p className="text-light opacity-75 mb-0" style={{ fontSize: '0.9rem' }}>
                  These problems are from past ICPC contests. Click a problem to solve directly on CodeChef platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ICPC;