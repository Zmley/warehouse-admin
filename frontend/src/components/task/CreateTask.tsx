import React, { useState, useEffect } from "react";
import {
  Button,
  Stack,
  TextField,
  Autocomplete,
  Typography,
  Paper,
} from "@mui/material";
import { createTask } from "../../api/taskApi";
import { useBin } from "../../hooks/useBin";
import { useProduct } from "../../hooks/useProduct";

interface Props {
  onSuccess?: () => void;
}

const CreateTask: React.FC<Props> = ({ onSuccess }) => {
  const [sourceBinCode, setSourceBinCode] = useState("");
  const [destinationBinCode, setDestinationBinCode] = useState("");
  const [productCode, setProductCode] = useState("");

  const { fetchAllBins } = useBin();
  const [allBinCodes, setAllBinCodes] = useState<string[]>([]);

  const { productCodes, loadProducts } = useProduct();

  useEffect(() => {
    fetchAllBins()
      .then((binsData) => {
        const binCodes = binsData.map((bin) => bin.binCode);
        setAllBinCodes(binCodes);
      })
      .catch(console.error);

    loadProducts();
  }, [fetchAllBins, loadProducts]);

  const handleSubmit = async () => {
    try {
      await createTask({
        sourceBinCode,
        destinationBinCode,
        productCode,
      });
      alert("✅ Task created successfully!");
      onSuccess?.();
    } catch (err: any) {
      console.error("❌ Error creating task:", err);
      alert("Failed to create task.");
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        padding: 4,
        borderRadius: 4,
        minWidth: 400,
        backgroundColor: "#fdfdfd",
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#333" }}
      >
        Create New Task
      </Typography>

      <Stack spacing={3} mt={2}>
        <Autocomplete
          options={allBinCodes}
          value={sourceBinCode}
          onChange={(event, newValue) => setSourceBinCode(newValue || "")}
          renderInput={(params) => (
            <TextField {...params} label="Source Bin Code" fullWidth />
          )}
        />
        <Autocomplete
          options={allBinCodes}
          value={destinationBinCode}
          onChange={(event, newValue) => setDestinationBinCode(newValue || "")}
          renderInput={(params) => (
            <TextField {...params} label="Destination Bin Code" fullWidth />
          )}
        />
        <Autocomplete
          options={productCodes}
          value={productCode}
          onChange={(event, newValue) => setProductCode(newValue || "")}
          renderInput={(params) => (
            <TextField {...params} label="Product Code" fullWidth />
          )}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            mt: 1,
            borderRadius: "8px",
            fontWeight: "bold",
            backgroundColor: "#3F72AF",
            "&:hover": {
              backgroundColor: "#365f94",
            },
          }}
        >
          Create Task
        </Button>
      </Stack>
    </Paper>
  );
};

export default CreateTask;
