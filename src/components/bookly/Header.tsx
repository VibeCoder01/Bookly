import { CalendarCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="py-6">
      <div className="container mx-auto px-4 flex items-center">
        <CalendarCheck className="h-10 w-10 text-primary mr-3" />
        <h1 className="font-headline text-4xl font-semibold text-primary">
          Bookly
        </h1>
      </div>
    </header>
  );
}
