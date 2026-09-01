import React, { useEffect, useState } from 'react'
import { Box, Alert, Button, CircularProgress, Typography, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../api/auth'
import { AccountType, createAccount, getMyAccounts } from '../api/accounts'

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [accountType, setAccountType] = useState<AccountType>('CHECKING')
  const [currency, setCurrency] = useState('USD')
  const [createError, setCreateError] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    retry: false
  })
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: getMyAccounts,
    retry: false
  })
  const createAccountMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      setIsCreateDialogOpen(false)
      setAccountType('CHECKING')
      setCurrency('USD')
      setCreateError(null)
      queryClient.invalidateQueries({
        queryKey: ['accounts']
      })
    }
  })

  useEffect(() => {
    const userStatus = (query.error as any)?.response?.status
    const accountsStatus = (accountsQuery.error as any)?.response?.status
    if (userStatus === 401 || accountsStatus === 401) {
      localStorage.removeItem('finflow_access_token')
      navigate('/login')
    }
  }, [query.error, accountsQuery.error, navigate])

  function onLogout() {
    localStorage.removeItem('finflow_access_token')
    navigate('/login')
  }

  function onOpenCreateDialog() {
    setCreateError(null)
    setIsCreateDialogOpen(true)
  }

  function onCloseCreateDialog() {
    if (createAccountMutation.isPending) return
    setIsCreateDialogOpen(false)
    setCreateError(null)
  }

  function onCreateAccount() {
    setCreateError(null)
    createAccountMutation.mutate(
      {
        accountType,
        currency: currency.trim().toUpperCase()
      },
      {
        onError: (error: any) => {
          const status = error?.response?.status
          if (status === 401) {
            localStorage.removeItem('finflow_access_token')
            navigate('/login')
            return
          }
          if (status === 400) {
            setCreateError('Invalid account request. Please review your input.')
            return
          }
          if (error?.response) {
            setCreateError('Unable to create account. Please try again.')
            return
          }
          setCreateError('Unable to reach the server.')
        }
      }
    )
  }

  if (query.isPending) {
    return (
      <Box sx={{ padding: 3, display: 'flex', alignItems: 'center' }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Loading dashboard...</Typography>
      </Box>
    )
  }

  if (query.isError) {
    return (
      <Box sx={{ maxWidth: 560, margin: '24px auto', padding: 2 }}>
        <Alert severity="error">
          Unable to load dashboard. Please login again.
        </Alert>
      </Box>
    )
  }

  const user = query.data
  const accounts = accountsQuery.data ?? []

  function maskAccountNumber(accountNumber: string): string {
    const last4 = accountNumber.slice(-4)
    return `•••• ${last4}`
  }

  function formatBalance(balance: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(balance)
  }

  return (
    <Box sx={{ maxWidth: 560, margin: '24px auto', padding: 2 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>FinFlow</Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>Welcome, {user.firstName}</Typography>
      <Typography sx={{ mb: 1 }}>Email: {user.email}</Typography>
      <Typography sx={{ mb: 1 }}>Role: {user.role}</Typography>
      <Typography sx={{ mb: 3 }}>Status: {user.status}</Typography>

      <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>My Accounts</Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={onOpenCreateDialog}>
        Create Account
      </Button>

      {accountsQuery.isPending && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1.5 }} />
          <Typography>Loading accounts...</Typography>
        </Box>
      )}

      {accountsQuery.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Unable to load your accounts right now.
        </Alert>
      )}

      {!accountsQuery.isPending && !accountsQuery.isError && accounts.length === 0 && (
        <Typography sx={{ mb: 2 }}>You don't have any accounts yet.</Typography>
      )}

      {!accountsQuery.isPending && !accountsQuery.isError && accounts.map((account) => (
        <Card key={account.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{account.accountType}</Typography>
            <Typography sx={{ mb: 0.5 }}>{maskAccountNumber(account.accountNumber)}</Typography>
            <Typography sx={{ mb: 0.5 }}>{formatBalance(account.balance, account.currency)} {account.currency}</Typography>
            <Typography color="text.secondary">{account.status}</Typography>
          </CardContent>
        </Card>
      ))}

      <Button variant="outlined" onClick={onLogout}>Logout</Button>

      <Dialog open={isCreateDialogOpen} onClose={onCloseCreateDialog} fullWidth maxWidth="sm">
        <DialogTitle>Create Account</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              {createError}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel id="account-type-label">Account Type</InputLabel>
            <Select
              labelId="account-type-label"
              label="Account Type"
              value={accountType}
              onChange={(event) => setAccountType(event.target.value as AccountType)}
              disabled={createAccountMutation.isPending}
            >
              <MenuItem value="CHECKING">CHECKING</MenuItem>
              <MenuItem value="SAVINGS">SAVINGS</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            disabled={createAccountMutation.isPending}
            helperText="Use 3-letter currency code (default: USD)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseCreateDialog} disabled={createAccountMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={onCreateAccount} variant="contained" disabled={createAccountMutation.isPending}>
            {createAccountMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
