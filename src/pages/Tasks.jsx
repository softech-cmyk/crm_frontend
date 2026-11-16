import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import "./Tasks.css";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  const load = () => {
    apiFetch(`${API_BASE}/api/tasks`)
      .then((res) => res.json())
      .then((data) => setTasks(data.tasks || []))
      .catch(() => {});
  };

  useEffect(load, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await apiFetch(`${API_BASE}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setTitle("");
    load();
  };

  const toggle = async (task) => {
    await apiFetch(`${API_BASE}/api/tasks/${task._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    load();
  };

  const remove = async (task) => {
    await apiFetch(`${API_BASE}/api/tasks/${task._id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="tasks-page">
      <h1 className="tasks-title">Tasks</h1>
      <form className="tasks-form" onSubmit={addTask}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task" />
        <button type="submit" className="btn-primary">
          Add
        </button>
      </form>
      <ul className="tasks-list">
        {tasks.map((task) => (
          <li key={task._id} className={task.done ? "done" : ""}>
            <label>
              <input type="checkbox" checked={task.done} onChange={() => toggle(task)} />
              <span>{task.title}</span>
            </label>
            <button
              type="button"
              className="tasks-delete"
              onClick={() => remove(task)}
              aria-label="Delete task"
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
        {tasks.length === 0 && <li className="tasks-empty">No tasks yet.</li>}
      </ul>
    </div>
  );
}

export default Tasks;
