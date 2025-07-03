# Bookly - Advanced Room Booking Application

Bookly is a modern, full-stack room booking application built with Next.js. It provides a seamless and highly customizable interface for users to view room availability and make bookings, along with a powerful administrative dashboard for complete control over the application.

This project was bootstrapped with [Firebase Studio](https://firebase.google.com/studio).

## Key Features

### User-Facing Features
- **Interactive Room Grid:** A dynamic home page that provides a visual overview of room availability at a glance for the entire week.
- **Detailed Slot Information:** Click on any time slot on the home page grid to instantly view its status (Available/Booked) and booking details in a pop-up dialog.
- **Flexible Weekly View:** Easily navigate between weeks using arrow buttons. The grid can be configured by an admin to show either a 5-day work week or a full 7-day week.
- **Customizable Start of Week:** The weekly view can be configured to start on either Sunday or Monday to match user preferences.
- **Streamlined Booking Process:** A dedicated `/book` page allows users to select a room, date, and time from a list of real-time available slots.
- **Persistent User Details:** The booking form conveniently remembers the user's name and email via local storage, speeding up future bookings.

### Comprehensive Admin Dashboard
- **Centralized Management:** A secure, password-protected dashboard at `/admin` for all administrative functions.
- **Full Bookings Overview:** View a comprehensive list of all bookings across all rooms, sorted by date and time.
- **Room Configuration:** Easily add, edit, or delete meeting rooms and their capacities.
- **Application Customization:**
  - **Branding:** Change the application's name, subtitle, and upload a custom logo.
  - **Booking Logic:** Set the default booking slot duration (15, 30, or 60 minutes) and define the start and end of the workday to constrain booking times.
  - **Appearance:** Adjust the size of room cards on the home page (Small, Medium, Large) to suit your display needs.
- **Data Portability:** Export all application data (settings, rooms, and bookings) to a single JSON file for backup, or import from a backup file to instantly restore the application's state.
- **Security:** Manage access by changing the admin password through a secure form.

## Screenshots

**Home Page - Weekly Room Availability Grid**
![image](https://github.com/user-attachments/assets/6f1b2992-5d37-423e-b7d1-ee5cbe04b489)

**Admin Dashboard - Room Management**
![image](https://github.com/user-attachments/assets/e9ecbce5-ca31-401b-8310-cde250e86538)

**Admin Dashboard - Data Management (Import/Export)**
![image](https://github.com/user-attachments/assets/4c52f3fb-3510-40ea-9434-8659c4879ab1)

**Admin Dashboard - Application Configuration**
![image](https://github.com/user-attachments/assets/7c305326-3d92-478f-9cb8-167a88e8b31b)

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
- `public/`: Static assets, including the uploaded application logo.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
