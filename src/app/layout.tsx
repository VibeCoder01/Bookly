
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { getCurrentConfiguration } from '@/lib/actions';
import { Header } from '@/components/bookly/Header';
import { UserProvider } from '@/context/UserContext';

export const metadata: Metadata = {
  title: 'Bookly - Room Booking App',
  description: 'Book rooms easily with Bookly.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getCurrentConfiguration();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <UserProvider>
          <Header config={config} />
          {children}
        </UserProvider>
        <Toaster />
      </body>
    </html>
  );
}
