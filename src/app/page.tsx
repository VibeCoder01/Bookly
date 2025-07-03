
import { getRoomsWithDailyUsage, getCurrentConfiguration } from '@/lib/actions';
import { RoomGrid } from '@/components/bookly/RoomGrid';

export default async function HomePage() {
  const [roomsWithUsage, config] = await Promise.all([
    getRoomsWithDailyUsage(),
    getCurrentConfiguration(),
  ]);

  return (
    <main className="flex-grow flex items-center justify-center p-6">
      {roomsWithUsage.length > 0 ? (
          <RoomGrid roomsWithUsage={roomsWithUsage} config={config} />
      ) : (
         <p className="text-muted-foreground">No rooms have been configured. Please add a room in the admin panel.</p>
      )}
    </main>
  );
}
