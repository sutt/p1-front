import { Link } from 'react-router-dom'
import './App.css'

const GitHubIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="github-icon"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

function App() {
  return (
    <>
      <h1>Collab Canvas</h1>
      <h2>
        Built for <a href="https://www.gauntletai.com/" target="_blank" rel="noopener noreferrer">GauntletAI Cohort3, Project1</a>
      </h2>
      <p>
        Built by <a href="https://github.com/sutt" target="_blank" rel="noopener noreferrer">Will Sutton</a>
      </p>

      <div className="card" style={{ padding: '2em' }}>
        <p style={{ fontSize: '1.5em', fontWeight: 'bold', margin: 0 }}>
          <Link to="/canvas">Head to Canvas for a Demo</Link>
        </p>
      </div>

      <h3>GitHub Repositories</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
        <a href="https://github.com/sutt/p1-front" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitHubIcon /> Front-end
        </a>
        <a href="https://github.com/sutt/p1-back" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitHubIcon /> Back-end
        </a>
      </div>

      <h3>Built with</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', textAlign: 'left', flexWrap: 'wrap' }}>
        <div>
          <h4>Front-end</h4>
          <ul>
            <li>Vite/React</li>
          </ul>
        </div>
        <div>
          <h4>Back-end</h4>
          <ul>
            <li>Python/FastAPI
              <ul>
                <li>uv</li>
                <li>uvicorn</li>
                <li>SQLAlchemy</li>
              </ul>
            </li>
            <li>Postgres</li>
            <li>Docker Compose</li>
            <li>NGINX</li>
            <li>Hosted on GCP, Debian12</li>
          </ul>
        </div>
        <div>
          <h4>AI</h4>
          <ul>
            <li>Gemini-2.5.-Pro</li>
            <li>Claude Code</li>
            <li>Aider</li>
            <li>Claude Sonnet-4.1</li>
          </ul>
        </div>
      </div>
    </>
  )
}

export default App
