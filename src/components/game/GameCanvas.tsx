'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/game/store';
import { INGREDIENT_CONFIGS, SPECIAL_ITEM_CONFIGS, DEFAULT_GAME_CONFIG } from '@/types/game';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const { gameState, config, update, drop } = useGameStore();

  // Draw the game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1B4332';
    ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

    // Draw stack
    for (const ingredient of gameState.stack) {
      // Draw ingredient body
      ctx.fillStyle = ingredient.color;
      ctx.fillRect(ingredient.x, ingredient.y, ingredient.width, ingredient.height);

      // Draw border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(ingredient.x, ingredient.y, ingredient.width, ingredient.height);

      // Draw emoji centered
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        ingredient.emoji,
        ingredient.x + ingredient.width / 2,
        ingredient.y + ingredient.height / 2
      );
    }

    // Draw current moving ingredient
    if (gameState.currentIngredient && gameState.status === 'playing') {
      const current = gameState.currentIngredient;
      const ingredientConfig = INGREDIENT_CONFIGS[current.type];

      // Calculate Y position (above stack)
      const topOfStack = gameState.stack.length > 0
        ? gameState.stack[gameState.stack.length - 1].y - config.ingredientHeight - 50
        : config.canvasHeight - config.ingredientHeight * 2 - 70;

      // Draw ingredient body
      ctx.fillStyle = ingredientConfig.color;
      ctx.fillRect(current.x, topOfStack, current.width, config.ingredientHeight);

      // Draw border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(current.x, topOfStack, current.width, config.ingredientHeight);

      // Draw emoji
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        ingredientConfig.emoji,
        current.x + current.width / 2,
        topOfStack + config.ingredientHeight / 2
      );

      // Draw drop zone indicator
      if (gameState.stack.length > 0) {
        const top = gameState.stack[gameState.stack.length - 1];
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(top.x, top.y - config.ingredientHeight, top.width, config.ingredientHeight);
        ctx.setLineDash([]);
      }
    }

    // Draw floating special item
    if (gameState.floatingItem) {
      const item = gameState.floatingItem;
      const itemConfig = SPECIAL_ITEM_CONFIGS[item.type];

      // Draw glow effect
      ctx.shadowColor = itemConfig.color;
      ctx.shadowBlur = 15;

      // Draw item background
      ctx.fillStyle = itemConfig.color + '40';
      ctx.beginPath();
      ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw emoji
      ctx.shadowBlur = 0;
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(itemConfig.emoji, item.x + item.width / 2, item.y + item.height / 2);
    }

    // Draw score overlay
    ctx.fillStyle = '#F5F5DC';
    ctx.font = 'bold 24px "Source Sans Pro", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 10, 30);

    // Draw combo
    if (gameState.combo > 0) {
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 18px "Source Sans Pro", sans-serif';
      ctx.fillText(`${gameState.combo}x Combo!`, 10, 55);
    }

    // Draw lives
    ctx.fillStyle = '#FF6B6B';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    const hearts = '❤️'.repeat(gameState.lives);
    ctx.fillText(hearts, 10, 80);

    // Draw active effects
    const now = Date.now();
    let effectY = 100;
    for (const effect of gameState.activeEffects) {
      if (effect.used) continue;
      const effectConfig = SPECIAL_ITEM_CONFIGS[effect.type];

      // Calculate remaining time for timed effects
      let label = effectConfig.emoji;
      if (effect.expiresAt) {
        const remaining = Math.ceil((effect.expiresAt - now) / 1000);
        if (remaining > 0) {
          label += ` ${remaining}s`;
        }
      } else if (effect.type === 'golden_steak') {
        label += ' 3x!';
      }

      ctx.fillStyle = effectConfig.color;
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(label, 10, effectY);
      effectY += 20;
    }

    // Draw layers count
    ctx.fillStyle = '#F5F5DC';
    ctx.font = '16px "Source Sans Pro", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Lagen: ${gameState.stack.length}`, config.canvasWidth - 10, 30);

    // Draw status messages
    if (gameState.status === 'idle') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 32px "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.fillText('BURGER STACK', config.canvasWidth / 2, config.canvasHeight / 2 - 40);

      ctx.fillStyle = '#F5F5DC';
      ctx.font = '18px "Source Sans Pro", sans-serif';
      ctx.fillText('Tik om te starten', config.canvasWidth / 2, config.canvasHeight / 2 + 10);
    }

    if (gameState.status === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 32px "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.fillText('GEPAUZEERD', config.canvasWidth / 2, config.canvasHeight / 2);
    }
  }, [gameState, config]);

  // Game loop
  const gameLoop = useCallback((time: number) => {
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    if (gameState.status === 'playing') {
      update(deltaTime);
    }

    draw();

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.status, update, draw]);

  // Start/stop game loop
  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  // Handle tap/click
  const handleTap = useCallback(() => {
    if (gameState.status === 'idle') {
      useGameStore.getState().start();
    } else if (gameState.status === 'playing') {
      drop();
    } else if (gameState.status === 'paused') {
      useGameStore.getState().resume();
    }
  }, [gameState.status, drop]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleTap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTap]);

  return (
    <canvas
      ref={canvasRef}
      width={config.canvasWidth}
      height={config.canvasHeight}
      onClick={handleTap}
      onTouchStart={(e) => {
        e.preventDefault();
        handleTap();
      }}
      className="touch-none select-none rounded-lg shadow-lg cursor-pointer"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
