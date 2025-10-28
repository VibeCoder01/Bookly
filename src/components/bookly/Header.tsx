
'use client';

import { CalendarCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useTransition, useCallback } from 'react';
import type { AppConfiguration } from '@/types';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import { getCurrentAdmin, getCurrentUser, logoutUser } from '@/lib/actions';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PanelColorPreferencesDialog } from '@/components/bookly/PanelColorPreferencesDialog';

interface HeaderProps {
  config: AppConfiguration;
  initialAdminInfo: { username: string; isPrimary: boolean } | null;
  initialUserInfo: { username: string } | null;
}

export function Header({ config, initialAdminInfo, initialUserInfo }: HeaderProps) {
  const { userName } = useUser();
  const pathname = usePathname();
  const [adminInfo, setAdminInfo] = useState<{ username: string; isPrimary: boolean } | null>(initialAdminInfo);
  const [userInfo, setUserInfo] = useState<{ username: string } | null>(initialUserInfo);
  const [isLoggingOut, startLogoutTransition] = useTransition();

  const handleUserLogout = useCallback(() => {
    startLogoutTransition(() => {
      logoutUser(pathname || '/');
    });
  }, [pathname, startLogoutTransition]);

  useEffect(() => {
    setAdminInfo(initialAdminInfo);
  }, [initialAdminInfo]);

  useEffect(() => {
    setUserInfo(initialUserInfo);
  }, [initialUserInfo]);

  useEffect(() => {
    let active = true;
    getCurrentAdmin()
      .then((info) => {
        if (active) {
          setAdminInfo(info);
        }
      })
      .catch(() => {
        if (active) {
          setAdminInfo(null);
        }
      });
    getCurrentUser()
      .then((info) => {
        if (active) {
          setUserInfo(info);
        }
      })
      .catch(() => {
        if (active) {
          setUserInfo(null);
        }
      });
    return () => {
      active = false;
    };
  }, [pathname]);

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
          <PanelColorPreferencesDialog />
          {adminInfo ? (
            <span
              className="text-foreground text-sm flex items-center gap-2"
              title={adminInfo.isPrimary ? 'Primary admin' : 'Secondary admin'}
            >
              Admin:
              <span className="font-semibold text-primary">{adminInfo.username}</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-foreground text-[10px] font-semibold">
                {adminInfo.isPrimary ? 'P' : 'S'}
              </span>
            </span>
          ) : userInfo ? (
            <>
              <span className="text-foreground text-sm flex items-center gap-2" title="Authenticated user">
                User:
                <span className="font-semibold text-primary">{userInfo.username}</span>
              </span>
              <Button variant="outline" size="sm" onClick={handleUserLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Logging out...' : 'Logout User'}
              </Button>
            </>
          ) : (
            userName && (
              <span className="text-foreground text-sm">
                Welcome, <span className="font-semibold text-primary">{userName}</span>!
              </span>
            )
          )}
        </div>
      </div>
    </header>
  );
}
