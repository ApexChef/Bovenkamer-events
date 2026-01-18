// Burger Stack Game Store

import { create } from 'zustand';
import {
  GameState,
  GameConfig,
  DEFAULT_GAME_CONFIG,
  LeaderboardEntry,
} from '@/types/game';
import {
  createInitialGameState,
  startGame,
  updateGame,
  dropIngredient,
  getGameDuration,
  DropResult,
} from './engine';

interface GameStore {
  // Game state
  gameState: GameState;
  config: GameConfig;

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  personalBest: number;

  // UI state
  isLoading: boolean;
  showLeaderboard: boolean;
  lastDropResult: DropResult | null;

  // Actions
  initGame: () => void;
  start: () => void;
  update: (deltaTime: number) => void;
  drop: () => DropResult;
  pause: () => void;
  resume: () => void;
  reset: () => void;

  // Leaderboard
  fetchLeaderboard: () => Promise<void>;
  saveScore: () => Promise<void>;

  // UI
  setShowLeaderboard: (show: boolean) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: createInitialGameState(),
  config: DEFAULT_GAME_CONFIG,
  leaderboard: [],
  personalBest: 0,
  isLoading: false,
  showLeaderboard: false,
  lastDropResult: null,

  initGame: () => {
    set({ gameState: createInitialGameState(), lastDropResult: null });
  },

  start: () => {
    const config = get().config;
    const newState = startGame(config);
    set({ gameState: newState, lastDropResult: null });
  },

  update: (deltaTime: number) => {
    const { gameState, config } = get();
    if (gameState.status !== 'playing') return;

    const newState = updateGame(gameState, config, deltaTime);
    set({ gameState: newState });
  },

  drop: () => {
    const { gameState, config } = get();
    const result = dropIngredient(gameState, config);
    set({ gameState: result.state, lastDropResult: result });

    // Auto-save score on game over
    if (result.isGameOver) {
      get().saveScore();
    }

    return result;
  },

  pause: () => {
    const { gameState } = get();
    if (gameState.status === 'playing') {
      set({ gameState: { ...gameState, status: 'paused' } });
    }
  },

  resume: () => {
    const { gameState } = get();
    if (gameState.status === 'paused') {
      set({ gameState: { ...gameState, status: 'playing' } });
    }
  },

  reset: () => {
    set({
      gameState: createInitialGameState(),
      lastDropResult: null,
      showLeaderboard: false,
    });
  },

  fetchLeaderboard: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/game/scores?limit=10');
      if (response.ok) {
        const data = await response.json();
        set({
          leaderboard: data.leaderboard || [],
          personalBest: data.personalBest || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  saveScore: async () => {
    const { gameState } = get();
    if (gameState.score === 0) return;

    try {
      const duration = getGameDuration(gameState);
      const response = await fetch('/api/game/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: gameState.score,
          layers: gameState.stack.length,
          max_combo: gameState.maxCombo,
          perfect_drops: gameState.perfectDrops,
          duration_seconds: duration,
        }),
      });

      if (response.ok) {
        // Refresh leaderboard after saving
        get().fetchLeaderboard();
      }
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  },

  setShowLeaderboard: (show: boolean) => {
    set({ showLeaderboard: show });
  },
}));
