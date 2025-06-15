import { join } from 'path';
import { fileURLToPath } from 'url';

import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

dotenv.config();

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const runMigration = async () => {
  const connection = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(connection);

  console.warn('Running migrations...');

  try {
    await migrate(db, { migrationsFolder: join(__dirname, 'drizzle/migrations') });
    console.warn('Migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
};

runMigration();
