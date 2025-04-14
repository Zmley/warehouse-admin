import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Autocomplete,
  Alert,
  Stack,
  Paper,
} from "@mui/material";
import { addInventory } from "../../api/inventoryApi";
import { useProduct } from "../../hooks/useProduct";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  binCode: string;
  binID: string;
}

const CreateInventory: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  binCode,
  binID,
}) => {
  const { productCodes, loadProducts, loading: productLoading } = useProduct();

  const [productCode, setProductCode] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | undefined
  >(undefined);

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open, loadProducts]);

  const handleCreateInventory = async () => {
    try {
      const response = await addInventory({
        productCode,
        binID,
        quantity,
      });

      if (response.success) {
        setMessage("✅ Inventory item created successfully!");
        setMessageType("success");
        onClose();
        onSuccess();
      } else {
        setMessage(response.message || "Failed to create inventory.");
        setMessageType("error");
      }
    } catch (err: any) {
      console.error("❌ Error creating inventory:", err);
      setMessage("Failed to create inventory.");
      setMessageType("error");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{ padding: "20px", minWidth: "500px" }}
    >
      <DialogTitle
        sx={{ fontWeight: "bold", fontSize: "1.25rem", textAlign: "center" }}
      >
        Create Inventory Item for {binCode}
      </DialogTitle>
      <DialogContent sx={{ paddingBottom: "20px" }}>
        <Paper
          elevation={4}
          sx={{
            padding: 4,
            borderRadius: 4,
            backgroundColor: "#fdfdfd",
          }}
        >
          <Stack spacing={3}>
            <Autocomplete
              options={productCodes}
              value={productCode}
              onChange={(event, newValue) => setProductCode(newValue || "")}
              loading={productLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Product Code"
                  fullWidth
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "50px",
                    },
                  }}
                />
              )}
            />
            <TextField
              label="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              type="number"
              fullWidth
              sx={{
                "& .MuiInputBase-root": {
                  height: "50px",
                },
              }}
            />
            {message && (
              <Alert severity={messageType} sx={{ mt: 2, fontWeight: "bold" }}>
                {message}
              </Alert>
            )}
          </Stack>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ padding: "20px" }}>
        <Button
          onClick={onClose}
          sx={{
            width: "100px",
            height: "50px",
            backgroundColor: "#e0e0e0",
            "&:hover": { backgroundColor: "#d5d5d5" },
            fontWeight: "bold",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateInventory}
          color="primary"
          sx={{
            width: "100px",
            height: "50px",
            backgroundColor: "#e0e0e0",
            "&:hover": { backgroundColor: "#d5d5d5" },
            fontWeight: "bold",
          }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInventory;
