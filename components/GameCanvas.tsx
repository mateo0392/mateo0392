
import React, { useRef, useEffect, useCallback } from 'react';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  MONKEY_RADIUS, 
  MONKEY_SPEED, 
  TIGER_RADIUS, 
  TIGER_SPEED, 
  BANANA_RADIUS, 
  TREE_RADIUS,
  STAFF_RADIUS,
  STAFF_SWING_RANGE,
  TIGER_STUN_DURATION,
  SNAKE_RADIUS,
  SNAKE_SPEED,
  SNAKE_MAX_HEALTH,
  SNAKE_SEGMENTS,
  COLORS 
} from '../constants';
import { Entity, Banana, Tree, Position, Staff, Snake, GameStatus } from '../types';

interface GameCanvasProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: () => void;
  onVictory: () => void;
  status: GameStatus;
}

interface Decoration {
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
}

interface AnimatedBanana extends Banana {
  spawnTime: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onScoreUpdate, onGameOver, onVictory, status }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const animationFrame = useRef(0);
  const prevStatusRef = useRef<GameStatus>(status);
  
  const monkey = useRef<Entity>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    radius: MONKEY_RADIUS,
    speed: MONKEY_SPEED,
    angle: 0
  });

  const tigers = useRef<Entity[]>([]);
  const snake = useRef<Snake | null>(null);
  const lastTigerScore = useRef(0);
  const staff = useRef<Staff | null>(null);
  const isSwinging = useRef(0);

  const bananas = useRef<AnimatedBanana[]>([]);
  const trees = useRef<Tree[]>([]);
  const decorations = useRef<Decoration[]>([]);
  const score = useRef(0);
  const keys = useRef<{ [key: string]: boolean }>({});
  const isMoving = useRef(false);

  const isPointInTree = (p: Position, treeList: Tree[]) => {
    return treeList.some(tree => {
      const dx = p.x - tree.x;
      const dy = p.y - tree.y;
      return Math.sqrt(dx * dx + dy * dy) < tree.radius + 10;
    });
  };

  const spawnTiger = useCallback(() => {
    if (score.current >= 200) return;

    const corners = [
      { x: 50, y: 50 },
      { x: GAME_WIDTH - 50, y: 50 },
      { x: 50, y: GAME_HEIGHT - 50 },
      { x: GAME_WIDTH - 50, y: GAME_HEIGHT - 50 }
    ];
    const corner = corners[Math.floor(Math.random() * corners.length)];
    const speedVariation = 0.8 + Math.random() * 0.4;
    
    tigers.current.push({
      x: corner.x,
      y: corner.y,
      radius: TIGER_RADIUS,
      speed: TIGER_SPEED * speedVariation,
      angle: 0,
      isStunned: false,
      stunTimer: 0
    });
  }, []);

  const spawnSnake = useCallback(() => {
    tigers.current = [];
    const segments = Array.from({ length: SNAKE_SEGMENTS }).map(() => ({ x: -100, y: -100 }));
    snake.current = {
      x: -100,
      y: -100,
      radius: SNAKE_RADIUS,
      speed: SNAKE_SPEED,
      angle: 0,
      health: SNAKE_MAX_HEALTH,
      maxHealth: SNAKE_MAX_HEALTH,
      segments: segments
    };
  }, []);

  const spawnStaff = useCallback(() => {
    let attempts = 0;
    let newPos = { x: 0, y: 0 };
    let valid = false;

    while (!valid && attempts < 20) {
      newPos = {
        x: Math.random() * (GAME_WIDTH - 150) + 75,
        y: Math.random() * (GAME_HEIGHT - 150) + 75
      };
      if (!isPointInTree(newPos, trees.current)) {
        valid = true;
      }
      attempts++;
    }

    staff.current = {
      id: 'ruyi-jingu-bang',
      x: newPos.x,
      y: newPos.y,
      isPickedUp: false
    };
  }, []);

  const spawnBanana = useCallback(() => {
    let attempts = 0;
    let newPos = { x: 0, y: 0 };
    let valid = false;

    while (!valid && attempts < 20) {
      newPos = {
        x: Math.random() * (GAME_WIDTH - 100) + 50,
        y: Math.random() * (GAME_HEIGHT - 100) + 50
      };
      if (!isPointInTree(newPos, trees.current)) {
        valid = true;
      }
      attempts++;
    }

    const newBanana: AnimatedBanana = {
      id: Math.random().toString(36).substr(2, 9),
      x: newPos.x,
      y: newPos.y,
      spawnTime: performance.now()
    };
    bananas.current.push(newBanana);
  }, []);

  const initGame = useCallback(() => {
    score.current = 0;
    lastTigerScore.current = 0;
    staff.current = null;
    snake.current = null;
    isSwinging.current = 0;
    onScoreUpdate(0);
    monkey.current = {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      radius: MONKEY_RADIUS,
      speed: MONKEY_SPEED,
      angle: 0
    };
    
    tigers.current = [];
    spawnTiger();
    
    const newTrees: Tree[] = [];
    for (let i = 0; i < 12; i++) {
      newTrees.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        radius: TREE_RADIUS + Math.random() * 20
      });
    }
    trees.current = newTrees;

    const newDeco: Decoration[] = [];
    const colors = ['#166534', '#15803d', '#14532d', '#3f6212'];
    for (let i = 0; i < 40; i++) {
      newDeco.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: 5 + Math.random() * 15,
        rotation: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    decorations.current = newDeco;
    
    bananas.current = [];
    for (let i = 0; i < 8; i++) spawnBanana();
  }, [onScoreUpdate, spawnBanana, spawnTiger]);

  useEffect(() => {
    // Solo reiniciamos el estado del juego si pasamos a PLAYING desde un estado que NO sea PAUSED
    if (status === GameStatus.PLAYING && prevStatusRef.current !== GameStatus.PAUSED) {
      initGame();
    }
    prevStatusRef.current = status;
  }, [status, initGame]);

  const update = () => {
    if (status !== GameStatus.PLAYING) return;
    animationFrame.current++;

    let dx = 0;
    let dy = 0;
    const k = keys.current;
    
    if (k['w']) dy -= 1;
    if (k['s']) dy += 1;
    if (k['a']) dx -= 1;
    if (k['d']) dx += 1;

    if (k[' '] && staff.current?.isPickedUp && isSwinging.current === 0) {
      isSwinging.current = 15;
      
      tigers.current.forEach(tiger => {
        const tdx = tiger.x - monkey.current.x;
        const tdy = tiger.y - monkey.current.y;
        const dist = Math.sqrt(tdx * tdx + tdy * tdy);
        const angleToTiger = Math.atan2(tdy, tdx);
        let angleDiff = Math.abs(angleToTiger - monkey.current.angle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        if (dist < STAFF_SWING_RANGE + tiger.radius && angleDiff < Math.PI / 2) {
          tiger.isStunned = true;
          tiger.stunTimer = TIGER_STUN_DURATION;
          tiger.x += Math.cos(angleToTiger) * 100;
          tiger.y += Math.sin(angleToTiger) * 100;
        }
      });

      if (snake.current) {
        const sdx = snake.current.x - monkey.current.x;
        const sdy = snake.current.y - monkey.current.y;
        const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
        const angleToSnake = Math.atan2(sdy, sdx);
        let angleDiff = Math.abs(angleToSnake - monkey.current.angle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        if (sdist < STAFF_SWING_RANGE + snake.current.radius && angleDiff < Math.PI / 2) {
          snake.current.health -= 1;
          snake.current.x += Math.cos(angleToSnake) * 40;
          snake.current.y += Math.sin(angleToSnake) * 40;
          
          if (snake.current.health <= 0) {
            onVictory();
          }
        }
      }
    }

    if (isSwinging.current > 0) isSwinging.current--;

    isMoving.current = dx !== 0 || dy !== 0;

    if (dx !== 0 || dy !== 0) {
      const mag = Math.sqrt(dx * dx + dy * dy);
      monkey.current.x += (dx / mag) * monkey.current.speed;
      monkey.current.y += (dy / mag) * monkey.current.speed;
      monkey.current.angle = Math.atan2(dy, dx);
    }

    monkey.current.x = Math.max(monkey.current.radius, Math.min(GAME_WIDTH - monkey.current.radius, monkey.current.x));
    monkey.current.y = Math.max(monkey.current.radius, Math.min(GAME_HEIGHT - monkey.current.radius, monkey.current.y));

    if (snake.current) {
      const sdx = monkey.current.x - snake.current.x;
      const sdy = monkey.current.y - snake.current.y;
      const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
      
      if (sdist > 0) {
        snake.current.x += (sdx / sdist) * snake.current.speed;
        snake.current.y += (sdy / sdist) * snake.current.speed;
        snake.current.angle = Math.atan2(sdy, sdx);
      }

      const head = { x: snake.current.x, y: snake.current.y };
      let prev = head;
      for (let i = 0; i < snake.current.segments.length; i++) {
        const seg = snake.current.segments[i];
        const ddx = prev.x - seg.x;
        const ddy = prev.y - seg.y;
        const dd = Math.sqrt(ddx * ddx + ddy * ddy);
        const targetDist = snake.current.radius * 0.7;
        if (dd > targetDist) {
          seg.x += (ddx / dd) * (dd - targetDist);
          seg.y += (ddy / dd) * (dd - targetDist);
        }
        prev = seg;
      }

      if (sdist < monkey.current.radius + snake.current.radius - 15) {
        onGameOver();
      }
    }

    tigers.current.forEach(tiger => {
      if (tiger.isStunned && tiger.stunTimer) {
        tiger.stunTimer--;
        if (tiger.stunTimer <= 0) {
          tiger.isStunned = false;
        }
        return;
      }

      const tdx = monkey.current.x - tiger.x;
      const tdy = monkey.current.y - tiger.y;
      const dist = Math.sqrt(tdx * tdx + tdy * tdy);
      
      if (dist > 0) {
        tiger.x += (tdx / dist) * tiger.speed;
        tiger.y += (tdy / dist) * tiger.speed;
        tiger.angle = Math.atan2(tdy, tdx);
      }

      if (dist < monkey.current.radius + tiger.radius - 8) {
        onGameOver();
      }
    });

    if (staff.current) {
      if (!staff.current.isPickedUp) {
        const sdx = monkey.current.x - staff.current.x;
        const sdy = monkey.current.y - staff.current.y;
        const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
        if (sdist < monkey.current.radius + STAFF_RADIUS) {
          staff.current.isPickedUp = true;
        }
      } else {
        staff.current.x = monkey.current.x;
        staff.current.y = monkey.current.y;
      }
    }

    for (let i = 0; i < tigers.current.length; i++) {
      for (let j = i + 1; j < tigers.current.length; j++) {
        const t1 = tigers.current[i];
        const t2 = tigers.current[j];
        const tdx = t1.x - t2.x;
        const tdy = t1.y - t2.y;
        const dist = Math.sqrt(tdx * tdx + tdy * tdy);
        const minDist = t1.radius + t2.radius + 15;
        
        if (dist < minDist) {
          const overlap = minDist - dist;
          const nx = tdx / (dist || 1);
          const ny = tdy / (dist || 1);
          t1.x += nx * overlap * 0.5;
          t1.y += ny * overlap * 0.5;
          t2.x -= nx * overlap * 0.5;
          t2.y -= ny * overlap * 0.5;
        }
      }
    }

    bananas.current = bananas.current.filter(banana => {
      const bdx = monkey.current.x - banana.x;
      const bdy = monkey.current.y - banana.y;
      const dist = Math.sqrt(bdx * bdx + bdy * bdy);
      if (dist < monkey.current.radius + BANANA_RADIUS + 8) {
        score.current += 1;
        onScoreUpdate(score.current);
        
        if (score.current < 200) {
          if (score.current > 0 && score.current % 30 === 0 && score.current !== lastTigerScore.current) {
            spawnTiger();
            lastTigerScore.current = score.current;
          }
        }

        if (score.current === 100 && !staff.current) {
          spawnStaff();
        }

        if (score.current === 200 && !snake.current) {
          spawnSnake();
        }
        
        return false;
      }
      return true;
    });

    while (bananas.current.length < 8) {
      spawnBanana();
    }

    trees.current.forEach(tree => {
      const entities = [monkey.current, ...tigers.current, ...(snake.current ? [snake.current] : [])];
      entities.forEach(ent => {
        const edx = ent.x - tree.x;
        const edy = ent.y - tree.y;
        const dist = Math.sqrt(edx * edx + edy * edy);
        const collisionRadius = ent === snake.current ? ent.radius * 0.3 : ent.radius + tree.radius * 0.45;
        if (dist < collisionRadius) {
          const overlap = collisionRadius - dist;
          ent.x += (edx / (dist || 1)) * overlap;
          ent.y += (edy / (dist || 1)) * overlap;
        }
      });
    });
  };

  const drawTree = (ctx: CanvasRenderingContext2D, tree: Tree) => {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(tree.x + 10, tree.y + 10, tree.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(tree.x, tree.y, tree.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    const layers = 3;
    for (let i = 0; i < layers; i++) {
      const layerRadius = tree.radius * (1 - i * 0.15);
      ctx.fillStyle = i === 0 ? '#064e3b' : (i === 1 ? '#065f46' : '#10b981');
      for (let j = 0; j < 8; j++) {
        const ang = (j / 8) * Math.PI * 2 + (i * 0.5);
        const ox = Math.cos(ang) * (layerRadius * 0.4);
        const oy = Math.sin(ang) * (layerRadius * 0.4);
        ctx.beginPath();
        ctx.arc(tree.x + ox, tree.y + oy, layerRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    decorations.current.forEach(deco => {
      ctx.save();
      ctx.translate(deco.x, deco.y);
      ctx.rotate(deco.rotation);
      ctx.fillStyle = deco.color;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, deco.size, deco.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.globalAlpha = 1.0;

    const now = performance.now();
    bananas.current.forEach(banana => {
      const scale = Math.min(1, (now - banana.spawnTime) / 500);
      ctx.save();
      ctx.translate(banana.x, banana.y);
      ctx.scale(scale, scale);
      ctx.rotate(Math.sin(animationFrame.current * 0.1) * 0.2);
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(250, 204, 21, 0.8)';
      ctx.fillStyle = COLORS.BANANA;
      ctx.beginPath();
      ctx.ellipse(0, 0, BANANA_RADIUS, BANANA_RADIUS * 0.6, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (staff.current && !staff.current.isPickedUp) {
      ctx.save();
      ctx.translate(staff.current.x, staff.current.y);
      ctx.rotate(animationFrame.current * 0.05);
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'gold';
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-2, -25, 4, 50);
      ctx.fillStyle = 'red';
      ctx.fillRect(-3, -25, 6, 8);
      ctx.fillRect(-3, 17, 6, 8);
      ctx.restore();
    }

    if (snake.current) {
      for (let i = snake.current.segments.length - 1; i >= 0; i--) {
        const seg = snake.current.segments[i];
        const sizeRatio = 1 - (i / snake.current.segments.length) * 0.5;
        ctx.save();
        ctx.translate(seg.x, seg.y);
        ctx.fillStyle = COLORS.SNAKE;
        ctx.beginPath();
        ctx.arc(0, 0, snake.current.radius * sizeRatio, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.SNAKE_BELLY;
        ctx.beginPath();
        ctx.arc(0, 0, snake.current.radius * sizeRatio * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(snake.current.x, snake.current.y);
      ctx.rotate(snake.current.angle);
      ctx.fillStyle = COLORS.SNAKE;
      ctx.beginPath();
      ctx.ellipse(0, 0, snake.current.radius * 1.2, snake.current.radius, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(snake.current.radius * 0.6, -10, 5, 0, Math.PI * 2);
      ctx.arc(snake.current.radius * 0.6, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      if (animationFrame.current % 60 < 20) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(snake.current.radius * 1.2, 0);
        ctx.lineTo(snake.current.radius * 1.6, 0);
        ctx.stroke();
      }
      ctx.restore();

      const barWidth = 100;
      const barHeight = 8;
      const healthRatio = snake.current.health / snake.current.maxHealth;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(snake.current.x - barWidth / 2, snake.current.y - 70, barWidth, barHeight);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(snake.current.x - barWidth / 2, snake.current.y - 70, barWidth * healthRatio, barHeight);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.strokeRect(snake.current.x - barWidth / 2, snake.current.y - 70, barWidth, barHeight);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Naga Boss', snake.current.x, snake.current.y - 75);
    }

    const bob = (isMoving.current && animationFrame.current % 20 < 10) ? 3 : 0;

    if (isSwinging.current > 0) {
      ctx.save();
      ctx.translate(monkey.current.x, monkey.current.y);
      ctx.rotate(monkey.current.angle);
      ctx.beginPath();
      ctx.arc(0, 0, STAFF_SWING_RANGE, -Math.PI / 3, Math.PI / 3);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 15;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(monkey.current.x, monkey.current.y);
    ctx.rotate(monkey.current.angle);
    ctx.fillStyle = COLORS.MONKEY;
    ctx.beginPath();
    ctx.ellipse(0, 0, monkey.current.radius + bob, monkey.current.radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(10, 0, monkey.current.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    if (staff.current?.isPickedUp) {
      ctx.save();
      const swingRot = isSwinging.current > 0 ? (isSwinging.current / 15) * Math.PI : 0;
      ctx.rotate(Math.PI / 4 + swingRot);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(5, -20, 3, 40);
      ctx.fillStyle = 'red';
      ctx.fillRect(4, -20, 5, 5);
      ctx.fillRect(4, 15, 5, 5);
      ctx.restore();
    }
    ctx.restore();

    tigers.current.forEach(tiger => {
      ctx.save();
      ctx.translate(tiger.x, tiger.y);
      ctx.rotate(tiger.angle);
      
      if (tiger.isStunned) {
        ctx.globalAlpha = 0.5 + Math.sin(animationFrame.current * 0.5) * 0.2;
        ctx.fillStyle = 'yellow';
        for(let i=0; i<3; i++) {
          const ang = (animationFrame.current * 0.1) + (i * Math.PI * 2 / 3);
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * 20, Math.sin(ang) * 10 - 20, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = COLORS.TIGER;
      ctx.beginPath();
      ctx.ellipse(0, 0, tiger.radius * 1.3, tiger.radius, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      for(let i=-1; i<=1; i++) {
          ctx.beginPath();
          ctx.moveTo(i*8, -tiger.radius); ctx.lineTo(i*8, tiger.radius);
          ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(tiger.radius, 0, tiger.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    trees.current.forEach(tree => drawTree(ctx, tree));
  };

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    update();
    draw(ctx);
    requestRef.current = requestAnimationFrame(loop);
  }, [status]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keys.current[e.key.toLowerCase()] = true;
    const handleKeyUp = (e: KeyboardEvent) => keys.current[e.key.toLowerCase()] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  return (
    <div className="relative w-full max-w-[800px] aspect-[4/3] mx-auto border-4 md:border-8 border-green-950 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl bg-emerald-950 touch-none">
      <canvas 
        ref={canvasRef} 
        width={GAME_WIDTH} 
        height={GAME_HEIGHT}
        className="w-full h-full block object-contain"
      />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>
    </div>
  );
};

export default GameCanvas;
