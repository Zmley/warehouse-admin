import React from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useWarehouses from "../hooks/useWarehouses"; // 自定义 hook 用于获取仓库数据

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { warehouses, loading, error } = useWarehouses(); // 获取仓库数据

  const handleSelectWarehouse = (warehouseId: string) => {
    // 跳转到管理页面
    navigate(`/admin-management/${warehouseId}`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "100px",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Select a Warehouse
      </Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        {warehouses.map((warehouse) => (
          <Button
            key={warehouse.warehouseID}
            variant="outlined"
            onClick={() => handleSelectWarehouse(warehouse.warehouseID)} // 点击仓库后跳转到管理页面
          >
            {warehouse.warehouseCode}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default Dashboard;
