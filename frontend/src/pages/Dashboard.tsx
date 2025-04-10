import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useWarehouses from "../hooks/useWarehouses";
import { useAuth } from "../hooks/useAuth";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { warehouses, loading, error } = useWarehouses();
  const { userProfile } = useAuth();

  const handleSelectWarehouse = (warehouseID: string) => {
    if (userProfile.warehouseID === warehouseID) {
      navigate(`/admin-management/${warehouseID}`);
    } else {
      alert("You are not authorized to manage this warehouse.");
    }
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
            onClick={() => handleSelectWarehouse(warehouse.warehouseID)} // 判断并跳转
          >
            {warehouse.warehouseCode}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default Dashboard;
