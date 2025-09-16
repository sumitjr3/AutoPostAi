import { Pool } from "pg";
import dotenv from "dotenv";

// Load .env early
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // allows Node to connect to Render SSL DB
  },
});

export default pool;
