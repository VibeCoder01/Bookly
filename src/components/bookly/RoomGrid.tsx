
'use client';

import Link from 'next/link';
import type { RoomWithDailyUsage, AppConfiguration, SlotStatus } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState } from 'react';
import { SlotDetailsDialog } from '@/components/bookly/SlotDetailsDialog';

interface RoomGridProps {
    roomsWithUsage: RoomWithDailyUsage[];
    config: AppConfiguration;
}

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


export function RoomGrid({ roomsWithUsage, config }: RoomGridProps) {
    const [isSlotDetailsOpen, setIsSlotDetailsOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; slot: SlotStatus } | null>(null);

    const handleSlotClick = (date: string, slot: SlotStatus) => {
        setSelectedSlot({ date, slot });
        setIsSlotDetailsOpen(true);
    };

    const scale = config.homePageScale || 'sm';

    const scalingStyles = {
        xs: {
          container: 'w-64',
          iconPadding: 'p-6',
          iconSize: 48,
          capacityText: 'text-3xl',
          nameText: 'mt-2 text-xl',
          usagePadding: 'pt-4 pb-5 px-5',
          usageTitle: 'text-base mb-2',
          usageDaySpacing: 'space-y-1',
          dayLetter: 'text-base w-4',
          usageBar: 'h-4',
          slotGap: 'gap-1',
        },
        sm: {
          container: 'w-80',
          iconPadding: 'p-8',
          iconSize: 64,
          capacityText: 'text-4xl',
          nameText: 'mt-3 text-2xl',
          usagePadding: 'pt-5 pb-6 px-6',
          usageTitle: 'text-lg mb-2',
          usageDaySpacing: 'space-y-1.5',
          dayLetter: 'text-lg w-5',
          usageBar: 'h-5',
          slotGap: 'gap-1.5',
        },
        md: {
          container: 'w-[28rem]',
          iconPadding: 'p-12',
          iconSize: 80,
          capacityText: 'text-6xl',
          nameText: 'mt-4 text-4xl',
          usagePadding: 'pt-6 pb-8 px-8',
          usageTitle: 'text-2xl mb-3',
          usageDaySpacing: 'space-y-2',
          dayLetter: 'text-2xl w-6',
          usageBar: 'h-7',
          slotGap: 'gap-2',
        },
    };

    const styles = scalingStyles[scale];

    return (
        <>
            <div className="flex flex-wrap justify-center gap-10">
                {roomsWithUsage.map((room) => (
                    <div
                    key={room.id}
                    className={cn(
                        "rounded-xl shadow-lg flex flex-col bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 ease-in-out transform hover:-translate-y-1 overflow-hidden",
                        styles.container
                    )}
                    >
                    <Link
                        href={`/book?roomId=${room.id}`}
                        className="block"
                    >
                        <div className={cn("flex flex-col items-center flex-grow justify-center", styles.iconPadding)}>
                            <div className="flex items-center gap-x-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width={styles.iconSize}
                                    height={styles.iconSize}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M16.4 20a2 2 0 0 0 2-2V13a2 2 0 0 0-2-2H7.6a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2Z"/>
                                    <path d="M7 11V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v7"/>
                                    <path d="M12 20v2"/>
                                    <path d="M6 11h12"/>
                                    <path d="M10 22h4"/>
                                </svg>
                                <span className={cn("font-semibold", styles.capacityText)}>x {room.capacity}</span>
                            </div>
                            <span className={cn("text-center font-bold", styles.nameText)}>{room.name}</span>
                        </div>
                    </Link>

                    <div className={cn("w-full bg-black/10", styles.usagePadding)}>
                        <p className={cn("text-center font-medium text-accent-foreground/80", styles.usageTitle)}>
                            Usage (Next 5 Working Days)
                        </p>
                        <div className={cn(styles.usageDaySpacing)}>
                            {room.dailyUsage.map((day) => {
                            return (
                                <div key={day.date} className="flex items-center gap-2">
                                <span className={cn("font-mono font-bold text-accent-foreground/70 text-center", styles.dayLetter)}>
                                    {format(new Date(day.date + 'T00:00:00'), 'EEEEE')}
                                </span>
                                <div className={cn("flex flex-1", styles.slotGap)}>
                                    {day.slots.map((slot) => {
                                    return (
                                        <div
                                        key={slot.startTime}
                                        onClick={() => handleSlotClick(day.date, slot)}
                                        className={cn(
                                            'flex-1 rounded-sm border-2 border-accent-foreground/30 cursor-pointer',
                                            styles.usageBar,
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
                    </div>
                ))}
            </div>
            <SlotDetailsDialog 
                isOpen={isSlotDetailsOpen} 
                onOpenChange={setIsSlotDetailsOpen} 
                details={selectedSlot}
            />
        </>
    );
}
