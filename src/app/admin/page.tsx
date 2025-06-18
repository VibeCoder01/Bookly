
'use client';

import { Header } from '@/components/bookly/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, ListChecks, Loader2, AlertTriangle, Settings } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { Booking, AdminConfigItem } from '@/types';
import { getAllBookings } from '@/lib/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function AdminPage() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBookingsTable, setShowBookingsTable] = useState(false);

  const [configItems, setConfigItems] = useState<AdminConfigItem[]>([
    { id: 'slotDuration', description: 'Default booking slot duration', value: '60 minutes' },
    // Future configuration items can be added here
  ]);

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

  const handleConfigChange = (itemId: string, newValue: string) => {
    setConfigItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, value: newValue } : item
      )
    );
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
                  ) : allBookings.length === 0 ? (
                    <p className="text-muted-foreground">No bookings found.</p>
                  ) : (
                    <ScrollArea className="h-[500px] w-full rounded-md border p-4 bg-card">
                      <h4 className="text-lg font-medium mb-4">All Bookings</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Room Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Booked By</TableHead>
                            <TableHead>Email</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allBookings.map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">{booking.roomName || booking.roomId}</TableCell>
                              <TableCell>{format(new Date(booking.date), 'PPP')}</TableCell>
                              <TableCell>{booking.time}</TableCell>
                              <TableCell>{booking.userName}</TableCell>
                              <TableCell>{booking.userEmail}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
              {configItems.length > 0 ? (
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
                            <TableCell className="font-medium pl-6">{item.description}</TableCell>
                            <TableCell className="text-right pr-6">
                              <Input 
                                type="text"
                                value={item.value}
                                onChange={(e) => handleConfigChange(item.id, e.target.value)}
                                className="text-right"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-muted-foreground">No configuration items defined.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
