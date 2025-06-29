
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
    if (usage === 0) return 'bg-muted/30';
    if (usage <= 50) return 'bg-primary/40';
    if (usage <= 90) return 'bg-primary';
    return 'bg-accent';
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
                  variant="outline"
                  className="h-36 w-56 rounded-xl shadow-lg p-0 flex flex-col justify-between items-stretch bg-card hover:bg-muted/80 transition-all duration-200 ease-in-out transform hover:-translate-y-1"
                >
                  <div className="flex flex-col items-center p-4 flex-grow justify-center">
                      <div className="flex items-center gap-x-2 text-card-foreground">
                          <Armchair size={32} className="text-primary" />
                          <span className="text-xl font-semibold">x {room.capacity}</span>
                      </div>
                      <span className="mt-2 text-base text-center font-bold text-primary">{room.name}</span>
                  </div>

                  <div className="w-full py-2 px-3 bg-muted/50 border-t">
                      <p className="text-xs text-center font-medium text-muted-foreground mb-1">
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
