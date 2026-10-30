
import { useState } from 'react'
import './App.css'

function App() {
  const [page, setPage] = useState('home')
  const [isLogin, setIsLogin] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const projects = [
    { id: 1, name: 'Project 1', color: 'green' },
    { id: 2, name: 'Project 2', color: 'beige' },
    { id: 3, name: 'Project 3', color: 'lavender' },
  ]

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (!isLogin && password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `/api/auth/${isLogin ? 'login' : 'register'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ username, password }),
        },
      )

      if (isLogin && response.status === 204) {
        setPassword('')
        setConfirmPassword('')
        setMessage('')
        setPage('dashboard')
      } else if (!isLogin && response.status === 201) {
        setMessage('Account created successfully! You can now log in.')
        setPassword('')
        setConfirmPassword('')
        setIsLogin(true)
        setPage('login')
      } else if (response.status === 409) {
        setMessage('This username is already taken.')
      } else if (response.status === 401 || response.status === 403) {
        setMessage('Invalid username or password.')
      } else if (response.status === 400) {
        setMessage(
          'Please check your input. Your password must contain at least 10 characters.',
        )
      } else {
        setMessage(
          `${isLogin ? 'Login' : 'Registration'} failed. Please try again.`,
        )
      }
    } catch {
      setMessage(
        'Unable to connect to the server. Please check whether the backend is running.',
      )
    } finally {
      setLoading(false)
    }
  }

  function navigateTo(nextPage) {
    setPage(nextPage)
    setIsLogin(nextPage === 'login')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setMessage('')
  }

  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.status === 204) {
        setPage('home')
        setIsLogin(false)
        setUsername('')
        setPassword('')
        setConfirmPassword('')
        setMessage('')
      } else {
        setMessage('Logout failed. Please try again.')
      }
    } catch {
      setMessage('Unable to connect to the server.')
    }
  }

  return (
    <div className="app">
      {page !== 'dashboard' && (
        <header className="navbar">
          <button
            type="button"
            className="brand-button"
            onClick={() => navigateTo('home')}
          >
            <span className="flowly-logo" aria-hidden="true" />
            Flowly
          </button>

          <nav className="nav-actions">
            <button
              type="button"
              className={page === 'login' ? 'nav-button active' : 'nav-button'}
              onClick={() => navigateTo('login')}
            >
              Log In
            </button>

            <button
              type="button"
              className={
                page === 'register' ? 'nav-button active' : 'nav-button'
              }
              onClick={() => navigateTo('register')}
            >
              Register
            </button>
          </nav>
        </header>
      )}

      {page === 'home' && (
        <main className="home-page">
          <section className="welcome-card">
            <h1>Welcome to Flowly</h1>
            <p className="home-description">
              A simple place to organize your projects and stay on top of your
              tasks.
            </p>

            <div className="home-features">
              <article className="home-feature">
                <div className="feature-visual feature-visual-green" />
                <h2>Organize projects</h2>
                <p>Keep your projects together in one clear overview.</p>
              </article>

              <article className="home-feature">
                <div className="feature-visual feature-visual-beige" />
                <h2>Manage tasks</h2>
                <p>
                  Break your work into tasks and keep track of what needs doing.
                </p>
              </article>

              <article className="home-feature">
                <div className="feature-visual feature-visual-lavender" />
                <h2>See your progress</h2>
                <p>
                  See open tasks at a glance and follow each project’s progress.
                </p>
              </article>
            </div>

            <p className="home-footer">
              Create an account to get started, or log in to return to your
              projects.
            </p>
          </section>
        </main>
      )}

      {(page === 'login' || page === 'register') && (
        <main className="register-page">
          <form className="register-card" onSubmit={handleSubmit}>
            <h1 className="form-title">
              {isLogin ? 'Log In' : 'Register'}
            </h1>

            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={100}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isLogin ? undefined : 10}
              maxLength={72}
              required
            />

            {!isLogin && (
              <>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={10}
                  maxLength={72}
                  required
                />
              </>
            )}

            <button type="submit" disabled={loading}>
              {loading
                ? 'Please wait...'
                : isLogin
                  ? 'Log In'
                  : 'Register'}
            </button>

            {message && (
              <p className="message" role="status">
                {message}
              </p>
            )}
          </form>
        </main>
      )}

      {page === 'dashboard' && (
        <main className="dashboard-page">
          <header className="dashboard-header">
            <div className="dashboard-brand">
              <span className="flowly-logo" aria-hidden="true" />
              Flowly
            </div>

            <div className="dashboard-user">
              <span className="user-avatar">
                {username.charAt(0).toUpperCase()}
              </span>
              <span>{username}</span>

              <button type="button" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </header>

          <section className="dashboard-content">
            <div className="dashboard-heading">
              <div>
                <p className="dashboard-date">YOUR WORKSPACE</p>
                <h1>Good morning, {username}</h1>
                <p className="dashboard-subtitle">
                  Here is an overview of your projects.
                </p>
              </div>

              <button type="button" className="new-project-button">
                + New project
              </button>
            </div>

            <h2 className="projects-heading">Your projects</h2>

            <div className="project-grid">
              {projects.map((project) => (
                <article className="project-card" key={project.id}>
                  <div className={`project-visual ${project.color}`} />
                  <h3># {project.name}</h3>
                  <p>Start organizing your tasks.</p>

                  <div className="project-actions">
                    <button type="button">Edit</button>
                    <button type="button">Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  )
}

export default App
