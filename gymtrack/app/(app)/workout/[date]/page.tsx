import { redirect } from 'next/navigation';

export default async function WorkoutDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  redirect(`/workout`);
}
