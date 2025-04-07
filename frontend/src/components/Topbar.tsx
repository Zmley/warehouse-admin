import React, { useContext, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Popover,
  Avatar,
  Chip,
  Tooltip,
  Divider,
} from "@mui/material";
import { ArrowBack, AccountCircle } from "@mui/icons-material";
import { deepPurple } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/auth";
import Profile from "../pages/Profile";

const Topbar: React.FC = () => {
  const { userProfile } = useContext(AuthContext)!;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleBack = () => {
    navigate(-1); // 返回上一页
  };

  return (
    <Box
      sx={{
        height: 72,
        background: "linear-gradient(to right, #f4f6f9, #dfe9f3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 4,
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      {/* 左侧返回按钮 + 欢迎语 */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Tooltip title="Back">
          <IconButton onClick={handleBack}>
            <ArrowBack sx={{ color: "#333" }} />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#2e3a59" }}>
          👋 Welcome back, {userProfile.firstName}!
        </Typography>
      </Box>

      {/* 当前仓库 */}
      {userProfile.warehouseCode ? (
        <Chip
          label={`Warehouse: ${userProfile.warehouseCode}`}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      ) : (
        <Typography variant="body2" sx={{ color: "#999" }}>
          No Warehouse Selected
        </Typography>
      )}

      {/* 右侧头像按钮 */}
      <Tooltip title="Account Settings">
        <IconButton onClick={handleMenuClick}>
          <Avatar sx={{ bgcolor: deepPurple[500] }}>
            {userProfile.firstName.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>

      {/* 弹出 Profile */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: 3,
            boxShadow: 4,
            minWidth: 350,
            maxHeight: 720,
          },
        }}
      >
        <Box p={2}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            User Profile
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Profile />
        </Box>
      </Popover>
    </Box>
  );
};

export default Topbar;
