import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { getDashboardData } from '@/lib/server/dashboard';
import { CACHE } from '@/lib/http/cache';

export async function GET() {
  try {
    const session = await requireAuth();
    const data = await getDashboardData(session.user.id);
    return NextResponse.json(data, { headers: { 'Cache-Control': CACHE.short } });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[GET /api/stats/dashboard]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
