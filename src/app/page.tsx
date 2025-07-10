
import { getRoomsWithDailyUsage, getCurrentConfiguration } from '@/lib/actions';
import { RoomGrid } from '@/components/bookly/RoomGrid';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [roomsWithUsage, config] = await Promise.all([
    getRoomsWithDailyUsage(),
    getCurrentConfiguration(),
  ]);

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-6">
      {roomsWithUsage.length > 0 ? (
          <RoomGrid initialRoomsWithUsage={roomsWithUsage} config={config} />
      ) : (
         <p className="text-muted-foreground">No rooms have been configured. Please add a room in the admin panel.</p>
      )}
    </main>
  );
}
