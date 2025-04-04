import React from "react";
import { Box, Select, MenuItem, Button } from "@mui/material";

interface FilterProps {
  selectedBin: string;
  setSelectedBin: (bin: string) => void;
  bins: { binID: string; binCode: string }[];
  onNewProductClick: () => void;
}

const FilterComponent: React.FC<FilterProps> = ({
  selectedBin,
  setSelectedBin,
  bins,
  onNewProductClick,
}) => {
  return (
    <Box
      sx={{
        marginBottom: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#d2e0f0",
        padding: "10px",
        borderRadius: "8px",
      }}
    >
      <Select
        value={selectedBin}
        onChange={(e) => setSelectedBin(e.target.value)}
        size="small"
        sx={{ width: "150px" }}
      >
        <MenuItem value="All">All Bins</MenuItem>
        {bins.map((bin) => (
          <MenuItem key={bin.binID} value={bin.binID}>
            {bin.binCode}
          </MenuItem>
        ))}
      </Select>

      <Button variant="contained" color="primary" onClick={onNewProductClick}>
        + New Product
      </Button>
    </Box>
  );
};

export default FilterComponent;
