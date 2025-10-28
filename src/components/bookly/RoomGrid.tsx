
'use client';

import Link from 'next/link';
import type { RoomWithDailyUsage, AppConfiguration, SlotStatus } from '@/types';
import { cn } from '@/lib/utils';
import { format, addDays, subDays } from 'date-fns';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlotDetailsDialog } from '@/components/bookly/SlotDetailsDialog';
import { getRoomsWithDailyUsage } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { usePanelColor } from '@/context/PanelColorContext';

interface RoomGridProps {
    initialRoomsWithUsage: RoomWithDailyUsage[];
    config: AppConfiguration;
    currentUser: { username: string } | null;
}

const colorPalette = [
  'bg-lime-500/80',      // Vibrant lime green
  'bg-emerald-600/80',   // Deep emerald green
  'bg-cyan-500/80',      // Bright cyan
  'bg-sky-600/80',       // Strong sky blue
  'bg-indigo-500/80',    // Rich indigo
  'bg-fuchsia-600/80',   // Bright fuchsia
  'bg-rose-500/80',      // Soft rose
  'bg-amber-500/80',     // Warm amber
  'bg-orange-600/80',    // Bold orange
  'bg-slate-500/80',     // Neutral slate gray
];


export function RoomGrid({ initialRoomsWithUsage, config, currentUser }: RoomGridProps) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [isSlotDetailsOpen, setIsSlotDetailsOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; slot: SlotStatus; colorClass?: string; } | null>(null);

    const [gridData, setGridData] = useState<RoomWithDailyUsage[]>(initialRoomsWithUsage);
    const [viewDate, setViewDate] = useState(() => {
        const param = searchParams.get('startDate');
        return param ? new Date(param + 'T00:00:00') : new Date();
    });
    const [isLoading, setIsLoading] = useState(false);
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.set('startDate', format(viewDate, 'yyyy-MM-dd'));
        router.replace(`?${params.toString()}`);

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
    }, [viewDate, router, searchParams]);

    const { legendData, titleToColorMap } = useMemo(() => {
        const uniqueTitles = new Set<string>();
        gridData.forEach(room => {
            room.dailyUsage.forEach(day => {
                day.slots.forEach(slot => {
                    if (slot.isBooked && slot.title) {
                        uniqueTitles.add(slot.title);
                    }
                });
            });
        });

        const sortedTitles = Array.from(uniqueTitles).sort();
        const titleColorMap = new Map<string, string>();
        const legendItems: { title: string; colorClass: string }[] = [];
        
        sortedTitles.forEach((title, index) => {
            const colorClass = colorPalette[index % colorPalette.length];
            titleColorMap.set(title, colorClass);
            legendItems.push({ title, colorClass });
        });

        return { legendData: legendItems, titleToColorMap: titleColorMap };
    }, [gridData]);

    const { activePanelColorOption } = usePanelColor();

    const allowAnonymousUsers = config.allowAnonymousUsers ?? true;
    const isUserLoggedIn = Boolean(currentUser);

    const handleSlotClick = (room: RoomWithDailyUsage, date: string, slot: SlotStatus) => {
        if (!slot.isBooked) {
            const params = new URLSearchParams({
                roomId: room.id,
                date,
                startTime: slot.startTime,
            });
            const targetPath = `/book?${params.toString()}`;

            if (allowAnonymousUsers || isUserLoggedIn) {
                router.push(targetPath);
            } else {
                router.push(`/user/login?from=${encodeURIComponent(targetPath)}`);
            }
            return;
        }

        const colorClass = slot.isBooked && slot.title ? titleToColorMap.get(slot.title) : undefined;
        setSelectedSlot({ date, slot, colorClass });
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
    const getSlotTooltipDetails = (date: string, slotInfo: SlotStatus) => {
        const slotDate = new Date(`${date}T00:00:00`);
        const slotStart = new Date(`${date}T${slotInfo.startTime}:00`);
        const slotEnd = new Date(`${date}T${slotInfo.endTime}:00`);
        return {
            dateLabel: format(slotDate, 'PPP'),
            timeLabel: `${format(slotStart, 'p')} - ${format(slotEnd, 'p')}`,
        };
    };
    
    const firstDayInView = useMemo(() => {
        if (gridData.length > 0 && gridData[0].dailyUsage.length > 0) {
            const firstDate = gridData[0].dailyUsage[0].date;
            return format(new Date(firstDate + 'T00:00:00'), 'PPP');
        }
        return '...';
    }, [gridData]);

    return (
        <TooltipProvider delayDuration={1000}>
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
                        'rounded-xl shadow-lg flex flex-col transition-all duration-200 ease-in-out transform hover:-translate-y-1 overflow-hidden',
                        activePanelColorOption.cardClass,
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
                                <span className={cn('font-mono font-bold text-center', activePanelColorOption.mutedTextClass, styles.dayLetter)}>
                                    {format(new Date(day.date + 'T00:00:00'), 'EEEEE')}
                                </span>
                                <div className={cn("flex flex-1", styles.slotGap)}>
                                    {day.slots.map((slot) => {
                                        const { dateLabel, timeLabel } = getSlotTooltipDetails(day.date, slot);
                                        return (
                                            <Tooltip key={`${day.date}-${slot.startTime}`}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        onClick={() => handleSlotClick(room, day.date, slot)}
                                                        className={cn(
                                                            'flex-1 rounded-sm border-2 cursor-pointer relative',
                                                            activePanelColorOption.borderClass,
                                                            styles.usageBar,
                                                            slot.isBooked && slot.title
                                                                ? titleToColorMap.get(slot.title)
                                                                : 'bg-transparent'
                                                        )}
                                                        aria-label={`${dateLabel} ${timeLabel}`}
                                                    >
                                                        {config.showSlotStrike && slot.isBooked && slot.title && (
                                                            <div
                                                                className="absolute inset-0 bg-center bg-no-repeat bg-cover"
                                                                style={{
                                                                    backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3cline x1='0' y1='0' x2='100%25' y2='100%25' stroke='rgba(255,255,255,0.6)' stroke-width='1.5'/%3e%3c/svg%3e")`
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="font-semibold">{dateLabel}</p>
                                                    <p className="text-xs text-muted-foreground">{timeLabel}</p>
                                                </TooltipContent>
                                            </Tooltip>
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
            
            {config.showHomePageKey && legendData.length > 0 && (
                <div className="w-full max-w-4xl mx-auto mt-12 p-4 border rounded-lg bg-card">
                    <h3 className="text-lg font-headline font-semibold mb-4 text-center text-primary">Key</h3>
                    <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
                        {legendData.map(({ title, colorClass }) => (
                            <div key={title} className="flex items-center gap-2">
                                <div className={cn('h-4 w-4 rounded-sm border-2 relative', activePanelColorOption.borderClass, colorClass)}>
                                    {config.showSlotStrike && (
                                      <div
                                          className="absolute inset-0 bg-center bg-no-repeat bg-cover"
                                          style={{
                                              backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3cline x1='0' y1='0' x2='100%25' y2='100%25' stroke='rgba(255,255,255,0.6)' stroke-width='1.5'/%3e%3c/svg%3e")`
                                          }}
                                      />
                                    )}
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
                showStrike={config.showSlotStrike}
                panelBorderClass={activePanelColorOption.borderClass}
            />
        </TooltipProvider>
    );
}

    
