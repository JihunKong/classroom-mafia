# Claude Code Instructions for Korean Mafia Game

## Project Overview
This is a real-time multiplayer Korean Mafia game web application designed for classroom use. Students can join games via their smartphones using a simple 4-digit code.

## Core Features
- Real-time multiplayer gameplay using Socket.io
- Mobile-first responsive design
- Automatic role balancing based on player count (6-20 players)
- No dedicated moderator needed - automated game flow
- Korean language interface with TTS support
- 15+ unique roles with special abilities

## Tech Stack
- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Real-time**: Socket.io
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Package Manager**: npm

## Project Structure
```
korean-mafia-game/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   ├── store/        # Redux store
│   │   ├── services/     # API/Socket services
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   └── public/
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── models/       # Data models
│   │   ├── socket/       # Socket.io handlers
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   └── index.ts
└── shared/               # Shared types/constants
```

## Development Guidelines

### 1. Code Style
- Use TypeScript for type safety
- Follow React best practices with functional components and hooks
- Implement proper error handling and loading states
- Use meaningful variable and function names in English (UI text in Korean)

### 2. Component Structure
```typescript
// Example component structure
interface ComponentProps {
  // Props definition
}

export const ComponentName: React.FC<ComponentProps> = ({ props }) => {
  // Hooks
  // Event handlers
  // Render
};
```

### 3. Socket Communication
- All game logic validation happens on the server
- Client only displays state received from server
- Use typed events for socket communication

### 4. State Management
- Use Redux Toolkit for global state
- Local component state for UI-only concerns
- Server state is the source of truth

### 5. Security Considerations
- Never trust client input
- Validate all actions on server
- Only send player their own role information
- Implement rate limiting

## Game Rules Implementation

### Player Count & Role Distribution
```typescript
const ROLE_DISTRIBUTIONS = {
  6: { mafia: 1, citizen: 4, doctor: 1 },
  7: { mafia: 2, citizen: 4, doctor: 1 },
  8: { mafia: 2, citizen: 5, doctor: 1 },
  9: { mafia: 2, citizen: 5, doctor: 1, police: 1 },
  10: { mafia: 2, citizen: 5, doctor: 1, police: 1, soldier: 1 },
  11: { mafia: 2, spy: 1, citizen: 5, doctor: 1, police: 1, soldier: 1 },
  12: { mafia: 3, citizen: 5, doctor: 1, police: 1, soldier: 1, reporter: 1 },
  13: { mafia: 3, spy: 1, citizen: 5, doctor: 1, police: 1, soldier: 1, reporter: 1 },
  14: { mafia: 3, spy: 1, citizen: 6, doctor: 1, police: 1, soldier: 1, detective: 1 },
  15: { mafia: 3, spy: 1, citizen: 6, doctor: 1, police: 1, soldier: 1, reporter: 1, bartender: 1 },
  16: { mafia: 3, spy: 1, citizen: 6, doctor: 1, police: 1, soldier: 1, reporter: 1, bartender: 1, terrorist: 1 },
  17: { mafia: 3, spy: 1, werewolf: 1, citizen: 6, doctor: 1, police: 1, soldier: 1, reporter: 1, bartender: 1, terrorist: 1 },
  18: { mafia: 3, spy: 1, werewolf: 1, citizen: 7, doctor: 1, police: 1, soldier: 1, reporter: 1, medium: 1, terrorist: 1 },
  19: { mafia: 3, spy: 1, werewolf: 1, citizen: 7, doctor: 1, police: 1, soldier: 1, reporter: 1, wizard: 1, medium: 1, terrorist: 1 },
  20: { mafia: 3, spy: 1, werewolf: 1, doubleAgent: 1, citizen: 7, doctor: 1, police: 1, soldier: 1, reporter: 1, wizard: 1, thief: 1, illusionist: 1 }
};
```

### Game Phases
1. **Waiting Room**: Players join with code
2. **Role Assignment**: Random role distribution
3. **Day Phase**: Discussion (3 minutes)
4. **Voting Phase**: Nominate suspects
5. **Execution Vote**: Yes/No on nominated player
6. **Night Phase**: Role actions
7. **Result**: Show night events
8. **Win Check**: Continue or end game

## Key Implementation Tasks

### Phase 1 - Core Functionality
- [ ] Basic server setup with Socket.io
- [ ] Room creation and joining logic
- [ ] Role assignment system
- [ ] Day/Night cycle management
- [ ] Basic voting mechanism

### Phase 2 - Game Features
- [ ] All role implementations
- [ ] Timer system
- [ ] Game state persistence
- [ ] Reconnection handling
- [ ] TTS integration

### Phase 3 - Polish
- [ ] Animations and transitions
- [ ] Sound effects
- [ ] Error handling improvements
- [ ] Performance optimization
- [ ] Comprehensive testing

## Testing Requirements
- Unit tests for game logic
- Integration tests for socket events
- E2E tests for critical user flows
- Manual testing on various mobile devices

## Deployment
- Frontend: Vercel
- Backend: Railway or Render
- Environment variables for production configs

## Notes for Claude
- Prioritize mobile UX - large touch targets, readable text
- Keep the interface simple and intuitive for students
- Ensure game continues smoothly even if players disconnect
- Implement Korean language throughout the UI
- Add helpful tooltips for first-time players