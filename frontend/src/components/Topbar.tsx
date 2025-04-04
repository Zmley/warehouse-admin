import React, { useState } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Popover,
} from "@mui/material";
import { Search, Menu } from "@mui/icons-material";
import Profile from "../pages/Profile";

const Topbar: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // 处理菜单点击
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // 关闭弹窗
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
      {/* 标题 */}
      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
        Welcome Name!
      </Typography>

      {/* 搜索框 */}
      <TextField
        variant="outlined"
        placeholder="Search"
        size="small"
        sx={{
          width: "250px",
          borderRadius: "20px",
          backgroundColor: "#f5f5f5",
          "& .MuiOutlinedInput-root": {
            borderRadius: "20px",
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {/* 菜单按钮 */}
      <IconButton onClick={handleMenuClick}>
        <Menu sx={{ fontSize: "28px", color: "#333" }} />
      </IconButton>

      {/* 弹出 Profile */}
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
        sx={{
          mt: 1,
        }}
      >
        <Box sx={{ width: 350, height: 700 }}>
          <Profile /> {/* 这里加载 Profile.tsx */}
        </Box>
      </Popover>
    </Box>
  );
};

export default Topbar;
