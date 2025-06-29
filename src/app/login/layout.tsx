import React from 'react';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      {children}
    </div>
  );
}
