"use client";
import React, { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";

interface WavesProps {
  lineColor?: string;
  backgroundColor?: string;
  waveSpeedX?: number;
  waveSpeedY?: number;
  waveAmpX?: number;
  waveAmpY?: number;
  friction?: number;
  tension?: number;
  maxDistance?: number;
  className?: string;
  strokeColor?: string;
}

export const Waves: React.FC<WavesProps> = ({
  lineColor = "#ffffff",
  strokeColor = "#ffffff",
  backgroundColor = "#0a0a0a",
  waveSpeedX = 0.012,
  waveSpeedY = 0.005,
  waveAmpX = 32,
  waveAmpY = 16,
  friction = 0.92,
  tension = 0.005,
  maxDistance = 150,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({
    x: -1000,
    y: -1000,
    lx: -1000,
    ly: -1000,
    vx: 0,
    vy: 0,
  });

  const effectiveLineColor = strokeColor || lineColor;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const noise3D = createNoise3D();
    let animationFrameId: number;
    let time = 0;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      pointerRef.current.x = x;
      pointerRef.current.y = y;
    };

    const handlePointerLeave = () => {
      pointerRef.current.x = -1000;
      pointerRef.current.y = -1000;
    };

    container.addEventListener("mousemove", handlePointerMove);
    container.addEventListener("mouseleave", handlePointerLeave);
    container.addEventListener("touchmove", handlePointerMove);
    container.addEventListener("touchend", handlePointerLeave);

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      const pointer = pointerRef.current;
      pointer.vx += (pointer.x - pointer.lx) * tension;
      pointer.vy += (pointer.y - pointer.ly) * tension;
      pointer.vx *= friction;
      pointer.vy *= friction;
      pointer.lx += pointer.vx;
      pointer.ly += pointer.vy;

      const linesCount = Math.floor(height / 14);
      const stepX = 12;

      ctx.strokeStyle = effectiveLineColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;

      for (let i = 0; i <= linesCount; i++) {
        const yBase = (height / linesCount) * i;
        ctx.beginPath();

        for (let x = 0; x <= width + stepX; x += stepX) {
          const noiseVal = noise3D(
            x * 0.004 + time * waveSpeedX,
            yBase * 0.004 + time * waveSpeedY,
            time * 0.001
          );

          const dx = x - pointer.lx;
          const dy = yBase - pointer.ly;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let mouseFactor = 0;
          if (dist < maxDistance) {
            mouseFactor = Math.cos((dist / maxDistance) * (Math.PI / 2)) * 24;
          }

          const offsetY = isReducedMotion ? 0 : noiseVal * waveAmpY + mouseFactor;

          if (x === 0) {
            ctx.moveTo(x, yBase + offsetY);
          } else {
            ctx.lineTo(x, yBase + offsetY);
          }
        }
        ctx.stroke();
      }

      // Small pointer dot
      if (pointer.x > 0 && pointer.y > 0) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = effectiveLineColor;
        ctx.beginPath();
        ctx.arc(pointer.lx, pointer.ly, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!isReducedMotion) {
        time += 1;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      mediaQuery.removeEventListener("change", handleMotionChange);
      container.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("mouseleave", handlePointerLeave);
      container.removeEventListener("touchmove", handlePointerMove);
      container.removeEventListener("touchend", handlePointerLeave);
    };
  }, [backgroundColor, effectiveLineColor, waveSpeedX, waveSpeedY, waveAmpX, waveAmpY, friction, tension, maxDistance]);

  return (
    <div
      ref={containerRef}
      className={`wave-background-container ${className}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: backgroundColor,
        pointerEvents: "auto",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default Waves;
