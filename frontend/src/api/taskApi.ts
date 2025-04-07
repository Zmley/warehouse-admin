import apiClient from "./axiosClient.ts";

export const fetchAllTasksAsAdmin = async () => {
  const response = await apiClient.post("/tasks/getTasks");
  return response.data;
};

export const createTaskAsAdmin = async (payload: {
  sourceBinCode: string;
  destinationBinCode: string;
  productCode: string;
}) => {
  const response = await apiClient.post("/tasks/createAsAdmin", payload);
  return response.data;
};

export const cancelTask = async (taskID: string) => {
  const response = await apiClient.post(`/tasks/cancelTask/${taskID}`);
  return response.data;
};
