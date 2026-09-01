import React, { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { registerUser, RegisterUserRequest } from '../api/auth'
import { Link, useNavigate } from 'react-router-dom'

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (payload: RegisterUserRequest) => registerUser(payload),
    onSuccess: () => navigate('/login')
  })

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setClientError('All fields are required')
      return
    }
    if (password.length < 8) {
      setClientError('Password must be at least 8 characters')
      return
    }
    setClientError(null)
    mutation.mutate({ firstName, lastName, email, password })
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 112px)', display: 'grid', placeItems: 'center' }}>
      <Card sx={{ width: '100%', maxWidth: 480 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h4">Create your account</Typography>
              <Typography color="text.secondary">Join FinFlow and start managing your accounts.</Typography>
            </Box>
            {clientError && <Alert severity="warning">{clientError}</Alert>}
            {mutation.isError && <Alert severity="error">{(mutation.error as any)?.response?.data?.message || 'Unable to register.'}</Alert>}
            <form onSubmit={onSubmit}>
              <Stack spacing={2}>
                <TextField fullWidth label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <TextField fullWidth label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button type="submit" variant="contained" size="large" disabled={mutation.isPending}>
                  {mutation.isPending ? <CircularProgress size={20} /> : 'Register'}
                </Button>
              </Stack>
            </form>
            <Typography variant="body2" color="text.secondary">
              Already have an account? <Button component={Link} to="/login" size="small">Login</Button>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
