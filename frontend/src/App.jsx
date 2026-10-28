import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import LoginForm from './components/LoginForm.jsx';
import TasksPage from './components/TasksPage.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(Boolean(getToken()));

  // Restore the session if a token is already stored.
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setCheckingSession(false));
  }, []);

  function handleLogin({ accessToken, user }) {
    setToken(accessToken);
    setUser(user);
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>NestJS + React Tasks</h1>
        <nav>
          <a href="http://localhost:3000/api/docs" target="_blank" rel="noreferrer">
            Swagger docs ↗
          </a>
          {user && (
            <>
              <span className="muted">Signed in as {user.displayName ?? user.username}</span>
              <button className="secondary" onClick={handleLogout}>
                Log out
              </button>
            </>
          )}
        </nav>
      </header>

      <main>
        {checkingSession ? (
          <p className="muted">Loading…</p>
        ) : user ? (
          <TasksPage onUnauthorized={handleLogout} />
        ) : (
          <LoginForm onLogin={handleLogin} />
        )}
      </main>
    </div>
  );
}
