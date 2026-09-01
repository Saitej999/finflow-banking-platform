import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finflow_access_token')

  if (!token) return config

  const existingAuth = config.headers?.Authorization
  if (existingAuth) return config

  config.headers = config.headers ?? {}
  config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
