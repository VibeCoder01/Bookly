
import { Header } from '@/components/bookly/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getRooms } from '@/lib/actions';
import type { Room } from '@/types';
import { Sofa } from 'lucide-react';

export default async function HomePage() {
  const { rooms } = await getRooms();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {rooms.length > 0 ? (
            rooms.map((room: Room) => (
              <Link key={room.id} href={`/book?roomId=${room.id}`} passHref>
                <Button size="lg" className="h-24 w-52 text-lg bg-accent hover:bg-accent/90 text-accent-foreground flex flex-col items-center justify-center gap-2 rounded-xl shadow-lg">
                  <Sofa size={32} />
                  <span>{room.name}</span>
                </Button>
              </Link>
            ))
          ) : (
             <p className="text-muted-foreground">No rooms have been configured. Please add a room in the admin panel.</p>
          )}
        </div>
      </main>
    </div>
  );
}
