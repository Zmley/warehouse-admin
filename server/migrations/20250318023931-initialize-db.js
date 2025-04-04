'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    )
    await queryInterface.createTable('warehouse', {
      warehouseID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn('uuid_generate_v4'),
        allowNull: false,
        primaryKey: true
      },
      warehouseCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    })

    await queryInterface.createTable('account', {
      accountID: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM(
          'ADMIN',
          'PICKER',
          'TRANSPORT_WORKER',
          'SUPER_ADMIN'
        ),
        allowNull: false
      },
      cartID: {
        type: Sequelize.UUID,
        allowNull: true
      },
      warehouseID: {
        type: Sequelize.UUID,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    })

    await queryInterface.createTable('bin', {
      binID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn('uuid_generate_v4'),
        allowNull: false,
        primaryKey: true
      },
      warehouseID: {
        type: Sequelize.UUID,
        allowNull: true
      },
      binCode: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('PICK_UP', 'INVENTORY', 'CART'),
        allowNull: false
      },
      defaultProductID: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    })

    await queryInterface.createTable('inventory', {
      inventoryID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn('uuid_generate_v4'),
        allowNull: false,
        primaryKey: true
      },
      binID: {
        type: Sequelize.UUID,
        allowNull: false
      },
      productID: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    })

    await queryInterface.createTable('task', {
      taskID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn('uuid_generate_v4'),
        allowNull: false,
        primaryKey: true
      },
      productID: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sourceBinID: {
        type: Sequelize.UUID,
        allowNull: true
      },
      destinationBinID: {
        type: Sequelize.UUID,
        allowNull: true
      },
      creatorID: {
        type: Sequelize.UUID,
        allowNull: true
      },
      accepterID: {
        type: Sequelize.UUID,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'IN_PROCESS', 'COMPLETED', 'CANCELED'),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    })

    //account.warehouseID -> warehouse.warehouseID
    await queryInterface.addConstraint('account', {
      fields: ['warehouseID'],
      type: 'foreign key',
      name: 'fk_account_warehouse',
      references: {
        table: 'warehouse',
        field: 'warehouseID'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    })

    //bin.warehouseID -> warehouse.warehouseID
    await queryInterface.addConstraint('bin', {
      fields: ['warehouseID'],
      type: 'foreign key',
      name: 'fk_bin_warehouse',
      references: {
        table: 'warehouse',
        field: 'warehouseID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })

    //inventory.binID -> bin.binID
    await queryInterface.addConstraint('inventory', {
      fields: ['binID'],
      type: 'foreign key',
      name: 'fk_inventory_bin',
      references: {
        table: 'bin',
        field: 'binID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })

    // task.sourceBinID & task.destinationBinID -> bin.binID

    await queryInterface.addConstraint('task', {
      fields: ['sourceBinID'],
      type: 'foreign key',
      name: 'fk_task_source_bin',
      references: {
        table: 'bin',
        field: 'binID'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addConstraint('task', {
      fields: ['destinationBinID'],
      type: 'foreign key',
      name: 'fk_task_destination_bin',
      references: {
        table: 'bin',
        field: 'binID'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    })

    // task.creatorID & task.accepterID -> account.accountID

    await queryInterface.addConstraint('task', {
      fields: ['creatorID'],
      type: 'foreign key',
      name: 'fk_task_creator',
      references: {
        table: 'account',
        field: 'accountID'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addConstraint('task', {
      fields: ['accepterID'],
      type: 'foreign key',
      name: 'fk_task_accepter',
      references: {
        table: 'account',
        field: 'accountID'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addConstraint('bin', {
      fields: ['warehouseID', 'binCode'],
      type: 'unique',
      name: 'unique_warehouse_bin'
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('task')
    await queryInterface.dropTable('inventory')
    await queryInterface.dropTable('bin')
    await queryInterface.dropTable('account')
    await queryInterface.dropTable('warehouse')
  }
}
