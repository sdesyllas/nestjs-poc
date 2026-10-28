import { useState } from 'react';

const EMPTY = { title: '', description: '', priority: 'medium' };

export default function TaskForm({ onCreate }) {
  const [task, setTask] = useState(EMPTY);

  async function handleSubmit(event) {
    event.preventDefault();
    if (await onCreate(task)) setTask(EMPTY);
  }

  const update = (field) => (event) => setTask({ ...task, [field]: event.target.value });

  return (
    <form className="card task-form" onSubmit={handleSubmit}>
      <h2>New task</h2>
      <input placeholder="Title" value={task.title} onChange={update('title')} />
      <input placeholder="Description (optional)" value={task.description} onChange={update('description')} />
      <select value={task.priority} onChange={update('priority')}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button type="submit">Add</button>
    </form>
  );
}
