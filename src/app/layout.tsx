
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { getCurrentConfiguration, getCurrentAdmin, getCurrentUser } from '@/lib/actions';
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
  const [config, adminInfo, userInfo] = await Promise.all([
    getCurrentConfiguration(),
    getCurrentAdmin(),
    getCurrentUser(),
  ]);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen flex flex-col">
        <UserProvider>
          <Header config={config} initialAdminInfo={adminInfo} initialUserInfo={userInfo} />
          {children}
        </UserProvider>
        <Toaster />
      </body>
    </html>
  );
}
