import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Paper,
  Dialog,
  Autocomplete,
  TextField,
  TablePagination,
  Stack,
} from "@mui/material";
import QuantityEditModal from "./QuantityEdit";
import CreateInventoryItemModal from "./CreateInventory";
import { InventoryItem } from "../../types/inventoryTypes";
import useInventory from "../../hooks/useInventory";
import { useBin } from "../../hooks/useBin";
import { useParams } from "react-router-dom";
import { formatDate } from "../../utils/format";

const InventoryPage: React.FC = () => {
  const {
    inventory,
    loading: inventoryLoading,
    error,
    removeInventoryItem,
    editInventoryItem,
    fetchAllInventory,
  } = useInventory();

  const { bins, fetchAllBins, loading: binLoading } = useBin();

  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>(
    []
  );
  const [selectedBin, setSelectedBin] = useState<string>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [createInventoryModalOpen, setCreateInventoryModalOpen] =
    useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchAllBins();
  }, [fetchAllBins]);

  const { warehouseID } = useParams();

  useEffect(() => {
    fetchAllInventory();
    // eslint-disable-next-line
  }, [warehouseID]);

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

  if (inventoryLoading || binLoading)
    return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  const binOptions = bins.map((bin) => ({
    binID: bin.binID,
    binCode: bin.binCode,
  }));
  const handleSuccess = () => fetchAllInventory();
  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  const currentItems = filteredInventory.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box
      sx={{
        p: 3,
        height: "100%",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Autocomplete
          options={binOptions}
          getOptionLabel={(option) => option.binCode}
          value={selectedBinData || null}
          onChange={(_, newValue) => {
            setSelectedBin(newValue ? newValue.binID : "All");
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Bin Code"
              variant="outlined"
              size="small"
              sx={{
                minWidth: 250,
                "& .MuiInputBase-root": {
                  height: 36,
                  fontSize: "0.875rem",
                },
                "& .MuiInputLabel-root": {
                  fontSize: "0.8rem",
                },
              }}
            />
          )}
          isOptionEqualToValue={(option, value) => option.binID === value.binID}
        />

        {selectedBin !== "All" && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateInventoryOpen}
            sx={{
              height: 28,
              px: 3,
              fontWeight: "bold",
              borderRadius: 2,
            }}
          >
            ➕ Create Inventory
          </Button>
        )}

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            color="info"
            onClick={() => {
              console.log("Transfer from another warehouse");
            }}
            sx={{
              height: 36,
              px: 2.5,
              fontSize: "0.8rem",
              fontWeight: "bold",
              textTransform: "none",
              borderRadius: 2,
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            🔄 Transfer From other Warehouse
          </Button>

          <Button
            variant="contained"
            sx={{
              height: 36,
              px: 2.5,
              fontSize: "0.8rem",
              fontWeight: "bold",
              textTransform: "none",
              borderRadius: 2,
              backgroundColor: "#4CAF50",
              color: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              "&:hover": {
                backgroundColor: "#388E3C",
              },
            }}
          >
            ⬆ Import Inventory
          </Button>
        </Stack>
      </Box>

      <Paper elevation={3} sx={{ borderRadius: 3 }}>
        <Table sx={{ border: "1px solid #e0e0e0" }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f0f4f9" }}>
              <TableCell align="center" sx={{ border: "1px solid #e0e0e0" }}>
                Bin Code
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #e0e0e0" }}>
                Product Code
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #e0e0e0" }}>
                Quantity
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #e0e0e0" }}>
                Imported Date
              </TableCell>
              <TableCell align="center" sx={{ border: "1px solid #e0e0e0" }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <TableRow key={item.inventoryID} sx={{ height: 44 }}>
                  <TableCell
                    align="center"
                    sx={{
                      py: 1,
                      fontSize: "0.9rem",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    {item.Bin?.binCode}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ py: 1, border: "1px solid #e0e0e0" }}
                  >
                    <Typography
                      component="a"
                      href={`/product/${item.productCode}`}
                      sx={{
                        fontSize: "0.9rem",
                        textDecoration: "underline",
                        color: "#1976d2",
                        fontWeight: 500,
                      }}
                    >
                      {item.productCode}
                    </Typography>
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      py: 1,
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      color: "#1976d2",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <Typography
                      sx={{
                        cursor: "pointer",
                        "&:hover": { textDecoration: "underline" },
                      }}
                      onClick={() => handleOpenModal(item)}
                    >
                      {item.quantity}
                    </Typography>
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      py: 1,
                      fontSize: "0.85rem",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    {formatDate(item.updatedAt)}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ py: 1, border: "1px solid #e0e0e0" }}
                  >
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this item?"
                          )
                        ) {
                          handleDelete(item.inventoryID);
                        }
                      }}
                      sx={{
                        height: 32,
                        px: 2,
                        fontSize: "0.8rem",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        textTransform: "none",
                        backgroundColor: "#e53935",
                        "&:hover": { backgroundColor: "#c62828" },
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    No matching products found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[20, 50, 100]}
          component="div"
          count={filteredInventory.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {selectedItem && (
        <QuantityEditModal
          open={modalOpen}
          onClose={handleCloseModal}
          inventoryId={selectedItem.inventoryID}
          initialQuantity={selectedItem.quantity}
          onQuantityUpdated={handleSaveQuantity}
        />
      )}

      <Dialog
        open={createInventoryModalOpen}
        onClose={handleCreateInventoryClose}
      >
        <Box sx={{ p: 3 }}>
          <CreateInventoryItemModal
            open={createInventoryModalOpen}
            onClose={handleCreateInventoryClose}
            onSuccess={handleSuccess}
            binCode={selectedBinData?.binCode || ""}
            binID={selectedBinData?.binID || ""}
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default InventoryPage;
