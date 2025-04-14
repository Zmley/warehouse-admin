import React from "react";
import { Typography, Box, Avatar, Divider, Button } from "@mui/material";
import { Logout as LogoutIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { handleLogout, userProfile } = useAuth();

  return (
    <Box sx={{ fontSize: "0.8rem", px: 1, py: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Avatar src="/profile.jpg" sx={{ width: 36, height: 36, mr: 1 }} />
        <Box>
          <Typography sx={{ fontWeight: "bold", fontSize: "0.85rem" }}>
            {userProfile?.firstName} {userProfile?.lastName}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#555" }}>
            {userProfile?.email}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ mb: 1 }}>
        <Typography
          sx={{ fontWeight: "bold", fontSize: "0.75rem", color: "#777" }}
        >
          Role
        </Typography>
        <Typography
          sx={{ fontSize: "0.75rem", color: "#1976d2", fontWeight: 500 }}
        >
          {userProfile?.role}
        </Typography>
      </Box>

      <Button
        variant="outlined"
        fullWidth
        size="small"
        onClick={() => {
          handleLogout();
          navigate("/");
        }}
        sx={{
          fontSize: "0.75rem",
          textTransform: "none",
          borderRadius: 2,
          fontWeight: "bold",
          color: "#1976d2",
          borderColor: "#1976d2",
          "&:hover": {
            backgroundColor: "#f0f0f0",
            borderColor: "#115293",
          },
        }}
        endIcon={<LogoutIcon fontSize="small" />}
      >
        Sign Out
      </Button>
    </Box>
  );
};

export default Profile;
