import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { getDbConfig } from "./getDbConfig"; // adjust path as needed
import * as schema from "../shared/schema";

const { Pool } = pg;

const pool = new Pool(getDbConfig());

export const db = drizzle(pool, { schema });
