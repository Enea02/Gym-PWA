import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { exerciseTemplates } from '@/lib/db/schema';
import { eq, or, isNull } from 'drizzle-orm';
import { exerciseTemplateSchema } from '@/lib/validations';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Return system exercises + user's custom exercises
    const templates = await db
      .select()
      .from(exerciseTemplates)
      .where(
        or(
          eq(exerciseTemplates.isSystem, true),
          eq(exerciseTemplates.userId, userId)
        )
      )
      .orderBy(exerciseTemplates.name);

    return NextResponse.json(templates);
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[GET /api/exercises/templates]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await req.json();
    const parsed = exerciseTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, muscleGroup, notes } = parsed.data;

    const [template] = await db
      .insert(exerciseTemplates)
      .values({
        userId,
        name,
        muscleGroup,
        notes: notes ?? null,
        isSystem: false,
      })
      .returning();

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[POST /api/exercises/templates]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
