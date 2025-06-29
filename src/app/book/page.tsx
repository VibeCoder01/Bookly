
'use client';

import { BookingForm } from '@/components/bookly/BookingForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Booking, Room } from '@/types';
import React, { useState, useEffect, Suspense } from 'react';
import { getRooms } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';

function BookPageContents() {
  const searchParams = useSearchParams();
  const initialRoomId = searchParams.get('roomId');

  const { setUserName } = useUser();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  useEffect(() => {
    const fetchRoomsData = async () => {
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
    fetchRoomsData();
  }, []);

  const handleBookingAttemptCompletion = (booking: Booking | null) => {
    if (booking) {
        setUserName(booking.userName); 
    }
  };

  return (
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
                    initialRoomId={initialRoomId}
                  />
              )}
            </CardContent>
          </Card>
      </div>
    </main>
  );
}


export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <BookPageContents />
    </Suspense>
  )
}
