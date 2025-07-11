
import { getRoomsWithDailyUsage, getCurrentConfiguration } from '@/lib/actions';
import { RoomGrid } from '@/components/bookly/RoomGrid';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserCog } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { startDate?: string };
}) {
  const [roomsWithUsage, config] = await Promise.all([
    getRoomsWithDailyUsage(searchParams?.startDate),
    getCurrentConfiguration(),
  ]);

  return (
    <main className="flex flex-col flex-grow">
      <div className="flex-grow flex flex-col items-center justify-center p-6">
        {roomsWithUsage.length > 0 ? (
            <RoomGrid initialRoomsWithUsage={roomsWithUsage} config={config} />
        ) : (
           <p className="text-muted-foreground">No rooms have been configured. Please add a room in the admin panel.</p>
        )}
      </div>
      <div className="pb-6 flex justify-center">
        <Link href="/admin" passHref>
          <Button variant="ghost" size="sm">
            <UserCog className="mr-2 h-5 w-5" />
            Admin
          </Button>
        </Link>
      </div>
    </main>
  );
}
