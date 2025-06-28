

export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export interface TimeSlot {
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  display: string; // e.g., "09:00 - 10:00"
}

export interface Booking {
  id: string;
  roomId: string;
  roomName?: string; // For display purposes
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // Combined range, e.g., "09:00 - 11:00"
  userName: string;
  userEmail: string;
}

export interface BookingFormData {
  roomId: string;
  date: Date | undefined;
  title: string;
  startTime: string; // Individual slot start time HH:MM
  endTime: string;   // Individual slot end time HH:MM for the selected range
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

export interface AIResponse {
  summary?: string;
  suggestions?: AISuggestion[];
}

export interface AISuggestion {
  roomName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM - HH:MM
  reason?: string;
}


// Interface for application configuration stored in app-config.json
export interface AppConfiguration {
  slotDurationMinutes: number;
  startOfDay: string; // HH:MM format
  endOfDay: string;   // HH:MM format
}

export interface RoomFormData {
    id?: string;
    name: string;
    capacity: number;
}

export interface ExportedSettings {
  appConfig: AppConfiguration;
  rooms: Room[];
  bookings: Booking[];
}
