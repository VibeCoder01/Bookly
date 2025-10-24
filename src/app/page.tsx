
import { getRoomsWithDailyUsage, getCurrentConfiguration, getCurrentUser, getCurrentAdmin, logoutAdmin, logoutUser } from '@/lib/actions';
import { RoomGrid } from '@/components/bookly/RoomGrid';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserCog } from 'lucide-react';

export const dynamic = 'force-dynamic';

type HomePageSearchParams =
  | { startDate?: string }
  | Promise<{ startDate?: string }>
  | undefined;

export default async function HomePage({
  searchParams,
}: {
  searchParams?: HomePageSearchParams;
}) {
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<any>)?.then === 'function'
      ? await searchParams
      : (searchParams as { startDate?: string } | undefined);

  const [roomsWithUsage, config, currentUser, currentAdmin] = await Promise.all([
    getRoomsWithDailyUsage(resolvedSearchParams?.startDate),
    getCurrentConfiguration(),
    getCurrentUser(),
    getCurrentAdmin(),
  ]);

  const logoutUserToHome = logoutUser.bind(null, '/');

  return (
    <main className="flex flex-col flex-grow">
      <div className="flex-grow flex flex-col items-center justify-center p-6">
        {roomsWithUsage.length > 0 ? (
            <RoomGrid initialRoomsWithUsage={roomsWithUsage} config={config} currentUser={currentUser} />
        ) : (
           <p className="text-muted-foreground">No rooms have been configured. Please add a room in the admin panel.</p>
        )}
      </div>
      <div className="pb-6 flex justify-center">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin" passHref>
            <Button variant="ghost" size="sm">
              <UserCog className="mr-2 h-5 w-5" />
              Admin
            </Button>
          </Link>
          {currentUser && (
            <form action={logoutUserToHome}>
              <Button variant="outline" size="sm" type="submit">
                Logout User
              </Button>
            </form>
          )}
          {currentAdmin && (
            <form action={logoutAdmin}>
              <Button variant="outline" size="sm" type="submit">
                Logout Admin
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
