
import { redirect } from 'next/navigation';
import { getCurrentConfiguration, getCurrentUser, getCurrentAdmin } from '@/lib/actions';
import BookPageClient from './BookPageClient';

export const dynamic = 'force-dynamic';

type BookPageSearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>
  | undefined;

export default async function BookPage({
  searchParams,
}: {
  searchParams?: BookPageSearchParams;
}) {
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<any>)?.then === 'function'
      ? await searchParams
      : (searchParams as Record<string, string | string[] | undefined> | undefined);

  const [config, currentUser, currentAdmin] = await Promise.all([
    getCurrentConfiguration(),
    getCurrentUser(),
    getCurrentAdmin(),
  ]);

  const allowAnonymous = config.allowAnonymousUsers ?? true;
  const allowAnonymousDeletion = config.allowAnonymousBookingDeletion ?? true;
  const allowAnonymousEditing = config.allowAnonymousBookingEditing ?? true;
  const isAuthenticated = Boolean(currentUser || currentAdmin);
  const requiresAuthForBooking = !allowAnonymous;
  const authenticatedUserName = currentUser?.username ?? currentAdmin?.username ?? null;

  if (!allowAnonymous && !isAuthenticated) {
    const entries = Object.entries(resolvedSearchParams ?? {}).flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((v) => [key, v]);
      }
      if (value === undefined) return [];
      return [[key, value]];
    }) as [string, string][];

    const queryString = entries.length ? new URLSearchParams(entries).toString() : '';
    const fromPath = queryString ? `/book?${queryString}` : '/book';
    redirect(`/user/login?from=${encodeURIComponent(fromPath)}`);
  }

  const canDeleteBookings = allowAnonymousDeletion || isAuthenticated;
  const requiresAuthForDeletion = !allowAnonymousDeletion;
  const canEditBookings = allowAnonymousEditing || isAuthenticated;
  const requiresAuthForEditing = !allowAnonymousEditing;

  return (
    <BookPageClient
      canDeleteBookings={canDeleteBookings}
      requiresAuthForDeletion={requiresAuthForDeletion}
      canEditBookings={canEditBookings}
      requiresAuthForEditing={requiresAuthForEditing}
      requiresAuthForBooking={requiresAuthForBooking}
      authenticatedUserName={authenticatedUserName}
      includeWeekends={config.includeWeekends ?? false}
    />
  );
}
