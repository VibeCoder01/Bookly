# Bookly

Bookly is a sample room booking application built with **Next.js** and **Tailwind CSS**. It is configured for Firebase Hosting and demonstrates how to manage room availability, create bookings and maintain simple configuration settings.

## Features

- **Booking form** for selecting a room, date and time.
- **Availability checker** displaying open time slots.
- **Calendar view** to review upcoming bookings.
- **Confirmation system** with toast notifications.
- **AI‑powered suggestions** offering alternative slots after a booking attempt.
- **Admin dashboard** to manage rooms, view all bookings and adjust app settings.

## Development

1. Install dependencies
   ```bash
   npm install
   ```
2. Start the development server
   ```bash
   npm run dev
   ```
   The app runs at `http://localhost:9002` by default.

## File structure

- `src/app/` &ndash; Next.js pages and layout
- `src/components/` &ndash; reusable UI components
- `src/lib/` &ndash; data access utilities and Firebase configuration
- `data/` &ndash; sample JSON data for rooms, bookings and app settings

For more details on the project goals and style guidelines, see [`docs/blueprint.md`](docs/blueprint.md).
