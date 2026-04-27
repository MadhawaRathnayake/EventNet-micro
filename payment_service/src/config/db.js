const { Sequelize } = require('sequelize');
const config = require('./env');

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    pool: config.db.pool,
    logging: config.nodeEnv === 'development' ? console.log : false,
    dialectOptions: {
      // SSL configuration for Azure / production
      ...((config.db.ssl || config.nodeEnv === 'production') && {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }),
    },
  }
);

// Test database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');

    // Sync models (creates tables if they don't exist)
    await sequelize.sync({ alter: config.nodeEnv === 'development' });
    console.log('✅ Database models synced');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    // Retry connection after 5 seconds
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = { sequelize, connectDB };
