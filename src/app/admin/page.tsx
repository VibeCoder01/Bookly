
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Home, ListChecks, Loader2, AlertTriangle, Settings, CheckCircle, Clock, CalendarClock, Building, Pencil, Trash2, PlusCircle, Sofa, Database, Download, Upload, Text, ImageIcon, KeyRound, LogOut } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Booking, Room, AppConfiguration } from '@/types';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    getAllBookings, 
    updateAppConfiguration as serverUpdateAppConfiguration,
    updateAppLogo,
    revertToDefaultLogo,
    getCurrentConfiguration,
    getRooms,
    deleteRoom,
    exportAllSettings,
    importAllSettings,
    logoutAdmin
} from '@/lib/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RoomFormDialog } from '@/components/bookly/RoomFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { CalendarCheck } from 'lucide-react';


interface GroupedBookings {
  [roomId: string]: Booking[];
}

interface AdminConfigFormState {
  appName: string;
  appSubtitle: string;
  slotDuration: string;
  startOfDay: string;
  endOfDay: string;
}

const convertMinutesToDurationString = (minutes: number): string => {
  if (minutes === 15) return '15 minutes';
  if (minutes === 30) return '30 minutes';
  if (minutes === 60) return '1 hour';
  return `${minutes} minutes`;
};

const convertDurationValueToMinutes = (value: string): number => {
  if (value === '15 minutes') return 15;
  if (value === '30 minutes') return 30;
  if (value === '1 hour') return 60;
  return parseInt(value.split(' ')[0]) || 60;
};

export default function AdminPage() {
  const { toast } = useToast();
  const router = useRouter();

  // Bookings state
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBookingsTable, setShowBookingsTable] = useState(false);

  // Configuration state
  const [config, setConfig] = useState<AdminConfigFormState>({ appName: '', appSubtitle: '', slotDuration: '', startOfDay: '', endOfDay: '' });
  const [currentLogo, setCurrentLogo] = useState<string | undefined>(undefined);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isRevertingLogo, setIsRevertingLogo] = useState(false);


  // Rooms state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // Import/Export state
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const fetchAdminConfiguration = useCallback(async () => {
    setIsLoadingConfig(true);
    try {
      // We only fetch non-sensitive config for display. Password is never sent to client.
      const currentConfig = await getCurrentConfiguration();
      setConfig({
        appName: currentConfig.appName,
        appSubtitle: currentConfig.appSubtitle,
        slotDuration: convertMinutesToDurationString(currentConfig.slotDurationMinutes),
        startOfDay: currentConfig.startOfDay,
        endOfDay: currentConfig.endOfDay,
      });
      setCurrentLogo(currentConfig.appLogo);
    } catch (err) {
      console.error("Failed to fetch admin configuration:", err);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Configuration',
        description: 'Could not load current settings. Displaying defaults.',
      });
      setConfig({ appName: 'Bookly', appSubtitle: 'Room booking system', slotDuration: '1 hour', startOfDay: '09:00', endOfDay: '17:00' });
      setCurrentLogo(undefined);
    } finally {
      setIsLoadingConfig(false);
    }
  }, [toast]);

  const fetchRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    try {
        const result = await getRooms();
        setRooms(result.rooms);
    } catch (err) {
        toast({ variant: 'destructive', title: 'Error Fetching Rooms', description: 'Could not load the list of rooms.' });
    } finally {
        setIsLoadingRooms(false);
    }
  }, [toast]);

  const handleShowAllBookings = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchAdminConfiguration();
    fetchRooms();
  }, [fetchAdminConfiguration, fetchRooms]);

  const roomMap = useMemo(() => new Map<string, Room>(rooms.map(room => [room.id, room])), [rooms]);

  const groupedBookings: GroupedBookings = useMemo(() => {
    if (!allBookings.length || !rooms.length) return {};

    return allBookings.reduce((acc, booking) => {
      // Only include bookings for rooms that currently exist
      if (roomMap.has(booking.roomId)) {
        if (!acc[booking.roomId]) {
          acc[booking.roomId] = [];
        }
        acc[booking.roomId].push(booking);
      }
      return acc;
    }, {} as GroupedBookings);
  }, [allBookings, rooms, roomMap]);


  const handleConfigChange = (field: keyof AdminConfigFormState, value: string) => {
    setConfig(prevConfig => ({ ...prevConfig, [field]: value }));
  };

  const handleApplyChanges = async () => {
    setIsApplyingChanges(true);

    const updates: Partial<AppConfiguration> = {
      appName: config.appName,
      appSubtitle: config.appSubtitle,
      slotDurationMinutes: convertDurationValueToMinutes(config.slotDuration),
      startOfDay: config.startOfDay,
      endOfDay: config.endOfDay,
    };

    const result = await serverUpdateAppConfiguration(updates);

    if (result.success) {
      toast({ title: 'Configuration Updated', description: 'Your application settings have been saved.' });
      await fetchAdminConfiguration(); 
    } else {
      toast({ variant: 'destructive', title: 'Update Failed', description: result.error || 'An unexpected error occurred.' });
    }

    setIsApplyingChanges(false);
  };
  
  const handleLogoUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const fileInput = form.elements.namedItem('logo') as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      toast({ variant: 'destructive', title: 'No File Selected', description: 'Please choose a logo file to upload.' });
      return;
    }
    
    const MAX_FILE_SIZE_MB = 1;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({ variant: 'destructive', title: 'File Too Large', description: `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.` });
        return;
    }

    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
         toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a PNG, JPG, SVG, or WEBP file.' });
        return;
    }

    setIsUploadingLogo(true);
    const formData = new FormData(form);
    const result = await updateAppLogo(formData);

    if (result.success && result.logoPath) {
        toast({ title: 'Logo Updated', description: 'Your new logo has been uploaded.' });
        setCurrentLogo(result.logoPath);
        if (fileInput) fileInput.value = '';
    } else {
        toast({ variant: 'destructive', title: 'Logo Upload Failed', description: result.error || 'An unexpected error occurred.' });
    }

    setIsUploadingLogo(false);
  };

  const handleRevertLogo = async () => {
    setIsRevertingLogo(true);
    const result = await revertToDefaultLogo();

    if (result.success) {
        toast({ title: 'Logo Reverted', description: 'The application is now using the default logo.' });
        setCurrentLogo(undefined);
    } else {
        toast({ variant: 'destructive', title: 'Revert Failed', description: result.error || 'An unexpected error occurred.' });
    }

    setIsRevertingLogo(false);
  };

  const getIconForSetting = (settingKey: keyof AdminConfigFormState) => {
    switch(settingKey) {
      case 'appName': return <Text className="mr-2 h-4 w-4 text-muted-foreground" />;
      case 'appSubtitle': return <Text className="mr-2 h-4 w-4 text-muted-foreground" />;
      case 'slotDuration': return <Clock className="mr-2 h-4 w-4 text-muted-foreground" />;
      case 'startOfDay': return <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />;
      case 'endOfDay': return <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const handleAddNewRoom = () => {
    setSelectedRoom(null);
    setIsRoomFormOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsRoomFormOpen(true);
  };
  
  const handleDeleteRoom = async () => {
      if (!roomToDelete) return;
      const result = await deleteRoom(roomToDelete.id);
      if (result.success) {
          toast({ title: 'Room Deleted', description: `Room "${roomToDelete.name}" has been deleted.` });
          fetchRooms();
          if (showBookingsTable) {
              await handleShowAllBookings();
          }
      } else {
          toast({ variant: 'destructive', title: 'Error Deleting Room', description: result.error });
      }
      setRoomToDelete(null);
  }

  const handleExport = async () => {
    const result = await exportAllSettings();
    if (result.success && result.data) {
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `bookly-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Export Successful', description: 'Your settings have been downloaded.' });
    } else {
      toast({ variant: 'destructive', title: 'Export Failed', description: result.error });
    }
  };
  
  const handleConfirmImport = async () => {
    if (!fileToImport) return;
    setIsImporting(true);
  
    const fileContent = await fileToImport.text();
    const result = await importAllSettings(fileContent);
  
    if (result.success) {
      toast({ title: 'Import Successful', description: 'All settings have been restored.' });
      await fetchAdminConfiguration();
      await fetchRooms();
      if (showBookingsTable) {
        await handleShowAllBookings();
      }
    } else {
      toast({ variant: 'destructive', title: 'Import Failed', description: result.error });
    }
  
    setFileToImport(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsImporting(false);
  };

  const handleLogout = async () => {
      await logoutAdmin();
  }

  return (
    <>
      <main className="container mx-auto py-8 px-4">
        <Card className="shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">Admin Dashboard</CardTitle>
            <CardDescription>Manage your Bookly application settings, view bookings, and configure parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* --- BOOKINGS OVERVIEW --- */}
            <div>
              <h3 className="text-xl font-semibold mb-3 font-headline text-primary flex items-center">
                <ListChecks className="mr-2 h-5 w-5" />
                Bookings Overview
              </h3>
              <div className="flex flex-wrap gap-2">
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
                 <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
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
                      {Object.entries(groupedBookings).map(([roomId, bookingsInRoom]) => {
                        const roomName = roomMap.get(roomId)?.name || 'Unknown Room';
                        let lastDateProcessedForRoom: string | null = null;
                        let useAlternateRowStyle = false;
                        return (
                          <div key={roomId} className="mb-8">
                            <h4 className="text-lg font-headline font-semibold mb-3 text-primary flex items-center">
                              <Building className="mr-2 h-5 w-5" />
                              {roomName}
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="font-semibold">Date</TableHead>
                                  <TableHead className="font-semibold">Time</TableHead>
                                  <TableHead className="font-semibold">Title</TableHead>
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
                                      <TableCell>{format(new Date(booking.date + 'T00:00:00'), 'PPP')}</TableCell>
                                      <TableCell>{booking.time}</TableCell>
                                      <TableCell>{booking.title}</TableCell>
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

           {/* --- ROOM MANAGEMENT --- */}
            <div className="pt-6 border-t">
                <h3 className="text-xl font-semibold mb-4 font-headline text-primary flex items-center">
                  <Sofa className="mr-2 h-5 w-5" />
                  Manage Rooms
                </h3>
                {isLoadingRooms ? (
                   <div className="flex items-center justify-center p-8 text-muted-foreground">
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      <p>Loading rooms...</p>
                  </div>
                ) : (
                  <Card className="bg-card">
                      <CardHeader>
                           <div className="flex justify-between items-center">
                              <div>
                                  <CardTitle className="text-lg">Room List</CardTitle>
                                  <CardDescription>Add, edit, or delete meeting rooms.</CardDescription>
                              </div>
                              <Button onClick={handleAddNewRoom}>
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Add New Room
                              </Button>
                          </div>
                      </CardHeader>
                      <CardContent>
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead className="text-center w-[100px]">Capacity</TableHead>
                                      <TableHead className="text-right w-[150px]">Actions</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {rooms.length > 0 ? rooms.map(room => (
                                      <TableRow key={room.id}>
                                          <TableCell className="font-medium">{room.name}</TableCell>
                                          <TableCell className="text-center">{room.capacity}</TableCell>
                                          <TableCell className="text-right space-x-2">
                                              <Button variant="outline" size="icon" onClick={() => handleEditRoom(room)}>
                                                  <Pencil className="h-4 w-4" />
                                                  <span className="sr-only">Edit Room</span>
                                              </Button>
                                              <Button variant="destructive" size="icon" onClick={() => setRoomToDelete(room)}>
                                                  <Trash2 className="h-4 w-4" />
                                                  <span className="sr-only">Delete Room</span>
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  )) : (
                                      <TableRow>
                                          <TableCell colSpan={3} className="text-center text-muted-foreground">No rooms found. Add one to get started.</TableCell>
                                      </TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </CardContent>
                  </Card>
                )}
            </div>


            {/* --- CONFIGURATION --- */}
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
              ) : (
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
                          <TableRow>
                              <TableCell className="font-medium pl-6 flex items-center">
                                  {getIconForSetting('appName')} App Name
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                  <Input value={config.appName} onChange={(e) => handleConfigChange('appName', e.target.value)} className="text-right sm:w-[220px] ml-auto" placeholder="e.g., Bookly" disabled={isApplyingChanges} />
                              </TableCell>
                          </TableRow>
                          <TableRow>
                              <TableCell className="font-medium pl-6 flex items-center">
                                  {getIconForSetting('appSubtitle')} App Subtitle
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                  <Input value={config.appSubtitle} onChange={(e) => handleConfigChange('appSubtitle', e.target.value)} className="text-right sm:w-[220px] ml-auto" placeholder="e.g., Room booking system" disabled={isApplyingChanges} />
                              </TableCell>
                          </TableRow>
                          <TableRow>
                              <TableCell className="font-medium pl-6 flex items-center">
                                  {getIconForSetting('slotDuration')} Booking Slot Duration
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                  <Select value={config.slotDuration} onValueChange={(v) => handleConfigChange('slotDuration', v)} disabled={isApplyingChanges}>
                                      <SelectTrigger className="w-full sm:w-[220px] ml-auto text-right">
                                          <SelectValue placeholder="Select duration" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="15 minutes">15 minutes</SelectItem>
                                          <SelectItem value="30 minutes">30 minutes</SelectItem>
                                          <SelectItem value="1 hour">1 hour</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </TableCell>
                          </TableRow>
                          <TableRow>
                              <TableCell className="font-medium pl-6 flex items-center">
                                  {getIconForSetting('startOfDay')} Start of Work Day (HH:MM)
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                  <Input value={config.startOfDay} onChange={(e) => handleConfigChange('startOfDay', e.target.value)} className="text-right sm:w-[220px] ml-auto" placeholder="HH:MM" disabled={isApplyingChanges} />
                              </TableCell>
                          </TableRow>
                           <TableRow>
                              <TableCell className="font-medium pl-6 flex items-center">
                                  {getIconForSetting('endOfDay')} End of Work Day (HH:MM)
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                  <Input value={config.endOfDay} onChange={(e) => handleConfigChange('endOfDay', e.target.value)} className="text-right sm:w-[220px] ml-auto" placeholder="HH:MM" disabled={isApplyingChanges} />
                              </TableCell>
                          </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              <div className="mt-6 flex justify-end">
                <Button onClick={handleApplyChanges} variant="default" disabled={isApplyingChanges || isLoadingConfig}>
                  {isApplyingChanges && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Apply Changes
                </Button>
              </div>
            </div>

            {/* --- SECURITY --- */}
            <div className="pt-6 border-t">
              <h3 className="text-xl font-semibold mb-4 font-headline text-primary flex items-center">
                <KeyRound className="mr-2 h-5 w-5" />
                Security
              </h3>
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Admin Password</CardTitle>
                  <CardDescription>Manage the password used to access the admin dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline">
                    <Link href="/admin/change-password">Change Password</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* --- DATA MANAGEMENT --- */}
            <div className="pt-6 border-t">
              <h3 className="text-xl font-semibold mb-4 font-headline text-primary flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Data Management
              </h3>
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Import/Export Data</CardTitle>
                  <CardDescription>Save all application data to a file or restore from a backup.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />Export All Data
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isImporting}>
                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Import All Data
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setFileToImport(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                    accept="application/json"
                  />
                </CardContent>
              </Card>
            </div>

            {/* --- LOGO MANAGEMENT --- */}
            <div className="pt-6 border-t">
              <h3 className="text-xl font-semibold mb-4 font-headline text-primary flex items-center">
                <ImageIcon className="mr-2 h-5 w-5" />
                Application Logo
              </h3>
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Upload Logo</CardTitle>
                  <CardDescription>Replace the default icon with your own logo. Recommended size: 40x40 pixels.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex-shrink-0">
                    <p className="text-sm font-medium mb-2">Current Logo</p>
                    <div className="h-12 w-12 rounded-md border border-dashed flex items-center justify-center bg-muted">
                      {isLoadingConfig ? (
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : currentLogo ? (
                        <Image src={currentLogo} alt="Current App Logo" width={40} height={40} className="object-contain" unoptimized />
                      ) : (
                        <CalendarCheck className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <form onSubmit={handleLogoUpload} className="flex-grow">
                    <Label htmlFor="logo-upload" className="mb-2 block">Upload New Logo</Label>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input 
                          id="logo-upload" 
                          name="logo" 
                          type="file" 
                          required 
                          accept="image/png, image/jpeg, image/svg+xml, image/webp" 
                          className="flex-grow"
                          disabled={isUploadingLogo || isLoadingConfig || isRevertingLogo} 
                        />
                        <Button type="submit" disabled={isUploadingLogo || isLoadingConfig || isRevertingLogo}>
                            {isUploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Save
                        </Button>
                        <Button type="button" variant="outline" onClick={handleRevertLogo} disabled={!currentLogo || isUploadingLogo || isLoadingConfig || isRevertingLogo}>
                            {isRevertingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Use Default
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Maximum file size: 1MB. The logo will be displayed at 40x40px.</p>
                  </form>
                </CardContent>
              </Card>
            </div>

          </CardContent>
        </Card>
      </main>

      <RoomFormDialog 
        isOpen={isRoomFormOpen}
        onOpenChange={setIsRoomFormOpen}
        onSuccess={fetchRooms}
        room={selectedRoom}
      />

       <AlertDialog open={!!roomToDelete} onOpenChange={(isOpen) => !isOpen && setRoomToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the room "{roomToDelete?.name}". This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setRoomToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRoom} className={cn(buttonVariants({ variant: "destructive" }))}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!fileToImport} onOpenChange={(isOpen) => { if (!isOpen) setFileToImport(null) }}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will overwrite all current settings, rooms, and bookings with the data from '{fileToImport?.name}'. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setFileToImport(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmImport}>Import</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
