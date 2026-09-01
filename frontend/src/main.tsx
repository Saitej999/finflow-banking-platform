import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import CssBaseline from '@mui/material/CssBaseline'

const queryClient = new QueryClient()

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CssBaseline />
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
