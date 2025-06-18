
'use client';

import { Header } from '@/components/bookly/Header';
import { BookingForm } from '@/components/bookly/BookingForm';
import { AISuggestionsCard } from '@/components/bookly/AISuggestionsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockRooms } from '@/lib/mock-data';
import type { Booking, AIResponse } from '@/types';
import React, { useState } from 'react';

export default function HomePage() {
  const [latestBookingAttempt, setLatestBookingAttempt] = useState<Booking | null>(null);
  const [aiData, setAIData] = useState<AIResponse | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  const handleBookingAttemptCompletion = (booking: Booking | null, aiResponse?: AIResponse) => {
    setAIData(aiResponse || null);
    if (booking) {
        setLatestBookingAttempt(booking);
        setCurrentUserName(booking.userName); 
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header userName={currentUserName} />
      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3">
            <Card className="shadow-xl rounded-xl overflow-hidden">
              <CardHeader className="bg-card">
                <CardTitle className="font-headline text-2xl text-primary">
                  Book Your Ideal Room
                </CardTitle>
                <CardDescription>
                  Select a room, date, and time. Our system will find the best options for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <BookingForm 
                  rooms={mockRooms} 
                  onBookingAttemptCompleted={handleBookingAttemptCompletion} 
                />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 sticky top-8">
             <AISuggestionsCard 
                currentBooking={latestBookingAttempt} 
                aiResponse={aiData}
              />
          </div>
        </div>
      </main>
    </div>
  );
}
