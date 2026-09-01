import api from './api'

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

export interface TransferRequest {
  sourceAccountId: string
  destinationAccountId: string
  amount: number
  currency: string
}

export interface TransactionResponse {
  id: string
  initiatedByUserId: string
  sourceAccountId: string
  destinationAccountId: string
  amount: number
  currency: string
  status: TransactionStatus
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export async function createTransfer(request: TransferRequest): Promise<TransactionResponse> {
  const resp = await api.post('/api/transactions/transfers', request)
  return resp.data as TransactionResponse
}

export async function getMyTransactions(): Promise<TransactionResponse[]> {
  const resp = await api.get('/api/transactions/me')
  return resp.data as TransactionResponse[]
}

export async function getTransaction(transactionId: string): Promise<TransactionResponse> {
  const resp = await api.get(`/api/transactions/${transactionId}`)
  return resp.data as TransactionResponse
}
