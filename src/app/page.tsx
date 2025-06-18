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

  const handleBookingSuccess = (booking: Booking, aiResponse?: AIResponse) => {
    setLatestBookingAttempt(booking); // This is the confirmed booking
    if (aiResponse) {
      setAIData(aiResponse);
    } else {
      // Handle case where AI response might be missing but booking was successful
      setAIData({ summary: `Booking for ${booking.roomName} on ${booking.date} at ${booking.time} confirmed.`, suggestions: [] });
    }
  };
  
  // This function could be expanded if BookingForm needs to report failed attempts
  // that still generate AI suggestions (e.g. slot just got booked scenario)
  // For now, onBookingSuccess covers successful bookings and their AI data.
  // If the server action returns AI data even on failure, that logic is handled by onBookingSuccess too,
  // where `booking` might be undefined/null and `aiResponse` would contain the failure summary + suggestions.
  // The current `onBookingSuccess` expects a `Booking` object, so it implies success.
  // To handle AI suggestions on failure, `BookingForm` would need another callback or `onBookingSuccess`
  // would need to accept potentially null booking.
  // The server action `submitBooking` can return `aiResponse` even on error,
  // so `BookingForm` receives it and then can pass it up.
  // Let's adjust `handleBookingSuccess` to reflect this.

  const handleBookingAttemptCompletion = (booking: Booking | null, aiResponse?: AIResponse) => {
    // `booking` will be the actual booking if successful, or null/undefined if failed
    // `aiResponse` can exist in both success and failure cases (e.g. suggestions after a slot conflict)
    
    // For AISuggestionsCard, we need to show what was *attempted* or *booked*.
    // If booking is null (failed attempt), we might need the original form data to show in AISuggestionsCard.
    // For simplicity now, if booking is null, AISuggestionsCard will rely mostly on aiResponse.
    // The current server action returns the confirmed booking. If it fails, `booking` is undefined.
    // Let's ensure AISuggestionsCard can handle currentBooking being null.
    // We can use the AI summary to understand the context.
    
    if (booking) { // Successful booking
        setLatestBookingAttempt(booking);
    } else if (aiResponse && latestBookingAttempt) { 
        // Failed booking, but we have AI response. Keep `latestBookingAttempt` if it was set by a previous successful booking
        // or clear it if we want the AI card to reflect the failed attempt only
        // For now, let's assume `latestBookingAttempt` should primarily hold the *successful* booking.
        // If a booking fails, `aiResponse` will be the main source of info for the card.
        // A better approach might be to have `currentAttemptDetails` state in `HomePage`.
        // The current `BookingForm`'s `onBookingSuccess` prop is for successful bookings.
        // Let's rename it to make it more generic.
    }


    setAIData(aiResponse || null);
    if(booking) setLatestBookingAttempt(booking); // Only set if booking was successful
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
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
                  onBookingSuccess={handleBookingAttemptCompletion} 
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
