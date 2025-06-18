
'use client';

import { Header } from '@/components/bookly/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, ListChecks, Loader2, AlertTriangle, Settings, CheckCircle, Clock, CalendarClock, Building } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Booking, AdminConfigItem } from '@/types';
import { getAllBookings, updateSlotDuration as serverUpdateSlotDuration, updateWorkdayHours as serverUpdateWorkdayHours, getCurrentConfiguration } from '@/lib/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface GroupedBookings {
  [roomName: string]: Booking[];
}

const initialConfigItems: AdminConfigItem[] = [
  { id: 'slotDuration', description: 'Booking Slot Duration', value: '' }, // Will be populated from server
  { id: 'startOfDay', description: 'Start of Work Day (HH:MM)', value: '' }, // Will be populated
  { id: 'endOfDay', description: 'End of Work Day (HH:MM)', value: '' },   // Will be populated
];

const convertMinutesToDurationString = (minutes: number): string => {
  if (minutes === 15) return '15 minutes';
  if (minutes === 30) return '30 minutes';
  if (minutes === 60) return '1 hour';
  return '1 hour'; // Default fallback
};

const convertDurationValueToMinutes = (value: string): number => {
  if (value === '15 minutes') return 15;
  if (value === '30 minutes') return 30;
  if (value === '1 hour') return 60;
  return 60; // Default to 60 if somehow invalid
};

export default function AdminPage() {
  const { toast } = useToast();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBookingsTable, setShowBookingsTable] = useState(false);

  const [configItems, setConfigItems] = useState<AdminConfigItem[]>(initialConfigItems);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);

  const fetchAdminConfiguration = useCallback(async () => {
    setIsLoadingConfig(true);
    try {
      const currentConfig = await getCurrentConfiguration();
      setConfigItems([
        { id: 'slotDuration', description: 'Booking Slot Duration', value: convertMinutesToDurationString(currentConfig.slotDurationMinutes) },
        { id: 'startOfDay', description: 'Start of Work Day (HH:MM)', value: currentConfig.startOfDay },
        { id: 'endOfDay', description: 'End of Work Day (HH:MM)', value: currentConfig.endOfDay },
      ]);
    } catch (err) {
      console.error("Failed to fetch admin configuration:", err);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Configuration',
        description: 'Could not load current settings. Displaying defaults.',
      });
      // Fallback to initial defaults if fetch fails (or keep previously set if any)
      setConfigItems(prev => prev.length ? prev : initialConfigItems.map(item => ({...item, value: item.id === 'slotDuration' ? '1 hour' : item.id === 'startOfDay' ? '09:00' : '17:00'})));
    } finally {
      setIsLoadingConfig(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAdminConfiguration();
  }, [fetchAdminConfiguration]);


  const handleShowAllBookings = async () => {
    setIsLoadingBookings(true);
    setError(null);
    setShowBookingsTable(true); 
    try {
      const result = await getAllBookings();
      if (result.error) {
        setError(result.error);
        setAllBookings([]);
      } else {
        setAllBookings(result.bookings);
      }
    } catch (err) {
      setError('Failed to fetch bookings. Please try again.');
      setAllBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const groupedBookings = useMemo(() => {
    if (!allBookings.length) return {};
    return allBookings.reduce((acc, booking) => {
      const roomName = booking.roomName || 'Unknown Room';
      if (!acc[roomName]) {
        acc[roomName] = [];
      }
      acc[roomName].push(booking);
      return acc;
    }, {} as GroupedBookings);
  }, [allBookings]);

  const handleConfigChange = (itemId: string, newValue: string) => {
    setConfigItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, value: newValue } : item
      )
    );
  };

  const handleApplyChanges = async () => {
    setIsApplyingChanges(true);
    let allSucceeded = true;

    // Update Slot Duration
    const slotDurationItem = configItems.find(item => item.id === 'slotDuration');
    if (slotDurationItem) {
      const durationInMinutes = convertDurationValueToMinutes(slotDurationItem.value);
      try {
        const result = await serverUpdateSlotDuration(durationInMinutes);
        if (result.success) {
          toast({
            title: 'Slot Duration Updated',
            description: `Booking slot duration set to ${slotDurationItem.value}.`,
            action: <CheckCircle className="text-green-500" />,
          });
        } else {
          allSucceeded = false;
          toast({
            variant: 'destructive',
            title: 'Slot Duration Update Failed',
            description: result.error || 'Could not apply slot duration change.',
          });
        }
      } catch (err) {
        allSucceeded = false;
        toast({
          variant: 'destructive',
          title: 'Error updating slot duration',
          description: 'Failed to apply changes. Please try again.',
        });
      }
    }

    // Update Workday Hours
    const startOfDayItem = configItems.find(item => item.id === 'startOfDay');
    const endOfDayItem = configItems.find(item => item.id === 'endOfDay');

    if (startOfDayItem && endOfDayItem) {
      try {
        const result = await serverUpdateWorkdayHours(startOfDayItem.value, endOfDayItem.value);
        if (result.success) {
          toast({
            title: 'Workday Hours Updated',
            description: `Workday hours set from ${startOfDayItem.value} to ${endOfDayItem.value}.`,
            action: <CheckCircle className="text-green-500" />,
          });
        } else {
          allSucceeded = false;
          toast({
            variant: 'destructive',
            title: 'Workday Hours Update Failed',
            description: result.error || 'Could not apply workday hours change.',
          });
        }
      } catch (err) {
        allSucceeded = false;
        toast({
          variant: 'destructive',
          title: 'Error updating workday hours',
          description: 'Failed to apply changes. Please try again.',
        });
      }
    }
    
    setIsApplyingChanges(false);
    if(allSucceeded) {
        fetchAdminConfiguration(); // Re-fetch to confirm and display persisted values
    }
  };
  
  const getIconForItem = (itemId: string) => {
    switch(itemId) {
      case 'slotDuration': return <Clock className="mr-2 h-4 w-4 text-muted-foreground" />;
      case 'startOfDay': return <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />;
      case 'endOfDay': return <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <Card className="shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">Admin Dashboard</CardTitle>
            <CardDescription>Manage your Bookly application settings, view bookings, and configure parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3 font-headline text-primary flex items-center">
                <ListChecks className="mr-2 h-5 w-5" />
                Bookings Overview
              </h3>
              <div className="flex space-x-4">
                <Button onClick={handleShowAllBookings} disabled={isLoadingBookings} variant="secondary">
                  {isLoadingBookings && showBookingsTable ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ListChecks className="mr-2 h-4 w-4" />
                  )}
                  {showBookingsTable ? 'Refresh All Bookings' : 'Show All Bookings'}
                </Button>
                <Link href="/" passHref>
                  <Button variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
              </div>

              {showBookingsTable && (
                <div className="mt-6">
                  {isLoadingBookings && !allBookings.length ? (
                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      <p>Loading bookings...</p>
                    </div>
                  ) : error ? (
                    <div className="flex items-center space-x-2 text-destructive-foreground bg-destructive/10 p-3 rounded-md border border-destructive">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <span>Error: {error}</span>
                    </div>
                  ) : Object.keys(groupedBookings).length === 0 ? (
                    <p className="text-muted-foreground">No bookings found.</p>
                  ) : (
                    <ScrollArea className="h-[600px] w-full rounded-md border p-4 bg-card">
                      {Object.entries(groupedBookings).map(([roomName, bookingsInRoom]) => {
                        let lastDateProcessedForRoom: string | null = null;
                        let useAlternateRowStyle = false;
                        return (
                          <div key={roomName} className="mb-8">
                            <h4 className="text-lg font-headline font-semibold mb-3 text-primary flex items-center">
                              <Building className="mr-2 h-5 w-5" />
                              {roomName}
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="font-semibold">Date</TableHead>
                                  <TableHead className="font-semibold">Time</TableHead>
                                  <TableHead className="font-semibold">Booked By</TableHead>
                                  <TableHead className="font-semibold">Email</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {bookingsInRoom.map((booking) => {
                                  if (lastDateProcessedForRoom !== null && booking.date !== lastDateProcessedForRoom) {
                                    useAlternateRowStyle = !useAlternateRowStyle;
                                  }
                                  lastDateProcessedForRoom = booking.date;
                                  const rowClassName = useAlternateRowStyle ? 'bg-primary/5' : '';

                                  return (
                                    <TableRow key={booking.id} className={cn(rowClassName)}>
                                      <TableCell>{format(new Date(booking.date + 'T00:00:00'), 'PPP')}</TableCell> {/* Ensure date is parsed correctly for formatting */}
                                      <TableCell>{booking.time}</TableCell>
                                      <TableCell>{booking.userName}</TableCell>
                                      <TableCell>{booking.userEmail}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        );
                      })}
                    </ScrollArea>
                  )}
                </div>
              )}
              {!showBookingsTable && (
                   <p className="mt-4 text-muted-foreground">Click "Show All Bookings" to view the booking list.</p>
              )}
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-xl font-semibold mb-4 font-headline text-primary flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Configuration
              </h3>
              {isLoadingConfig ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <p>Loading configuration...</p>
                </div>
              ) : configItems.length > 0 ? (
                <Card className="bg-card">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6 font-semibold">Setting Description</TableHead>
                          <TableHead className="text-right pr-6 font-semibold">Current Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {configItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium pl-6 flex items-center">
                                {getIconForItem(item.id)}
                                {item.description}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              {item.id === 'slotDuration' ? (
                                <Select
                                  value={item.value}
                                  onValueChange={(newValue) => handleConfigChange(item.id, newValue)}
                                  disabled={isLoadingConfig || isApplyingChanges}
                                >
                                  <SelectTrigger className="w-full sm:w-[180px] ml-auto text-right">
                                    <SelectValue placeholder="Select duration" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="15 minutes">15 minutes</SelectItem>
                                    <SelectItem value="30 minutes">30 minutes</SelectItem>
                                    <SelectItem value="1 hour">1 hour</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input 
                                  type={item.id === 'startOfDay' || item.id === 'endOfDay' ? 'text' : 'text'}
                                  value={item.value}
                                  onChange={(e) => handleConfigChange(item.id, e.target.value)}
                                  className="text-right sm:w-[180px] ml-auto"
                                  placeholder={item.id === 'startOfDay' || item.id === 'endOfDay' ? 'HH:MM' : ''}
                                  disabled={isLoadingConfig || isApplyingChanges}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-muted-foreground">No configuration items defined or loaded.</p>
              )}
              <div className="mt-6 flex justify-end">
                <Button onClick={handleApplyChanges} variant="default" disabled={isApplyingChanges || isLoadingConfig}>
                  {isApplyingChanges && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Apply Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
