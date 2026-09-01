import React, { useEffect, useState } from 'react'
import {
 Box,
 Alert,
 Button,
 CircularProgress,
 Typography,
 Card,
 CardContent,
 Dialog,
 DialogTitle,
 DialogContent,
 DialogActions,
 FormControl,
 InputLabel,
 Select,
 MenuItem,
 TextField,
 Chip,
 Stack
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../api/auth'
import { AccountType, createAccount, getMyAccounts } from '../api/accounts'
import { createTransfer, getMyTransactions, TransactionResponse } from '../api/transactions'

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
 const [selectedSourceAccountId, setSelectedSourceAccountId] = useState('')
 const [destinationAccountId, setDestinationAccountId] = useState('')
 const [transferAmount, setTransferAmount] = useState('')

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
     queryClient.invalidateQueries({
       queryKey: ['accounts']
     })
   }
 })

 const transferMutation = useMutation({
   mutationFn: createTransfer,
   onSuccess: (transaction) => {
     setIsTransferDialogOpen(false)
     setSelectedSourceAccountId('')
     setDestinationAccountId('')
     setTransferAmount('')
     setTransferError(null)
     setTransferSuccess(
       `Transfer of ${formatAmount(Number(transaction.amount), transaction.currency)} ${transaction.currency} was submitted successfully.`
     )
     queryClient.invalidateQueries({ queryKey: ['accounts'] })
     queryClient.invalidateQueries({ queryKey: ['transactions'] })
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

 useEffect(() => {
   if (!accountsQuery.data || accountsQuery.data.length === 0) {
     if (selectedSourceAccountId) {
       setSelectedSourceAccountId('')
     }
     return
   }

   if (!selectedSourceAccountId || !accountsQuery.data.some((account) => account.id === selectedSourceAccountId)) {
     setSelectedSourceAccountId(accountsQuery.data[0].id)
   }
 }, [accountsQuery.data, selectedSourceAccountId])

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

 function onOpenTransferDialog() {
   setTransferError(null)
   setTransferSuccess(null)
   setDestinationAccountId('')
   setTransferAmount('')
   if (accountsQuery.data && accountsQuery.data.length > 0) {
     setSelectedSourceAccountId(accountsQuery.data[0].id)
   }
   setIsTransferDialogOpen(true)
 }

 function onCloseTransferDialog() {
   if (transferMutation.isPending) return
   setIsTransferDialogOpen(false)
   setTransferError(null)
 }

 function onSubmitTransfer() {
   const trimmedDestination = destinationAccountId.trim()
   const parsedAmount = Number(transferAmount)
   const sourceAccount = accountsQuery.data?.find((account) => account.id === selectedSourceAccountId) ?? null

   setTransferError(null)

   if (!sourceAccount) {
     setTransferError('Please select a valid source account.')
     return
   }

   if (!trimmedDestination) {
     setTransferError('Destination account ID is required.')
     return
   }

   if (trimmedDestination === sourceAccount.id) {
     setTransferError('Destination account must be different from the source account.')
     return
   }

   if (!transferAmount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
     setTransferError('Transfer amount must be greater than zero.')
     return
   }

   transferMutation.mutate(
     {
       sourceAccountId: sourceAccount.id,
       destinationAccountId: trimmedDestination,
       amount: parsedAmount,
       currency: sourceAccount.currency
     },
     {
       onError: (error: any) => {
         const status = error?.response?.status
         const message = error?.response?.data?.message || error?.response?.data?.error || null

         if (status === 401) {
           localStorage.removeItem('finflow_access_token')
           navigate('/login')
           return
         }

         if (status === 400) {
           setTransferError(message || 'Invalid transfer request.')
           return
         }
         if (status === 403) {
           setTransferError('You are not authorized to transfer from that account.')
           return
         }
         if (status === 404) {
           setTransferError('Source or destination account was not found.')
           return
         }
         if (status === 409) {
           setTransferError(message || 'Transfer could not be completed. This may be due to insufficient funds, inactive account, or currency mismatch.')
           return
         }
         if (error?.response) {
           setTransferError('Unable to process this transfer at the moment.')
           return
         }
         setTransferError('Unable to reach the server. Please try again.')
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
 const transactions = transactionsQuery.data ?? []
 const selectedSourceAccount = accounts.find((account) => account.id === selectedSourceAccountId) ?? null

 function maskAccountNumber(accountNumber: string): string {
   const last4 = accountNumber.slice(-4)
   return `•••• ${last4}`
 }

 function formatAmount(value: number, currency: string): string {
   return new Intl.NumberFormat('en-US', {
     style: 'currency',
     currency
   }).format(value)
 }

 function formatTimestamp(value: string | null | undefined): string {
   if (!value) return '—'
   return new Date(value).toLocaleString()
 }

 function shortAccountRef(value: string): string {
   return value.length <= 8 ? value : `…${value.slice(-6)}`
 }

 function getStatusColor(status: string): 'default' | 'success' | 'error' | 'warning' {
   if (status === 'COMPLETED') return 'success'
   if (status === 'FAILED') return 'error'
   if (status === 'PENDING') return 'warning'
   return 'default'
 }

 return (
   <Box sx={{ maxWidth: 980, margin: '24px auto', padding: 2 }}>
     <Typography variant="h4" sx={{ mb: 1 }}>FinFlow</Typography>
     <Typography variant="h6" sx={{ mb: 2 }}>Welcome, {user.firstName}</Typography>
     <Typography sx={{ mb: 1 }}>Email: {user.email}</Typography>
     <Typography sx={{ mb: 1 }}>Role: {user.role}</Typography>
     <Typography sx={{ mb: 3 }}>Status: {user.status}</Typography>

     <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
       <Button variant="contained" onClick={onOpenCreateDialog}>
         Create Account
       </Button>
       <Button variant="contained" color="secondary" onClick={onOpenTransferDialog} disabled={accounts.length === 0}>
         Transfer Money
       </Button>
       <Button variant="outlined" onClick={onLogout}>Logout</Button>
     </Stack>

     {transferSuccess && (
       <Alert severity="success" sx={{ mb: 2 }}>
         {transferSuccess}
       </Alert>
     )}

     <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>My Accounts</Typography>

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
           <Typography sx={{ mb: 0.5 }}>{formatAmount(account.balance, account.currency)} {account.currency}</Typography>
           <Typography color="text.secondary">{account.status}</Typography>
         </CardContent>
       </Card>
     ))}

     <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>Recent Transactions</Typography>

     {transactionsQuery.isPending && (
       <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
         <CircularProgress size={20} sx={{ mr: 1.5 }} />
         <Typography>Loading transactions...</Typography>
       </Box>
     )}

     {transactionsQuery.isError && (
       <Alert severity="error" sx={{ mb: 2 }}>
         Unable to load your transactions right now.
       </Alert>
     )}

     {!transactionsQuery.isPending && !transactionsQuery.isError && transactions.length === 0 && (
       <Typography sx={{ mb: 2 }}>No transactions yet.</Typography>
     )}

     {!transactionsQuery.isPending && !transactionsQuery.isError && transactions.map((transaction) => (
       <Card key={transaction.id} sx={{ mb: 2 }}>
         <CardContent>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 1 }}>
             <Chip label={transaction.status} color={getStatusColor(transaction.status)} />
             <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
               {formatAmount(Number(transaction.amount), transaction.currency)}
             </Typography>
           </Box>
           <Typography sx={{ mb: 0.5 }}>Currency: {transaction.currency}</Typography>
           <Typography sx={{ mb: 0.5 }}>Source: {shortAccountRef(transaction.sourceAccountId)}</Typography>
           <Typography sx={{ mb: 0.5 }}>Destination: {shortAccountRef(transaction.destinationAccountId)}</Typography>
           <Typography sx={{ mb: 0.5 }}>Created: {formatTimestamp(transaction.createdAt)}</Typography>
           <Typography>Completed: {formatTimestamp(transaction.completedAt)}</Typography>
         </CardContent>
       </Card>
     ))}

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

     <Dialog open={isTransferDialogOpen} onClose={onCloseTransferDialog} fullWidth maxWidth="sm">
       <DialogTitle>Transfer Money</DialogTitle>
       <DialogContent>
         {transferError && (
           <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
             {transferError}
           </Alert>
         )}

         <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
           <InputLabel id="source-account-label">Source Account</InputLabel>
           <Select
             labelId="source-account-label"
             label="Source Account"
             value={selectedSourceAccountId}
             onChange={(event) => setSelectedSourceAccountId(event.target.value as string)}
             disabled={transferMutation.isPending || accounts.length === 0}
           >
             {accounts.map((account) => (
               <MenuItem key={account.id} value={account.id}>
                 {account.accountType} • {maskAccountNumber(account.accountNumber)} • {formatAmount(account.balance, account.currency)} {account.currency}
               </MenuItem>
             ))}
           </Select>
         </FormControl>

         <TextField
           fullWidth
           label="Destination Account ID"
           value={destinationAccountId}
           onChange={(event) => setDestinationAccountId(event.target.value)}
           disabled={transferMutation.isPending}
           sx={{ mb: 2 }}
         />

         <TextField
           fullWidth
           label="Amount"
           type="number"
           value={transferAmount}
           onChange={(event) => setTransferAmount(event.target.value)}
           disabled={transferMutation.isPending || !selectedSourceAccount}
           inputProps={{ min: '0.01', step: '0.01' }}
           helperText={selectedSourceAccount ? `Currency: ${selectedSourceAccount.currency}` : 'Select a source account'}
         />
       </DialogContent>
       <DialogActions>
         <Button onClick={onCloseTransferDialog} disabled={transferMutation.isPending}>
           Cancel
         </Button>
         <Button onClick={onSubmitTransfer} variant="contained" disabled={transferMutation.isPending}>
           {transferMutation.isPending ? 'Submitting...' : 'Submit Transfer'}
         </Button>
       </DialogActions>
     </Dialog>
   </Box>
 )
}
