import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/test')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      {/* Displays the server message or a loading state */}
      <p>{message || 'Loading server status...'}</p>
      
      <h1>Bruin Match</h1>
      
      <div>
        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      
      <br />

      <div>
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <br />
      
      <button onClick={() => console.log('Logging in as:', username)}>
        Sign In
      </button>
    </div>
  )
}

export default App