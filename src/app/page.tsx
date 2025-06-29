
import { Header } from '@/components/bookly/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getRoomsWithDailyUsage } from '@/lib/actions';
import type { Room } from '@/types';
import { Armchair } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomWithDailyUsage extends Room {
  dailyUsage: number[];
}

export default async function HomePage() {
  const roomsWithUsage: RoomWithDailyUsage[] = await getRoomsWithDailyUsage();

  const getUsageColor = (usage: number) => {
    if (usage === 0) return 'bg-white/20';
    if (usage <= 50) return 'bg-white/40';
    if (usage <= 90) return 'bg-white/70';
    return 'bg-white/90';
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
          {roomsWithUsage.length > 0 ? (
            roomsWithUsage.map((room) => (
              <Link key={room.id} href={`/book?roomId=${room.id}`} passHref>
                <Button
                  className="h-36 w-56 rounded-xl shadow-lg p-0 flex flex-col justify-between items-stretch bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 ease-in-out transform hover:-translate-y-1"
                >
                  <div className="flex flex-col items-center p-4 flex-grow justify-center">
                      <div className="flex items-center gap-x-2">
                          <Armchair size={32} />
                          <span className="text-xl font-semibold">x {room.capacity}</span>
                      </div>
                      <span className="mt-2 text-base text-center font-bold">{room.name}</span>
                  </div>

                  <div className="w-full py-2 px-3 bg-black/10 border-t border-accent-foreground/20">
                      <p className="text-xs text-center font-medium text-accent-foreground/80 mb-1">
                          Usage (Next 5 Working Days)
                      </p>
                      <div className="flex w-full justify-center gap-1">
                        {room.dailyUsage.map((usage, index) => (
                          <div
                            key={index}
                            title={`Day ${index + 1}: ${usage}% used`}
                            className={cn(
                              'h-2 w-full flex-1 rounded-sm transition-colors',
                              getUsageColor(usage)
                            )}
                          />
                        ))}
                      </div>
                  </div>
                </Button>
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
