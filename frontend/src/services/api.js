import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' }
})

export const compileCode = (code, stdin = '') =>
  api.post('/compile', {
    code,
    stdin,
    options: { assembly: true, machine_code: true, execute: true }
  })

export const getHistory  = ()    => api.get('/history')
export const getHistoryEntry = (id) => api.get(`/history/${id}`)

export default api
