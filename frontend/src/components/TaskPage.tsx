import React from "react";
import { Box, Typography } from "@mui/material";

const TaskPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
        📋 Task Management
      </Typography>
      <Typography>Here will be a list of tasks for admin to manage.</Typography>
    </Box>
  );
};

export default TaskPage;
