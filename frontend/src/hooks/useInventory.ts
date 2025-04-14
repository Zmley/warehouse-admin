import { useState } from "react";
import {
  fetchInventory,
  deleteInventoryItem,
  updateInventoryItem,
} from "../api/inventoryApi";
import { InventoryItem } from "../types/inventoryTypes";
import { useParams } from "react-router-dom";

const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { warehouseID } = useParams();

  // Function to fetch all inventory items
  const fetchAllInventory = async () => {
    try {
      setLoading(true);

      if (!warehouseID) {
        setError("❌ No warehouse selected.");
        return;
      }

      const data = await fetchInventory(warehouseID);
      setInventory(data.inventory);
      setError(null);
    } catch (err) {
      setError("❌ Failed to fetch inventory data");
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchAllInventory(); // Load inventory when the component mounts
  // }, []);

  const removeInventoryItem = async (id: string) => {
    await deleteInventoryItem(id);
    setInventory((prev) => prev.filter((item) => item.inventoryID !== id));
  };

  const editInventoryItem = async (
    id: string,
    updatedData: Partial<InventoryItem>
  ) => {
    await updateInventoryItem(id, updatedData);
    setInventory((prev) =>
      prev.map((item) =>
        item.inventoryID === id ? { ...item, ...updatedData } : item
      )
    );
  };

  return {
    inventory,
    loading,
    error,
    removeInventoryItem,
    editInventoryItem,
    fetchAllInventory, // Added function to refresh inventory
  };
};

export default useInventory;
