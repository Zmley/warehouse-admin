import React, {
  createContext,
  useState,
  ReactNode,
  useEffect,
  useContext,
} from "react";
import { AuthContext } from "../contexts/auth";
import { getWarehouseById } from "../api/warehouseApi";

interface Warehouse {
  warehouseID: string;
  warehouseCode: string;
}

interface WarehouseContextType {
  currentWarehouse: Warehouse | null;
  setCurrentWarehouse: (warehouse: Warehouse | null) => void;
}

export const WarehouseContext = createContext<WarehouseContextType | undefined>(
  undefined
);

export const WarehouseProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error(
      "AuthContext is undefined. Ensure that AuthProvider is wrapping the component tree."
    );
  }

  const { userProfile } = authContext;

  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getWarehouse = async () => {
      if (userProfile?.warehouseID) {
        setLoading(true);
        try {
          const warehouseCode = await getWarehouseById(userProfile.warehouseID);
          setCurrentWarehouse({
            warehouseID: userProfile.warehouseID,
            warehouseCode,
          });
        } catch (err) {
          setError("Error fetching warehouse data");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    getWarehouse();
  }, [userProfile?.warehouseID]);

  return (
    <WarehouseContext.Provider
      value={{ currentWarehouse, setCurrentWarehouse }}
    >
      {children}
    </WarehouseContext.Provider>
  );
};
