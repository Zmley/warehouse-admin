import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  Dialog,
  TablePagination,
  TextField,
} from "@mui/material";
import useAdminTasks from "../hooks/useAdminTasks";
import dayjs from "dayjs";
import AdminCreateTaskForm from "../components/AdminCreateTaskForm";

const AdminTaskPage: React.FC = () => {
  const { tasks, loading, error, cancelTask, refetch } = useAdminTasks();
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "COMPLETED"
  >("ALL");
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const rowsPerPage = 20;

  const handleOpen = () => setOpenDialog(true);
  const handleClose = () => setOpenDialog(false);

  const filteredTasks = useMemo(() => {
    const base =
      filterStatus === "ALL"
        ? tasks
        : tasks.filter((task) => task.status === filterStatus);

    if (!searchKeyword.trim()) return base;

    const keyword = searchKeyword.trim().toLowerCase();

    return base.filter(
      (task) =>
        task.taskID.toLowerCase().includes(keyword) ||
        task.productCode?.toLowerCase().includes(keyword) ||
        task.destinationBinCode?.toLowerCase().includes(keyword) ||
        task.sourceBins?.some((b: any) =>
          b.Bin?.binCode?.toLowerCase().includes(keyword)
        )
    );
  }, [tasks, filterStatus, searchKeyword]);

  const paginatedTasks = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredTasks.slice(start, start + rowsPerPage);
  }, [filteredTasks, page]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" sx={{ mt: 10 }}>
        {error}
      </Typography>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
          All Tasks
        </Typography>
        <Button
          variant="contained"
          onClick={handleOpen}
          sx={{
            borderRadius: "8px",
            backgroundColor: "#3F72AF",
            "&:hover": { backgroundColor: "#2d5e8c" },
            fontWeight: "bold",
          }}
        >
          Create Task
        </Button>
      </Box>

      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3 }}>
          <AdminCreateTaskForm
            onSuccess={() => {
              handleClose();
              refetch();
            }}
          />
        </Box>
      </Dialog>

      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <TextField
          label="Search tasks"
          variant="outlined"
          size="small"
          value={searchKeyword}
          onChange={(e) => {
            setSearchKeyword(e.target.value);
            setPage(0);
          }}
          sx={{ width: 250 }}
        />
        <Button
          variant={filterStatus === "ALL" ? "contained" : "outlined"}
          onClick={() => {
            setPage(0);
            setFilterStatus("ALL");
          }}
        >
          All
        </Button>
        <Button
          variant={filterStatus === "PENDING" ? "contained" : "outlined"}
          onClick={() => {
            setPage(0);
            setFilterStatus("PENDING");
          }}
        >
          Pending
        </Button>
        <Button
          variant={filterStatus === "COMPLETED" ? "contained" : "outlined"}
          onClick={() => {
            setPage(0);
            setFilterStatus("COMPLETED");
          }}
        >
          Completed
        </Button>
      </Stack>

      {/* 表格 */}
      <Paper elevation={3} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f0f4f9" }}>
              <TableCell>Task ID</TableCell>
              <TableCell>Product Code</TableCell>
              <TableCell>Source Bins</TableCell>
              <TableCell>Target Bin</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Updated At</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTasks.map((task) => (
              <TableRow key={task.taskID}>
                <TableCell>{task.taskID}</TableCell>
                <TableCell>{task.productCode}</TableCell>
                <TableCell>
                  {task.sourceBins
                    ?.map((s: any) => s.Bin?.binCode)
                    .join(" / ") || "--"}
                </TableCell>
                <TableCell>{task.destinationBinCode || "--"}</TableCell>
                <TableCell>{task.status}</TableCell>
                <TableCell>
                  {dayjs(task.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                </TableCell>
                <TableCell>
                  {dayjs(task.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
                </TableCell>
                <TableCell align="right">
                  {task.status === "PENDING" && (
                    <Button
                      color="error"
                      size="small"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to cancel this task?"
                          )
                        ) {
                          cancelTask(task.taskID);
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={filteredTasks.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
        />
      </Paper>
    </Box>
  );
};

export default AdminTaskPage;
