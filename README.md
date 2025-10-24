# Bookly - Advanced Room Booking Application

Bookly is a modern, full-stack room booking application built with Next.js. It provides a seamless and highly customizable interface for users to view room availability and make bookings, along with a powerful administrative dashboard for complete control over the application.

This project was bootstrapped with [Firebase Studio](https://firebase.google.com/studio).

## Key Features

### User-Facing Features
- **Interactive Room Grid:** A dynamic home page that provides a visual overview of room availability at a glance for the entire week.
- **Detailed Slot Information:** Click on any time slot on the home page grid to instantly view its status (Available/Booked) and booking details in a pop-up dialog.
- **Color-Coded Legend:** Quickly distinguish overlapping meetings with a configurable legend and optional strike overlay that highlight booked slots by title.
- **Flexible Weekly View:** Easily navigate between weeks using arrow buttons. The grid can be configured by an admin to show either a 5-day work week or a full 7-day week.
- **Customizable Start of Week:** The weekly view can be configured to start on either Sunday or Monday to match user preferences.
- **Streamlined Booking Process:** A dedicated `/book` page allows users to select a room, date, and time from a list of real-time available slots.
- **Booking Insights:** Review the current day's reservations for any room directly from the booking form before submitting a new request.
- **Account-Aware Actions:** Optional sign-in requirements ensure booking, editing, and deletion flows respect the authentication rules configured by administrators.

### Comprehensive Admin Dashboard
- **Centralized Management:** A secure, password-protected dashboard at `/admin` for all administrative functions.
- **Full Bookings Overview:** View a comprehensive list of all bookings across all rooms, sorted by date and time.
- **Room Configuration:** Easily add, edit, or delete meeting rooms and their capacities.
- **Account Management:** Create, rename, reset, or delete end-user accounts from the dashboard, and provide a self-service password change view for signed-in users.
- **Secondary Admin Controls:** Primary administrators can provision, rename, reset, or remove secondary admin accounts without leaving the app.
- **Application Customization:**
  - **Branding:** Change the application's name, subtitle, and upload a custom logo.
  - **Booking Logic:** Set the default booking slot duration (15, 30, or 60 minutes) and define the start and end of the workday to constrain booking times.
  - **Appearance:** Adjust the size of room cards on the home page (Small, Medium, Large) to suit your display needs, and toggle the booking legend or strike overlay.
  - **Access Rules:** Decide whether anonymous visitors can book, edit, or delete reservations before authentication is required.
  - **Database:** Set the path to the SQLite executable used for data storage.
- **Data Portability:** Export all application data (settings, rooms, and bookings) to a single JSON file for backup, or import from a backup file to instantly restore the application's state.
- **Security:** Manage access by changing the primary admin password or rotating secondary admin credentials through dedicated workflows.

## Screenshots

**Home Page - Weekly Room Availability Grid**
![image](https://github.com/user-attachments/assets/38270cde-d2da-412d-be53-f0036b96de43)


**Admin Dashboard - Room Management**
![image](https://github.com/user-attachments/assets/e9ecbce5-ca31-401b-8310-cde250e86538)


**Admin Dashboard - Data Management (Import/Export)**
![image](https://github.com/user-attachments/assets/4c52f3fb-3510-40ea-9434-8659c4879ab1)


**Admin Dashboard - Application Configuration**
![image](https://github.com/user-attachments/assets/ddb2a921-d119-47c5-8bfa-824184a2368f)



## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (using the App Router)
- **UI Library:** [React](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Component Library:** [ShadCN UI](https://ui.shadcn.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Backend Logic:** Next.js Server Actions for all data mutations and queries.
- **Database:** SQLite (via the `sqlite3` CLI) for bookings, configuration, and user credential storage.

## Getting Started

To get the application running locally, follow these steps:

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (version 18 or higher) and npm installed on your machine.
This project persists data using the `sqlite3` command line tool. Ensure `sqlite3` is installed and available in your `PATH` before running the app.

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
  - `actions.ts`: Contains all the Next.js Server Actions that interact with the data layer and enforce authentication rules.
  - `config-store.ts`, `sqlite-db.ts`, `mock-data.ts`: Persist configuration, bookings, and credentials to SQLite while exposing helper functions for rooms and backups.
- `src/context/`: Shared React context such as the `UserProvider` that keeps lightweight client state in sync with authentication cookies.
- `data/`: Persisted application data.
  - `bookly.sqlite`: SQLite database storing bookings, configuration, admin accounts, and app user credentials.
  - `rooms.json`: JSON definition for available rooms used by the booking grid and import/export flows.
- `public/`: Static assets, including the uploaded application logo.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
