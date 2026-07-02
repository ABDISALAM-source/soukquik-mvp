require('ts-node').register({ transpileOnly: true });
module.exports = async () => {
  const { pool } = require('./src/config/db');
  await pool.end();
};
