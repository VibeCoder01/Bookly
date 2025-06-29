
'use client';

import { CalendarCheck, UserCog, Wifi } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { getCurrentConfiguration } from '@/lib/actions';
import type { AppConfiguration } from '@/types';
import Image from 'next/image';

interface HeaderProps {
  userName?: string | null;
}

export function Header({ userName }: HeaderProps) {
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(true);
  const [config, setConfig] = useState<{ appName: string; appSubtitle: string; appLogo?: string; } | null>(null);

  useEffect(() => {
    fetch('/api/ip')
      .then((res) => res.json())
      .then((data) => {
        setIpAddress(data.ip || 'N/A');
        setIsLoadingIp(false);
      })
      .catch(() => {
        setIpAddress('Error fetching IP');
        setIsLoadingIp(false);
      });
      
    const fetchConfig = async () => {
        try {
            const appConfig = await getCurrentConfiguration();
            setConfig({ appName: appConfig.appName, appSubtitle: appConfig.appSubtitle, appLogo: appConfig.appLogo });
        } catch {
            // Fallback to default values on error
            setConfig({ appName: 'Bookly', appSubtitle: 'Room booking system', appLogo: undefined });
        }
    };
    fetchConfig();

  }, []);

  return (
    <header className="py-6 border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center group">
          {config?.appLogo ? (
            <Image src={config.appLogo} alt={`${config.appName || 'Bookly'} Logo`} width={40} height={40} className="mr-3" unoptimized />
          ) : (
            <CalendarCheck className="h-10 w-10 text-primary mr-3 group-hover:text-primary/80 transition-colors" />
          )}
          <div>
            <h1 className="font-headline text-4xl font-semibold text-primary group-hover:text-primary/80 transition-colors">
              {config?.appName || 'Bookly'}
            </h1>
            <p className="text-sm text-muted-foreground">{config?.appSubtitle || 'Room booking system'}</p>
          </div>
        </Link>
        <div className="flex items-center space-x-4">
          {isLoadingIp ? (
            <span className="text-xs text-muted-foreground">Loading IP...</span>
          ) : (
            ipAddress && (
              <div className="flex items-center text-xs text-muted-foreground" title="Your IP Address">
                <Wifi className="mr-1 h-3 w-3" />
                <span>{ipAddress}</span>
              </div>
            )
          )}
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
