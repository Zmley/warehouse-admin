// warehouses/warehouse.service.ts
import Warehouse from "./warehouse.model";

export const getAllWarehouses = async () => {
  return await Warehouse.findAll();
};

export const getWarehouseById = async (warehouseID: string) => {
  const warehouse = await Warehouse.findOne({ where: { warehouseID } });
  if (!warehouse) {
    throw new Error("Warehouse not found");
  }
  return warehouse;
};

export const createWarehouse = async (warehouseCode: string) => {
  return await Warehouse.create({ warehouseCode });
};

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

export const deleteWarehouse = async (warehouseID: string) => {
  const warehouse = await Warehouse.findOne({ where: { warehouseID } });
  if (!warehouse) {
    throw new Error("Warehouse not found");
  }
  await warehouse.destroy();
  return "Warehouse deleted successfully";
};
