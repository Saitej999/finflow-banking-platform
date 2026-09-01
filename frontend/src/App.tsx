import React from 'react'
import { AppBar, Toolbar, Typography, Button, Box, Avatar, IconButton, Menu, MenuItem, Container } from '@mui/material'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
}

function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('finflow_access_token')
  const isAuthenticated = Boolean(token)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const isMenuOpen = Boolean(anchorEl)
  const firstName = 'Dashboard'

  function handleLogout() {
    localStorage.removeItem('finflow_access_token')
    setAnchorEl(null)
    navigate('/login')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ minHeight: 72, gap: 2 }}>
          <Typography variant="h6" component={Link} to={isAuthenticated ? '/dashboard' : '/'} sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 800, letterSpacing: 0.2, flexGrow: 1 }}>
            FinFlow
          </Typography>

          {isAuthenticated ? (
            <>
              <Button component={Link} to="/dashboard" color="inherit" sx={{ fontWeight: 600 }}>
                Dashboard
              </Button>
              <Button onClick={(event) => setAnchorEl(event.currentTarget)} color="inherit" startIcon={<Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 14 }}>{getInitials(firstName)}</Avatar>} sx={{ textTransform: 'none', fontWeight: 600 }}>
                {firstName}
              </Button>
              <Button variant="contained" onClick={handleLogout}>Logout</Button>
              <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { setAnchorEl(null); navigate('/dashboard') }}>Dashboard</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button component={Link} to="/login" color={location.pathname === '/login' ? 'primary' : 'inherit'} sx={{ fontWeight: 600 }}>
                Login
              </Button>
              <Button component={Link} to="/register" variant="contained">
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </Container>
    </Box>
  )
}

export default function App() {
  return <AppShell />
}
