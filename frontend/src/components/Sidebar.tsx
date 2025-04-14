import React from "react";
import { Box, Typography, Tooltip, Icon } from "@mui/material";
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
        width: 120,
        height: "%100",
        backgroundColor: "#2f3e4e",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-around",
        py: 4,
        boxShadow: "4px 0 10px rgba(0,0,0,0.1)",
      }}
    >
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
              color: "#ffffff",
              cursor: "pointer",
              transition: "all 0.3s ease",
              "&:hover": {
                color: "#90caf9",
                transform: "scale(1.1)",
              },
            }}
          >
            <Icon sx={{ fontSize: 30, mb: 0.5 }}>{item.icon}</Icon>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                fontSize: "0.85rem",
                textAlign: "center",
              }}
            >
              {item.label}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
};

export default Sidebar;
