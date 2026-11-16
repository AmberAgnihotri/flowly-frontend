
import { useCallback, useState } from 'react'
import './App.css'

const taskStatuses = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'DUE_TODAY', label: 'Due today' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
]

function App() {
  const [page, setPage] = useState('home')
  const [isLogin, setIsLogin] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [projectMessage, setProjectMessage] = useState('')
  const [projectFormOpen, setProjectFormOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [savingProject, setSavingProject] = useState(false)

  const [selectedProject, setSelectedProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [taskMessage, setTaskMessage] = useState('')
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskStatus, setTaskStatus] = useState('BACKLOG')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [savingTask, setSavingTask] = useState(false)

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true)
    setProjectMessage('')

    try {
      const response = await fetch('/api/project-boards', {
        credentials: 'include',
      })

      if (response.ok) {
        setProjects(await response.json())
      } else if (response.status === 401 || response.status === 403) {
        setProjectMessage('Your session has expired. Please log in again.')
      } else {
        setProjectMessage('Could not load projects.')
      }
    } catch {
      setProjectMessage('Could not connect to the server.')
    } finally {
      setLoadingProjects(false)
    }
  }, [])

  const loadTasks = useCallback(async (projectId) => {
    setLoadingTasks(true)
    setTaskMessage('')

    try {
      const response = await fetch(
        `/api/project-boards/${projectId}/tasks`,
        { credentials: 'include' },
      )

      if (response.ok) {
        setTasks(await response.json())
      } else if (response.status === 401 || response.status === 403) {
        setTaskMessage('Your session has expired. Please log in again.')
      } else if (response.status === 404) {
        setTaskMessage('Project not found.')
      } else {
        setTaskMessage('Could not load tasks.')
      }
    } catch {
      setTaskMessage('Could not connect to the server.')
    } finally {
      setLoadingTasks(false)
    }
  }, [])

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
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username, password }),
        },
      )

      if (isLogin && response.status === 204) {
        setPassword('')
        setConfirmPassword('')
        setMessage('')
        await loadProjects()
        setPage('dashboard')
      } else if (!isLogin && response.status === 201) {
        setMessage('Account created! You can now log in.')
        setPassword('')
        setConfirmPassword('')
        setIsLogin(true)
        setPage('login')
      } else if (response.status === 409) {
        setMessage('This username is already taken.')
      } else if (response.status === 401 || response.status === 403) {
        setMessage('Invalid username or password.')
      } else if (response.status === 400) {
        setMessage('Please check your input. Your password must contain at least 10 characters.')
      } else {
        setMessage('Login or registration failed. Please try again.')
      }
    } catch {
      setMessage('Could not connect to the server. Please check whether the backend is running.')
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
        setProjects([])
        setSelectedProject(null)
        setTasks([])
        setMessage('')
      } else {
        setMessage('Logout failed. Please try again.')
      }
    } catch {
      setMessage('Could not connect to the server.')
    }
  }

  function openNewProjectForm() {
    setProjectName('')
    setEditingProjectId(null)
    setProjectMessage('')
    setProjectFormOpen(true)
  }

  function openEditProjectForm(project) {
    setProjectName(project.name)
    setEditingProjectId(project.id)
    setProjectMessage('')
    setProjectFormOpen(true)
  }

  function closeProjectForm() {
    setProjectFormOpen(false)
    setProjectName('')
    setEditingProjectId(null)
  }

  async function handleSaveProject(event) {
    event.preventDefault()
    setProjectMessage('')

    const trimmedName = projectName.trim()

    if (!trimmedName) {
      setProjectMessage('Please enter a project name.')
      return
    }

    setSavingProject(true)

    const isEditing = editingProjectId !== null
    const url = isEditing
      ? `/api/project-boards/${editingProjectId}`
      : '/api/project-boards'

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: trimmedName }),
      })

      if (response.ok) {
        closeProjectForm()
        await loadProjects()
      } else if (response.status === 400) {
        setProjectMessage('The project name is invalid.')
      } else if (response.status === 401 || response.status === 403) {
        setProjectMessage('Your session has expired. Please log in again.')
      } else {
        setProjectMessage('Could not save the project. Please try again.')
      }
    } catch {
      setProjectMessage('Could not connect to the server.')
    } finally {
      setSavingProject(false)
    }
  }

  async function handleDeleteProject(project) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the project "${project.name}"?`,
    )

    if (!confirmed) return

    setProjectMessage('')

    try {
      const response = await fetch(`/api/project-boards/${project.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.status === 204) {
        await loadProjects()
      } else if (response.status === 401 || response.status === 403) {
        setProjectMessage('Your session has expired. Please log in again.')
      } else {
        setProjectMessage('Could not delete the project.')
      }
    } catch {
      setProjectMessage('Could not connect to the server.')
    }
  }

  function openProject(project) {
    setSelectedProject(project)
    setTasks([])
    closeTaskForm()
    loadTasks(project.id)
  }

  function closeProject() {
    setSelectedProject(null)
    setTasks([])
    setTaskMessage('')
    closeTaskForm()
  }

  function openNewTaskForm() {
    setTaskTitle('')
    setTaskDescription('')
    setTaskStatus('BACKLOG')
    setEditingTaskId(null)
    setTaskMessage('')
    setTaskFormOpen(true)
  }

  function openEditTaskForm(task) {
    setTaskTitle(task.title)
    setTaskDescription(task.description || '')
    setTaskStatus(task.status)
    setEditingTaskId(task.id)
    setTaskMessage('')
    setTaskFormOpen(true)
  }

  function closeTaskForm() {
    setTaskFormOpen(false)
    setTaskTitle('')
    setTaskDescription('')
    setTaskStatus('BACKLOG')
    setEditingTaskId(null)
  }

  async function handleSaveTask(event) {
    event.preventDefault()
    setTaskMessage('')

    const trimmedTitle = taskTitle.trim()

    if (!trimmedTitle) {
      setTaskMessage('Please enter a task title.')
      return
    }

    setSavingTask(true)

    const isEditing = editingTaskId !== null
    const url = isEditing
      ? `/api/project-boards/${selectedProject.id}/tasks/${editingTaskId}`
      : `/api/project-boards/${selectedProject.id}/tasks`

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: trimmedTitle,
          description: taskDescription.trim(),
          status: taskStatus,
        }),
      })

      if (response.ok) {
        closeTaskForm()
        await loadTasks(selectedProject.id)
      } else if (response.status === 400) {
        setTaskMessage('Please check the task details.')
      } else if (response.status === 401 || response.status === 403) {
        setTaskMessage('Your session has expired. Please log in again.')
      } else if (response.status === 404) {
        setTaskMessage('Project or task not found.')
      } else {
        setTaskMessage('Could not save the task. Please try again.')
      }
    } catch {
      setTaskMessage('Could not connect to the server.')
    } finally {
      setSavingTask(false)
    }
  }

  async function handleUpdateTaskStatus(task, newStatus) {
    setTaskMessage('')

    try {
      const response = await fetch(
        `/api/project-boards/${selectedProject.id}/tasks/${task.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: task.title,
            description: task.description || '',
            status: newStatus,
          }),
        },
      )

      if (response.ok) {
        await loadTasks(selectedProject.id)
      } else {
        setTaskMessage('Could not update the task status.')
      }
    } catch {
      setTaskMessage('Could not connect to the server.')
    }
  }

  async function handleDeleteTask(task) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the task "${task.title}"?`,
    )

    if (!confirmed) return

    setTaskMessage('')

    try {
      const response = await fetch(
        `/api/project-boards/${selectedProject.id}/tasks/${task.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      )

      if (response.status === 204) {
        await loadTasks(selectedProject.id)
      } else if (response.status === 404) {
        setTaskMessage('Task not found.')
      } else {
        setTaskMessage('Could not delete the task.')
      }
    } catch {
      setTaskMessage('Could not connect to the server.')
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
              Log in
            </button>

            <button
              type="button"
              className={page === 'register' ? 'nav-button active' : 'nav-button'}
              onClick={() => navigateTo('register')}
            >
              Sign up
            </button>
          </nav>
        </header>
      )}

      {page === 'home' && (
        <main className="home-page">
          <section className="welcome-card">
            <h1>Welcome to Flowly</h1>
            <p className="home-description">
              A simple place to organize your projects and keep track of your tasks.
            </p>

            <div className="home-features">
              <article className="home-feature">
                <div className="feature-visual feature-visual-green" />
                <h2>Organize projects</h2>
                <p>Keep all your projects organized in one place.</p>
              </article>

              <article className="home-feature">
                <div className="feature-visual feature-visual-beige" />
                <h2>Manage tasks</h2>
                <p>Break your work into tasks and keep track of what needs to be done.</p>
              </article>

              <article className="home-feature">
                <div className="feature-visual feature-visual-lavender" />
                <h2>Track progress</h2>
                <p>See the progress of your projects at a glance.</p>
              </article>
            </div>

            <p className="home-footer">
              Create an account or log in to get started.
            </p>
          </section>
        </main>
      )}

      {(page === 'login' || page === 'register') && (
        <main className="register-page">
          <form className="register-card" onSubmit={handleSubmit}>
            <h1 className="form-title">{isLogin ? 'Log in' : 'Sign up'}</h1>

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
                <label htmlFor="confirmPassword">Confirm password</label>
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
              {loading ? 'Please wait...' : isLogin ? 'Log in' : 'Sign up'}
            </button>

            {message && <p className="message" role="status">{message}</p>}
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
              <button type="button" onClick={handleLogout}>Log out</button>
            </div>
          </header>

          <section className="dashboard-content">
            {!selectedProject ? (
              <>
                <div className="dashboard-heading">
                  <div>
                    <p className="dashboard-date">YOUR WORKSPACE</p>
                    <h1>Good morning, {username}</h1>
                    <p className="dashboard-subtitle">
                      Here is an overview of your projects.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="new-project-button"
                    onClick={openNewProjectForm}
                  >
                    + New project
                  </button>
                </div>

                {projectFormOpen && (
                  <form className="project-form" onSubmit={handleSaveProject}>
                    <h2>{editingProjectId !== null ? 'Edit project' : 'Create new project'}</h2>
                    <label htmlFor="projectName">Project name</label>
                    <input
                      id="projectName"
                      type="text"
                      value={projectName}
                      onChange={(event) => setProjectName(event.target.value)}
                      maxLength={100}
                      placeholder="For example: My school project"
                      required
                    />

                    {projectMessage && <p className="project-message" role="alert">{projectMessage}</p>}

                    <div className="project-form-actions">
                      <button type="submit" disabled={savingProject}>
                        {savingProject ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={closeProjectForm}
                        disabled={savingProject}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <h2 className="projects-heading">Your projects</h2>

                {projectMessage && !projectFormOpen && (
                  <p className="project-message" role="alert">{projectMessage}</p>
                )}

                {loadingProjects ? (
                  <p className="project-status">Loading projects...</p>
                ) : projects.length === 0 ? (
                  <p className="project-status">
                    You don't have any projects yet. Create your first project!
                  </p>
                ) : (
                  <div className="project-grid">
                    {projects.map((project, index) => {
                      const colors = ['green', 'beige', 'lavender']
                      const color = colors[index % colors.length]

                      return (
                        <article className="project-card" key={project.id}>
                          <div className={`project-visual ${color}`} />
                          <h3># {project.name}</h3>
                          <p>View and organize the tasks in this project.</p>

                          <div className="project-actions">
                            <button type="button" onClick={() => openProject(project)}>
                              Open project
                            </button>
                            <button type="button" onClick={() => openEditProjectForm(project)}>
                              Edit
                            </button>
                            <button type="button" onClick={() => handleDeleteProject(project)}>
                              Delete
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="dashboard-heading">
                  <div>
                    <button type="button" className="back-button" onClick={closeProject}>
                      ← Back to projects
                    </button>
                    <p className="dashboard-date">PROJECT</p>
                    <h1>{selectedProject.name}</h1>
                    <p className="dashboard-subtitle">
                      Manage the tasks in this project.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="new-project-button"
                    onClick={openNewTaskForm}
                  >
                    + New task
                  </button>
                </div>

                {taskFormOpen && (
                  <form className="project-form task-form" onSubmit={handleSaveTask}>
                    <h2>{editingTaskId !== null ? 'Edit task' : 'Create new task'}</h2>

                    <label htmlFor="taskTitle">Task title</label>
                    <input
                      id="taskTitle"
                      type="text"
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      maxLength={200}
                      placeholder="For example: Prepare presentation"
                      required
                    />

                    <label htmlFor="taskDescription">Description</label>
                    <textarea
                      id="taskDescription"
                      value={taskDescription}
                      onChange={(event) => setTaskDescription(event.target.value)}
                      placeholder="Describe this task (optional)"
                      rows={3}
                    />

                    <label htmlFor="taskStatus">Status</label>
                    <select
                      id="taskStatus"
                      value={taskStatus}
                      onChange={(event) => setTaskStatus(event.target.value)}
                    >
                      {taskStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>

                    {taskMessage && <p className="project-message" role="alert">{taskMessage}</p>}

                    <div className="project-form-actions">
                      <button type="submit" disabled={savingTask}>
                        {savingTask ? 'Saving...' : 'Save task'}
                      </button>
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={closeTaskForm}
                        disabled={savingTask}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <h2 className="projects-heading">Tasks</h2>

                {taskMessage && !taskFormOpen && (
                  <p className="project-message" role="alert">{taskMessage}</p>
                )}

                {loadingTasks ? (
                  <p className="project-status">Loading tasks...</p>
                ) : tasks.length === 0 ? (
                  <p className="project-status">
                    There are no tasks in this project yet. Create your first task!
                  </p>
                ) : (
                  <div className="task-grid">
                    {tasks.map((task) => (
                      <article className="task-card" key={task.id}>
                        <h3>{task.title}</h3>
                        <p>{task.description || 'No description provided.'}</p>

                        <label htmlFor={`status-${task.id}`}>Status</label>
                        <select
                          id={`status-${task.id}`}
                          value={task.status}
                          onChange={(event) => handleUpdateTaskStatus(task, event.target.value)}
                        >
                          {taskStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>

                        <div className="project-actions">
                          <button type="button" onClick={() => openEditTaskForm(task)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteTask(task)}>
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      )}
    </div>
  )
}

export default App
