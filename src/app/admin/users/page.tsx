'use client';

import { useEffect, useState } from 'react';
import { getAdminAccounts, saveAdminAccount, deleteAdminAccount } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { AdminAccount } from '@/types';

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    async function fetchData() {
      const data = await getAdminAccounts();
      setAdmins(data);
    }
    fetchData();
  }, []);

  const handleAdd = async () => {
    if (!newUser || !newPass) return;
    await saveAdminAccount({ username: newUser, password: newPass, permissions: [], requirePasswordChange: false });
    const updated = await getAdminAccounts();
    setAdmins(updated);
    setNewUser('');
    setNewPass('');
  };

  const handleDelete = async (u: string) => {
    await deleteAdminAccount(u);
    setAdmins(await getAdminAccounts());
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <Card className="shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Manage Admins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Username" value={newUser} onChange={e => setNewUser(e.target.value)} />
            <Input placeholder="Password" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} />
            <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4"/>Add</Button>
            <Link href="/admin" passHref><Button variant="outline">Back</Button></Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map(a => (
                <TableRow key={a.username}>
                  <TableCell>{a.username}</TableCell>
                  <TableCell>
                    {a.username !== 'sysadmin' && (
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(a.username)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
