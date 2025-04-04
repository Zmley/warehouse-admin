import { DataTypes, Model } from 'sequelize'
import { sequelize } from 'config/db'

export class Account extends Model {
  public accountID!: string
  public email!: string
  public role!: 'ADMIN' | 'TRANSPORT_WORKER' | 'PICKER' | 'SUPER_ADMIN'
  public firstName!: string
  public lastName!: string
  public cartID!: string | null
  public warehouseID!: string | null
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Account.init(
  {
    accountID: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    role: {
      type: DataTypes.ENUM(
        'ADMIN',
        'PICKER',
        'TRANSPORT_WORKER',
        'SUPER_ADMIN'
      ),
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cartID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    warehouseID: {
      type: DataTypes.UUID,
      allowNull: true
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
    tableName: 'account',
    timestamps: true
  }
)

export default Account
