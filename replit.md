# Anonymous Message Board Application

## Overview

This is a full-stack web application for a password-protected anonymous message board. Users authenticate with a shared password to access the board where they can post anonymous messages, like posts, and comment on them. The application features an AI bot that automatically responds to new messages with witty or sarcastic replies.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: 
  - React Query (TanStack Query) for server state management
  - Zustand for WebSocket connection state
  - Local React state for component-level state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API**: RESTful endpoints with WebSocket support for real-time updates
- **Session Management**: Cookie-based authentication with a shared password
- **Real-time Updates**: WebSocket server for live message, like, and comment updates

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless PostgreSQL
- **Schema**: Four main tables (messages, comments, likes, rate_limits)
- **Migrations**: Drizzle Kit for database schema management

## Key Components

### Authentication System
- **Access Control**: Single shared password ("darktalent2024!")
- **Session Persistence**: Cookie-based session storage
- **Route Protection**: Authentication check on protected routes

### Message Board Features
- **Anonymous Posting**: Users can submit messages without identification
- **Interaction System**: Like messages and add comments
- **Real-time Updates**: Live updates for new messages, likes, and comments
- **Thread View**: Expandable comment sections for each message

### AI Bot Integration
- **Auto-replies**: AI bot automatically comments on new messages
- **Provider**: OpenAI API integration
- **Personality**: Witty, sarcastic, and roasting responses
- **UI Distinction**: Bot comments styled differently with special indicators

### Anti-Spam Protection
- **Rate Limiting**: IP-based restrictions (1 message per minute per IP)
- **Storage**: Rate limit tracking in database
- **Validation**: Server-side enforcement of posting limits

## Data Flow

1. **User Authentication**: User enters shared password → Server validates → Session cookie set
2. **Message Creation**: User submits message → Rate limit check → Save to database → WebSocket broadcast → AI bot generates response
3. **Real-time Updates**: WebSocket connections receive live updates for new messages, likes, and comments
4. **Interactions**: Users like/comment → Database update → WebSocket broadcast to all connected clients

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Database ORM and query builder
- **express**: Web server framework
- **ws**: WebSocket implementation
- **openai**: AI integration for bot responses

### UI Components
- **@radix-ui/***: Accessible UI primitives
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight routing library

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type safety and development experience
- **drizzle-kit**: Database schema management

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle pushes schema changes to PostgreSQL

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for bot responses
- `NODE_ENV`: Environment setting (development/production)

### Production Setup
- **Server**: Node.js server serving both API and static files
- **Database**: Neon Database PostgreSQL instance
- **Real-time**: WebSocket server for live updates
- **Static Files**: Vite-built frontend served from Express

## Changelog

```
Changelog:
- July 05, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```