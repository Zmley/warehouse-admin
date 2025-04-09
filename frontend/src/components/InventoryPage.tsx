import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  Autocomplete,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterComponent from "../components/FilterComponent";
import QuantityEditModal from "../components/QuantityEditModal";
import CreateInventoryItemModal from "../components/CreateInventoryForm"; // 引入创建库存项的模态框组件
import { InventoryItem } from "../types/inventoryTypes";
import useInventory from "../hooks/useInventory";
import { useBin } from "../hooks/useBin";

// Function to format date to a human-readable format
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    weekday: "short", // 'Mon'
    year: "numeric", // '2025'
    month: "short", // 'Apr'
    day: "numeric", // '1'
    hour: "numeric", // '3 PM'
    minute: "numeric", // '15'
    second: "numeric", // '34'
    hour12: true, // Use 12-hour format
  });
};

const InventoryPage: React.FC = () => {
  const {
    inventory,
    loading: inventoryLoading,
    error,
    removeInventoryItem,
    editInventoryItem,
    fetchAllInventory, // Ensure this function is available to re-fetch the inventory list
  } = useInventory();

  const { bins, fetchAllBins, loading: binLoading } = useBin(); // 使用 bins 代替 binCodes

  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>(
    []
  );
  const [selectedBin, setSelectedBin] = useState<string>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // 新增：用于打开创建库存模态框
  const [createInventoryModalOpen, setCreateInventoryModalOpen] =
    useState(false);

  // 🔁 页面加载时拉取 bins 数据
  useEffect(() => {
    fetchAllBins();
  }, [fetchAllBins]);

  useEffect(() => {
    const filtered =
      selectedBin === "All"
        ? inventory
        : inventory.filter((item) => item.binID === selectedBin);
    setFilteredInventory(filtered);
  }, [selectedBin, inventory]);

  const selectedBinData = bins.find((bin) => bin.binID === selectedBin);

  const handleCreateInventoryOpen = () => setCreateInventoryModalOpen(true);
  const handleCreateInventoryClose = () => setCreateInventoryModalOpen(false);

  const handleOpenModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const handleSaveQuantity = async (newQuantity: number) => {
    if (!selectedItem) return;
    await editInventoryItem(selectedItem.inventoryID, {
      quantity: newQuantity,
    });
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    await removeInventoryItem(id);
  };

  if (inventoryLoading || binLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  // ✅ 构建 binID 列表供 FilterComponent 使用
  const binOptions = bins.map((bin) => ({
    binID: bin.binID,
    binCode: bin.binCode,
  }));

  // Success callback to refresh inventory after adding an item
  const handleSuccess = () => {
    fetchAllInventory(); // Refresh inventory list after item is added
  };

  return (
    <Box sx={{ padding: "20px" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
          width: "100%",
        }}
      >
        <Autocomplete
          options={binOptions}
          getOptionLabel={(option) => option.binCode}
          value={selectedBinData || null}
          onChange={(event, newValue) => {
            setSelectedBin(newValue ? newValue.binID : "All");
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Bin Code"
              variant="outlined"
              sx={{
                minWidth: "300px", // Ensure the input field has a minimum width
                maxWidth: "600px", // Limit the input field width
                width: "100%", // Ensure it takes up the available space within its container
                "& .MuiInputBase-root": {
                  height: "50px", // Set the height of the input box
                },
              }}
            />
          )}
          isOptionEqualToValue={(option, value) => option.binID === value.binID}
        />

        {/* Add Create Inventory button */}
        {selectedBin !== "All" && (
          <Button
            variant="contained"
            color="primary"
            sx={{
              height: "50px",
              paddingLeft: "20px",
              paddingRight: "20px",
              alignSelf: "center", // Aligns the button with the input
              marginLeft: "10px", // Add space between the input and button
            }}
            onClick={handleCreateInventoryOpen}
          >
            ➕ Create Inventory
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "#444" }}>
                <Typography variant="h6">Product ID</Typography>
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#444" }}>
                <Typography variant="h6">Imported Date</Typography>
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#444" }}>
                <Typography variant="h6">Quantity</Typography>
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#444" }}>
                <Typography variant="h6">Action</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item) => (
                <TableRow
                  key={item.inventoryID}
                  sx={{ "&:hover": { backgroundColor: "#f5f5f5" } }}
                >
                  <TableCell>
                    <Typography
                      component="a"
                      href={`/product/${item.productCode}`}
                      sx={{
                        textDecoration: "underline",
                        color: "blue",
                        cursor: "pointer",
                        fontWeight: "medium",
                      }}
                    >
                      {item.productCode}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(item.updatedAt)}</TableCell>
                  <TableCell>
                    <Typography sx={{ color: "#555" }}>
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleDelete(item.inventoryID)}
                      color="error"
                      sx={{ "&:hover": { backgroundColor: "#ffebee" } }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No matching products found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedItem && (
        <QuantityEditModal
          open={modalOpen}
          onClose={handleCloseModal}
          inventoryId={selectedItem.inventoryID}
          initialQuantity={selectedItem.quantity}
          onQuantityUpdated={handleSaveQuantity}
        />
      )}

      {/* Add Create Inventory Item Modal */}
      <Dialog
        open={createInventoryModalOpen}
        onClose={handleCreateInventoryClose}
      >
        <Box sx={{ p: 3 }}>
          <CreateInventoryItemModal
            open={createInventoryModalOpen}
            onClose={handleCreateInventoryClose}
            onSuccess={handleSuccess} // Use handleSuccess to re-fetch inventory
            binCode={selectedBinData?.binCode || ""}
            binID={selectedBinData?.binID || ""}
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default InventoryPage;
