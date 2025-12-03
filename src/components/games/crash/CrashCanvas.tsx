import { useEffect, useRef } from 'react';

interface CrashCanvasProps {
  gameState: 'idle' | 'starting' | 'running' | 'crashed';
  multiplier: number;
  timeElapsed: number;
}

export default function CrashCanvas({ gameState, multiplier, timeElapsed }: CrashCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High DPI Displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const draw = () => {
      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // --- Grid & Axes ---
      ctx.strokeStyle = '#2f4553';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      // Horizontal Lines
      for (let i = 1; i <= 5; i++) {
        const y = height - (height / 5) * i;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        
        // Labels
        ctx.fillStyle = '#b1bad3';
        ctx.font = '10px Manrope';
        ctx.fillText(`${(i * 2)}x`, 10, y - 5);
      }
      
      // Vertical Lines
      for (let i = 1; i <= 5; i++) {
        const x = (width / 5) * i;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        
        // Labels
        ctx.fillText(`${(i * 2)}s`, x + 5, height - 10);
      }
      ctx.stroke();

      // --- The Rocket Curve ---
      if (gameState === 'running' || gameState === 'crashed') {
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = gameState === 'crashed' ? '#ef4444' : '#ffffff'; // White line normally, Red on crash
        ctx.lineCap = 'round';

        // Calculate curve points
        // We map time (x) and multiplier (y) to canvas coordinates
        // This is a simplified visual representation
        const maxTime = Math.max(10000, timeElapsed * 1.2); // Dynamic scale
        const maxMult = Math.max(2, multiplier * 1.2);

        ctx.moveTo(0, height);

        // Draw curve segments
        const steps = 50;
        for (let i = 0; i <= steps; i++) {
          const t = (timeElapsed / steps) * i;
          // Growth function: M = E^(k*t)
          // Inverse for Y coord
          const m = Math.pow(Math.E, 0.00006 * t); 
          
          const x = (t / maxTime) * width;
          const y = height - ((m - 1) / (maxMult - 1)) * height;
          
          ctx.lineTo(x, y);
        }
        ctx.stroke();

        // --- Rocket / Dot ---
        const currentX = (timeElapsed / maxTime) * width;
        const currentY = height - ((multiplier - 1) / (maxMult - 1)) * height;

        ctx.beginPath();
        ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
        ctx.fillStyle = gameState === 'crashed' ? '#ef4444' : '#F7D979';
        ctx.fill();
        
        // Glow effect
        if (gameState === 'running') {
          ctx.shadowColor = '#F7D979';
          ctx.shadowBlur = 15;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // --- Loading / Starting State ---
      if (gameState === 'starting') {
        ctx.fillStyle = '#b1bad3';
        ctx.font = 'bold 14px Manrope';
        ctx.textAlign = 'center';
        ctx.fillText("Preparing Engines...", width / 2, height / 2 + 40);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, multiplier, timeElapsed]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
