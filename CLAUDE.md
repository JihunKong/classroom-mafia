# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a real-time multiplayer Korean Mafia game web application designed for classroom use. Students join games via smartphones using a 4-digit code. The game runs automatically without a dedicated moderator.

## Key Commands

### Development
```bash
# Install all dependencies (root, client, server)
npm run install:all

# Run both client and server in development mode
npm run dev

# Run client only (port 5173)
npm run dev:client

# Run server only (port 3001)
npm run dev:server
```

### Build & Production
```bash
# Build both client and server
npm run build

# Build client only
npm run build:client

# Build server only  
npm run build:server

# Start production server
npm start
```

### Testing & Quality
```bash
# Run all tests
npm run test

# Run client tests
npm run test:client

# Run server tests
npm run test:server

# Run all linters
npm run lint

# Run client linter
npm run lint:client

# Run server linter
npm run lint:server

# Clean all node_modules and build artifacts
npm run clean
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Redux Toolkit + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Socket.io
- **Real-time**: Socket.io for bidirectional communication
- **State**: In-memory game state on server (no database)

### Project Structure
```
/
├── client/           # React frontend
├── server/           # Node.js backend  
├── shared/           # Shared types/constants between client/server
└── package.json      # Root package with concurrent scripts
```

### Key Architectural Decisions

1. **Server-Authoritative Game State**: All game logic validation happens on the server. Client only displays state received from server.

2. **Socket.io for Real-time**: Handles room management, game events, and dead chat. Key namespaces:
   - Main game events
   - Dead chat events (separate channel)

3. **Role Balance System**: Automatic role distribution based on player count (6-20 players). See `ROLE_DISTRIBUTIONS` in `/shared/constants/roles.ts`.

4. **Phase-Based Game Flow**: Game progresses through defined phases (waiting → starting → day → voting → execution → night → nightResult → ended). Each phase has timers and allowed actions.

5. **Mobile-First UI**: Designed for smartphone screens with large touch targets and Korean language interface.

## Game Implementation Details

### Role System
- **15+ unique roles** across 3 teams (mafia, citizen, neutral)
- Each role has specific abilities and win conditions
- Role images stored in `/client/src/assets/images/roles/`
- Role definitions in `/shared/constants/roles.ts`

### Game Phases & Timers
- Day discussion: 3 minutes
- Voting: 1 minute  
- Execution vote: 30 seconds
- Night actions: 1 minute
- Phase configs in `/shared/constants/phases.ts`

### Socket Events
Client → Server:
- `room:create`, `room:join`, `game:start`
- `vote:nominate`, `vote:execution`, `action:night`

Server → Client:
- `room:created`, `room:joined`, `game:started`
- `game:phaseChanged`, `game:ended`

### Dead Chat System
- Separate communication channel for dead players
- Implemented in `dead-chat-component.ts` and `dead-chat-server.ts`
- Integrated into main game screen

## Development Guidelines

1. **Type Safety**: Use TypeScript strictly. Define all types in appropriate `.types.ts` files.

2. **State Management**: 
   - Server state is source of truth
   - Use Redux Toolkit on client for local state
   - Never trust client input - validate everything on server

3. **Error Handling**: Implement proper error boundaries and socket disconnection handling.

4. **Mobile UX**: Test on actual mobile devices. Ensure touch targets are large enough.

5. **Korean Language**: All UI text should be in Korean. Use meaningful Korean variable names for UI-facing content.

6. **Security**: 
   - Validate all actions on server
   - Only send each player their own role info
   - Implement rate limiting for actions

## Common Tasks

### Adding a New Role
1. Add role definition to `/shared/constants/roles.ts`
2. Update `ROLE_DISTRIBUTIONS` for player counts
3. Add role image to `/client/src/assets/images/roles/`
4. Implement role abilities in `/server/src/services/roleService.ts`
5. Add UI components if needed for special abilities

### Modifying Game Phases
1. Update phase configs in `/shared/constants/phases.ts`
2. Modify phase transitions if needed
3. Update UI in `/client/src/pages/Game.tsx`
4. Adjust server phase handlers in `/server/src/socket/gameHandlers.ts`

### Debugging Socket Events
1. Check browser DevTools Network tab for WebSocket frames
2. Add logging to socket handlers: `console.log('Event:', eventName, data)`
3. Verify event names match between client and server
4. Check for socket middleware blocking events

## Important Files to Know

- `/shared/constants/roles.ts` - All role definitions and balance
- `/shared/constants/phases.ts` - Game phase configuration  
- `/server/src/services/gameService.ts` - Core game logic
- `/server/src/socket/gameHandlers.ts` - Socket event handlers
- `/client/src/pages/Game.tsx` - Main game UI
- `/client/src/hooks/useSocket.ts` - Socket connection management

## Environment Variables

Client (`.env`):
```
VITE_SERVER_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

Server (`.env`):
```
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```