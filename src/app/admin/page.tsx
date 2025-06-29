
'use client';

import { Header } from '@/components/bookly/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Home, ListChecks, Loader2, AlertTriangle, Settings, CheckCircle, Clock, CalendarClock, Building, Pencil, Trash2, PlusCircle, Sofa, Database, Download, Upload, Users, ShieldCheck, LogOut, KeyRound } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Booking, Room, AppConfiguration, User, SessionPayload } from '@/types';
import { 
    getAllBookings, 
    updateSlotDuration as serverUpdateSlotDuration, 
    updateWorkdayHours as serverUpdateWorkdayHours, 
    getCurrentConfiguration,
    getRooms,
    deleteRoom,
    exportAllSettings,
    importAllSettings,
    getUsersForAdmin,
    deleteUserByAdmin
} from '@/lib/actions';
import { getSession, deleteSession } from '@/lib/session';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RoomFormDialog } from '@/components/bookly/RoomFormDialog';
import { UserFormDialog } from '@/components/bookly/UserFormDialog';
import { PasswordChangeDialog } from '@/components/bookly/PasswordChangeDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface GroupedBookings {
  [roomName: string]: Booking[];
}

interface AdminConfigFormState {
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
  // Session state
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Bookings state
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBookingsTable, setShowBookingsTable] = useState(false);

  // Configuration state
  const [config, setConfig] = useState<AdminConfigFormState>({ slotDuration: '', startOfDay: '', endOfDay: ''});
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);

  // Rooms state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // User Management state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToChangePassword, setUserToChangePassword] = useState<User | null>(null);

  // Import/Export state
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch session on mount
  useEffect(() => {
    getSession().then(s => {
      setSession(s);
      setIsSessionLoading(false);
    });
  }, []);

  const hasPermission = useCallback((permission: keyof SessionPayload['permissions']) => {
    if (session?.role === 'master') return true;
    return session?.permissions?.[permission] ?? false;
  }, [session]);

  const canManageUsers = useMemo(() => session?.role === 'master', [session]);

  const fetchAdminConfiguration = useCallback(async () => {
    if (!hasPermission('canManageConfig')) {
        setIsLoadingConfig(false);
        return;
    }
    setIsLoadingConfig(true);
    try {
      const currentConfig = await getCurrentConfiguration();
      setConfig({
        slotDuration: convertMinutesToDurationString(currentConfig.slotDurationMinutes),
        startOfDay: currentConfig.startOfDay,
        endOfDay: currentConfig.endOfDay,
      });
    } catch (err) {
      console.error("Failed to fetch admin configuration:", err);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Configuration',
        description: 'Could not load current settings. Displaying defaults.',
      });
      setConfig({ slotDuration: '1 hour', startOfDay: '09:00', endOfDay: '17:00' });
    } finally {
      setIsLoadingConfig(false);
    }
  }, [toast, hasPermission]);

  const fetchRooms = useCallback(async () => {
    if (!hasPermission('canManageRooms')) {
        setIsLoadingRooms(false);
        return;
    }
    setIsLoadingRooms(true);
    try {
        const result = await getRooms();
        setRooms(result.rooms);
    } catch (err) {
        toast({ variant: 'destructive', title: 'Error Fetching Rooms', description: 'Could not load the list of rooms.' });
    } finally {
        setIsLoadingRooms(false);
    }
  }, [toast, hasPermission]);

   const fetchUsers = useCallback(async () => {
    if (!canManageUsers) {
        setIsLoadingUsers(false);
        return;
    }
    setIsLoadingUsers(true);
    try {
        const result = await getUsersForAdmin();
        if (result.users) {
            setUsers(result.users);
        } else if (result.error) {
             toast({ variant: 'destructive', title: 'Error Fetching Users', description: result.error });
        }
    } catch (err) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load the list of admin users.' });
    } finally {
        setIsLoadingUsers(false);
    }
  }, [toast, canManageUsers]);

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
    if (session) {
        fetchAdminConfiguration();
        fetchRooms();
        fetchUsers();
    }
  }, [session, fetchAdminConfiguration, fetchRooms, fetchUsers]);


  const groupedBookings = useMemo(() => {
    if (!allBookings.length) return {};
    return allBookings.reduce((acc, booking) => {
      const roomName = booking.roomName || 'Unknown Room';
      if (!acc[roomName]) {
        acc[roomName] = [];
      }
      acc[roomName].push(booking);
      return acc;
    }, {} as GroupedBookings);
  }, [allBookings]);

  const handleConfigChange = (field: keyof AdminConfigFormState, value: string) => {
    setConfig(prevConfig => ({ ...prevConfig, [field]: value }));
  };

  const handleApplyChanges = async () => {
    setIsApplyingChanges(true);
    try {
        const durationInMinutes = convertDurationValueToMinutes(config.slotDuration);
        const tasks = [
            serverUpdateSlotDuration(durationInMinutes),
            serverUpdateWorkdayHours(config.startOfDay, config.endOfDay)
        ];
        const results = await Promise.all(tasks);
        results.forEach((result, index) => {
            const taskName = index === 0 ? "Slot Duration" : "Workday Hours";
            if (result.success) {
                toast({ title: `${taskName} Updated` });
            } else {
                 toast({ variant: 'destructive', title: `${taskName} Update Failed`, description: result.error });
            }
        });
        await fetchAdminConfiguration();
    } catch (error) {
        console.error("One or more configuration updates failed:", error);
    } finally {
        setIsApplyingChanges(false);
    }
  };
  
  const getIconForSetting = (settingKey: keyof AdminConfigFormState) => {
    switch(settingKey) {
      case 'slotDuration': return <Clock className="mr-2 h-4 w-4 text-muted-foreground" />;
      case 'startOfDay': return <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />;
      case 'endOfDay': return <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const handleAddNewRoom = () => { setSelectedRoom(null); setIsRoomFormOpen(true); };
  const handleEditRoom = (room: Room) => { setSelectedRoom(room); setIsRoomFormOpen(true); };
  
  const handleDeleteRoom = async () => {
      if (!roomToDelete) return;
      const result = await deleteRoom(roomToDelete.id);
      if (result.success) {
          toast({ title: 'Room Deleted', description: `Room "${roomToDelete.name}" has been deleted.` });
          fetchRooms();
          if (showBookingsTable) { await handleShowAllBookings(); }
      } else {
          toast({ variant: 'destructive', title: 'Error Deleting Room', description: result.error });
      }
      setRoomToDelete(null);
  };
  
  const handleAddNewUser = () => { setSelectedUser(null); setIsUserFormOpen(true); };
  const handleEditUser = (user: User) => { setSelectedUser(user); setIsUserFormOpen(true); };

  const handleDeleteUser = async () => {
      if (!userToDelete) return;
      const result = await deleteUserByAdmin(userToDelete.id);
      if (result.success) {
          toast({ title: 'User Deleted', description: `User "${userToDelete.username}" has been deleted.` });
          fetchUsers();
      } else {
          toast({ variant: 'destructive', title: 'Error Deleting User', description: result.error });
      }
      setUserToDelete(null);
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
      if(hasPermission('canManageConfig')) await fetchAdminConfiguration();
      if(hasPermission('canManageRooms')) await fetchRooms();
      if(session?.role === 'master') await fetchUsers();
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

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <Card className="shadow-xl rounded-xl">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-3xl text-primary">Admin Dashboard</CardTitle>
                        <CardDescription>Welcome, <span className="font-semibold text-primary">{session?.username}</span>! Role: <span className="font-semibold text-primary capitalize">{session?.role}</span></CardDescription>
                    </div>
                     <div className="flex items-center gap-x-2">
                        <Link href="/" passHref>
                            <Button variant="outline" size="sm">
                            <Home className="mr-2 h-4 w-4" />
                            Home
                            </Button>
                        </Link>
                        <form action={deleteSession}>
                            <Button variant="ghost" size="sm" type="submit">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </form>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* --- BOOKINGS OVERVIEW --- */}
              <div>
                <h3 className="text-xl font-semibold mb-3 font-headline text-primary flex items-center">
                  <ListChecks className="mr-2 h-5 w-5" />
                  Bookings Overview
                </h3>
                <Button onClick={handleShowAllBookings} disabled={isLoadingBookings} variant="secondary">
                    {isLoadingBookings && showBookingsTable ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<ListChecks className="mr-2 h-4 w-4" />)}
                    {showBookingsTable ? 'Refresh All Bookings' : 'Show All Bookings'}
                </Button>
                {showBookingsTable && (
                  <div className="mt-6">
                    {isLoadingBookings && !allBookings.length ? (
                      <div className="flex items-center justify-center p-8 text-muted-foreground"><Loader2 className="mr-2 h-6 w-6 animate-spin" /><p>Loading bookings...</p></div>
                    ) : error ? (
                      <div className="flex items-center space-x-2 text-destructive-foreground bg-destructive/10 p-3 rounded-md border border-destructive"><AlertTriangle className="h-5 w-5 text-destructive" /><span>Error: {error}</span></div>
                    ) : Object.keys(groupedBookings).length === 0 ? (
                      <p className="text-muted-foreground">No bookings found.</p>
                    ) : (
                      <ScrollArea className="h-[600px] w-full rounded-md border p-4 bg-card">
                        {Object.entries(groupedBookings).map(([roomName, bookingsInRoom]) => (
                            <div key={roomName} className="mb-8">
                                <h4 className="text-lg font-headline font-semibold mb-3 text-primary flex items-center"><Building className="mr-2 h-5 w-5" />{roomName}</h4>
                                <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Title</TableHead><TableHead>Booked By</TableHead><TableHead>Email</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {bookingsInRoom.map((booking) => (<TableRow key={booking.id}><TableCell>{format(new Date(booking.date + 'T00:00:00'), 'PPP')}</TableCell><TableCell>{booking.time}</TableCell><TableCell>{booking.title}</TableCell><TableCell>{booking.userName}</TableCell><TableCell>{booking.userEmail}</TableCell></TableRow>))}
                                </TableBody>
                                </Table>
                            </div>
                        ))}
                      </ScrollArea>
                    )}
                  </div>
                )}
                {!showBookingsTable && <p className="mt-4 text-muted-foreground">Click "Show All Bookings" to view the booking list.</p>}
              </div>

            {/* --- USER MANAGEMENT --- */}
            {canManageUsers && (
                <div className="pt-6 border-t">
                    <h3 className="text-xl font-semibold mb-4 font-headline text-primary flex items-center"><Users className="mr-2 h-5 w-5" />Manage Admin Users</h3>
                    {isLoadingUsers ? (
                        <div className="flex items-center justify-center p-8 text-muted-foreground"><Loader2 className="mr-2 h-6 w-6 animate-spin" /><p>Loading users...</p></div>
                    ) : (
                    <Card className="bg-card">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div><CardTitle className="text-lg">Admin List</CardTitle><CardDescription>Add, edit, or delete admin users.</CardDescription></div>
                                <Button onClick={handleAddNewUser}><PlusCircle className="mr-2 h-4 w-4" />Add New Admin</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Role</TableHead><TableHead>Permissions</TableHead><TableHead className="text-right w-[200px]">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {users.length > 0 ? users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.username}</TableCell>
                                            <TableCell className="capitalize">{user.role}</TableCell>
                                            <TableCell className="text-xs">
                                                <div className="flex flex-col gap-1">
                                                    <span className={cn("inline-flex items-center gap-1.5", user.permissions.canManageRooms ? 'text-foreground' : 'text-muted-foreground/50')}><Sofa size={14}/> Rooms</span>
                                                    <span className={cn("inline-flex items-center gap-1.5", user.permissions.canManageConfig ? 'text-foreground' : 'text-muted-foreground/50')}><Settings size={14}/> Config</span>
                                                    <span className={cn("inline-flex items-center gap-1.5", user.permissions.canManageData ? 'text-foreground' : 'text-muted-foreground/50')}><Database size={14}/> Data</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="icon" onClick={() => setUserToChangePassword(user)}><KeyRound className="h-4 w-4" /><span className="sr-only">Change Password</span></Button>
                                                <Button variant="outline" size="icon" onClick={() => handleEditUser(user)} disabled={user.role === 'master'}><Pencil className="h-4 w-4" /><span className="sr-only">Edit User</span></Button>
                                                <Button variant="destructive" size="icon" onClick={() => setUserToDelete(user)} disabled={user.role === 'master'}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete User</span></Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No admin users found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    )}
                </div>
            )}


             {/* --- ROOM MANAGEMENT --- */}
             {hasPermission('canManageRooms') && (
              <div className="pt-6 border-t">
                  <h3 className="text-xl font-semibold mb-4 font-headline text-primary flex items-center"><Sofa className="mr-2 h-5 w-5" />Manage Rooms</h3>
                  {isLoadingRooms ? (
                     <div className="flex items-center justify-center p-8 text-muted-foreground"><Loader2 className="mr-2 h-6 w-6 animate-spin" /><p>Loading rooms...</p></div>
                  ) : (
                    <Card className="bg-card">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div><CardTitle className="text-lg">Room List</CardTitle><CardDescription>Add, edit, or delete meeting rooms.</CardDescription></div>
                                <Button onClick={handleAddNewRoom}><PlusCircle className="mr-2 h-4 w-4" />Add New Room</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-center w-[100px]">Capacity</TableHead><TableHead className="text-right w-[150px]">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {rooms.length > 0 ? rooms.map(room => (
                                        <TableRow key={room.id}>
                                            <TableCell className="font-medium">{room.name}</TableCell>
                                            <TableCell className="text-center">{room.capacity}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEditRoom(room)}><Pencil className="h-4 w-4" /><span className="sr-only">Edit Room</span></Button>
                                                <Button variant="destructive" size="icon" onClick={() => setRoomToDelete(room)}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete Room</span></Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (<TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No rooms found. Add one to get started.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                  )}
              </div>
             )}


              {/* --- CONFIGURATION --- */}
              {hasPermission('canManageConfig') && (
              <div className="pt-6 border-t">
                <h3 className="text-xl font-semibold mb-4 font-headline text-primary flex items-center"><Settings className="mr-2 h-5 w-5" />Configuration</h3>
                {isLoadingConfig ? (
                  <div className="flex items-center justify-center p-8 text-muted-foreground"><Loader2 className="mr-2 h-6 w-6 animate-spin" /><p>Loading configuration...</p></div>
                ) : (
                  <Card className="bg-card">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead className="pl-6 font-semibold">Setting Description</TableHead><TableHead className="text-right pr-6 font-semibold">Current Value</TableHead></TableRow></TableHeader>
                        <TableBody>
                            <TableRow><TableCell className="font-medium pl-6 flex items-center">{getIconForSetting('slotDuration')} Booking Slot Duration</TableCell><TableCell className="text-right pr-6"><Select value={config.slotDuration} onValueChange={(v) => handleConfigChange('slotDuration', v)} disabled={isApplyingChanges}><SelectTrigger className="w-full sm:w-[180px] ml-auto text-right"><SelectValue placeholder="Select duration" /></SelectTrigger><SelectContent><SelectItem value="15 minutes">15 minutes</SelectItem><SelectItem value="30 minutes">30 minutes</SelectItem><SelectItem value="1 hour">1 hour</SelectItem></SelectContent></Select></TableCell></TableRow>
                            <TableRow><TableCell className="font-medium pl-6 flex items-center">{getIconForSetting('startOfDay')} Start of Work Day (HH:MM)</TableCell><TableCell className="text-right pr-6"><Input value={config.startOfDay} onChange={(e) => handleConfigChange('startOfDay', e.target.value)} className="text-right sm:w-[180px] ml-auto" placeholder="HH:MM" disabled={isApplyingChanges} /></TableCell></TableRow>
                            <TableRow><TableCell className="font-medium pl-6 flex items-center">{getIconForSetting('endOfDay')} End of Work Day (HH:MM)</TableCell><TableCell className="text-right pr-6"><Input value={config.endOfDay} onChange={(e) => handleConfigChange('endOfDay', e.target.value)} className="text-right sm:w-[180px] ml-auto" placeholder="HH:MM" disabled={isApplyingChanges} /></TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleApplyChanges} variant="default" disabled={isApplyingChanges || isLoadingConfig}>{isApplyingChanges && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Apply Changes</Button>
                </div>
              </div>
              )}
              
              {/* --- DATA MANAGEMENT --- */}
              {hasPermission('canManageData') && (
              <div className="pt-6 border-t">
                <h3 className="text-xl font-semibold mb-4 font-headline text-primary flex items-center"><Database className="mr-2 h-5 w-5" />Data Management</h3>
                <Card className="bg-card">
                  <CardHeader><CardTitle className="text-lg">Import/Export Data</CardTitle><CardDescription>Save all application data to a file or restore from a backup.</CardDescription></CardHeader>
                  <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export All Data</Button>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isImporting}>{isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import All Data</Button>
                    <input type="file" ref={fileInputRef} onChange={(e) => setFileToImport(e.target.files ? e.target.files[0] : null)} className="hidden" accept="application/json"/>
                  </CardContent>
                </Card>
              </div>
              )}

            </CardContent>
          </Card>
        </main>
      </div>

      <RoomFormDialog isOpen={isRoomFormOpen} onOpenChange={setIsRoomFormOpen} onSuccess={fetchRooms} room={selectedRoom}/>
      <UserFormDialog isOpen={isUserFormOpen} onOpenChange={setIsUserFormOpen} onSuccess={fetchUsers} user={selectedUser} />
      <PasswordChangeDialog user={userToChangePassword} isOpen={!!userToChangePassword} onOpenChange={(isOpen) => !isOpen && setUserToChangePassword(null)} />


       <AlertDialog open={!!roomToDelete} onOpenChange={(isOpen) => !isOpen && setRoomToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the room "{roomToDelete?.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setRoomToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteRoom} className={cn(buttonVariants({ variant: "destructive" }))}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the admin user "{userToDelete?.username}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteUser} className={cn(buttonVariants({ variant: "destructive" }))}>Delete User</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!fileToImport} onOpenChange={(isOpen) => { if (!isOpen) setFileToImport(null) }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will overwrite all current settings, rooms, and bookings with the data from '{fileToImport?.name}'. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setFileToImport(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmImport}>Import</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
}
