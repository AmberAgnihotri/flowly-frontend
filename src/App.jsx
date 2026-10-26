import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('laden...')

  useEffect(() => {
    fetch('/api/health')
      .then((response) => response.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('backend niet bereikbaar'))
  }, [])

  return (
    <div>
      <h1>Flowly</h1>
      <p>Backend status: {status}</p>
    </div>
  )
}

export default App