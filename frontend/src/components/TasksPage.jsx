import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import TaskForm from './TaskForm.jsx';
import TaskList from './TaskList.jsx';

export default function TasksPage({ onUnauthorized }) {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [error, setError] = useState('');

  const handleError = useCallback(
    (err) => {
      if (err.status === 401) onUnauthorized();
      else setError(err.message);
    },
    [onUnauthorized],
  );

  const loadTasks = useCallback(() => {
    api.listTasks(filters).then(setTasks).catch(handleError);
  }, [filters, handleError]);

  useEffect(loadTasks, [loadTasks]);

  // Wraps an API call: clears the error, runs it, reloads the list. Resolves to true on success.
  async function run(action) {
    setError('');
    try {
      await action();
      loadTasks();
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }

  return (
    <div className="tasks-page">
      <TaskForm onCreate={(task) => run(() => api.createTask(task))} />

      {error && (
        <div className="error-banner">
          <strong>API error:</strong> {error}
        </div>
      )}

      <section className="card">
        <div className="toolbar">
          <h2>My tasks</h2>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
          <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <TaskList
          tasks={tasks}
          onStatusChange={(id, status) => run(() => api.updateTask(id, { status }))}
          onDelete={(id) => run(() => api.deleteTask(id))}
        />
      </section>

      <section className="card demo">
        <h2>Try the validation</h2>
        <p className="muted">
          These requests bypass the form and send bad data straight to the API. NestJS rejects them using only the
          decorators on the DTO classes — no hand-written validation code.
        </p>
        <div className="demo-buttons">
          <button className="secondary" onClick={() => run(() => api.createTask({ title: '', priority: 'urgent' }))}>
            Empty title + bad priority
          </button>
          <button className="secondary" onClick={() => run(() => api.createTask({ title: 'Hi', isAdmin: true }))}>
            Unknown field
          </button>
          <button className="secondary" onClick={() => run(() => api.updateTask(9999, { status: 'done' }))}>
            Missing task (404)
          </button>
        </div>
      </section>
    </div>
  );
}
