import React, { useState } from 'react'
import { TextField, Button, Box, Alert, CircularProgress } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { login, LoginRequest } from '../api/auth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [warning, setWarning] = useState<string | null>(null)
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (data) => {
      localStorage.setItem('finflow_access_token', data.accessToken)
      navigate('/dashboard')
    }
  })

  function validate(): boolean {
    if (!email.trim() || !password.trim()) {
      setWarning('Email and password are required')
      return false
    }
    setWarning(null)
    return true
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate({ email, password })
  }

  const axiosError = mutation.error as any
  const response = axiosError?.response
  let serverMessage: string | null = null
  if (response) {
    if (response.status === 401) {
      serverMessage = response.data?.message || 'Invalid email or password'
    } else if (response.status === 400) {
      serverMessage = response.data?.message || JSON.stringify(response.data) || 'Validation error'
    } else {
      serverMessage = response.data?.message || axiosError?.message || 'Login failed'
    }
  } else if (mutation.isError) {
    serverMessage = 'Unable to reach the server. Please try again.'
  }

  return (
    <Box sx={{ maxWidth: 480, margin: '24px auto', padding: 2 }}>
      <h2>Login</h2>
      {warning && <Alert severity="warning" sx={{ mb: 2 }}>{warning}</Alert>}
      {mutation.isError && <Alert severity="error" sx={{ mb: 2 }}>{String(serverMessage)}</Alert>}
      <form onSubmit={onSubmit}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <Button variant="contained" type="submit" disabled={mutation.isPending}>
            Login
          </Button>
          {mutation.isPending && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Box>
      </form>
    </Box>
  )
}
