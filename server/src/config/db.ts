import { Sequelize } from 'sequelize'
import env from 'config/config'

export const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
  dialect: 'postgres',
  logging: false
})

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.')
  })
  .catch(error => {
    console.error('Unable to connect to the database: ', error)
  })
