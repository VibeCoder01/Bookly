
'use client';

import Link from 'next/link';
import type { RoomWithDailyUsage, AppConfiguration, SlotStatus } from '@/types';
import { cn } from '@/lib/utils';
import { format, addDays, subDays } from 'date-fns';
import { useState, useEffect, useMemo, useRef } from 'react';
import { SlotDetailsDialog } from '@/components/bookly/SlotDetailsDialog';
import { getRoomsWithDailyUsage } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface RoomGridProps {
    initialRoomsWithUsage: RoomWithDailyUsage[];
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


export function RoomGrid({ initialRoomsWithUsage, config }: RoomGridProps) {
    const [isSlotDetailsOpen, setIsSlotDetailsOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; slot: SlotStatus } | null>(null);

    const [gridData, setGridData] = useState<RoomWithDailyUsage[]>(initialRoomsWithUsage);
    const [viewDate, setViewDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const fetchNewData = async () => {
            setIsLoading(true);
            try {
                const newGridData = await getRoomsWithDailyUsage(format(viewDate, 'yyyy-MM-dd'));
                setGridData(newGridData);
            } catch (error) {
                console.error("Failed to fetch new room usage data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNewData();
    }, [viewDate]);

    const handleSlotClick = (date: string, slot: SlotStatus) => {
        setSelectedSlot({ date, slot });
        setIsSlotDetailsOpen(true);
    };
    
    const handlePrevWeek = () => {
        setViewDate(current => subDays(current, 7));
    };

    const handleNextWeek = () => {
        setViewDate(current => addDays(current, 7));
    };

    const scale = config.homePageScale || 'sm';
    const is15MinSlots = config.slotDurationMinutes === 15;

    const scalingStyles = {
        xs: {
          container: 'w-64',
          iconPadding: 'p-6',
          nameText: 'text-4xl mb-3 h-20',
          chairText: 'text-xl',
          capacityText: 'text-xl',
          usagePadding: 'pt-4 pb-5 px-5',
          dayLetter: 'text-base w-4',
          usageBar: 'h-4',
          slotGap: is15MinSlots ? 'gap-px' : 'gap-0.5',
        },
        sm: {
          container: 'w-80',
          iconPadding: 'p-8',
          nameText: 'text-5xl mb-4 h-24',
          chairText: 'text-2xl',
          capacityText: 'text-2xl',
          usagePadding: 'pt-5 pb-6 px-6',
          dayLetter: 'text-lg w-5',
          usageBar: 'h-5',
          slotGap: is15MinSlots ? 'gap-0.5' : 'gap-1',
        },
        md: {
          container: 'w-96',
          iconPadding: 'p-10',
          nameText: 'text-6xl mb-4 h-32',
          chairText: 'text-3xl',
          capacityText: 'text-3xl',
          usagePadding: 'pt-6 pb-7 px-7',
          dayLetter: 'text-xl w-6',
          usageBar: 'h-6',
          slotGap: is15MinSlots ? 'gap-0.5' : 'gap-1.5',
        },
    };

    const styles = scalingStyles[scale];
    
    const firstDayInView = useMemo(() => {
        if (gridData.length > 0 && gridData[0].dailyUsage.length > 0) {
            const firstDate = gridData[0].dailyUsage[0].date;
            return format(new Date(firstDate + 'T00:00:00'), 'PPP');
        }
        return '...';
    }, [gridData]);
    
    const legendData = useMemo(() => {
        const uniqueBookings = new Map<string, string>(); // Map<title, colorClass>

        gridData.forEach(room => {
            room.dailyUsage.forEach(day => {
                day.slots.forEach(slot => {
                    if (slot.isBooked && slot.title) {
                        if (!uniqueBookings.has(slot.title)) {
                            const colorClass = colorPalette[stringToHash(slot.title) % colorPalette.length];
                            uniqueBookings.set(slot.title, colorClass);
                        }
                    }
                });
            });
        });

        return Array.from(uniqueBookings.entries()).map(([title, colorClass]) => ({ title, colorClass }));
    }, [gridData]);

    return (
        <>
            <div className="w-full max-w-7xl mx-auto mb-6">
                 <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" size="icon" onClick={handlePrevWeek} disabled={isLoading}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous 5 days</span>
                    </Button>
                    <div className="text-center font-semibold text-lg w-64">
                        {isLoading ? (
                             <div className="flex items-center justify-center text-muted-foreground">
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                <span>Loading...</span>
                             </div>
                        ) : (
                            <span>Usage from {firstDayInView}</span>
                        )}
                    </div>
                    <Button variant="outline" size="icon" onClick={handleNextWeek} disabled={isLoading}>
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next 5 days</span>
                    </Button>
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-10">
                {gridData.map((room) => (
                    <div
                    key={room.id}
                    className={cn(
                        "rounded-xl shadow-lg flex flex-col bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 ease-in-out transform hover:-translate-y-1 overflow-hidden",
                        styles.container,
                        isLoading && "opacity-50 pointer-events-none"
                    )}
                    >
                    <Link
                        href={`/book?roomId=${room.id}`}
                        className={cn("flex flex-col items-center flex-grow justify-center", styles.iconPadding)}
                    >
                        <span className={cn("text-center font-bold", styles.nameText, "flex items-center justify-center")}>{room.name}</span>
                        <div className="flex items-baseline gap-x-2">
                            <span className={cn("font-medium", styles.chairText)}>Seat</span>
                            <span className={cn(styles.capacityText)}>x {room.capacity}</span>
                        </div>
                    </Link>

                    <div className={cn("w-full bg-black/10", styles.usagePadding)}>
                        <div className="space-y-1.5">
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
                                                'flex-1 rounded-sm border-2 border-accent-foreground/30 cursor-pointer relative',
                                                styles.usageBar,
                                                slot.isBooked && slot.title
                                                ? colorPalette[stringToHash(slot.title) % colorPalette.length]
                                                : 'bg-transparent'
                                            )}
                                        >
                                            {slot.isBooked && slot.title && (
                                                <div
                                                    className="absolute inset-0 bg-center bg-no-repeat bg-cover"
                                                    style={{
                                                        backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3cline x1='0' y1='0' x2='100%25' y2='100%25' stroke='rgba(255,255,255,0.6)' stroke-width='1.5'/%3e%3c/svg%3e")`
                                                    }}
                                                />
                                            )}
                                        </div>
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
            
            {legendData.length > 0 && (
                <div className="w-full max-w-4xl mx-auto mt-12 p-4 border rounded-lg bg-card">
                    <h3 className="text-lg font-headline font-semibold mb-4 text-center text-primary">Key</h3>
                    <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
                        {legendData.map(({ title, colorClass }) => (
                            <div key={title} className="flex items-center gap-2">
                                <div className={cn('h-4 w-4 rounded-sm border-2 border-accent-foreground/30 relative', colorClass)}>
                                    <div
                                        className="absolute inset-0 bg-center bg-no-repeat bg-cover"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3cline x1='0' y1='0' x2='100%25' y2='100%25' stroke='rgba(255,255,255,0.6)' stroke-width='1.5'/%3e%3c/svg%3e")`
                                        }}
                                    />
                                </div>
                                <span className="text-sm text-foreground">{title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <SlotDetailsDialog 
                isOpen={isSlotDetailsOpen} 
                onOpenChange={setIsSlotDetailsOpen} 
                details={selectedSlot}
            />
        </>
    );
}
