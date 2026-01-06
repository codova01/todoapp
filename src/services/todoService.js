import { supabase } from '../supabaseClient'

export async function fetchTodos(userId) {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createTodo(text, userId) {
  const { data, error } = await supabase
    .from('todos')
    .insert([{ text, completed: false, user_id: userId }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTodo(id, patch) {
  const { data, error } = await supabase
    .from('todos')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTodo(id) {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export function subscribeToTodos(userId, onChange) {
  const channel = supabase
    .channel('public:todos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${userId}` }, (payload) => {
      onChange(payload)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
