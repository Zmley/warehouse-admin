import { DataTypes, Model } from 'sequelize'
import { sequelize } from 'config/db'
import Inventory from '../inventory/inventory.model'
import Bin from '../bins/bin.model'

export class Task extends Model {
  public taskID!: string
  public sourceBinID!: string
  public destinationBinID!: string
  public accepterID!: string
  public creatorID!: string
  public productCode!: string
  public status!: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELED'
  public createdAt!: Date
  public updatedAt!: Date | null

  public readonly sourceBin?: Bin
  public readonly destinationBin?: Bin
}

Task.init(
  {
    taskID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    sourceBinID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    destinationBinID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    creatorID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    accepterID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    productCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'IN_PROCESS', 'COMPLETED', 'CANCELED'),
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'task',
    timestamps: true
  }
)

Task.hasMany(Inventory, {
  foreignKey: 'productCode',
  sourceKey: 'productCode'
})

Task.belongsTo(Bin, {
  foreignKey: 'sourceBinID',
  as: 'sourceBin',
  targetKey: 'binID'
})

Task.belongsTo(Bin, {
  foreignKey: 'destinationBinID',
  as: 'destinationBin',
  targetKey: 'binID'
})

Task.hasMany(Inventory, {
  foreignKey: 'productCode',
  sourceKey: 'productCode',
  as: 'inventories'
})

export default Task
