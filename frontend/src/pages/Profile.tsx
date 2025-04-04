import React from 'react'
import {
  Container,
  Typography,
  Box,
  IconButton,
  Button,
  Avatar,
  Divider
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Logout as LogoutIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Profile: React.FC = () => {
  const navigate = useNavigate()
  const { handleLogout, userProfile } = useAuth()

  return (
    <Container
      maxWidth='sm'
      sx={{
        textAlign: 'center',
        padding: '20px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton
          onClick={() => navigate('/')}
          sx={{ alignSelf: 'flex-start' }}
        >
          <ArrowBackIcon sx={{ fontSize: '28px', color: '#333' }} />
        </IconButton>
      </Box>

      <Typography
        variant='h4'
        sx={{
          fontWeight: 'bold',
          color: 'black',
          textAlign: 'left',
          marginBottom: '20px',
          paddingLeft: '8px'
        }}
      >
        Profile
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          textAlign: 'left',
          paddingLeft: '16px',
          mb: 2
        }}
      >
        <Avatar
          src='/profile.jpg'
          sx={{ width: 70, height: 70, marginRight: '12px' }}
        />
        <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
          {userProfile?.firstName} {userProfile?.lastName}
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'left', paddingLeft: '16px', width: '100%' }}>
        <Typography sx={{ fontWeight: 'bold', color: '#666', mb: 0.5 }}>
          Username
        </Typography>
        <Typography sx={{ color: '#2279B8', fontWeight: 'bold', mb: 1 }}>
          {userProfile?.email}
        </Typography>
        <Divider sx={{ width: '80%', borderColor: '#DDD' }} />

        <Typography sx={{ fontWeight: 'bold', color: '#666', mt: 2, mb: 0.5 }}>
          First Name
        </Typography>
        <Typography sx={{ color: '#2279B8', fontWeight: 'bold', mb: 1 }}>
          {userProfile?.firstName}
        </Typography>
        <Divider sx={{ width: '80%', borderColor: '#DDD' }} />

        <Typography sx={{ fontWeight: 'bold', color: '#666', mt: 2, mb: 0.5 }}>
          Last Name
        </Typography>
        <Typography sx={{ color: '#2279B8', fontWeight: 'bold', mb: 1 }}>
          {userProfile?.lastName}
        </Typography>
        <Divider sx={{ width: '80%', borderColor: '#DDD' }} />

        <Typography sx={{ fontWeight: 'bold', color: '#666', mt: 2, mb: 0.5 }}>
          Role
        </Typography>
        <Typography sx={{ color: '#2279B8', fontWeight: 'bold', mb: 1 }}>
          {userProfile?.role}
        </Typography>
        <Divider sx={{ width: '80%', borderColor: '#DDD' }} />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: '30px',
          left: '16px',
          width: 'calc(100% - 32px)'
        }}
      >
        <Button
          variant='outlined'
          onClick={() => {
            handleLogout()
            navigate('/')
          }}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderRadius: '30px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderColor: '#0779B8',
            color: '#0779B8',
            '&:hover': { backgroundColor: '#F7F7F7' },
            width: '70%'
          }}
        >
          Sign Out
          <LogoutIcon sx={{ fontSize: '20px' }} />
        </Button>
      </Box>
    </Container>
  )
}

export default Profile
