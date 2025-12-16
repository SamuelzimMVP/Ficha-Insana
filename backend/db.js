const { Client } = require('pg');
require('dotenv').config();

const createClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
};

module.exports = createClient;