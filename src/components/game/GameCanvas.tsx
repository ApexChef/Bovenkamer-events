'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '@/lib/game/store';
import { INGREDIENT_CONFIGS, SPECIAL_ITEM_CONFIGS } from '@/types/game';

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  scale: number;
}

let floatingTextId = 0;

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  const { gameState, config, update, drop, lastDropResult } = useGameStore();

  // Add floating text when drop result changes
  useEffect(() => {
    if (lastDropResult && lastDropResult.pointsEarned > 0) {
      const topY = gameState.stack.length > 0
        ? gameState.stack[gameState.stack.length - 1].y
        : config.canvasHeight - 100;

      const newText: FloatingText = {
        id: floatingTextId++,
        text: lastDropResult.isPerfect
          ? `+${lastDropResult.pointsEarned} PERFECT!`
          : `+${lastDropResult.pointsEarned}`,
        x: config.canvasWidth / 2,
        y: topY - 20,
        color: lastDropResult.isPerfect ? '#FFD700' : '#FFFFFF',
        opacity: 1,
        scale: lastDropResult.isPerfect ? 1.5 : 1,
      };

      setFloatingTexts(prev => [...prev, newText]);

      // Remove after animation
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(t => t.id !== newText.id));
      }, 1000);
    }
  }, [lastDropResult, gameState.stack, config.canvasWidth, config.canvasHeight]);

  // Helper: Draw rounded rectangle
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Draw the game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, config.canvasHeight);
    gradient.addColorStop(0, '#1B4332');
    gradient.addColorStop(1, '#0D2818');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

    // Draw subtle grid pattern
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < config.canvasWidth; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, config.canvasHeight);
      ctx.stroke();
    }
    for (let i = 0; i < config.canvasHeight; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(config.canvasWidth, i);
      ctx.stroke();
    }

    // Draw plate/base at bottom
    const plateY = config.canvasHeight - 15;
    ctx.fillStyle = '#8B4513';
    drawRoundedRect(ctx, 20, plateY, config.canvasWidth - 40, 10, 5);
    ctx.fill();
    ctx.strokeStyle = '#5D2E0C';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw stack with improved graphics
    for (let i = 0; i < gameState.stack.length; i++) {
      const ingredient = gameState.stack[i];

      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      drawRoundedRect(ctx, ingredient.x + 3, ingredient.y + 3, ingredient.width, ingredient.height, 6);
      ctx.fill();

      // Draw ingredient body with gradient
      const ingredientGradient = ctx.createLinearGradient(
        ingredient.x,
        ingredient.y,
        ingredient.x,
        ingredient.y + ingredient.height
      );
      ingredientGradient.addColorStop(0, ingredient.color);
      ingredientGradient.addColorStop(1, adjustColor(ingredient.color, -30));
      ctx.fillStyle = ingredientGradient;
      drawRoundedRect(ctx, ingredient.x, ingredient.y, ingredient.width, ingredient.height, 6);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = adjustColor(ingredient.color, -50);
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ingredient.x + 8, ingredient.y + 4);
      ctx.lineTo(ingredient.x + ingredient.width - 8, ingredient.y + 4);
      ctx.stroke();

      // Draw emoji centered
      ctx.font = '22px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(
        ingredient.emoji,
        ingredient.x + ingredient.width / 2,
        ingredient.y + ingredient.height / 2
      );
      ctx.shadowBlur = 0;
    }

    // Draw current moving ingredient
    if (gameState.currentIngredient && gameState.status === 'playing') {
      const current = gameState.currentIngredient;
      const ingredientConfig = INGREDIENT_CONFIGS[current.type];

      // Calculate Y position (above stack)
      const topOfStack = gameState.stack.length > 0
        ? gameState.stack[gameState.stack.length - 1].y - config.ingredientHeight - 60
        : config.canvasHeight - config.ingredientHeight * 2 - 80;

      // Draw drop guide line
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(current.x + current.width / 2, topOfStack + config.ingredientHeight);
      const targetY = gameState.stack.length > 0
        ? gameState.stack[gameState.stack.length - 1].y
        : plateY;
      ctx.lineTo(current.x + current.width / 2, targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw target zone highlight
      if (gameState.stack.length > 0) {
        const top = gameState.stack[gameState.stack.length - 1];
        ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
        drawRoundedRect(ctx, top.x, top.y - config.ingredientHeight - 5, top.width, config.ingredientHeight + 5, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw moving ingredient shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      drawRoundedRect(ctx, current.x + 3, topOfStack + 3, current.width, config.ingredientHeight, 6);
      ctx.fill();

      // Draw moving ingredient with gradient
      const moveGradient = ctx.createLinearGradient(
        current.x,
        topOfStack,
        current.x,
        topOfStack + config.ingredientHeight
      );
      moveGradient.addColorStop(0, ingredientConfig.color);
      moveGradient.addColorStop(1, adjustColor(ingredientConfig.color, -30));
      ctx.fillStyle = moveGradient;
      drawRoundedRect(ctx, current.x, topOfStack, current.width, config.ingredientHeight, 6);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = adjustColor(ingredientConfig.color, -50);
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw emoji
      ctx.font = '22px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(
        ingredientConfig.emoji,
        current.x + current.width / 2,
        topOfStack + config.ingredientHeight / 2
      );
      ctx.shadowBlur = 0;

      // Draw ingredient name
      ctx.font = 'bold 12px "Source Sans Pro", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(ingredientConfig.label, current.x + current.width / 2, topOfStack - 12);
    }

    // Draw floating special item
    if (gameState.floatingItem) {
      const item = gameState.floatingItem;
      const itemConfig = SPECIAL_ITEM_CONFIGS[item.type];

      // Draw glow effect
      ctx.shadowColor = itemConfig.color;
      ctx.shadowBlur = 20;

      // Draw pulsating background
      const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1;
      ctx.fillStyle = itemConfig.color + '60';
      ctx.beginPath();
      ctx.arc(
        item.x + item.width / 2,
        item.y + item.height / 2,
        (item.width / 2) * pulseScale,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw emoji
      ctx.shadowBlur = 0;
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(itemConfig.emoji, item.x + item.width / 2, item.y + item.height / 2);

      // Draw label
      ctx.font = 'bold 10px "Source Sans Pro", sans-serif';
      ctx.fillStyle = itemConfig.color;
      ctx.fillText(itemConfig.label, item.x + item.width / 2, item.y + item.height + 12);
    }

    // Draw floating score texts
    for (const text of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = text.opacity;
      ctx.font = `bold ${Math.round(18 * text.scale)}px "Source Sans Pro", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = text.color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(text.text, text.x, text.y - (1 - text.opacity) * 30);
      ctx.restore();
    }

    // Update floating texts animation
    setFloatingTexts(prev =>
      prev.map(t => ({
        ...t,
        y: t.y - 1,
        opacity: Math.max(0, t.opacity - 0.02),
      })).filter(t => t.opacity > 0)
    );

    // Draw UI overlay
    // Score panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    drawRoundedRect(ctx, 8, 8, 120, 65, 8);
    ctx.fill();

    ctx.fillStyle = '#F5F5DC';
    ctx.font = 'bold 28px "Source Sans Pro", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${gameState.score}`, 16, 38);

    ctx.fillStyle = 'rgba(245, 245, 220, 0.6)';
    ctx.font = '12px "Source Sans Pro", sans-serif';
    ctx.fillText('SCORE', 16, 56);

    // Combo indicator
    if (gameState.combo > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px "Source Sans Pro", sans-serif';
      ctx.fillText(`${gameState.combo}x`, 90, 38);
    }

    // Lives
    ctx.font = '18px Arial';
    const hearts = '❤️'.repeat(gameState.lives);
    ctx.fillText(hearts, 16, 82);

    // Active effects
    const now = Date.now();
    let effectX = 140;
    for (const effect of gameState.activeEffects) {
      if (effect.used) continue;
      const effectConfig = SPECIAL_ITEM_CONFIGS[effect.type];

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      drawRoundedRect(ctx, effectX, 8, 50, 30, 6);
      ctx.fill();

      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(effectConfig.emoji, effectX + 25, 28);

      if (effect.expiresAt) {
        const remaining = Math.ceil((effect.expiresAt - now) / 1000);
        if (remaining > 0) {
          ctx.font = '10px "Source Sans Pro", sans-serif';
          ctx.fillStyle = effectConfig.color;
          ctx.fillText(`${remaining}s`, effectX + 25, 42);
        }
      }
      effectX += 55;
    }

    // Layers count (right side)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    drawRoundedRect(ctx, config.canvasWidth - 75, 8, 67, 35, 8);
    ctx.fill();

    ctx.fillStyle = '#F5F5DC';
    ctx.font = 'bold 18px "Source Sans Pro", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${gameState.stack.length}`, config.canvasWidth - 18, 30);

    ctx.fillStyle = 'rgba(245, 245, 220, 0.6)';
    ctx.font = '10px "Source Sans Pro", sans-serif';
    ctx.fillText('LAGEN', config.canvasWidth - 18, 42);

    // Draw status overlays
    if (gameState.status === 'idle') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

      // Title
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 36px "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
      ctx.shadowBlur = 20;
      ctx.fillText('🍔 BURGER', config.canvasWidth / 2, config.canvasHeight / 2 - 60);
      ctx.fillText('STACK', config.canvasWidth / 2, config.canvasHeight / 2 - 20);
      ctx.shadowBlur = 0;

      // Instructions
      ctx.fillStyle = '#F5F5DC';
      ctx.font = '16px "Source Sans Pro", sans-serif';
      ctx.fillText('Stapel ingrediënten door te tikken', config.canvasWidth / 2, config.canvasHeight / 2 + 30);

      ctx.fillStyle = 'rgba(245, 245, 220, 0.6)';
      ctx.font = '14px "Source Sans Pro", sans-serif';
      ctx.fillText('Perfecte timing = combo bonus!', config.canvasWidth / 2, config.canvasHeight / 2 + 55);

      // Start button
      ctx.fillStyle = '#D4AF37';
      drawRoundedRect(ctx, config.canvasWidth / 2 - 80, config.canvasHeight / 2 + 80, 160, 45, 10);
      ctx.fill();

      ctx.fillStyle = '#1B4332';
      ctx.font = 'bold 18px "Source Sans Pro", sans-serif';
      ctx.fillText('TAP OM TE STARTEN', config.canvasWidth / 2, config.canvasHeight / 2 + 107);
    }

    if (gameState.status === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 32px "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.fillText('⏸️ GEPAUZEERD', config.canvasWidth / 2, config.canvasHeight / 2);

      ctx.fillStyle = '#F5F5DC';
      ctx.font = '16px "Source Sans Pro", sans-serif';
      ctx.fillText('Tik om verder te spelen', config.canvasWidth / 2, config.canvasHeight / 2 + 40);
    }
  }, [gameState, config, floatingTexts]);

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
      className="touch-none select-none rounded-xl shadow-2xl cursor-pointer border-2 border-gold/20"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
