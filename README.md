# Bookly - Room Booking Application

Bookly is a modern, full-stack room booking application built with Next.js. It provides a seamless interface for users to book meeting rooms and an administrative dashboard for managing rooms, bookings, and application settings.

This project was bootstrapped with [Firebase Studio](https://firebase.google.com/studio).

## Key Features

- **Intuitive Booking Form:** A user-friendly interface for selecting rooms, dates, and available time slots.
- **Real-time Availability:** The booking form dynamically fetches and displays available time slots based on existing bookings.
- **Admin Dashboard:** A comprehensive dashboard located at `/admin` for:
  - Viewing all bookings across all rooms.
  - Adding, editing, and deleting meeting rooms.
  - Configuring application-wide settings like booking slot duration and workday hours.
- **Data Persistence:** Uses a simple flat-file system (JSON) for storing all application data, making it easy to inspect and manage.
- **Import/Export:** Easily back up and restore all application data (rooms, bookings, settings) with a single click.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (using the App Router)
- **UI Library:** [React](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Component Library:** [ShadCN UI](https://ui.shadcn.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Backend Logic:** Next.js Server Actions for all data mutations and queries.

## Getting Started

To get the application running locally, follow these steps:

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (version 18 or higher) and npm installed on your machine.

### Installation

1.  Clone the repository:
    ```bash
    git clone <your-repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd <project-directory>
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

Execute the following command to start the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser to view the application.

## Project Structure

- `src/app/`: Contains the main pages and layouts for the application (e.g., `page.tsx` for the home page and `admin/page.tsx` for the admin dashboard).
- `src/components/`: Houses all React components.
  - `src/components/ui/`: Auto-generated UI components from ShadCN.
  - `src/components/bookly/`: Custom components specific to the Bookly application.
- `src/lib/`: Core logic and utilities.
  - `actions.ts`: Contains all the Next.js Server Actions that interact with the data layer.
  - `config-store.ts`, `mock-data.ts`: Handles reading from and writing to the JSON data files.
- `data/`: The flat-file database for the application.
  - `rooms.json`: A list of all available rooms.
  - `bookings.json`: A record of all bookings.
  - `app-config.json`: Global application settings.
- `public/`: Static assets.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
