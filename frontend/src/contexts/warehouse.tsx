import React, {
  createContext,
  useState,
  ReactNode,
  useEffect,
  useContext,
} from "react";
import { AuthContext } from "../contexts/auth"; // 引入 AuthContext
import { getWarehouseById } from "../api/warehouseApi"; // 假设有 API 获取仓库代码

// 定义仓库类型
interface Warehouse {
  warehouseID: string;
  warehouseCode: string;
}

interface WarehouseContextType {
  currentWarehouse: Warehouse | null; // 当前选中的仓库
  setCurrentWarehouse: (warehouse: Warehouse | null) => void; // 设置当前仓库的方法
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
  ); // 当前选中的仓库
  const [loading, setLoading] = useState<boolean>(false); // 加载状态
  const [error, setError] = useState<string | null>(null); // 错误状态

  useEffect(() => {
    const getWarehouse = async () => {
      if (userProfile?.warehouseID) {
        setLoading(true);
        try {
          const warehouseCode = await getWarehouseById(userProfile.warehouseID); // 获取仓库的 code
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

    getWarehouse(); // 调用函数获取仓库信息
  }, [userProfile?.warehouseID]); // 当 `warehouseID` 改变时重新获取

  return (
    <WarehouseContext.Provider
      value={{ currentWarehouse, setCurrentWarehouse }}
    >
      {children}
    </WarehouseContext.Provider>
  );
};
