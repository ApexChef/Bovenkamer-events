// Burger Stack Game Engine

import {
  GameState,
  GameConfig,
  DEFAULT_GAME_CONFIG,
  Ingredient,
  CurrentIngredient,
  IngredientType,
  INGREDIENT_CONFIGS,
  INGREDIENT_SPAWN_WEIGHTS,
} from '@/types/game';

export function createInitialGameState(): GameState {
  return {
    status: 'idle',
    stack: [],
    currentIngredient: null,
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectDrops: 0,
    lives: DEFAULT_GAME_CONFIG.maxLives,
    level: 1,
    gameStartTime: null,
    gameEndTime: null,
  };
}

export function startGame(config: GameConfig = DEFAULT_GAME_CONFIG): GameState {
  const state = createInitialGameState();
  state.status = 'playing';
  state.gameStartTime = Date.now();

  // Add bottom bun as foundation
  const bottomBun: Ingredient = {
    id: crypto.randomUUID(),
    type: 'bun_bottom',
    x: (config.canvasWidth - config.initialWidth) / 2,
    y: config.canvasHeight - config.ingredientHeight - 20,
    width: config.initialWidth,
    height: config.ingredientHeight,
    color: INGREDIENT_CONFIGS.bun_bottom.color,
    emoji: INGREDIENT_CONFIGS.bun_bottom.emoji,
    points: 0,
  };

  state.stack = [bottomBun];
  state.currentIngredient = spawnNextIngredient(state, config);

  return state;
}

export function spawnNextIngredient(
  state: GameState,
  config: GameConfig
): CurrentIngredient {
  const ingredientType = getRandomIngredientType(state.stack.length);
  const ingredientConfig = INGREDIENT_CONFIGS[ingredientType];

  // Get width from top of stack
  const topIngredient = state.stack[state.stack.length - 1];
  const width = topIngredient ? topIngredient.width : config.initialWidth;

  // Calculate speed based on level
  const baseSpeed = config.baseSpeed + (state.level - 1) * config.speedIncrement;
  const speed = baseSpeed * ingredientConfig.speed;

  return {
    type: ingredientType,
    x: 0,
    width,
    speed,
    direction: 1,
  };
}

function getRandomIngredientType(stackSize: number): IngredientType {
  // After 10 layers, chance for bun_top
  if (stackSize >= 10 && Math.random() < 0.15) {
    return 'bun_top';
  }

  // Weighted random selection
  const totalWeight = INGREDIENT_SPAWN_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of INGREDIENT_SPAWN_WEIGHTS) {
    random -= item.weight;
    if (random <= 0) {
      return item.type;
    }
  }

  return 'patty'; // fallback
}

export function updateGame(
  state: GameState,
  config: GameConfig,
  deltaTime: number
): GameState {
  if (state.status !== 'playing' || !state.currentIngredient) {
    return state;
  }

  const newState = { ...state };
  const current = { ...state.currentIngredient };

  // Move ingredient
  current.x += current.speed * current.direction * (deltaTime / 16);

  // Bounce off walls
  if (current.x + current.width >= config.canvasWidth) {
    current.x = config.canvasWidth - current.width;
    current.direction = -1;
  } else if (current.x <= 0) {
    current.x = 0;
    current.direction = 1;
  }

  newState.currentIngredient = current;
  return newState;
}

export interface DropResult {
  state: GameState;
  overlap: number;
  isPerfect: boolean;
  pointsEarned: number;
  isGameOver: boolean;
  isBunTop: boolean;
}

export function dropIngredient(
  state: GameState,
  config: GameConfig
): DropResult {
  if (state.status !== 'playing' || !state.currentIngredient) {
    return {
      state,
      overlap: 0,
      isPerfect: false,
      pointsEarned: 0,
      isGameOver: false,
      isBunTop: false,
    };
  }

  const current = state.currentIngredient;
  const topIngredient = state.stack[state.stack.length - 1];
  const ingredientConfig = INGREDIENT_CONFIGS[current.type];

  // Calculate overlap
  const overlapStart = Math.max(current.x, topIngredient.x);
  const overlapEnd = Math.min(
    current.x + current.width,
    topIngredient.x + topIngredient.width
  );
  const overlapWidth = Math.max(0, overlapEnd - overlapStart);

  const overlapRatio = overlapWidth / current.width;
  const isPerfect = overlapRatio >= config.perfectThreshold;
  const isBunTop = current.type === 'bun_top';

  let newState = { ...state };

  // Check for miss (no overlap)
  if (overlapWidth <= 0) {
    newState.lives -= 1;
    newState.combo = 0;

    if (newState.lives <= 0) {
      // Game over
      newState.status = 'gameover';
      newState.gameEndTime = Date.now();
      newState.currentIngredient = null;

      return {
        state: newState,
        overlap: 0,
        isPerfect: false,
        pointsEarned: 0,
        isGameOver: true,
        isBunTop: false,
      };
    }

    // Continue with new ingredient
    newState.currentIngredient = spawnNextIngredient(newState, config);
    return {
      state: newState,
      overlap: 0,
      isPerfect: false,
      pointsEarned: 0,
      isGameOver: false,
      isBunTop: false,
    };
  }

  // Successful drop - add to stack
  const newIngredient: Ingredient = {
    id: crypto.randomUUID(),
    type: current.type,
    x: overlapStart,
    y: topIngredient.y - config.ingredientHeight,
    width: overlapWidth,
    height: config.ingredientHeight,
    color: ingredientConfig.color,
    emoji: ingredientConfig.emoji,
    points: ingredientConfig.points,
  };

  newState.stack = [...newState.stack, newIngredient];

  // Update combo
  if (isPerfect) {
    newState.combo += 1;
    newState.perfectDrops += 1;
  } else {
    newState.combo = 0;
  }

  if (newState.combo > newState.maxCombo) {
    newState.maxCombo = newState.combo;
  }

  // Calculate points (with combo bonus)
  const comboMultiplier = isPerfect ? Math.min(1 + newState.combo * 0.5, 5) : 1;
  const pointsEarned = Math.floor(ingredientConfig.points * comboMultiplier);
  newState.score += pointsEarned;

  // Level up every 5 successful drops
  if (newState.stack.length % 5 === 0) {
    newState.level += 1;
  }

  // Check if burger is complete (bun_top placed)
  if (isBunTop) {
    // Burger complete bonus!
    const completionBonus = newState.stack.length * 10;
    newState.score += completionBonus;
    newState.status = 'gameover';
    newState.gameEndTime = Date.now();
    newState.currentIngredient = null;

    return {
      state: newState,
      overlap: overlapRatio,
      isPerfect,
      pointsEarned: pointsEarned + completionBonus,
      isGameOver: true,
      isBunTop: true,
    };
  }

  // Check if width is too small
  if (overlapWidth < config.minWidth) {
    newState.status = 'gameover';
    newState.gameEndTime = Date.now();
    newState.currentIngredient = null;

    return {
      state: newState,
      overlap: overlapRatio,
      isPerfect,
      pointsEarned,
      isGameOver: true,
      isBunTop: false,
    };
  }

  // Spawn next ingredient
  newState.currentIngredient = spawnNextIngredient(newState, config);

  return {
    state: newState,
    overlap: overlapRatio,
    isPerfect,
    pointsEarned,
    isGameOver: false,
    isBunTop: false,
  };
}

export function getGameDuration(state: GameState): number {
  if (!state.gameStartTime) return 0;
  const endTime = state.gameEndTime || Date.now();
  return Math.floor((endTime - state.gameStartTime) / 1000);
}
