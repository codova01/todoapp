import React, { useState, useEffect } from 'react'

function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className={`todo-item ${todo.completed ? 'done' : ''}`}>
      <label>
        <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)} />
        <span>{todo.text}</span>
      </label>
      <button className="delete" onClick={() => onDelete(todo.id)}>×</button>
    </li>
  )
}

export default function TodoApp() {
  const [todos, setTodos] = useState([])
  const [text, setText] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const saved = localStorage.getItem('todos')
    if (saved) setTodos(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setTodos([{ id: Date.now(), text: text.trim(), completed: false }, ...todos])
    setText('')
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id))
  }

  const clearCompleted = () => {
    setTodos(todos.filter(t => !t.completed))
  }

  const visible = todos.filter(t => filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed)

  return (
    <div className="todo-app">
      <form onSubmit={addTodo} className="add-form">
        <input placeholder="Add a todo" value={text} onChange={e => setText(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      <ul className="todo-list">
        {visible.map(todo => (
          <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
        ))}
        {visible.length === 0 && <li className="empty">No todos</li>}
      </ul>

      <div className="controls">
        <div className="filters">
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
          <button onClick={() => setFilter('active')} className={filter === 'active' ? 'active' : ''}>Active</button>
          <button onClick={() => setFilter('completed')} className={filter === 'completed' ? 'active' : ''}>Completed</button>
        </div>
        <div className="actions">
          <span>{todos.filter(t => !t.completed).length} items left</span>
          <button onClick={clearCompleted}>Clear completed</button>
        </div>
      </div>
    </div>
  )
}
