import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Alert,
} from "@mui/material";
import { addInventoryItem } from "../api/inventoryApi"; // 引入添加库存项的 API
import { useProduct } from "../hooks/useProduct"; // 假设你有一个 hook 用于获取所有产品

// 定义Props类型，包含open、onClose和onSuccess
interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  binCode: string; // 当前的 binCode
  binID: string; // 当前的 binID
}

const CreateInventoryItemModal: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  binCode, // 获取传递过来的 binCode
  binID, // 获取传递过来的 binID
}) => {
  const { productCodes, loadProducts, loading: productLoading } = useProduct();

  const [productCode, setProductCode] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [message, setMessage] = useState<string>(""); // State to store the message
  const [messageType, setMessageType] = useState<
    "success" | "error" | undefined
  >(undefined); // Use undefined instead of empty string

  // 加载产品数据
  useEffect(() => {
    if (open) {
      loadProducts(); // 当模态框打开时加载产品数据
    }
  }, [open, loadProducts]);

  const handleCreateInventory = async () => {
    try {
      // 调用 API 创建库存项
      const response = await addInventoryItem({
        productCode: productCode,
        binID, // 使用传递的 binID
        quantity,
      });

      if (response.success) {
        setMessage("✅ Inventory item created successfully!"); // Set success message
        setMessageType("success"); // Set message type to success
        onClose(); // 关闭模态框
        onSuccess(); // 通知父组件更新数据
      } else {
        setMessage(response.message || "Failed to create inventory."); // Set error message
        setMessageType("error"); // Set message type to error
      }
    } catch (err: any) {
      console.error("❌ Error creating inventory:", err);
      setMessage("Failed to create inventory.");
      setMessageType("error"); // Set message type to error
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create Inventory Item for {binCode}</DialogTitle>
      <DialogContent>
        {/* 显示 binCode */}
        <TextField
          label="Bin Code"
          value={binCode} // 显示当前的 binCode
          fullWidth
          disabled // 禁用输入框，不能手动更改 binCode
          sx={{ mb: 2 }}
        />

        {/* 选择产品的 Autocomplete */}
        <Autocomplete
          options={productCodes}
          value={productCode}
          onChange={(event, newValue) => setProductCode(newValue || "")}
          renderInput={(params) => (
            <TextField {...params} label="Product Code" fullWidth />
          )}
          loading={productLoading}
          renderOption={(props, option) => (
            <li {...props} key={option}>
              {option}
            </li>
          )}
        />

        {/* 输入数量 */}
        <TextField
          label="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          type="number"
          fullWidth
          sx={{ mb: 2 }}
        />

        {/* Show message here */}
        {message && (
          <Alert severity={messageType} sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreateInventory} color="primary">
          Create Inventory
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInventoryItemModal;
