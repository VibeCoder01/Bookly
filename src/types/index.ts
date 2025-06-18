
export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  display: string; // e.g., "09:00 - 10:00"
}

export interface Booking {
  id: string;
  roomId: string;
  roomName?: string; // For display purposes
  date: string; // YYYY-MM-DD
  time: string; // Corresponds to TimeSlot.display
  userName: string;
  userEmail: string;
  summary?: string; // AI generated summary
}

export interface AISuggestion {
  roomName: string;
  roomId?: string; // Optional: if AI can suggest specific room ID
  date: string;
  time: string;
  reason?: string;
}

export interface AIResponse {
  summary: string;
  suggestions: AISuggestion[];
}

export interface BookingFormData {
  roomId: string;
  date: Date | undefined;
  time: string;
  userName: string;
  userEmail: string;
}

export interface RoomBookingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  roomName: string;
  date: string;
  bookings: Booking[];
}
