import { useEffect, useState } from "react";
import {
  fetchInventory,
  deleteInventoryItem,
  addInventoryItem,
  updateInventoryItem,
} from "../api/inventoryApi";
import { InventoryItem } from "../types/inventoryTypes";
import { useInventoryContext } from "../contexts/Inventory";

const useInventory = () => {
  const { inventory, setInventory } = useInventoryContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchInventory();
        setInventory(data);
      } catch (err) {
        setError("❌ Failed to fetch inventory data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setInventory]);

  const removeInventoryItem = async (id: string) => {
    await deleteInventoryItem(id);
    setInventory((prevInventory) =>
      prevInventory.filter((item) => item.id !== id)
    );
  };

  const addNewItem = async (item: Omit<InventoryItem, "id">) => {
    const existingItem = inventory.find(
      (i) =>
        i.warehouse_code === item.warehouse_code &&
        i.bin_code === item.bin_code &&
        i.product_code === item.product_code
    );

    if (existingItem) {
      const updatedQuantity = existingItem.quantity + item.quantity;

      await updateInventoryItem(existingItem.id, { quantity: updatedQuantity });

      setInventory((prevInventory) =>
        prevInventory.map((inv) =>
          inv.id === existingItem.id
            ? { ...inv, quantity: updatedQuantity }
            : inv
        )
      );
    } else {
      const newItem = await addInventoryItem(item);
      setInventory((prevInventory) => [...prevInventory, newItem]);
    }
  };

  const editInventoryItem = async (
    id: string,
    updatedData: Partial<InventoryItem>
  ) => {
    await updateInventoryItem(id, updatedData);
    setInventory((prevInventory) =>
      prevInventory.map((item) =>
        item.id === id ? { ...item, ...updatedData } : item
      )
    );
  };

  return {
    inventory,
    loading,
    error,
    removeInventoryItem,
    addNewItem,
    editInventoryItem,
  };
};

export default useInventory;
