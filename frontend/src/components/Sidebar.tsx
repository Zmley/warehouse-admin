import React from "react";
import {
  Box,
  Typography,
  Tooltip,
  Stack,
  Icon,
  IconButton,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import InventoryIcon from "@mui/icons-material/Inventory";
import CategoryIcon from "@mui/icons-material/Category";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";

interface SidebarProps {
  setCurrentPage: React.Dispatch<
    React.SetStateAction<"inventory" | "tasks" | "products" | "users">
  >;
}

const Sidebar: React.FC<SidebarProps> = ({ setCurrentPage }) => {
  const sidebarItems = [
    { label: "Tasks", page: "tasks", icon: <AssignmentIcon /> },
    { label: "Inventory", page: "inventory", icon: <InventoryIcon /> },
    { label: "Products", page: "products", icon: <CategoryIcon /> },
    { label: "Users", page: "users", icon: <PeopleAltIcon /> },
  ];

  return (
    <Box
      sx={{
        width: 110,
        height: "100vh",
        backgroundColor: "#3F72AF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pt: 8,
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
      }}
    >
      <Stack spacing={4} alignItems="center" width="100%">
        {sidebarItems.map((item, index) => (
          <Tooltip title={item.label} placement="right" key={index}>
            <Box
              onClick={() =>
                setCurrentPage(
                  item.page as "inventory" | "tasks" | "products" | "users"
                )
              }
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                color: "#fff",
                cursor: "pointer",
                "&:hover": {
                  color: "#FFD700",
                  transform: "scale(1.05)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              <Icon sx={{ fontSize: 30 }}>{item.icon}</Icon>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, fontSize: "0.8rem", mt: 0.5 }}
              >
                {item.label}
              </Typography>
            </Box>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
};

export default Sidebar;
