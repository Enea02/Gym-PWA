import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// DATABASE_URL must be set in .env.local (dev) or Vercel environment (prod)
const sql = neon(process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@placeholder/placeholder');
export const db = drizzle(sql, { schema });
