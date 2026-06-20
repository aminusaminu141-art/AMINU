import { Sequelize } from 'sequelize';

// Database configuration
const databaseConfig = {
  database: process.env.DB_NAME || 'school_portal',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql', // or 'postgres', 'sqlite', etc.
};

// Initialize Sequelize
const sequelize = new Sequelize(databaseConfig.database, databaseConfig.username, databaseConfig.password, {
  host: databaseConfig.host,
  dialect: databaseConfig.dialect,
});

// Test the database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Export the sequelize instance and test connection function
export { sequelize, testConnection };