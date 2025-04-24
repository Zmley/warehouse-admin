import React, { useState } from 'react'
import { Typography, Button, TextField, Box, Alert } from '@mui/material'
import { useAuth } from 'hooks/useAuth'

const LoginPage: React.FC = () => {
  const { handleLogin, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const handleLoginClick = () => {
    handleLogin(email, password)
  }

  return (
    <Box
      sx={{
        backgroundImage: "url('/background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '400px',
          background: '#FFF',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}
      >
        <Typography
          variant='h5'
          sx={{ fontWeight: 'bold', mb: 2, color: '#2272FF' }}
        >
          Welcome to
        </Typography>
        <Typography
          variant='h5'
          sx={{ fontWeight: 'bold', mb: 3, color: '#2272FF' }}
        >
          Inventory System!
        </Typography>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label='User name'
          variant='outlined'
          fullWidth
          value={email}
          onChange={e => setEmail(e.target.value)}
          sx={{
            mb: 2,
            borderRadius: '8px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px'
            }
          }}
        />
        <TextField
          label='Password'
          variant='outlined'
          fullWidth
          type='password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          sx={{
            mb: 2,
            borderRadius: '8px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px'
            }
          }}
        />

        <Button
          variant='contained'
          fullWidth
          sx={{
            backgroundColor: '#2272FF',
            color: '#FFF',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'none',
            '&:hover': { backgroundColor: '#1A5BCC' }
          }}
          onClick={handleLoginClick}
        >
          Login
        </Button>

        <Typography sx={{ color: '#555', fontSize: '14px', mt: 2 }}>
          Forgot password?
        </Typography>
      </Box>
    </Box>
  )
}

export default LoginPage
