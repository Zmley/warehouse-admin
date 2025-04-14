import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useWarehouses from "../hooks/useWarehouse";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { warehouses, loading, error } = useWarehouses();

  const handleSelectWarehouse = (
    warehouseID: string,
    warehouseCode: string
  ) => {
    navigate(`/admin-management/${warehouseID}/${warehouseCode}`);
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
            onClick={() =>
              handleSelectWarehouse(
                warehouse.warehouseID,
                warehouse.warehouseCode
              )
            }
          >
            {warehouse.warehouseCode}
          </Button>
        ))}
        ß
      </Box>
    </Box>
  );
};

export default Dashboard;
