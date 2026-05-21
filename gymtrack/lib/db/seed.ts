import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const SYSTEM_EXERCISES: Array<{
  name: string;
  muscleGroup: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio';
}> = [
  { name: 'Panca piana', muscleGroup: 'chest' },
  { name: 'Squat', muscleGroup: 'legs' },
  { name: 'Stacco da terra', muscleGroup: 'back' },
  { name: 'Pull-up', muscleGroup: 'back' },
  { name: 'Military press', muscleGroup: 'shoulders' },
  { name: 'Rematore bilanciere', muscleGroup: 'back' },
  { name: 'Curl bilanciere', muscleGroup: 'arms' },
  { name: 'Dips', muscleGroup: 'chest' },
  { name: 'Alzate laterali', muscleGroup: 'shoulders' },
  { name: 'Push-down cavi', muscleGroup: 'arms' },
  { name: 'Romanian deadlift', muscleGroup: 'legs' },
  { name: 'Leg press', muscleGroup: 'legs' },
];

async function seed() {
  console.log('Starting seed...');

  // Seed system exercises
  for (const exercise of SYSTEM_EXERCISES) {
    const existing = await db
      .select()
      .from(schema.exerciseTemplates)
      .where(eq(schema.exerciseTemplates.name, exercise.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.exerciseTemplates).values({
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        isSystem: true,
        userId: null,
      });
      console.log(`Inserted exercise: ${exercise.name}`);
    } else {
      console.log(`Exercise already exists: ${exercise.name}`);
    }
  }

  // Seed admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gymtrack.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  const existingAdmin = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail))
    .limit(1);

  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.insert(schema.users).values({
      email: adminEmail,
      passwordHash,
      name: 'Admin',
      role: 'admin',
      preferredUnit: 'kg',
      theme: 'dark',
    });
    console.log(`Inserted admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
