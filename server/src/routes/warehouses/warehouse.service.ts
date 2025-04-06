// warehouses/warehouse.service.ts
import Warehouse from "./warehouse.model";

// 获取所有仓库
export const getAllWarehouses = async () => {
  return await Warehouse.findAll();
};

// 获取单个仓库
export const getWarehouseById = async (warehouseID: string) => {
  const warehouse = await Warehouse.findOne({ where: { warehouseID } });
  if (!warehouse) {
    throw new Error("Warehouse not found");
  }
  return warehouse;
};

// 创建仓库
export const createWarehouse = async (warehouseCode: string) => {
  return await Warehouse.create({ warehouseCode });
};

// 更新仓库
export const updateWarehouse = async (
  warehouseID: string,
  warehouseCode: string
) => {
  const warehouse = await Warehouse.findOne({ where: { warehouseID } });
  if (!warehouse) {
    throw new Error("Warehouse not found");
  }
  warehouse.warehouseCode = warehouseCode;
  await warehouse.save();
  return warehouse;
};

// 删除仓库
export const deleteWarehouse = async (warehouseID: string) => {
  const warehouse = await Warehouse.findOne({ where: { warehouseID } });
  if (!warehouse) {
    throw new Error("Warehouse not found");
  }
  await warehouse.destroy();
  return "Warehouse deleted successfully";
};
