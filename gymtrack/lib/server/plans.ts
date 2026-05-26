import { db } from '@/lib/db';
import { workoutPlans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserPlans(userId: string) {
  return db.query.workoutPlans.findMany({
    where: eq(workoutPlans.userId, userId),
    with: {
      exercises: {
        with: { template: true },
        orderBy: (pe, { asc }) => [asc(pe.orderIndex)],
      },
    },
    orderBy: (wp, { asc }) => [asc(wp.dayOfWeek)],
  });
}
