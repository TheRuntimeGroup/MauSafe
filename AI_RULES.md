# Tech Stack

- You are building a React application.
- Use TypeScript.
- Use React Router. KEEP the routes in src/App.tsx
- Always put source code in the src folder.
- Put pages into src/pages/
- Put components into src/components/
- The main page (default page) is src/pages/Index.tsx
- UPDATE the main page to include the new components. OTHERWISE, the user can NOT see any components!
- ALWAYS try to use the shadcn/ui library.
- Tailwind CSS: always use Tailwind CSS for styling components. Utilize Tailwind classes extensively for layout, spacing, colors, and other design aspects.

Available packages and libraries:

- The lucide-react package is installed for icons.
- You ALREADY have ALL the shadcn/ui components and their dependencies installed. So you don't need to install them again.
- You have ALL the necessary Radix UI components installed.
- Use prebuilt components from the shadcn/ui library after importing them. Note that these files shouldn't be edited, so make new components if you need to change them.

## AnouSecureMoris Project Guidelines

### Project Overview
AnouSecureMoris is a safety and protection web application designed for people living in Mauritius.

The application aims to help users protect themselves against crime, fraud, scams, and emergency situations.

### User Experience
- Design a modern, premium, and responsive interface.
- Use Tailwind CSS and shadcn/ui components.
- Ensure the application works on mobile phones, tablets, and computers.
- Provide simple navigation for users of all ages.
- Support accessibility for elderly users and people with disabilities.
- Plan multilingual support for English, French, and Mauritian Creole.

### Planned Core Features
- Emergency SOS with trusted contact notifications.
- Crime and incident reporting.
- Scam and suspicious link detection.
- Safe journey tracking and voluntary location sharing.
- Safety alerts and incident maps.
- Trusted contact management.
- Accessible elderly-friendly interface.
- Administrative dashboard for managing reports.

### Security and Privacy
- Protect personal information and sensitive user data.
- Require user consent before accessing location.
- Use secure authentication and role-based permissions.
- Validate user input on the frontend and backend.
- Never expose API keys or passwords in frontend code.
- Prevent unauthorised access to private incident reports.
- Never claim emergency services were contacted unless confirmed.

### Development Standards
- Use React with TypeScript.
- Keep application routes in src/App.tsx.
- Store pages in src/pages/.
- Store reusable components in src/components/.
- Use Tailwind CSS for styling.
- Use Lucide React for consistent icons.
- Keep components reusable and well organised.
- Handle loading, errors, and empty states properly.
- Connect features to real backend APIs when implemented.
- Do not present mock data as real incidents or alerts.
