"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("🚀 开始插入数据...");

    const warehouses = await queryInterface.bulkInsert(
      "warehouse",
      [
        {
          warehouseCode: "wh-001",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          warehouseCode: "wh-002",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { returning: ["warehouseID", "warehouseCode"] } 
    );

    console.log("✅ warehouse 数据插入成功!", warehouses);

    const bins = [];
    for (const warehouse of warehouses) {
      for (let b = 1; b <= 3; b++) {
        bins.push({
          binCode: `bin-${b}`,
          warehouseID: warehouse.warehouseID,
          type: "INVENTORY",
          defaultProductID: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      bins.push({
        binCode: `cart-bin-${warehouse.warehouseCode}`,
        warehouseID: warehouse.warehouseID, 
        type: 'CART', 
        defaultProductID: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const insertedBins = await queryInterface.bulkInsert("bin", bins, {
      returning: ["binID", "binCode"],
    });
    console.log("✅ bin 数据插入成功!", insertedBins);

    const inventory = [];
    for (const bin of insertedBins) {
      for (let p = 1; p <= 3; p++) {
        inventory.push({
          binID: bin.binID,
          productID: `p00${p}`,
          quantity: Math.floor(Math.random() * 100) + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await queryInterface.bulkInsert("inventory", inventory);
    console.log("✅ inventory 数据插入成功!");
  },

  down: async (queryInterface, Sequelize) => {
    console.log("🗑 开始删除数据...");
    await queryInterface.bulkDelete("inventory", null, {});
    await queryInterface.bulkDelete("bin", null, {});
    await queryInterface.bulkDelete("warehouse", null, {});
    console.log("✅ 数据删除完成！");
  },
};