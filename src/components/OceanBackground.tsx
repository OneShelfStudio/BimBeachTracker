"use client";

import { useEffect, useRef } from "react";

interface WaterMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  tone: "cyan" | "teal" | "sky";
}

interface RippleWave {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

/**
 * Interactive liquid oceanic canvas backdrop with layered translucent currents,
 * gentle bioluminescent motes, and subtle ripple response to pointer motion.
 */
export default function OceanBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const pointer = {
      x: -1000,
      y: -1000,
      active: false,
      lastRippleAt: 0,
    };

    const ripples: RippleWave[] = [];

    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();

    const spawnRipple = (x: number, y: number) => {
      const now = performance.now();
      if (now - pointer.lastRippleAt < 110) return;
      pointer.lastRippleAt = now;
      ripples.push({ x, y, radius: 10, alpha: 0.24 });
      if (ripples.length > 8) ripples.shift();
    };

    const handleMouseMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      spawnRipple(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        pointer.x = e.touches[0].clientX;
        pointer.y = e.touches[0].clientY;
        pointer.active = true;
        spawnRipple(pointer.x, pointer.y);
      }
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    window.addEventListener("resize", setSize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("mouseout", handlePointerLeave, { passive: true });
    window.addEventListener("touchend", handlePointerLeave, { passive: true });

    const moteCount = Math.min(Math.max(Math.floor(width / 18), 55), 90);
    const motes: WaterMote[] = Array.from({ length: moteCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: -(Math.random() * 0.28 + 0.12),
      vy: (Math.random() - 0.5) * 0.16,
      radius: Math.random() * 2 + 0.9,
      phase: Math.random() * Math.PI * 2,
      tone: i % 3 === 0 ? "teal" : i % 2 === 0 ? "cyan" : "sky",
    }));

    const waveLayers = [
      {
        amplitude: 28,
        wavelength: 0.0038,
        speed: 0.0007,
        baseRatio: 0.18,
        fill: "rgba(6, 182, 212, 0.07)",
        stroke: "rgba(34, 211, 238, 0.14)",
      },
      {
        amplitude: 34,
        wavelength: 0.0029,
        speed: -0.00055,
        baseRatio: 0.34,
        fill: "rgba(14, 165, 233, 0.06)",
        stroke: "rgba(56, 189, 248, 0.12)",
      },
      {
        amplitude: 24,
        wavelength: 0.0046,
        speed: 0.00085,
        baseRatio: 0.52,
        fill: "rgba(16, 185, 129, 0.05)",
        stroke: "rgba(45, 212, 191, 0.1)",
      },
      {
        amplitude: 38,
        wavelength: 0.0024,
        speed: -0.00045,
        baseRatio: 0.7,
        fill: "rgba(56, 189, 248, 0.06)",
        stroke: "rgba(14, 165, 233, 0.11)",
      },
      {
        amplitude: 30,
        wavelength: 0.0035,
        speed: 0.0006,
        baseRatio: 0.86,
        fill: "rgba(6, 182, 212, 0.055)",
        stroke: "rgba(34, 211, 238, 0.09)",
      },
    ];

    const draw = (time: number) => {
      // Base deep Caribbean gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#020913");
      bgGrad.addColorStop(0.45, "#041527");
      bgGrad.addColorStop(1, "#030d18");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle overhead sunlit lagoon caustic glow
      const radialGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.05,
        20,
        width * 0.5,
        height * 0.08,
        Math.max(width, height) * 0.65
      );
      radialGlow.addColorStop(0, "rgba(34, 211, 238, 0.14)");
      radialGlow.addColorStop(0.5, "rgba(14, 116, 144, 0.06)");
      radialGlow.addColorStop(1, "rgba(3, 13, 24, 0)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // Draw layered flowing ocean current ribbons
      const stepX = Math.max(24, Math.floor(width / 36));
      for (let wIdx = 0; wIdx < waveLayers.length; wIdx++) {
        const layer = waveLayers[wIdx];
        const baseY = height * layer.baseRatio;

        ctx.beginPath();
        for (let x = 0; x <= width + stepX; x += stepX) {
          let pointerOffset = 0;
          if (pointer.active) {
            const dx = x - pointer.x;
            const dy = baseY - pointer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 220) {
              pointerOffset = Math.cos((dist / 220) * Math.PI) * 14;
            }
          }
          const y =
            baseY +
            Math.sin(x * layer.wavelength + time * layer.speed + wIdx * 1.4) * layer.amplitude +
            Math.cos(x * (layer.wavelength * 0.55) - time * layer.speed * 0.7) * (layer.amplitude * 0.4) +
            pointerOffset;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = layer.fill;
        ctx.fill();
      }

      // Expanding caustic pointer ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 1.65;
        r.alpha *= 0.965;
        if (r.alpha < 0.01 || r.radius > 170) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 211, 238, ${r.alpha.toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }

      // Drifting sea-foam & bioluminescent motes
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.phase += 0.022;
        m.x += m.vx + Math.sin(m.phase * 0.7) * 0.08;
        m.y += m.vy + Math.cos(m.phase) * 0.14;

        if (pointer.active) {
          const dx = m.x - pointer.x;
          const dy = m.y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160 && dist > 6) {
            const swirl = (1 - dist / 160) * 0.45;
            // Gentle tangential swirl + outward shimmer
            m.x += (-dy / dist) * swirl + (dx / dist) * (swirl * 0.25);
            m.y += (dx / dist) * swirl + (dy / dist) * (swirl * 0.25);
          }
        }

        if (m.x < -10) m.x = width + 10;
        if (m.x > width + 10) m.x = -10;
        if (m.y < -10) m.y = height + 10;
        if (m.y > height + 10) m.y = -10;

        const twinkle = 0.35 + (Math.sin(m.phase) + 1) * 0.25;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fillStyle =
          m.tone === "teal"
            ? `rgba(45, 212, 191, ${twinkle.toFixed(2)})`
            : m.tone === "cyan"
            ? `rgba(34, 211, 238, ${twinkle.toFixed(2)})`
            : `rgba(125, 211, 252, ${twinkle.toFixed(2)})`;
        ctx.fill();
      }

      animationFrameId = window.requestAnimationFrame(draw);
    };

    animationFrameId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", setSize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseout", handlePointerLeave);
      window.removeEventListener("touchend", handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
