
import Link from 'next/link';
import { getRoomsWithDailyUsage } from '@/lib/actions';
import type { RoomWithDailyUsage } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const colorPalette = [
  'bg-chart-1/80',
  'bg-chart-2/80',
  'bg-chart-3/80',
  'bg-chart-4/80',
  'bg-chart-5/80',
];

const stringToHash = (str: string): number => {
  let hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export default async function HomePage() {
  const roomsWithUsage: RoomWithDailyUsage[] = await getRoomsWithDailyUsage();

  return (
    <main className="flex-grow flex items-center justify-center p-6">
      <div className="flex flex-wrap justify-center gap-6">
        {roomsWithUsage.length > 0 ? (
          roomsWithUsage.map((room) => (
            <Link
              key={room.id}
              href={`/book?roomId=${room.id}`}
              className="w-56 rounded-xl shadow-lg flex flex-col bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 ease-in-out transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="flex flex-col items-center p-4 flex-grow justify-center">
                  <div className="flex items-center gap-x-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 12v-2a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2" />
                        <path d="M7 12h10v5a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-5Z" />
                        <path d="M12 19v3" />
                        <path d="M15 22H9" />
                      </svg>
                      <span className="text-xl font-semibold">x {room.capacity}</span>
                  </div>
                  <span className="mt-2 text-base text-center font-bold">{room.name}</span>
              </div>

              <div className="w-full pt-2 pb-3 px-3 bg-black/10">
                  <p className="text-xs text-center font-medium text-accent-foreground/80 mb-2">
                      Usage (Next 5 Working Days)
                  </p>
                  <div className="space-y-1">
                    {room.dailyUsage.map((day) => {
                      return (
                        <div key={day.date} className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-accent-foreground/70 w-3 text-center">
                            {format(new Date(day.date + 'T00:00:00'), 'EEEEE')}
                          </span>
                          <div className="flex gap-px flex-1">
                            {day.slots.map((slot) => {
                              const tooltipText = slot.isBooked
                                ? `${format(new Date(day.date + 'T00:00:00'), 'MMM d')}: ${slot.startTime} - ${slot.endTime}\nBooked: "${slot.title}" by ${slot.userName}`
                                : `${format(new Date(day.date + 'T00:00:00'), 'MMM d')}: ${slot.startTime} - ${slot.endTime} (Available)`;

                              const slotColor = slot.isBooked && slot.title
                                ? colorPalette[stringToHash(slot.title) % colorPalette.length]
                                : 'bg-transparent border border-accent-foreground/30';

                              return (
                                <div
                                  key={slot.startTime}
                                  title={tooltipText}
                                  className={cn(
                                    'h-2 flex-1 rounded-sm',
                                    slotColor || 'bg-white/90' // Fallback for safety
                                  )}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
              </div>
            </Link>
          ))
        ) : (
           <p className="text-muted-foreground">No rooms have been configured. Please add a room in the admin panel.</p>
        )}
      </div>
    </main>
  );
}
