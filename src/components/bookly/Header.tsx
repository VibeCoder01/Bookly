
import { CalendarCheck, UserCog } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  userName?: string | null;
}

export function Header({ userName }: HeaderProps) {
  return (
    <header className="py-6 border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center group">
          <CalendarCheck className="h-10 w-10 text-primary mr-3 group-hover:text-primary/80 transition-colors" />
          <h1 className="font-headline text-4xl font-semibold text-primary group-hover:text-primary/80 transition-colors">
            Bookly
          </h1>
        </Link>
        <div className="flex items-center space-x-4">
          {userName && (
            <span className="text-foreground text-sm">
              Welcome, <span className="font-semibold text-primary">{userName}</span>!
            </span>
          )}
          <Link href="/admin" passHref>
            <Button variant="ghost" size="sm">
              <UserCog className="mr-2 h-5 w-5" />
              Admin
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
