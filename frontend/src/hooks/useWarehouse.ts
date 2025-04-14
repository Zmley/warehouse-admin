import { useEffect, useState } from "react";
import { getAllWarehouses } from "../api/warehouseApi";

interface Warehouse {
  warehouseID: string;
  warehouseCode: string;
}

const useWarehouses = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWarehouses = async () => {
      setLoading(true);
      try {
        const data = await getAllWarehouses();
        setWarehouses(data);
      } catch (err) {
        setError("Error fetching warehouses");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  return { warehouses, loading, error };
};

export default useWarehouses;
