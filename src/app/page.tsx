
import { Header } from '@/components/bookly/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <Link href="/book" passHref>
          <Button size="lg" className="h-14 px-8 text-lg bg-accent hover:bg-accent/90 text-accent-foreground">
            Book a Room
          </Button>
        </Link>
      </main>
    </div>
  );
}
