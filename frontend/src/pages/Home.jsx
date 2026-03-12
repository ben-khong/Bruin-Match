import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="app">
      <header className="nav">
        <div className="brand">BruinMatch</div>
        <nav className="nav-links">
          <Link to="/login" className="link">Login</Link>
          <Link to="/signup" className="btn btn-primary">Sign up</Link>
        </nav>
      </header>

      <main className="hero">
        <div className="hero-content">
          <h1>Find a roommate who fits your lifestyle.</h1>
          <p>
            Build a profile, set preferences, and match with UCLA students
            looking for the same vibe.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary">Get started</Link>
            <Link to="/login" className="btn btn-secondary">I already have an account</Link>
          </div>
        </div>

        <div className="hero-window">
          <div className="hero-window-titlebar">
            <div className="hero-window-dots">
              <span className="hw-dot hw-dot-red" />
              <span className="hw-dot hw-dot-yellow" />
              <span className="hw-dot hw-dot-green" />
            </div>
            <span className="hero-window-title">bruinmatch.ucla.edu</span>
          </div>
          <div className="hero-window-body">
            <div className="stat">
              <span className="stat-number">3 steps</span>
              <span className="stat-label">Create profile, set preferences, match.</span>
            </div>
            <div className="stat">
              <span className="stat-number">Safe &amp; trusted</span>
              <span className="stat-label">Built exclusively for UCLA students.</span>
            </div>
            <div className="stat">
              <span className="stat-number">Smart matching</span>
              <span className="stat-label">Ranked by compatibility scores.</span>
            </div>
          </div>
        </div>
      </main>

      <section className="features">
        <div className="feature-window">
          <div className="feature-window-bar feature-bar--dandelion">
            <span className="fw-dot" /><span className="fw-dot" /><span className="fw-dot" />
          </div>
          <div className="feature-window-body">
            <h3>Detailed profiles</h3>
            <p>Share your habits, schedule, and what makes a great roommate.</p>
          </div>
        </div>
        <div className="feature-window">
          <div className="feature-window-bar feature-bar--navy">
            <span className="fw-dot" /><span className="fw-dot" /><span className="fw-dot" />
          </div>
          <div className="feature-window-body">
            <h3>Preference matching</h3>
            <p>Filter by housing type, move-in term, and room setup.</p>
          </div>
        </div>
        <div className="feature-window">
          <div className="feature-window-bar feature-bar--strawberry">
            <span className="fw-dot" /><span className="fw-dot" /><span className="fw-dot" />
          </div>
          <div className="feature-window-body">
            <h3>Simple messaging</h3>
            <p>Connect quickly and form groups with the right people.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
