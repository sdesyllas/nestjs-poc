export default function TaskList({ tasks, onStatusChange, onDelete }) {
  if (tasks.length === 0) {
    return <p className="muted">No tasks match.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id} className={`task ${task.status}`}>
          <div className="task-main">
            <span className={`badge ${task.priority}`}>{task.priority}</span>
            <div>
              <div className="task-title">{task.title}</div>
              {task.description && <div className="muted">{task.description}</div>}
            </div>
          </div>
          <div className="task-actions">
            <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value)}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
            <button className="danger" onClick={() => onDelete(task.id)}>
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
