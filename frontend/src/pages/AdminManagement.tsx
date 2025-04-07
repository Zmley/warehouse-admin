import React, { useState } from "react";
import { Box } from "@mui/material";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import InventoryPage from "./InventoryPage";
import TaskPage from "../components/TaskPage";

const AdminManagement: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<
    "inventory" | "tasks" | "products" | "users"
  >("inventory");

  const renderPage = () => {
    switch (currentPage) {
      case "inventory":
        return <InventoryPage />;
      case "tasks":
        return <TaskPage />;
      // case "products":
      //   return <ProductPage />;
      // case "users":
      //   return <UserPage />;
      default:
        return <div>Select a menu item</div>;
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#f8f9fb" }}>
      <Sidebar setCurrentPage={setCurrentPage} />

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Topbar />

        <Box sx={{ flexGrow: 1, padding: "20px" }}>{renderPage()}</Box>
      </Box>
    </Box>
  );
};

export default AdminManagement;
