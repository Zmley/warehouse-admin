// src/components/FilterComponent.tsx
import React from "react";
import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";

interface FilterComponentProps {
  selectedBin: string;
  setSelectedBin: (binID: string) => void;
  bins: { binID: string; binCode: string }[];
  onNewProductClick: () => void;
}

const FilterComponent: React.FC<FilterComponentProps> = ({
  selectedBin,
  setSelectedBin,
  bins,
  onNewProductClick,
}) => {
  return (
    <FormControl sx={{ minWidth: 200, mb: 2 }}>
      <InputLabel id="bin-select-label">Bin</InputLabel>
      <Select
        labelId="bin-select-label"
        value={selectedBin}
        onChange={(e) => setSelectedBin(e.target.value)}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 200, // ✅ 设置最大高度
              overflowY: "auto", // ✅ 出现滚动条
            },
          },
        }}
      >
        <MenuItem value="All">All Bins</MenuItem>
        {bins.map((bin) => (
          <MenuItem key={bin.binID} value={bin.binID}>
            {bin.binCode}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default FilterComponent;
