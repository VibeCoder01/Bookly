
'use client';

import { Header } from '@/components/bookly/Header';
import { BookingForm } from '@/components/bookly/BookingForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Booking, Room } from '@/types';
import React, { useState, useEffect } from 'react';
import { getRooms } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookPage() {
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoadingRooms(true);
      try {
        const result = await getRooms();
        setRooms(result.rooms);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
        // Handle error, e.g., show a toast notification
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  const handleBookingAttemptCompletion = (booking: Booking | null) => {
    if (booking) {
        setCurrentUserName(booking.userName); 
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header userName={currentUserName} />
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl rounded-xl overflow-hidden">
              <CardHeader className="bg-card">
                <CardTitle className="font-headline text-2xl text-primary">
                  Book Your Room
                </CardTitle>
                <CardDescription>
                  Select a room, date, and time.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingRooms ? (
                  <div className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-1/3" />
                  </div>
                ) : (
                   <BookingForm 
                      rooms={rooms} 
                      onBookingAttemptCompleted={handleBookingAttemptCompletion} 
                    />
                )}
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
