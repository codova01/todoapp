import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { fetchTodos, createTodo, updateTodo, deleteTodo, subscribeToTodos } from '../services/todoService'

function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className={`todo-item ${todo.completed ? 'done' : ''}`}>
      <label>
        <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id, !todo.completed)} />
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
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Auth state
  useEffect(() => {
    let mounted = true
    async function getSession() {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setUser(data.session?.user ?? null)
    }
    getSession()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      mounted = false
      if (listener?.subscription) listener.subscription.unsubscribe()
    }
  }, [])

  // Load todos when user changes
  useEffect(() => {
    if (!user) {
      setTodos([])
      return
    }

    let unsub = null
    setLoading(true)
    fetchTodos(user.id)
      .then(setTodos)
      .catch(err => setMessage(err.message))
      .finally(() => setLoading(false))

    unsub = subscribeToTodos(user.id, () => {
      fetchTodos(user.id).then(setTodos).catch(err => setMessage(err.message))
    })

    return () => {
      if (unsub) unsub()
    }
  }, [user])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!text.trim() || !user) return
    setLoading(true)
    try {
      await createTodo(text.trim(), user.id)
      setText('')
      // real-time will sync the list
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id, completed) => {
    if (!user) return
    try {
      await updateTodo(id, { completed })
    } catch (err) {
      setMessage(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!user) return
    try {
      await deleteTodo(id)
    } catch (err) {
      setMessage(err.message)
    }
  }

  const clearCompleted = async () => {
    if (!user) return
    try {
      const completedIds = todos.filter(t => t.completed).map(t => t.id)
      await Promise.all(completedIds.map(id => deleteTodo(id)))
    } catch (err) {
      setMessage(err.message)
    }
  }

  const visible = todos.filter(t => filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed)

  const signIn = async () => {
    if (!email.trim()) return setMessage('Enter an email')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() })
    if (error) setMessage(error.message)
    else setMessage('Check your email for the sign-in link')
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="todo-app">
      {!user ? (
        <div className="auth">
          <h3>Sign in to sync your todos</h3>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <button onClick={signIn} disabled={loading}>Send sign-in link</button>
          {message && <p className="message">{message}</p>}
        </div>
      ) : (
        <div className="auth">
          <p className="signed-in">Signed in as <strong>{user.email}</strong></p>
          <button onClick={signOut}>Sign out</button>
        </div>
      )}

      {user && (
        <>
          <form onSubmit={handleAdd} className="add-form">
            <input placeholder="Add a todo" value={text} onChange={e => setText(e.target.value)} />
            <button type="submit" disabled={loading}>Add</button>
          </form>

          <ul className="todo-list">
            {visible.map(todo => (
              <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
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
              <button
                className="clear-completed"
                onClick={clearCompleted}
                disabled={!todos.some(t => t.completed)}
                aria-disabled={!todos.some(t => t.completed)}
                title="Clear completed todos"
              >
                Clear completed
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
