import React from "react";
import { Box, Typography } from "@mui/material";

interface SidebarProps {
  setCurrentPage: React.Dispatch<
    React.SetStateAction<"inventory" | "tasks" | "products" | "users">
  >;
}

const Sidebar: React.FC<SidebarProps> = ({ setCurrentPage }) => {
  const sidebarItems = [
    { label: "Tasks", page: "tasks" },
    { label: "Inventory", page: "inventory" },
    { label: "Products", page: "products" },
    { label: "Users", page: "users" },
  ];

  return (
    <Box
      sx={{
        width: "96px",
        height: "100vh",
        backgroundColor: "#3F72AF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "160px",
      }}
    >
      {sidebarItems.map((item, index) => (
        <Box
          key={index}
          sx={{
            textAlign: "center",
            marginBottom: "45px",
            cursor: "pointer",
          }}
          onClick={() =>
            setCurrentPage(
              item.page as "inventory" | "tasks" | "products" | "users"
            )
          }
        >
          <Typography
            variant="caption"
            sx={{ color: "#fff", marginTop: "4px", display: "block" }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default Sidebar;
