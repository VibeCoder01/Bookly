
'use client';

import type { Room, TimeSlot, Booking, BookingFormData } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Building2, User, Mail, Loader2, AlertTriangle, Eye, ArrowRight, Bookmark } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAvailableTimeSlots, submitBooking, getBookingsForRoomAndDate } from '@/lib/actions';
import { RoomBookingsDialog } from './RoomBookingsDialog';
import { useRouter } from 'next/navigation';

interface BookingFormProps {
  rooms: Room[];
  onBookingAttemptCompleted: (booking: Booking | null) => void;
}

const formSchema = z.object({
  roomId: z.string().min(1, 'Please select a room.'),
  date: z.date({ required_error: 'Please select a date.' }),
  startTime: z.string().min(1, 'Please select a start time.'),
  endTime: z.string().min(1, 'Please select an end time.'),
  title: z.string().min(3, 'Title must be at least 3 characters.').max(100, 'Title must be 100 characters or less.'),
  userName: z.string().min(2, 'Name must be at least 2 characters.').max(50),
  userEmail: z.string().email('Please enter a valid email address.'),
}).refine(data => {
    if(data.startTime && data.endTime) {
        return data.startTime < data.endTime;
    }
    return true;
}, {
    message: "End time must be after start time.",
    path: ["endTime"],
});


type FormValues = z.infer<typeof formSchema>;

export function BookingForm({ rooms, onBookingAttemptCompleted }: BookingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [allAvailableIndividualSlots, setAllAvailableIndividualSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [isBookingsDialogOpen, setIsBookingsDialogOpen] = useState(false);
  const [bookingsForSelectedRoomDate, setBookingsForSelectedRoomDate] = useState<Booking[]>([]);
  const [isLoadingRoomBookings, setIsLoadingRoomBookings] = useState(false);
  const [roomDetailsForDialog, setRoomDetailsForDialog] = useState<{ roomName: string; date: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomId: '',
      date: undefined,
      startTime: '',
      endTime: '',
      title: '',
      userName: '',
      userEmail: '',
    },
  });

  const selectedRoomId = form.watch('roomId');
  const selectedDate = form.watch('date');
  const selectedStartTimeValue = form.watch('startTime');
  const watchedEndTime = form.watch('endTime'); // For reactive button disabling
  const watchedUserName = form.watch('userName');
  const watchedUserEmail = form.watch('userEmail');

  // Load user details from localStorage on mount
  useEffect(() => {
    try {
        const storedUserName = localStorage.getItem('booklyUserName');
        const storedUserEmail = localStorage.getItem('booklyUserEmail');
        if (storedUserName) {
        form.setValue('userName', storedUserName);
        }
        if (storedUserEmail) {
        form.setValue('userEmail', storedUserEmail);
        }
    } catch (error) {
        console.warn("Could not access localStorage for user details:", error);
    }
  }, [form]);

  // Save user details to localStorage on change
  useEffect(() => {
    try {
        if (watchedUserName !== undefined) {
            localStorage.setItem('booklyUserName', watchedUserName);
        }
    } catch (error) {
        console.warn("Could not save userName to localStorage:", error);
    }
  }, [watchedUserName]);

  useEffect(() => {
    try {
        if (watchedUserEmail !== undefined) {
            localStorage.setItem('booklyUserEmail', watchedUserEmail);
        }
    } catch (error) {
        console.warn("Could not save userEmail to localStorage:", error);
    }
  }, [watchedUserEmail]);


  const fetchIndividualSlots = useCallback(async (roomIdToFetch: string, dateToFetch: Date) => {
    setIsLoadingSlots(true);
    setAllAvailableIndividualSlots([]); 
    form.resetField('startTime');
    form.resetField('endTime');
    try {
      const result = await getAvailableTimeSlots(roomIdToFetch, format(dateToFetch, 'yyyy-MM-dd'));
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error fetching slots', description: result.error });
      } else {
        setAllAvailableIndividualSlots(result.slots);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch time slots.' });
    } finally {
      setIsLoadingSlots(false);
    }
  }, [toast, form]);

  useEffect(() => {
    if (selectedRoomId && selectedDate) {
      fetchIndividualSlots(selectedRoomId, selectedDate);
    } else {
      setAllAvailableIndividualSlots([]);
      form.resetField('startTime');
      form.resetField('endTime');
    }
  }, [selectedRoomId, selectedDate, fetchIndividualSlots, form]);


  const availableEndTimesForSelect = useMemo(() => {
    if (!selectedStartTimeValue || allAvailableIndividualSlots.length === 0) {
      return [];
    }

    const startSlot = allAvailableIndividualSlots.find(slot => slot.startTime === selectedStartTimeValue);
    if (!startSlot) {
      return [];
    }

    const validEndTimes: string[] = [];
    let lastSlotEndTimeInChain = startSlot.endTime;
    validEndTimes.push(lastSlotEndTimeInChain); 

    const startIndex = allAvailableIndividualSlots.findIndex(slot => slot.startTime === selectedStartTimeValue);

    for (let i = startIndex + 1; i < allAvailableIndividualSlots.length; i++) {
      const nextSlot = allAvailableIndividualSlots[i];
      if (nextSlot.startTime === lastSlotEndTimeInChain) { 
        validEndTimes.push(nextSlot.endTime);
        lastSlotEndTimeInChain = nextSlot.endTime;
      } else {
        break; 
      }
    }
    
    return validEndTimes;
  }, [selectedStartTimeValue, allAvailableIndividualSlots]);

  useEffect(() => {
      if (!availableEndTimesForSelect.includes(form.getValues('endTime'))){
          form.resetField('endTime');
      }
  }, [availableEndTimesForSelect, form]);


  async function onSubmit(data: FormValues) {
    setIsSubmittingForm(true);
    try {
      const submissionData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
      };
      const result = await submitBooking(submissionData);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Booking Failed',
          description: result.error,
        });
        if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([field, errors]) => {
                form.setError(field as keyof FormValues, { type: 'server', message: errors.join(', ') });
            });
        }
        if (result.error.toLowerCase().includes("slot") || result.error.toLowerCase().includes("unavailable") || result.error.toLowerCase().includes("range")) {
           if(selectedRoomId && selectedDate) fetchIndividualSlots(selectedRoomId, selectedDate);
        }
        onBookingAttemptCompleted(null);
      } else if (result.booking) {
        toast({
          title: 'Booking Successful!',
          description: `Room ${result.booking.roomName} booked for ${result.booking.date} from ${data.startTime} to ${data.endTime}.`,
        });
        onBookingAttemptCompleted(result.booking);
        router.push('/');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'An Unexpected Error Occurred',
        description: 'Please try again later.',
      });
      onBookingAttemptCompleted(null);
    } finally {
      setIsSubmittingForm(false);
    }
  }

  const handleShowRoomDetails = async () => {
    if (!selectedRoomId || !selectedDate) {
      toast({ variant: 'destructive', title: 'Selection Missing', description: 'Please select a room and a date first.' });
      return;
    }
    setIsLoadingRoomBookings(true);
    try {
      const result = await getBookingsForRoomAndDate(selectedRoomId, format(selectedDate, 'yyyy-MM-dd'));
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error Fetching Bookings', description: result.error });
        setBookingsForSelectedRoomDate([]);
      } else {
        setBookingsForSelectedRoomDate(result.bookings);
        setRoomDetailsForDialog({ roomName: result.roomName || 'Selected Room', date: format(selectedDate, 'PPP') });
        setIsBookingsDialogOpen(true);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch room booking details.' });
      setBookingsForSelectedRoomDate([]);
    } finally {
      setIsLoadingRoomBookings(false);
    }
  };
  
  const isDetailsButtonDisabled = !selectedRoomId || !selectedDate || isLoadingSlots || isLoadingRoomBookings || isSubmittingForm;
  const isBookRoomButtonDisabled = isSubmittingForm || isLoadingSlots || isLoadingRoomBookings || !selectedStartTimeValue || !watchedEndTime;


  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="roomId" className="flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-primary" /> Room
            </Label>
            <Controller
              name="roomId"
              control={form.control}
              render={({ field }) => (
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                  }} 
                  defaultValue={field.value} 
                  value={field.value}
                >
                  <SelectTrigger id="roomId" aria-label="Select Room">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} (Capacity: {room.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.roomId && (
              <p className="text-sm text-destructive">{form.formState.errors.roomId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-primary" /> Date
            </Label>
            <Controller
              name="date"
              control={form.control}
              render={({ field }) => (
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                          field.onChange(date);
                          setIsDatePickerOpen(false);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {form.formState.errors.date && (
              <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
            )}
          </div>
        </div>
        
        {selectedRoomId && selectedDate && (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" /> Start Time
              </Label>
              {isLoadingSlots ? (
                <div className="flex items-center space-x-2 text-muted-foreground h-10">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading start times...</span>
                </div>
              ) : allAvailableIndividualSlots.length > 0 ? (
                <Controller
                  name="startTime"
                  control={form.control}
                  render={({ field }) => (
                    <Select 
                        onValueChange={(value) => {
                            field.onChange(value);
                        }} 
                        value={field.value}
                        defaultValue={field.value}
                    >
                      <SelectTrigger id="startTime" aria-label="Select Start Time">
                        <SelectValue placeholder="Select a start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {allAvailableIndividualSlots.map((slot) => (
                          <SelectItem key={`start-${slot.startTime}`} value={slot.startTime}>
                            {slot.startTime}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                 <div className="flex items-center space-x-2 text-destructive-foreground bg-destructive/10 p-3 rounded-md border border-destructive h-10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span>No slots available.</span>
                </div>
              )}
              {form.formState.errors.startTime && (
                <p className="text-sm text-destructive">{form.formState.errors.startTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center">
                <ArrowRight className="mr-2 h-5 w-5 text-primary" /> End Time
              </Label>
              {isLoadingSlots && selectedStartTimeValue ? ( 
                 <div className="flex items-center space-x-2 text-muted-foreground h-10">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading end times...</span>
                </div>
              ) : selectedStartTimeValue && availableEndTimesForSelect.length > 0 ? (
                <Controller
                  name="endTime"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <SelectTrigger id="endTime" aria-label="Select End Time" disabled={!selectedStartTimeValue || isLoadingSlots}>
                        <SelectValue placeholder="Select an end time" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEndTimesForSelect.map((time) => (
                          <SelectItem key={`end-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : selectedStartTimeValue ? (
                <div className="flex items-center space-x-2 text-muted-foreground bg-muted/20 p-3 rounded-md border h-10">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>Select start time or no further slots.</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-muted-foreground bg-muted/20 p-3 rounded-md border h-10">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>Select start time.</span>
                </div>
              )}
              {form.formState.errors.endTime && (
                <p className="text-sm text-destructive">{form.formState.errors.endTime.message}</p>
              )}
            </div>
           </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="w-full sm:w-auto flex-shrink-0">
             <Button 
                type="button" 
                variant="outline" 
                onClick={handleShowRoomDetails} 
                disabled={isDetailsButtonDisabled}
                className="w-full sm:w-auto"
              >
                {isLoadingRoomBookings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                View Bookings
              </Button>
            </div>
        </div>


        <div className="space-y-6 pt-6 border-t mt-4">
            <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center">
                    <Bookmark className="mr-2 h-5 w-5 text-primary" /> Booking Title
                </Label>
                <Input id="title" placeholder="e.g., Project Kick-off Meeting" {...form.register('title')} />
                {form.formState.errors.title && (
                    <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="userName" className="flex items-center">
                    <User className="mr-2 h-5 w-5 text-primary" /> Your Name
                    </Label>
                    <Input id="userName" placeholder="e.g. John Doe" {...form.register('userName')} />
                    {form.formState.errors.userName && (
                    <p className="text-sm text-destructive">{form.formState.errors.userName.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="userEmail" className="flex items-center">
                    <Mail className="mr-2 h-5 w-5 text-primary" /> Your Email
                    </Label>
                    <Input id="userEmail" type="email" placeholder="e.g. john.doe@example.com" {...form.register('userEmail')} />
                    {form.formState.errors.userEmail && (
                    <p className="text-sm text-destructive">{form.formState.errors.userEmail.message}</p>
                    )}
                </div>
            </div>
        </div>


        <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isBookRoomButtonDisabled}>
          {isSubmittingForm ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
            </>
          ) : (
            'Book Room'
          )}
        </Button>
      </form>
      {roomDetailsForDialog && (
        <RoomBookingsDialog
          isOpen={isBookingsDialogOpen}
          onOpenChange={setIsBookingsDialogOpen}
          roomName={roomDetailsForDialog.roomName}
          date={roomDetailsForDialog.date}
          bookings={bookingsForSelectedRoomDate}
        />
      )}
    </>
  );
}

    