import React, { useMemo, useState } from 'react'
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Skeleton, Snackbar, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../api/auth'
import { AccountResponse, AccountType, createAccount, getMyAccounts } from '../api/accounts'
import { createDeposit, createTransfer, getMyTransactions, TransactionResponse } from '../api/transactions'

type TxFilter = 'ALL' | 'TRANSFER' | 'DEPOSIT'
type StatusFilter = 'ALL' | 'COMPLETED' | 'FAILED' | 'PENDING'

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false)
  const [accountType, setAccountType] = useState<AccountType>('CHECKING')
  const [currency, setCurrency] = useState('USD')
  const [createError, setCreateError] = useState<string | null>(null)
  const [transferError, setTransferError] = useState<string | null>(null)
  const [depositError, setDepositError] = useState<string | null>(null)
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null)
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [selectedSourceAccountId, setSelectedSourceAccountId] = useState('')
  const [destinationAccountId, setDestinationAccountId] = useState('')
  const [depositAccountId, setDepositAccountId] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [typeFilter, setTypeFilter] = useState<TxFilter>('ALL')
  const [showOwnAccountDestinations, setShowOwnAccountDestinations] = useState(false)
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({})

  const query = useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser, retry: false })
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: getMyAccounts, retry: false })
  const transactionsQuery = useQuery({ queryKey: ['transactions'], queryFn: getMyTransactions, retry: false })

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
      setTransferSuccess('Transfer completed successfully')
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })

  const depositMutation = useMutation({
    mutationFn: createDeposit,
    onSuccess: () => {
      setIsDepositDialogOpen(false)
      setDepositAccountId('')
      setDepositAmount('')
      setDepositError(null)
      setDepositSuccess('Deposit completed successfully')
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      clearTransactionFilters()
    }
  })

  const user = query.data
  const accounts = accountsQuery.data ?? []
  const transactions = transactionsQuery.data ?? []
  const selectedSourceAccount = accounts.find((account) => account.id === selectedSourceAccountId) ?? null
  const selectedDepositAccount = accounts.find((account) => account.id === depositAccountId) ?? null

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => (statusFilter === 'ALL' || tx.status === statusFilter) && (typeFilter === 'ALL' || tx.type === typeFilter))
  }, [transactions, statusFilter, typeFilter])
  const hasTransactions = transactions.length > 0
  const hasFilteredTransactions = filteredTransactions.length > 0
  const statusCounts = useMemo(() => transactions.reduce((counts, tx) => {
    counts.ALL += 1
    counts[tx.status] += 1
    return counts
  }, { ALL: 0, COMPLETED: 0, FAILED: 0, PENDING: 0 }), [transactions])
  const typeCounts = useMemo(() => transactions.reduce((counts, tx) => {
    counts.ALL += 1
    counts[tx.type] += 1
    return counts
  }, { ALL: 0, TRANSFER: 0, DEPOSIT: 0 }), [transactions])

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
    if (!selectedSourceAccountId || !accounts.some((a) => a.id === selectedSourceAccountId)) {
      setSelectedSourceAccountId(accounts[0].id)
    }
    if (!depositAccountId || !accounts.some((a) => a.id === depositAccountId)) {
      setDepositAccountId(accounts[0].id)
    }
  }, [accounts, selectedSourceAccountId, depositAccountId])

  function formatMoney(value: number, currencyCode: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(value)
  }

  function maskAccountNumber(accountNumber: string): string {
    return `•••• ${accountNumber.slice(-4)}`
  }

  function shortId(value: string): string {
    return value.length <= 12 ? value : `${value.slice(0, 8)}…${value.slice(-4)}`
  }

  function copyToClipboard(value: string) {
    navigator.clipboard.writeText(value).then(() => setCopySuccess('Account ID copied')).catch(() => setCopySuccess('Unable to copy Account ID'))
  }

  function onSubmitTransfer() {
    const sourceAccount = accounts.find((a) => a.id === selectedSourceAccountId) ?? null
    const parsedAmount = Number(transferAmount)
    const destination = destinationAccountId.trim()
    setTransferError(null)
    if (!sourceAccount) return setTransferError('Please select a valid source account.')
    if (!destination) return setTransferError('Destination account ID is required.')
    if (destination === sourceAccount.id) return setTransferError('Source and destination accounts must be different.')
    if (!transferAmount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return setTransferError('Amount must be greater than zero.')
    transferMutation.mutate({ sourceAccountId: sourceAccount.id, destinationAccountId: destination, amount: parsedAmount, currency: sourceAccount.currency }, {
      onError: (error: any) => {
        const status = error?.response?.status
        if (status === 400) setTransferError('Invalid transfer request.')
        else if (status === 403) setTransferError('You are not authorized to transfer from this account.')
        else if (status === 404) setTransferError('Destination account could not be found.')
        else if (status === 409) setTransferError('Transfer could not be completed. Check the available balance, account status, and currency.')
        else setTransferError('Unable to complete transfer.')
      }
    })
  }

  function onSubmitDeposit() {
    const account = accounts.find((a) => a.id === depositAccountId) ?? null
    const parsedAmount = Number(depositAmount)
    setDepositError(null)
    if (!account) return setDepositError('Please select a valid account.')
    if (!depositAmount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return setDepositError('Amount must be greater than zero.')
    depositMutation.mutate({ accountId: account.id, amount: parsedAmount, currency: account.currency }, {
      onError: (error: any) => {
        const status = error?.response?.status
        if (status === 400) setDepositError('Invalid deposit amount.')
        else if (status === 403) setDepositError('You are not authorized to deposit into this account.')
        else if (status === 404) setDepositError('Account not found.')
        else if (status === 409) setDepositError('Deposit could not be completed. Check account status and currency.')
        else setDepositError('Unable to complete deposit.')
      }
    })
  }

  const summaryCards = [
    { label: 'Total Accounts', value: String(accounts.length) },
    { label: 'Available Balance', value: accounts.length ? formatMoney(accounts.reduce((sum, a) => sum + Number(a.balance), 0), accounts[0].currency) : '$0.00' },
    { label: 'Recent Transactions', value: String(transactions.length) }
  ]

  const sourceOptions = accounts
  const ownDestinationOptions = accounts.filter((a) => a.id !== selectedSourceAccountId)
  const filteredDepositAccount = selectedDepositAccount
  const newDepositBalance = filteredDepositAccount ? Number(filteredDepositAccount.balance) + (Number.isFinite(Number(depositAmount)) ? Number(depositAmount) : 0) : 0

  function clearTransactionFilters() {
    setStatusFilter('ALL')
    setTypeFilter('ALL')
  }

  if (query.isPending) return <Container maxWidth="lg" sx={{ py: 4 }}><Skeleton variant="rectangular" height={320} /></Container>
  if (query.isError || !user) return <Container maxWidth="lg" sx={{ py: 4 }}><Alert severity="error">Unable to load dashboard. Please login again.</Alert></Container>

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Good morning, {user.firstName}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>Here's an overview of your FinFlow accounts.</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main' }}>{user.firstName[0]?.toUpperCase()}</Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{user.firstName} {user.lastName}</Typography>
                <Typography color="text.secondary">{user.email}</Typography>
              </Box>
            </Stack>
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
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
        <Button variant="contained" size="large" onClick={() => setIsTransferDialogOpen(true)} disabled={!accounts.length}>Transfer Money</Button>
        <Button variant="outlined" size="large" onClick={() => setIsDepositDialogOpen(true)} disabled={!accounts.length}>Deposit Money</Button>
        <Button variant="outlined" size="large" onClick={() => setIsCreateDialogOpen(true)}>Create Account</Button>
      </Stack>

      <Typography variant="h5" sx={{ mb: 2 }}>My Accounts</Typography>
      {accountsQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Unable to load your accounts right now.</Alert>}
      {accountsQuery.isPending ? (
        <Stack spacing={2}><Skeleton variant="rectangular" height={156} /><Skeleton variant="rectangular" height={156} /></Stack>
      ) : accounts.length === 0 ? (
        <Card sx={{ mb: 3 }}><CardContent sx={{ textAlign: 'center', py: 6 }}><Typography variant="h6" sx={{ fontWeight: 700 }}>No accounts yet</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>Create your first checking or savings account to get started.</Typography><Button variant="contained" onClick={() => setIsCreateDialogOpen(true)}>Create Account</Button></CardContent></Card>
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
                      <Button variant="outlined" onClick={() => { setIsTransferDialogOpen(true); setSelectedSourceAccountId(account.id); }}>Transfer From This Account</Button>
                      <Button variant="outlined" onClick={() => { setIsDepositDialogOpen(true); setDepositAccountId(account.id); }}>Deposit Into This Account</Button>
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
      {transactionsQuery.isPending ? <Skeleton variant="rectangular" height={260} /> : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack spacing={2} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Status</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(['ALL', 'COMPLETED', 'FAILED', 'PENDING'] as StatusFilter[]).map((filter) => (
                    <Button key={filter} variant={statusFilter === filter ? 'contained' : 'outlined'} onClick={() => setStatusFilter(filter)}>
                      {filter === 'ALL' ? `All (${statusCounts.ALL})` : `${filter[0] + filter.slice(1).toLowerCase()} (${statusCounts[filter]})`}
                    </Button>
                  ))}
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Type</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(['ALL', 'TRANSFER', 'DEPOSIT'] as TxFilter[]).map((filter) => (
                    <Button key={filter} variant={typeFilter === filter ? 'contained' : 'outlined'} onClick={() => setTypeFilter(filter)}>
                      {filter === 'ALL' ? `All (${typeCounts.ALL})` : `${filter[0] + filter.slice(1).toLowerCase()} (${typeCounts[filter]})`}
                    </Button>
                  ))}
                </Stack>
              </Box>
              {(statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
                <Box>
                  <Button variant="text" onClick={clearTransactionFilters}>Clear Filters</Button>
                </Box>
              )}
            </Stack>
            {!hasTransactions ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>No transactions yet</Typography>
                <Typography color="text.secondary">Your transfers and deposits will appear here.</Typography>
              </Box>
            ) : !hasFilteredTransactions ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>No matching transactions</Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>Try changing or clearing your filters.</Typography>
                <Button variant="outlined" onClick={clearTransactionFilters}>Clear Filters</Button>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
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
                        <TableCell><Chip size="small" label={transaction.type} variant="outlined" /></TableCell>
                        <TableCell><Chip size="small" label={transaction.status} color={transaction.status === 'COMPLETED' ? 'success' : transaction.status === 'FAILED' ? 'error' : 'warning'} /></TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{transaction.type === 'DEPOSIT' ? '+' : '-'}{formatMoney(Number(transaction.amount), transaction.currency)}</TableCell>
                        <TableCell>{transaction.type === 'DEPOSIT' ? '—' : <Tooltip title={transaction.sourceAccountId}><span>{shortId(transaction.sourceAccountId)}</span></Tooltip>}</TableCell>
                        <TableCell>
                          {transaction.type === 'DEPOSIT'
                            ? <Tooltip title={transaction.destinationAccountId}><span>To {shortId(transaction.destinationAccountId)}</span></Tooltip>
                            : <Tooltip title={transaction.destinationAccountId}><span>{shortId(transaction.sourceAccountId)} → {shortId(transaction.destinationAccountId)}</span></Tooltip>}
                        </TableCell>
                        <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Account</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ mt: 1 }}>{createError && <Alert severity="error">{createError}</Alert>}<FormControl fullWidth><InputLabel id="account-type-label">Account Type</InputLabel><Select labelId="account-type-label" label="Account Type" value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)}><MenuItem value="CHECKING">CHECKING</MenuItem><MenuItem value="SAVINGS">SAVINGS</MenuItem></Select></FormControl><TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} helperText="Use 3-letter currency code." /></Stack></DialogContent>
        <DialogActions><Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={() => createAccountMutation.mutate({ accountType, currency: currency.trim().toUpperCase() })} disabled={createAccountMutation.isPending}>{createAccountMutation.isPending ? 'Creating...' : 'Create Account'}</Button></DialogActions>
      </Dialog>

      <Dialog open={isTransferDialogOpen} onClose={() => setIsTransferDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Transfer Money</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography color="text.secondary">Send money between FinFlow accounts.</Typography>
            {transferError && <Alert severity="error">{transferError}</Alert>}
            <FormControl fullWidth>
              <InputLabel id="source-account">From Account</InputLabel>
              <Select labelId="source-account" label="From Account" value={selectedSourceAccountId} onChange={(e) => setSelectedSourceAccountId(e.target.value)}>
                {sourceOptions.map((account) => <MenuItem key={account.id} value={account.id}>{account.accountType} {maskAccountNumber(account.accountNumber)} — Available: {formatMoney(Number(account.balance), account.currency)} {account.currency}</MenuItem>)}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1}>
              <Button variant={showOwnAccountDestinations ? 'contained' : 'outlined'} onClick={() => setShowOwnAccountDestinations(true)} sx={{ flex: 1 }}>Transfer between my accounts</Button>
              <Button variant={!showOwnAccountDestinations ? 'contained' : 'outlined'} onClick={() => setShowOwnAccountDestinations(false)} sx={{ flex: 1 }}>Another FinFlow account</Button>
            </Stack>
            {showOwnAccountDestinations ? (
              <FormControl fullWidth>
                <InputLabel id="dest-account">Destination Account</InputLabel>
                <Select labelId="dest-account" label="Destination Account" value={destinationAccountId} onChange={(e) => setDestinationAccountId(e.target.value)}>
                  {ownDestinationOptions.map((account) => <MenuItem key={account.id} value={account.id}>{account.accountType} {shortId(account.id)}</MenuItem>)}
                </Select>
              </FormControl>
            ) : (
              <TextField label="Destination Account ID" value={destinationAccountId} onChange={(e) => setDestinationAccountId(e.target.value)} helperText="Paste the recipient's FinFlow Account ID. They can copy it from their dashboard." />
            )}
            <TextField label="Amount" type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">{selectedSourceAccount?.currency ?? 'USD'}</InputAdornment> }} helperText={selectedSourceAccount ? `Available balance: ${formatMoney(Number(selectedSourceAccount.balance), selectedSourceAccount.currency)} ${selectedSourceAccount.currency}` : undefined} />
            {selectedSourceAccount && destinationAccountId && transferAmount && Number(transferAmount) > 0 && <Card variant="outlined"><CardContent><Typography variant="subtitle2" sx={{ mb: 1 }}>Transfer Summary</Typography><Typography variant="body2"><strong>From:</strong> {selectedSourceAccount.accountType} {maskAccountNumber(selectedSourceAccount.accountNumber)}</Typography><Typography variant="body2"><strong>To:</strong> {shortId(destinationAccountId)}</Typography><Typography variant="body2"><strong>Amount:</strong> {formatMoney(Number(transferAmount), selectedSourceAccount.currency)} {selectedSourceAccount.currency}</Typography></CardContent></Card>}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setIsTransferDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={onSubmitTransfer} disabled={transferMutation.isPending || !selectedSourceAccount}>{transferMutation.isPending ? 'Submitting...' : 'Submit Transfer'}</Button></DialogActions>
      </Dialog>

      <Dialog open={isDepositDialogOpen} onClose={() => setIsDepositDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Deposit Money</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography color="text.secondary">Add funds to one of your FinFlow accounts.</Typography>
            {depositError && <Alert severity="error">{depositError}</Alert>}
            <FormControl fullWidth>
              <InputLabel id="deposit-account">Account</InputLabel>
              <Select labelId="deposit-account" label="Account" value={depositAccountId} onChange={(e) => setDepositAccountId(e.target.value)}>
                {accounts.map((account) => <MenuItem key={account.id} value={account.id}>{account.accountType} {maskAccountNumber(account.accountNumber)} — Current balance: {formatMoney(Number(account.balance), account.currency)} {account.currency}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Amount" type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">{selectedDepositAccount?.currency ?? 'USD'}</InputAdornment> }} helperText={selectedDepositAccount ? `Current balance: ${formatMoney(Number(selectedDepositAccount.balance), selectedDepositAccount.currency)} ${selectedDepositAccount.currency}` : undefined} />
            {selectedDepositAccount && depositAmount && Number(depositAmount) > 0 && <Card variant="outlined"><CardContent><Typography variant="subtitle2" sx={{ mb: 1 }}>Deposit Summary</Typography><Typography variant="body2"><strong>Current Balance:</strong> {formatMoney(Number(selectedDepositAccount.balance), selectedDepositAccount.currency)} {selectedDepositAccount.currency}</Typography><Typography variant="body2"><strong>Deposit Amount:</strong> +{formatMoney(Number(depositAmount), selectedDepositAccount.currency)} {selectedDepositAccount.currency}</Typography><Typography variant="body2"><strong>New Balance:</strong> {formatMoney(newDepositBalance, selectedDepositAccount.currency)} {selectedDepositAccount.currency}</Typography></CardContent></Card>}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setIsDepositDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={onSubmitDeposit} disabled={depositMutation.isPending || !selectedDepositAccount}>{depositMutation.isPending ? 'Submitting...' : 'Deposit Money'}</Button></DialogActions>
      </Dialog>

      <Snackbar open={Boolean(copySuccess)} autoHideDuration={2500} onClose={() => setCopySuccess(null)} message={copySuccess} />
      <Snackbar open={Boolean(transferSuccess)} autoHideDuration={3000} onClose={() => setTransferSuccess(null)} message={transferSuccess} />
      <Snackbar open={Boolean(depositSuccess)} autoHideDuration={3000} onClose={() => setDepositSuccess(null)} message={depositSuccess} />
    </Container>
  )
}
