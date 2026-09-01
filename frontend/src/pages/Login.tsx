import React, { useState } from 'react'
import { Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography, Alert } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { login, LoginRequest } from '../api/auth'
import { useNavigate, Link } from 'react-router-dom'

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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setWarning('Email and password are required')
      return
    }
    setWarning(null)
    mutation.mutate({ email, password })
  }

  const serverMessage = (mutation.error as any)?.response?.data?.message || 'Unable to sign in.'

  return (
    <Box sx={{ minHeight: 'calc(100vh - 112px)', display: 'grid', placeItems: 'center' }}>
      <Card sx={{ width: '100%', maxWidth: 460 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h4">FinFlow</Typography>
              <Typography color="text.secondary">Welcome back. Sign in to your banking dashboard.</Typography>
            </Box>
            {warning && <Alert severity="warning">{warning}</Alert>}
            {mutation.isError && <Alert severity="error">{serverMessage}</Alert>}
            <form onSubmit={onSubmit}>
              <Stack spacing={2}>
                <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button type="submit" variant="contained" size="large" disabled={mutation.isPending}>
                  {mutation.isPending ? <CircularProgress size={20} /> : 'Login'}
                </Button>
              </Stack>
            </form>
            <Typography variant="body2" color="text.secondary">
              New to FinFlow? <Button component={Link} to="/register" size="small">Create an account</Button>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
