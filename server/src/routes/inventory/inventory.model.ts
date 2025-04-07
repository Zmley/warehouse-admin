import { DataTypes, Model } from 'sequelize'
import { sequelize } from 'config/db'
import { Bin } from '../bins/bin.model'

export class Inventory extends Model {
  public inventoryID!: string
  public binID!: string
  public productCode!: string
  public quantity!: number
}

Inventory.init(
  {
    inventoryID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    binID: {
      type: DataTypes.UUID,
      allowNull: false
    },
    productCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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
    tableName: 'inventory',
    timestamps: true
  }
)

Inventory.belongsTo(Bin, {
  foreignKey: 'binID',
  targetKey: 'binID'
})

export default Inventory
