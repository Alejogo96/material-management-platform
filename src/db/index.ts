import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

/** Cliente de base de datos. Es null mientras no se configure DATABASE_URL. */
export const db = url ? drizzle(postgres(url, { prepare: false }), { schema }) : null;
export { schema };
