
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
      <div className="flex flex-wrap justify-center gap-10">
        {roomsWithUsage.length > 0 ? (
          roomsWithUsage.map((room) => (
            <Link
              key={room.id}
              href={`/book?roomId=${room.id}`}
              className="w-80 rounded-xl shadow-lg flex flex-col bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 ease-in-out transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="flex flex-col items-center p-10 flex-grow justify-center">
                  <div className="flex items-center gap-x-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="56"
                        height="56"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="5" y="3" width="14" height="8" rx="2" />
                        <rect x="4" y="11" width="16" height="4" rx="2" />
                        <path d="M7 15v6" />
                        <path d="M17 15v6" />
                      </svg>
                      <span className="text-4xl font-semibold">x {room.capacity}</span>
                  </div>
                  <span className="mt-3 text-2xl text-center font-bold">{room.name}</span>
              </div>

              <div className="w-full pt-5 pb-6 px-6 bg-black/10">
                  <p className="text-lg text-center font-medium text-accent-foreground/80 mb-2">
                      Usage (Next 5 Working Days)
                  </p>
                  <div className="space-y-1.5">
                    {room.dailyUsage.map((day) => {
                      return (
                        <div key={day.date} className="flex items-center gap-2">
                          <span className="text-lg font-mono font-bold text-accent-foreground/70 w-4 text-center">
                            {format(new Date(day.date + 'T00:00:00'), 'EEEEE')}
                          </span>
                          <div className="flex gap-px flex-1">
                            {day.slots.map((slot) => {
                              const tooltipText = slot.isBooked
                                ? `${format(new Date(day.date + 'T00:00:00'), 'MMM d')}: ${slot.startTime} - ${slot.endTime}\nBooked: "${slot.title}" by ${slot.userName}`
                                : `${format(new Date(day.date + 'T00:00:00'), 'MMM d')}: ${slot.startTime} - ${slot.endTime} (Available)`;

                              return (
                                <div
                                  key={slot.startTime}
                                  title={tooltipText}
                                  className={cn(
                                    'h-5 flex-1 rounded-sm border border-accent-foreground/30',
                                    slot.isBooked && slot.title
                                      ? colorPalette[stringToHash(slot.title) % colorPalette.length]
                                      : 'bg-transparent'
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
