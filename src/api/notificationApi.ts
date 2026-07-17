import { UserPlant } from '../types';
import { calcNextWateringDate } from '../utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function headers() {
  return {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function upsertSchedule(userKey: string, plant: UserPlant): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  await fetch(`${SUPABASE_URL}/functions/v1/upsert-schedule`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      userKey,
      plantId: plant.id,
      plantName: plant.name,
      nextWateringDate: calcNextWateringDate(plant),
    }),
  });
}

export async function deleteSchedule(userKey: string, plantId: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  await fetch(`${SUPABASE_URL}/functions/v1/delete-schedule`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ userKey, plantId }),
  });
}

export async function syncAllSchedules(userKey: string, plants: UserPlant[]): Promise<void> {
  await Promise.all(plants.map(p => upsertSchedule(userKey, p)));
}
