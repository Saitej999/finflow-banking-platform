import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <div>
      <nav style={{ padding: 12 }}>
        <Link to="/register" style={{ marginRight: 8 }}>Register</Link>
        <Link to="/login" style={{ marginRight: 8 }}>Login</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<div style={{ padding: 12 }}>Welcome to FinFlow</div>} />
      </Routes>
    </div>
  )
}
