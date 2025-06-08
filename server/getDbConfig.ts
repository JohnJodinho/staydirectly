import { PoolConfig } from "pg";
import { parse } from "pg-connection-string";
import dotenv from "dotenv";
dotenv.config();

// Helper to get PG connection config based on environment
export function getDbConfig(): PoolConfig {
  const mode = process.env.APP_MODE;  
  const appMode = mode || "development"; // Default to development if not set

  
  console.log(`Running in ${appMode} mode.`);

  if (appMode === "development" || appMode === "test") {
    // Use individual values from .env for development
    const dbVars = {
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
    };
    
    return dbVars;
  } else {
    // In production or staging, use the full DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not defined in production mode.");
    }

    const parsed = parse(databaseUrl);
    // Ensure 'database' is never null (convert null to undefined)
    if (parsed.database === null) {
      parsed.database = undefined;
    }
    return parsed as PoolConfig;
  }
}
