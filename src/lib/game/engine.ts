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
  SpecialItemType,
  SpecialItem,
  ActiveEffect,
  SPECIAL_ITEM_CONFIGS,
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
    activeEffects: [],
    floatingItem: null,
    itemsCollected: 0,
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

  let newState = { ...state };
  const current = { ...state.currentIngredient };

  // Apply speed multiplier from effects
  const speedMultiplier = getSpeedMultiplier(state);

  // Move ingredient
  current.x += current.speed * current.direction * speedMultiplier * (deltaTime / 16);

  // Bounce off walls
  if (current.x + current.width >= config.canvasWidth) {
    current.x = config.canvasWidth - current.width;
    current.direction = -1;
  } else if (current.x <= 0) {
    current.x = 0;
    current.direction = 1;
  }

  newState.currentIngredient = current;

  // Update floating item
  if (newState.floatingItem) {
    const topOfStackY = newState.stack.length > 0
      ? newState.stack[newState.stack.length - 1].y
      : config.canvasHeight - config.ingredientHeight - 20;

    // Check if collected
    if (checkItemCollection(newState.floatingItem, current, topOfStackY)) {
      newState = applySpecialItem(newState, newState.floatingItem.type);
    } else {
      // Update position
      newState.floatingItem = updateFloatingItem(newState.floatingItem, config, deltaTime);
    }
  }

  // Maybe spawn new item
  if (!newState.floatingItem && Math.random() < 0.001) {
    const topOfStackY = newState.stack.length > 0
      ? newState.stack[newState.stack.length - 1].y
      : config.canvasHeight - config.ingredientHeight - 20;

    // Only spawn if stack is high enough
    if (newState.stack.length >= 3) {
      const itemType = SPECIAL_ITEM_TYPES[Math.floor(Math.random() * SPECIAL_ITEM_TYPES.length)];
      newState.floatingItem = {
        type: itemType,
        x: Math.random() * (config.canvasWidth - 40) + 20,
        y: topOfStackY - 150,
        width: 40,
        height: 40,
      };
    }
  }

  // Cleanup expired effects
  newState = cleanupExpiredEffects(newState);

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

  // Calculate points (with combo bonus and golden steak)
  const comboMultiplier = isPerfect ? Math.min(1 + newState.combo * 0.5, 5) : 1;

  // Check for golden steak effect
  const goldenSteakEffect = newState.activeEffects.find(
    e => e.type === 'golden_steak' && !e.used
  );
  const goldenMultiplier = goldenSteakEffect ? 3 : 1;

  // Mark golden steak as used
  if (goldenSteakEffect) {
    newState.activeEffects = newState.activeEffects.map(e =>
      e === goldenSteakEffect ? { ...e, used: true } : e
    );
  }

  const pointsEarned = Math.floor(ingredientConfig.points * comboMultiplier * goldenMultiplier);
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

// Special Items Functions

const SPECIAL_ITEM_TYPES: SpecialItemType[] = ['golden_steak', 'slow_mo', 'extra_life', 'fire'];

export function maybeSpawnSpecialItem(
  state: GameState,
  config: GameConfig
): SpecialItem | null {
  // 10% chance to spawn after every 3 successful drops
  if (state.stack.length < 4 || state.stack.length % 3 !== 0) {
    return null;
  }

  if (Math.random() > 0.10) {
    return null;
  }

  const itemType = SPECIAL_ITEM_TYPES[Math.floor(Math.random() * SPECIAL_ITEM_TYPES.length)];
  const itemConfig = SPECIAL_ITEM_CONFIGS[itemType];

  return {
    type: itemType,
    x: Math.random() * (config.canvasWidth - 40) + 20,
    y: 60,
    width: 40,
    height: 40,
  };
}

export function updateFloatingItem(
  item: SpecialItem,
  config: GameConfig,
  deltaTime: number
): SpecialItem | null {
  // Float down slowly
  const newY = item.y + 1.5 * (deltaTime / 16);

  // Remove if off screen
  if (newY > config.canvasHeight) {
    return null;
  }

  return { ...item, y: newY };
}

export function checkItemCollection(
  item: SpecialItem,
  currentIngredient: { x: number; width: number } | null,
  topOfStackY: number
): boolean {
  if (!currentIngredient) return false;

  // Check if the current moving ingredient overlaps with the item
  const ingredientLeft = currentIngredient.x;
  const ingredientRight = currentIngredient.x + currentIngredient.width;
  const itemLeft = item.x;
  const itemRight = item.x + item.width;

  // Y position of moving ingredient (above stack)
  const ingredientY = topOfStackY - 50;

  // Check overlap
  const xOverlap = ingredientLeft < itemRight && ingredientRight > itemLeft;
  const yOverlap = Math.abs(ingredientY - item.y) < 50;

  return xOverlap && yOverlap;
}

export function applySpecialItem(
  state: GameState,
  itemType: SpecialItemType
): GameState {
  const newState = { ...state };
  newState.itemsCollected += 1;
  newState.floatingItem = null;

  const now = Date.now();
  const itemConfig = SPECIAL_ITEM_CONFIGS[itemType];

  switch (itemType) {
    case 'golden_steak':
      // 3x points on next drop - single use effect
      newState.activeEffects = [
        ...newState.activeEffects,
        { type: 'golden_steak', expiresAt: null, used: false }
      ];
      break;

    case 'slow_mo':
      // Slow down for 5 seconds
      newState.activeEffects = [
        ...newState.activeEffects.filter(e => e.type !== 'slow_mo'),
        { type: 'slow_mo', expiresAt: now + (itemConfig.duration || 5000) }
      ];
      break;

    case 'extra_life':
      // Add extra life
      newState.lives += 1;
      break;

    case 'fire':
      // Speed up for 3 seconds
      newState.activeEffects = [
        ...newState.activeEffects.filter(e => e.type !== 'fire'),
        { type: 'fire', expiresAt: now + (itemConfig.duration || 3000) }
      ];
      break;
  }

  return newState;
}

export function getSpeedMultiplier(state: GameState): number {
  const now = Date.now();
  let multiplier = 1;

  for (const effect of state.activeEffects) {
    if (effect.expiresAt && effect.expiresAt < now) continue;

    if (effect.type === 'slow_mo') {
      multiplier *= 0.5; // Half speed
    } else if (effect.type === 'fire') {
      multiplier *= 2; // Double speed
    }
  }

  return multiplier;
}

export function cleanupExpiredEffects(state: GameState): GameState {
  const now = Date.now();
  const activeEffects = state.activeEffects.filter(effect => {
    // Keep effects that don't expire (like golden_steak until used)
    if (effect.expiresAt === null) return !effect.used;
    // Keep effects that haven't expired
    return effect.expiresAt > now;
  });

  if (activeEffects.length !== state.activeEffects.length) {
    return { ...state, activeEffects };
  }
  return state;
}
