import React, { useState } from 'react'
import { TextField, Button, Box, Alert, CircularProgress } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { registerUser, RegisterUserRequest } from '../api/auth'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)

  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (payload: RegisterUserRequest) => registerUser(payload),
    onSuccess: () => {
      navigate('/login')
    }
  })

  function validate(): boolean {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setClientError('All fields are required')
      return false
    }
    if (password.length < 8) {
      setClientError('Password must be at least 8 characters')
      return false
    }
    setClientError(null)
    return true
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    mutation.mutate({ firstName, lastName, email, password })
  }

  const resp = (mutation.error as any)?.response
  let backendError: string | null = null
  if (resp) {
    if (resp.status === 409) {
      backendError = resp.data?.message || 'Email already exists'
    } else if (resp.status === 400) {
      backendError = resp.data?.message || JSON.stringify(resp.data) || 'Validation error'
    } else {
      backendError = resp.data?.message || (mutation.error as any)?.message
    }
  }

  return (
    <Box sx={{ maxWidth: 480, margin: '24px auto', padding: 2 }}>
      <h2>Create Account</h2>

      {clientError && <Alert severity="warning" sx={{ mb: 2 }}>{clientError}</Alert>}
      {mutation.isError && <Alert severity="error" sx={{ mb: 2 }}>{String(backendError)}</Alert>}
      {mutation.isSuccess && <Alert severity="success" sx={{ mb: 2 }}>Registration successful — redirecting to login...</Alert>}

      <form onSubmit={onSubmit}>
        <TextField fullWidth label="First name" margin="normal" value={firstName} onChange={e => setFirstName(e.target.value)} />
        <TextField fullWidth label="Last name" margin="normal" value={lastName} onChange={e => setLastName(e.target.value)} />
        <TextField fullWidth label="Email" type="email" margin="normal" value={email} onChange={e => setEmail(e.target.value)} />
        <TextField fullWidth label="Password" type="password" margin="normal" value={password} onChange={e => setPassword(e.target.value)} />

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <Button variant="contained" type="submit" disabled={mutation.isPending}>
            Register
          </Button>
          {mutation.isPending && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Box>
      </form>
    </Box>
  )
}
