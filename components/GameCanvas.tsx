
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
  COLORS 
} from '../constants';
import { Entity, Banana, Tree, Position } from '../types';

interface GameCanvasProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: () => void;
  status: string;
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

const GameCanvas: React.FC<GameCanvasProps> = ({ onScoreUpdate, onGameOver, status }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const animationFrame = useRef(0);
  
  const monkey = useRef<Entity>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    radius: MONKEY_RADIUS,
    speed: MONKEY_SPEED,
    angle: 0
  });

  const tigers = useRef<Entity[]>([]);
  const lastTigerScore = useRef(0);

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
    const corners = [
      { x: 50, y: 50 },
      { x: GAME_WIDTH - 50, y: 50 },
      { x: 50, y: GAME_HEIGHT - 50 },
      { x: GAME_WIDTH - 50, y: GAME_HEIGHT - 50 }
    ];
    const corner = corners[Math.floor(Math.random() * corners.length)];
    
    // Variamos ligeramente la velocidad para evitar que se amontonen perfectamente
    const speedVariation = 0.8 + Math.random() * 0.4; // entre 80% y 120% de la velocidad base
    
    tigers.current.push({
      x: corner.x,
      y: corner.y,
      radius: TIGER_RADIUS,
      speed: TIGER_SPEED * speedVariation,
      angle: 0
    });
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
    onScoreUpdate(0);
    monkey.current = {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      radius: MONKEY_RADIUS,
      speed: MONKEY_SPEED,
      angle: 0
    };
    
    // Inicializar con UN SOLO tigre al principio
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
    if (status === 'PLAYING') {
      initGame();
    }
  }, [status, initGame]);

  const update = () => {
    if (status !== 'PLAYING') return;
    animationFrame.current++;

    let dx = 0;
    let dy = 0;
    const k = keys.current;
    
    // Movimiento RESTRINGIDO a WASD únicamente
    if (k['w'] || k['W']) dy -= 1;
    if (k['s'] || k['S']) dy += 1;
    if (k['a'] || k['A']) dx -= 1;
    if (k['d'] || k['D']) dx += 1;

    isMoving.current = dx !== 0 || dy !== 0;

    if (dx !== 0 || dy !== 0) {
      const mag = Math.sqrt(dx * dx + dy * dy);
      monkey.current.x += (dx / mag) * monkey.current.speed;
      monkey.current.y += (dy / mag) * monkey.current.speed;
      monkey.current.angle = Math.atan2(dy, dx);
    }

    monkey.current.x = Math.max(monkey.current.radius, Math.min(GAME_WIDTH - monkey.current.radius, monkey.current.x));
    monkey.current.y = Math.max(monkey.current.radius, Math.min(GAME_HEIGHT - monkey.current.radius, monkey.current.y));

    // IA Tigres
    tigers.current.forEach(tiger => {
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

    // Colisión entre tigres para evitar que se solapen
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

    // Recolección de Bananas
    bananas.current = bananas.current.filter(banana => {
      const bdx = monkey.current.x - banana.x;
      const bdy = monkey.current.y - banana.y;
      const dist = Math.sqrt(bdx * bdx + bdy * bdy);
      if (dist < monkey.current.radius + BANANA_RADIUS + 8) {
        score.current += 1;
        onScoreUpdate(score.current);
        
        // Mecánica de nuevo tigre cada 30 bananas
        if (score.current > 0 && score.current % 30 === 0 && score.current !== lastTigerScore.current) {
          spawnTiger();
          lastTigerScore.current = score.current;
        }
        
        return false;
      }
      return true;
    });

    while (bananas.current.length < 8) {
      spawnBanana();
    }

    // Colisión con Árboles
    trees.current.forEach(tree => {
      const entities = [monkey.current, ...tigers.current];
      entities.forEach(ent => {
        const edx = ent.x - tree.x;
        const edy = ent.y - tree.y;
        const dist = Math.sqrt(edx * edx + edy * edy);
        if (dist < ent.radius + tree.radius * 0.45) {
          const overlap = (ent.radius + tree.radius * 0.45) - dist;
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

    const bob = (isMoving.current && animationFrame.current % 20 < 10) ? 3 : 0;

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
    ctx.restore();

    tigers.current.forEach(tiger => {
      ctx.save();
      ctx.translate(tiger.x, tiger.y);
      ctx.rotate(tiger.angle);
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
