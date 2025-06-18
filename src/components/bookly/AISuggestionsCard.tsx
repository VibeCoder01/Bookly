'use client';

import type { AIResponse, Booking } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, CheckCircle, Info } from 'lucide-react';

interface AISuggestionsCardProps {
  currentBooking?: Booking | null; // The booking that was just made or attempted
  aiResponse?: AIResponse | null;
}

export function AISuggestionsCard({ currentBooking, aiResponse }: AISuggestionsCardProps) {
  if (!currentBooking && !aiResponse) {
    return (
      <Card className="shadow-lg h-full">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            <Lightbulb className="mr-2 h-6 w-6 text-primary" />
            Booking Assistant
          </CardTitle>
          <CardDescription>Get insights and suggestions for your bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-6 bg-muted/50 rounded-lg min-h-[200px]">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              After you attempt to book a room, helpful summaries and alternative suggestions will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const wasSuccessfulBooking = !!currentBooking && !aiResponse?.summary?.toLowerCase().includes("failed");

  return (
    <Card className="shadow-lg animate-in fade-in-50 duration-500">
      <CardHeader>
        <CardTitle className="font-headline flex items-center">
            {wasSuccessfulBooking ? 
                <CheckCircle className="mr-2 h-6 w-6 text-green-500" /> : 
                <Lightbulb className="mr-2 h-6 w-6 text-primary" />
            }
          {wasSuccessfulBooking ? "Booking Confirmed" : "Booking Assistant"}
        </CardTitle>
        {currentBooking && (
          <CardDescription>
            Details for your {wasSuccessfulBooking ? "booking" : "attempted booking"} of {currentBooking.roomName} on {currentBooking.date} at {currentBooking.time}.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {aiResponse?.summary && (
          <div>
            <h3 className="font-semibold text-lg mb-2 font-headline">Summary</h3>
            <p className="text-sm text-foreground/80 bg-primary/10 p-3 rounded-md">{aiResponse.summary}</p>
          </div>
        )}

        {aiResponse?.suggestions && aiResponse.suggestions.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-2 font-headline">Suggestions</h3>
            <ul className="space-y-3">
              {aiResponse.suggestions.map((suggestion, index) => (
                <li key={index} className="p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                  <p className="font-medium text-primary">
                    {suggestion.roomName}
                  </p>
                  <p className="text-sm text-foreground/90">
                    On <span className="font-semibold">{suggestion.date}</span> at <span className="font-semibold">{suggestion.time}</span>
                  </p>
                  {suggestion.reason && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{suggestion.reason}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
         {(!aiResponse?.suggestions || aiResponse.suggestions.length === 0) && aiResponse?.summary && (
            <p className="text-sm text-muted-foreground">No alternative suggestions available at this moment.</p>
         )}
      </CardContent>
    </Card>
  );
}
