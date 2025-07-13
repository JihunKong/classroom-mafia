// client/src/hooks/useGame.ts

import { useContext, createContext, useState, ReactNode, useEffect } from 'react';
import { Player } from '../../../shared/types';

interface GameContextType {
  // Game state
  roomCode: string;
  players: Player[];
  myPlayer: Player | null;
  gameState: 'home' | 'waiting' | 'game' | 'ended';
  currentPhase: string;
  currentDay: number;
  timeRemaining: number;
  phaseMessage: string;
  gameLog: string[];
  winner: string;

  // Actions
  setRoomCode: (code: string) => void;
  setPlayers: (players: Player[] | ((prev: Player[]) => Player[])) => void;
  setMyPlayer: (player: Player | null) => void;
  setGameState: (state: 'home' | 'waiting' | 'game' | 'ended') => void;
  setCurrentPhase: (phase: string) => void;
  setCurrentDay: (day: number) => void;
  setTimeRemaining: (time: number) => void;
  setPhaseMessage: (message: string) => void;
  setGameLog: (log: string[] | ((prev: string[]) => string[])) => void;
  setWinner: (winner: string) => void;
}

const GameContext = createContext<GameContextType | null>(null);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  // const { socket } = useSocket();
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<'home' | 'waiting' | 'game' | 'ended'>('home');
  const [currentPhase, setCurrentPhase] = useState('');
  const [currentDay, setCurrentDay] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [phaseMessage, setPhaseMessage] = useState('');
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [winner, setWinner] = useState('');

  // Update myPlayer when players list changes
  useEffect(() => {
    if (myPlayer && players.length > 0) {
      const updatedMyPlayer = players.find(p => p.id === myPlayer.id);
      if (updatedMyPlayer) {
        setMyPlayer(updatedMyPlayer);
      }
    }
  }, [players, myPlayer]);

  const value: GameContextType = {
    roomCode,
    players,
    myPlayer,
    gameState,
    currentPhase,
    currentDay,
    timeRemaining,
    phaseMessage,
    gameLog,
    winner,
    setRoomCode,
    setPlayers,
    setMyPlayer,
    setGameState,
    setCurrentPhase,
    setCurrentDay,
    setTimeRemaining,
    setPhaseMessage,
    setGameLog,
    setWinner,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}