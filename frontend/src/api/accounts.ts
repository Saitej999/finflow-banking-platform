import api from './api'

export type AccountType = 'CHECKING' | 'SAVINGS'

export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED'

export interface AccountResponse {
  id: string
  accountNumber: string
  userId: string
  accountType: AccountType
  balance: number
  currency: string
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

export interface CreateAccountRequest {
  accountType: AccountType
  currency: string
}

export async function getMyAccounts(): Promise<AccountResponse[]> {
  const resp = await api.get('/api/accounts/me')
  return resp.data as AccountResponse[]
}

export async function createAccount(request: CreateAccountRequest): Promise<AccountResponse> {
  const resp = await api.post('/api/accounts', request)
  return resp.data as AccountResponse
}
