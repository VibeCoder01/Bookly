
'use client';

import { CalendarCheck, UserCog, Wifi } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import type { AppConfiguration } from '@/types';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import { getCurrentAdmin } from '@/lib/actions';

interface HeaderProps {
  config: AppConfiguration;
}

export function Header({ config }: HeaderProps) {
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(true);
  const { userName } = useUser();
  const [adminInfo, setAdminInfo] = useState<{ username: string; isPrimary: boolean } | null>(null);

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
    getCurrentAdmin().then(setAdminInfo).catch(() => setAdminInfo(null));
  }, []);

  return (
    <header className="py-6 border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center group">
          {config.appLogo ? (
            <Image src={config.appLogo} alt={`${config.appName} Logo`} width={40} height={40} className="mr-3" unoptimized />
          ) : (
            <CalendarCheck className="h-10 w-10 text-primary mr-3 group-hover:text-primary/80 transition-colors" />
          )}
          <div>
            <h1 className="font-headline text-4xl font-semibold text-primary group-hover:text-primary/80 transition-colors">
              {config.appName}
            </h1>
            <p className="text-sm text-muted-foreground">{config.appSubtitle}</p>
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
          {adminInfo && (
            <span className="text-xs text-muted-foreground flex items-center">
              {adminInfo.username}
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-foreground text-[10px] font-semibold">
                {adminInfo.isPrimary ? '1' : '2'}
              </span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
