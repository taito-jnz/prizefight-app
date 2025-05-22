# Prizefight Application Architecture

## Overview
Prizefight is a smart spending simulator that helps users track skipped purchases and budget savings. The application turns smart spending decisions into virtual investment points (OPCs) and shows potential future wealth. It is built using a modern tech stack with React on the frontend and Express.js on the backend, using Drizzle ORM for database interactions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
Prizefight follows a client-server architecture with a clear separation between frontend and backend components:

1. **Frontend**: React application using Vite as the build tool
2. **Backend**: Express.js server
3. **Database**: Uses Drizzle ORM with a schema ready for PostgreSQL
4. **Data Flow**: RESTful API endpoints for CRUD operations

The application currently uses in-memory storage but is designed to easily transition to a PostgreSQL database. User data like OPC balance, budgets, spending logs, and streaks are managed through state and localStorage in the client, but the architecture supports moving this to server-side persistence.

## Key Components

### Frontend Components
1. **OpcOverview**: Displays the user's current OPC (virtual currency) balance
2. **SkippedSpendLogger**: Allows users to log purchases they've chosen to skip
3. **BudgetTracker**: Lets users set budgets and track actual spending
4. **StreakTracker**: Shows consecutive days of staying under budget
5. **InvestmentSimulator**: Projects future value of accumulated OPCs
6. **RecentActivity**: Shows a history of the user's activity

The UI is built using the shadcn/ui component library with Tailwind CSS for styling.

### Backend Components
1. **Express Server**: Handles HTTP requests and responses
2. **Storage Interface**: Currently implemented as in-memory storage but designed for database integration
3. **User Schema**: Defined using Drizzle ORM with zod validation

### Data Model
1. **Users**: Basic user model with id, username, and password
2. **Activity Items**: Tracking user's spending decisions and OPC earnings
3. **Budget Data**: User-defined budget values and actual spending

## Data Flow
1. User logs skipped purchases or budget tracking in the UI
2. Client components update local state and persist to localStorage
3. The architecture supports extending this to API calls to the backend
4. The backend is set up to store data in the database using Drizzle ORM

## External Dependencies
1. **React**: Frontend library
2. **Express**: Backend server framework
3. **Drizzle ORM**: Database ORM
4. **Tailwind CSS**: Utility-first CSS framework
5. **shadcn/ui**: UI component library based on Radix UI
6. **Zod**: Schema validation library
7. **Vite**: Build tool and development server

The application uses a comprehensive set of Radix UI components through the shadcn/ui library, providing accessible and customizable UI elements.

## Deployment Strategy
The application is configured for deployment on Replit with:

1. **Development**: `npm run dev` using tsx for TypeScript execution
2. **Production Build**: Vite for frontend and esbuild for backend
3. **Production Start**: Node.js serving the built application

The Replit configuration includes:
- Node.js 20
- Web module
- PostgreSQL 16 (ready to be integrated)
- Ports configuration (port 5000 mapped to 80)
- Workflow for running the application

## Development Guidelines

### Adding Endpoints
New API endpoints should be added to `server/routes.ts` with the `/api` prefix. Use the storage interface for database operations.

### Database Integration
The application is ready for PostgreSQL integration. When implementing:
1. Use Drizzle ORM functions for queries
2. Create appropriate schema definitions in `shared/schema.ts`
3. Implement proper database connection in the storage interface

### Adding Features
When adding new features:
1. Create new React components in the `client/src/components` directory
2. Update state management in App.tsx
3. Add any required API endpoints in the server
4. Extend the database schema if needed

### UI Components
The application uses shadcn/ui components. When building UI:
1. Use existing components from `client/src/components/ui`
2. Follow the established styling patterns with Tailwind CSS
3. Maintain accessibility standards supported by Radix UI primitives

## Next Steps
1. Implement proper database integration with PostgreSQL
2. Add user authentication using the existing user schema
3. Develop server-side storage for user activities and spending data
4. Create proper API endpoints for data persistence