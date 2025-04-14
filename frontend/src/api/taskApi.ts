import apiClient from "./axiosClient.ts";

export const fetchTasks = async (warehouseID: string) => {
  const response = await apiClient.get("/tasks/all", {
    params: { warehouseID },
  });
  return response.data;
};

export const createTask = async (payload: {
  sourceBinCode: string;
  destinationBinCode: string;
  productCode: string;
}) => {
  const response = await apiClient.post("/tasks/", payload);
  return response.data;
};

export const cancelTask = async (taskID: string) => {
  const response = await apiClient.post(`/tasks/${taskID}`);
  return response.data;
};
