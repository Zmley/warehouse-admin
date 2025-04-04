import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const warehouses = [
    { id: "1", name: "Warehouse 1" },
    { id: "2", name: "Warehouse 2" },
    { id: "3", name: "Warehouse 3" },
  ];

  const handleSelectWarehouse = (warehouseId: string) => {
    navigate(`/dashboard/${warehouseId}`);
  };

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
            key={warehouse.id}
            variant="outlined"
            onClick={() => handleSelectWarehouse(warehouse.id)}
          >
            {warehouse.name}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default Dashboard;
