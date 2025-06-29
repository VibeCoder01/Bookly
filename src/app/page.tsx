
import { Header } from '@/components/bookly/Header';
import Link from 'next/link';
import { getRoomsWithDailyUsage } from '@/lib/actions';
import type { RoomWithDailyUsage } from '@/types';
import { Armchair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default async function HomePage() {
  const roomsWithUsage: RoomWithDailyUsage[] = await getRoomsWithDailyUsage();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
          {roomsWithUsage.length > 0 ? (
            roomsWithUsage.map((room) => (
              <Link
                key={room.id}
                href={`/book?roomId=${room.id}`}
                className="w-56 rounded-xl shadow-lg flex flex-col bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 ease-in-out transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="flex flex-col items-center p-4 flex-grow justify-center">
                    <div className="flex items-center gap-x-2">
                        <Armchair size={32} />
                        <span className="text-xl font-semibold">x {room.capacity}</span>
                    </div>
                    <span className="mt-2 text-base text-center font-bold">{room.name}</span>
                </div>

                <div className="w-full pt-2 pb-3 px-3 bg-black/10">
                    <p className="text-xs text-center font-medium text-accent-foreground/80 mb-1">
                        Usage (Next 5 Working Days)
                    </p>
                    <div className="flex w-full justify-center items-end gap-1">
                      {room.dailyUsage.map((dayUsage, index) => (
                        <div
                          key={index}
                          title={`${format(new Date(dayUsage.date + 'T00:00:00'), 'MMM d')}: ${dayUsage.usage}% used`}
                          className="h-8 w-full flex-1 rounded-sm bg-muted/40 overflow-hidden relative"
                        >
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-white/70"
                            style={{ height: `${dayUsage.usage}%` }}
                          />
                        </div>
                      ))}
                    </div>
                </div>
              </Link>
            ))
          ) : (
             <p className="text-muted-foreground">No rooms have been configured. Please add a room in the admin panel.</p>
          )}
        </div>
      </main>
    </div>
  );
}
