import React, { useEffect, useState } from 'react'
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Container, Snackbar, Stack, TextField, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentUser, updateCurrentUser } from '../api/auth'

export default function AccountPage() {
  const queryClient = useQueryClient()
  const userQuery = useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser, retry: false })
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [snack, setSnack] = useState<string | null>(null)

  useEffect(() => {
    if (userQuery.data) {
      setFirstName(userQuery.data.firstName)
      setLastName(userQuery.data.lastName)
    }
  }, [userQuery.data])

  const mutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: () => {
      setSnack('Profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    }
  })

  if (userQuery.isPending || !userQuery.data) {
    return <Typography>Loading account...</Typography>
  }

  const user = userQuery.data

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({ firstName: firstName.trim(), lastName: lastName.trim() })
  }

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Account</Typography>
          <Typography color="text.secondary">Manage your FinFlow profile.</Typography>
        </Box>

        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 64, height: 64 }}>{user.firstName[0]?.toUpperCase()}</Avatar>
                <Box>
                  <Typography variant="h5">{user.firstName} {user.lastName}</Typography>
                  <Typography color="text.secondary">{user.email}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Chip label={user.role} />
                <Chip label={user.status} color="success" />
              </Stack>
              <form onSubmit={onSubmit}>
                <Stack spacing={2}>
                  <TextField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  <TextField label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  <Stack direction="row" spacing={1}>
                    <Button type="submit" variant="contained" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
                  </Stack>
                </Stack>
              </form>
            </Stack>
          </CardContent>
        </Card>

        {mutation.isError && <Alert severity="error">Unable to update profile.</Alert>}
      </Stack>
      <Snackbar open={Boolean(snack)} autoHideDuration={2500} onClose={() => setSnack(null)} message={snack} />
    </Container>
  )
}
