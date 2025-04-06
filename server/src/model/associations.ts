import { Account } from "../routes/accounts/accounts.model";
import { Warehouse } from "../routes/warehouses/warehouse.model";

export const setupAssociations = () => {
  Account.belongsTo(Warehouse, {
    foreignKey: "warehouseID",
  });

  Warehouse.hasMany(Account, {
    foreignKey: "warehouseID",
  });
};
