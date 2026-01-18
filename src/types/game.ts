// Burger Stack Game Types

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export interface Ingredient {
  id: string;
  type: IngredientType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  emoji: string;
  points: number;
}

export type IngredientType =
  | 'bun_bottom'
  | 'patty'
  | 'cheese'
  | 'lettuce'
  | 'tomato'
  | 'bacon'
  | 'egg'
  | 'pickle'
  | 'bun_top';

export interface IngredientConfig {
  type: IngredientType;
  emoji: string;
  color: string;
  points: number;
  speed: number; // multiplier
  label: string;
}

export const INGREDIENT_CONFIGS: Record<IngredientType, IngredientConfig> = {
  bun_bottom: { type: 'bun_bottom', emoji: '🍞', color: '#D4A574', points: 0, speed: 1.0, label: 'Broodje onder' },
  patty: { type: 'patty', emoji: '🥩', color: '#8B4513', points: 10, speed: 1.0, label: 'Hamburger' },
  cheese: { type: 'cheese', emoji: '🧀', color: '#FFD700', points: 15, speed: 1.0, label: 'Kaas' },
  lettuce: { type: 'lettuce', emoji: '🥬', color: '#90EE90', points: 20, speed: 1.3, label: 'Sla' },
  tomato: { type: 'tomato', emoji: '🍅', color: '#FF6347', points: 20, speed: 1.3, label: 'Tomaat' },
  bacon: { type: 'bacon', emoji: '🥓', color: '#CD5C5C', points: 25, speed: 1.5, label: 'Bacon' },
  egg: { type: 'egg', emoji: '🍳', color: '#FFFACD', points: 30, speed: 1.5, label: 'Ei' },
  pickle: { type: 'pickle', emoji: '🥒', color: '#6B8E23', points: 15, speed: 1.0, label: 'Augurk' },
  bun_top: { type: 'bun_top', emoji: '🍞', color: '#D4A574', points: 50, speed: 0.8, label: 'Broodje boven' },
};

// Ingredient spawn order (weighted random)
export const INGREDIENT_SPAWN_WEIGHTS: { type: IngredientType; weight: number }[] = [
  { type: 'patty', weight: 25 },
  { type: 'cheese', weight: 20 },
  { type: 'lettuce', weight: 15 },
  { type: 'tomato', weight: 15 },
  { type: 'bacon', weight: 10 },
  { type: 'egg', weight: 8 },
  { type: 'pickle', weight: 7 },
];

export interface GameState {
  status: GameStatus;
  stack: Ingredient[];
  currentIngredient: CurrentIngredient | null;
  score: number;
  combo: number;
  maxCombo: number;
  perfectDrops: number;
  lives: number;
  level: number;
  gameStartTime: number | null;
  gameEndTime: number | null;
}

export interface CurrentIngredient {
  type: IngredientType;
  x: number;
  width: number;
  speed: number;
  direction: 1 | -1;
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  baseSpeed: number;
  speedIncrement: number;
  ingredientHeight: number;
  initialWidth: number;
  minWidth: number;
  perfectThreshold: number; // % overlap for "perfect"
  maxLives: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  canvasWidth: 360,
  canvasHeight: 640,
  baseSpeed: 3,
  speedIncrement: 0.15,
  ingredientHeight: 30,
  initialWidth: 200,
  minWidth: 20,
  perfectThreshold: 0.95,
  maxLives: 1,
};

export interface GameScore {
  id: string;
  user_id: string;
  game_type: 'burger_stack';
  score: number;
  layers: number;
  max_combo: number;
  perfect_drops: number;
  duration_seconds: number;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  score: number;
  layers: number;
  created_at: string;
}

export interface GameChallenge {
  id: string;
  challenger_id: string;
  challenger_name: string;
  challenged_id: string;
  challenged_name: string;
  challenger_score_id: string;
  challenger_score: number;
  challenged_score_id?: string;
  challenged_score?: number;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  winner_id?: string;
  guru_comment?: string;
  created_at: string;
  completed_at?: string;
}
