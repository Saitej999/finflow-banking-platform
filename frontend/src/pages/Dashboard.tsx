import React, { useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../api/auth'
import { AccountResponse, AccountType, createAccount, getMyAccounts } from '../api/accounts'
import { createTransfer, getMyTransactions, TransactionResponse } from '../api/transactions'

type TxFilter = 'ALL' | 'COMPLETED' | 'FAILED' | 'PENDING'

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [accountType, setAccountType] = useState<AccountType>('CHECKING')
  const [currency, setCurrency] = useState('USD')
  const [createError, setCreateError] = useState<string | null>(null)
  const [transferError, setTransferError] = useState<string | null>(null)
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [selectedSourceAccountId, setSelectedSourceAccountId] = useState('')
  const [destinationAccountId, setDestinationAccountId] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [historyFilter, setHistoryFilter] = useState<TxFilter>('ALL')
  const [showOwnAccountDestinations, setShowOwnAccountDestinations] = useState(false)
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({})

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

  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: getMyTransactions,
    retry: false
  })

  const createAccountMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      setIsCreateDialogOpen(false)
      setAccountType('CHECKING')
      setCurrency('USD')
      setCreateError(null)
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    }
  })

  const transferMutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      setIsTransferDialogOpen(false)
      setSelectedSourceAccountId('')
      setDestinationAccountId('')
      setTransferAmount('')
      setTransferError(null)
      setTransferSuccess('Transfer completed successfully.')
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })

  const user = query.data
  const accounts = accountsQuery.data ?? []
  const transactions = transactionsQuery.data ?? []
  const selectedSourceAccount = accounts.find((account) => account.id === selectedSourceAccountId) ?? null
  const filteredTransactions = useMemo(() => {
    if (historyFilter === 'ALL') return transactions
    return transactions.filter((transaction) => transaction.status === historyFilter)
  }, [historyFilter, transactions])

  React.useEffect(() => {
    const userStatus = (query.error as any)?.response?.status
    const accountsStatus = (accountsQuery.error as any)?.response?.status
    if (userStatus === 401 || accountsStatus === 401) {
      localStorage.removeItem('finflow_access_token')
      navigate('/login')
    }
  }, [query.error, accountsQuery.error, navigate])

  React.useEffect(() => {
    if (!accounts.length) return
    if (!selectedSourceAccountId || !accounts.some((account) => account.id === selectedSourceAccountId)) {
      setSelectedSourceAccountId(accounts[0].id)
    }
  }, [accounts, selectedSourceAccountId])

  function formatMoney(value: number, currencyCode: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(value)
  }

  function maskAccountNumber(accountNumber: string): string {
    return `•••• ${accountNumber.slice(-4)}`
  }

  function shortId(value: string): string {
    if (value.length <= 12) return value
    return `${value.slice(0, 8)}…${value.slice(-4)}`
  }

  function shortTransactionRef(value: string): string {
    if (value.length <= 8) return value
    return `…${value.slice(-4)}`
  }

  function copyToClipboard(value: string) {
    navigator.clipboard.writeText(value).then(() => setCopySuccess('Account ID copied')).catch(() => setCopySuccess('Unable to copy Account ID'))
  }

  function onSubmitTransfer() {
    const sourceAccount = accounts.find((account) => account.id === selectedSourceAccountId) ?? null
    const parsedAmount = Number(transferAmount)
    const destination = destinationAccountId.trim()

    setTransferError(null)

    if (!sourceAccount) {
      setTransferError('Please select a valid source account.')
      return
    }
    if (!destination) {
      setTransferError('Destination account ID is required.')
      return
    }
    if (destination === sourceAccount.id) {
      setTransferError('Source and destination accounts must be different.')
      return
    }
    if (!transferAmount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setTransferError('Amount must be greater than zero.')
      return
    }

    transferMutation.mutate(
      {
        sourceAccountId: sourceAccount.id,
        destinationAccountId: destination,
        amount: parsedAmount,
        currency: sourceAccount.currency
      },
      {
        onError: (error: any) => {
          const status = error?.response?.status
          if (status === 400) setTransferError('Invalid transfer request.')
          else if (status === 403) setTransferError('You are not authorized to transfer from this account.')
          else if (status === 404) setTransferError('Destination account could not be found.')
          else if (status === 409) setTransferError('Transfer could not be completed. Check the available balance, account status, and currency.')
          else setTransferError('Unable to complete transfer.')
        }
      }
    )
  }

  function onCreateAccount() {
    setCreateError(null)
    createAccountMutation.mutate(
      { accountType, currency: currency.trim().toUpperCase() },
      {
        onError: () => setCreateError('Unable to create account.')
      }
    )
  }

  const summaryCards = [
    { label: 'Total Accounts', value: accounts.length.toString(), helper: 'Your active FinFlow accounts' },
    {
      label: 'Available Balance',
      value: accounts.length === 0 ? '$0.00' : formatMoney(accounts.reduce((sum, account) => sum + Number(account.balance), 0), accounts[0]?.currency ?? 'USD'),
      helper: 'Shown across your current currency set'
    },
    { label: 'Recent Transactions', value: transactions.length.toString(), helper: 'Latest ledger activity' }
  ]

  const historyPage = (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mb: 2 }}>
          {(['ALL', 'COMPLETED', 'FAILED', 'PENDING'] as TxFilter[]).map((filter) => (
            <Button key={filter} variant={historyFilter === filter ? 'contained' : 'outlined'} onClick={() => setHistoryFilter(filter)}>
              {filter}
            </Button>
          ))}
        </Stack>
        {filteredTransactions.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>No transactions yet</Typography>
            <Typography color="text.secondary">Your transfers will appear here.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((transaction: TransactionResponse) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell><Chip size="small" label={transaction.status} color={transaction.status === 'COMPLETED' ? 'success' : transaction.status === 'FAILED' ? 'error' : 'warning'} /></TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{formatMoney(Number(transaction.amount), transaction.currency)}</TableCell>
                    <TableCell><Tooltip title={transaction.sourceAccountId}><span>{shortTransactionRef(transaction.sourceAccountId)}</span></Tooltip></TableCell>
                    <TableCell><Tooltip title={transaction.destinationAccountId}><span>{shortTransactionRef(transaction.destinationAccountId)}</span></Tooltip></TableCell>
                    <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  )

  if (query.isPending) {
    return <Container maxWidth="lg" sx={{ py: 4 }}><Skeleton variant="rectangular" height={320} /></Container>
  }

  if (query.isError || !user) {
    return <Container maxWidth="lg" sx={{ py: 4 }}><Alert severity="error">Unable to load dashboard. Please login again.</Alert></Container>
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Good morning, {user.firstName}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>Here's an overview of your FinFlow accounts.</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">Profile</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>{user.firstName[0]?.toUpperCase()}</Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{user.firstName} {user.lastName}</Typography>
                  <Typography color="text.secondary">{user.email}</Typography>
                </Box>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip label={user.role} variant="outlined" />
              <Chip label={user.status} color="success" />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Card key={card.label} sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">{card.label}</Typography>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 800 }}>{card.value}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{card.helper}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
        <Button variant="contained" size="large" onClick={() => setIsTransferDialogOpen(true)} disabled={!accounts.length}>Transfer Money</Button>
        <Button variant="outlined" size="large" onClick={() => setIsCreateDialogOpen(true)}>Create Account</Button>
      </Stack>

      <Typography variant="h5" sx={{ mb: 2 }}>My Accounts</Typography>
      {accountsQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Unable to load your accounts right now.</Alert>}
      {accountsQuery.isPending ? (
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={156} />
          <Skeleton variant="rectangular" height={156} />
        </Stack>
      ) : accounts.length === 0 ? (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>No accounts yet</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>Create your first checking or savings account to get started.</Typography>
            <Button variant="contained" onClick={() => setIsCreateDialogOpen(true)}>Create Account</Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2} sx={{ mb: 4 }}>
          {accounts.map((account: AccountResponse) => {
            const expanded = expandedAccounts[account.id] ?? false
            return (
              <Card key={account.id}>
                <CardContent>
                  <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{account.accountType}</Typography>
                        <Chip size="small" label={account.status} color="success" />
                      </Stack>
                      <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{formatMoney(Number(account.balance), account.currency)}</Typography>
                      <Typography color="text.secondary">{account.currency}</Typography>
                      <Typography sx={{ mt: 1.5 }}>Masked Number: <strong>{maskAccountNumber(account.accountNumber)}</strong></Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">Account ID</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{shortId(account.id)}</Typography>
                        <Tooltip title="Copy Account ID"><IconButton size="small" onClick={() => copyToClipboard(account.id)} aria-label={`Copy account ID for ${account.accountNumber}`}>⧉</IconButton></Tooltip>
                        <Button size="small" onClick={() => setExpandedAccounts((prev) => ({ ...prev, [account.id]: !expanded }))}>{expanded ? 'Hide Details' : 'View Details'}</Button>
                      </Stack>
                    </Box>
                    <Stack spacing={1} sx={{ minWidth: { xs: '100%', md: 240 } }}>
                      <Button variant="outlined" onClick={() => setIsTransferDialogOpen(true)}>Transfer From This Account</Button>
                    </Stack>
                  </Stack>
                  {expanded && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="body2"><strong>Account ID:</strong> {account.id}</Typography>
                      <Typography variant="body2"><strong>Account Number:</strong> {account.accountNumber}</Typography>
                      <Typography variant="body2"><strong>Account Type:</strong> {account.accountType}</Typography>
                      <Typography variant="body2"><strong>Currency:</strong> {account.currency}</Typography>
                      <Typography variant="body2"><strong>Status:</strong> {account.status}</Typography>
                      <Typography variant="body2"><strong>Created:</strong> {new Date(account.createdAt).toLocaleString()}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}

      <Typography variant="h5" sx={{ mb: 2 }}>Recent Transactions</Typography>
      {transactionsQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Unable to load your transactions right now.</Alert>}
      {transactionsQuery.isPending ? <Skeleton variant="rectangular" height={260} /> : historyPage}

      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Account</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {createError && <Alert severity="error">{createError}</Alert>}
            <FormControl fullWidth>
              <InputLabel id="account-type-label">Account Type</InputLabel>
              <Select labelId="account-type-label" label="Account Type" value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)}>
                <MenuItem value="CHECKING">CHECKING</MenuItem>
                <MenuItem value="SAVINGS">SAVINGS</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} helperText="Use 3-letter currency code." />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onCreateAccount} disabled={createAccountMutation.isPending}>{createAccountMutation.isPending ? 'Creating...' : 'Create Account'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isTransferDialogOpen} onClose={() => setIsTransferDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Transfer Money</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography color="text.secondary">Send money between FinFlow accounts.</Typography>
            {transferError && <Alert severity="error">{transferError}</Alert>}
            <FormControl fullWidth>
              <InputLabel id="source-account">From Account</InputLabel>
              <Select
                labelId="source-account"
                label="From Account"
                value={selectedSourceAccountId}
                onChange={(e) => setSelectedSourceAccountId(e.target.value)}
              >
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.accountType} {maskAccountNumber(account.accountNumber)} — Available: {formatMoney(Number(account.balance), account.currency)} {account.currency}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1}>
              <Button variant={showOwnAccountDestinations ? 'contained' : 'outlined'} onClick={() => setShowOwnAccountDestinations(true)} sx={{ flex: 1 }}>Transfer between my accounts</Button>
              <Button variant={!showOwnAccountDestinations ? 'contained' : 'outlined'} onClick={() => setShowOwnAccountDestinations(false)} sx={{ flex: 1 }}>Another FinFlow account</Button>
            </Stack>
            {showOwnAccountDestinations ? (
              <FormControl fullWidth>
                <InputLabel id="dest-account">Destination Account</InputLabel>
                <Select
                  labelId="dest-account"
                  label="Destination Account"
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                >
                  {accounts.filter((account) => account.id !== selectedSourceAccountId).map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.accountType} {shortId(account.id)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                label="Destination Account ID"
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                helperText="Paste the recipient's FinFlow Account ID. They can copy it from their dashboard."
              />
            )}
            <TextField
              label="Amount"
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">{selectedSourceAccount?.currency ?? 'USD'}</InputAdornment>
              }}
              helperText={selectedSourceAccount ? `Available balance: ${formatMoney(Number(selectedSourceAccount.balance), selectedSourceAccount.currency)} ${selectedSourceAccount.currency}` : undefined}
            />
            {selectedSourceAccount && destinationAccountId && transferAmount && Number(transferAmount) > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Transfer Summary</Typography>
                  <Typography variant="body2"><strong>From:</strong> {selectedSourceAccount.accountType} {maskAccountNumber(selectedSourceAccount.accountNumber)}</Typography>
                  <Typography variant="body2"><strong>To:</strong> {shortId(destinationAccountId)}</Typography>
                  <Typography variant="body2"><strong>Amount:</strong> {formatMoney(Number(transferAmount), selectedSourceAccount.currency)} {selectedSourceAccount.currency}</Typography>
                </CardContent>
              </Card>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTransferDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onSubmitTransfer} disabled={transferMutation.isPending || !selectedSourceAccount}>
            {transferMutation.isPending ? <CircularProgress size={20} /> : 'Submit Transfer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(copySuccess)} autoHideDuration={2500} onClose={() => setCopySuccess(null)} message={copySuccess} />
      <Snackbar open={Boolean(transferSuccess)} autoHideDuration={3000} onClose={() => setTransferSuccess(null)} message={transferSuccess} />
    </Container>
  )
}
