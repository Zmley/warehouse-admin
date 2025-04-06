import React, { useContext, useState } from "react";
import { Box, Typography, IconButton, Popover } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import Profile from "../pages/Profile";
import { AuthContext } from "../contexts/auth";

const Topbar: React.FC = () => {
  const { userProfile } = useContext(AuthContext)!;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        height: "60px",
        backgroundColor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      {/* 左侧欢迎语 */}
      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
        Welcome {userProfile.firstName}!
      </Typography>

      {/* 中间显示当前仓库 */}
      {userProfile.warehouseCode ? (
        <Typography variant="body1" sx={{ color: "#333", fontWeight: "bold" }}>
          Warehouse: {userProfile.warehouseCode}
        </Typography>
      ) : (
        <Typography variant="body1" sx={{ color: "#999" }}>
          No Warehouse Selected
        </Typography>
      )}

      {/* 右侧菜单按钮（弹出 Profile） */}
      <IconButton onClick={handleMenuClick}>
        <MenuIcon sx={{ fontSize: 28, color: "#333" }} />
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{ mt: 1 }}
      >
        <Box sx={{ width: 350, height: 700 }}>
          <Profile />
        </Box>
      </Popover>
    </Box>
  );
};

export default Topbar;
