"use client";

import React from "react";
import dynamic from "next/dynamic";
import { BrainCog, Section, SunMoon, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Mode = "ai" | "ce";

type HeroLandingProps = {
  name?: string;
  tagline?: string;
  intro?: string;
  defaultMode?: Mode;
  className?: string;
  onExploreAIMode?: () => void;
  onExploreCEMode?: () => void;
  onModeChange?: (mode: Mode) => void;
  splineUrl?: string; // optional Spline scene URL
};

// Dynamically import Spline (client-only)
const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false });

const AI_PALETTE: Record<string, string> = {
  "--primary": "#8b5cf6", // neon purple
  "--primary-foreground": "#0b0c10",
  "--ring": "#60a5fa", // neon blue ring
  "--accent": "#9b8cff",
  "--accent-foreground": "#0b0c10",
  "--chart-1": "#9c8cff",
  "--chart-2": "#38bdf8",
  "--chart-3": "#22c55e",
};

const CE_PALETTE: Record<string, string> = {
  "--primary": "#f59e0b", // earthy orange
  "--primary-foreground": "#0b0c10",
  "--ring": "#22c55e", // earthy green ring
  "--accent": "#65a30d",
  "--accent-foreground": "#0b0c10",
  "--chart-1": "#65a30d",
  "--chart-2": "#f59e0b",
  "--chart-3": "#15803d",
};

function applyPalette(mode: Mode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const palette = mode === "ai" ? AI_PALETTE : CE_PALETTE;
  Object.entries(palette).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute("data-mode", mode);
}

export default function HeroLanding({
  name = "Your Name",
  tagline = "AI & CE Enthusiast",
  intro = "Exploring the intersection of intelligent systems and real‑world infrastructure. I build data-driven solutions and resilient designs that shape the future.",
  defaultMode = "ai",
  className,
  onExploreAIMode,
  onExploreCEMode,
  onModeChange,
  splineUrl,
}: HeroLandingProps) {
  const [mode, setMode] = React.useState<Mode>(defaultMode);
  const [tilt, setTilt] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const tiltRef = React.useRef<HTMLDivElement>(null);

  // Apply mode palette on mount and when mode changes
  React.useEffect(() => {
    // read persisted preference first (if any)
    if (typeof window !== "undefined") {
      const persisted = window.localStorage.getItem("site-mode") as Mode | null;
      if (persisted && (persisted === "ai" || persisted === "ce")) {
        setMode(persisted);
        applyPalette(persisted);
        return;
      }
    }
    applyPalette(mode);
  }, []);

  React.useEffect(() => {
    applyPalette(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("site-mode", mode);
    }
  }, [mode]);

  const handleToggle = (checked: boolean) => {
    const next: Mode = checked ? "ai" : "ce";
    setMode(next);
    onModeChange?.(next);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = tiltRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const rx = (0.5 - py) * 10; // rotateX
    const ry = (px - 0.5) * 14; // rotateY
    setTilt({ x: rx, y: ry });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <section
      aria-label="Hero"
      className={[
        "relative w-full min-h-[100svh] bg-background text-foreground overflow-hidden",
        "flex flex-col items-center justify-center",
        "isolate",
        className || "",
      ].join(" ")}
    >
      {/* 3D Spline background (optional) */}
      {splineUrl ? (
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <Spline scene={splineUrl} className="h-full w-full" />
        </div>
      ) : null}

      {/* Background layers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 70%)",
          }}
        />
        {/* Animated aurora/gradient glow that adapts with mode */}
        <div className="absolute -top-24 left-1/2 h-[60vh] w-[60vw] -translate-x-1/2 rounded-full blur-3xl opacity-40">
          <div
            className="h-full w-full animate-pulse rounded-full"
            style={{
              background:
                mode === "ai"
                  ? "radial-gradient(closest-side, rgba(139,92,246,0.5), rgba(56,189,248,0.25), transparent)"
                  : "radial-gradient(closest-side, rgba(245,158,11,0.5), rgba(34,197,94,0.25), transparent)",
            }}
          />
        </div>
        {/* Subtle diagonal sheen */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.04) 100%)",
          }}
        />
      </div>

      {/* Top-right mode switch */}
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <div className="flex items-center gap-2 rounded-full bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60 border px-3 py-2">
          <SunMoon
            aria-hidden="true"
            className="h-4 w-4 text-muted-foreground"
          />
          <span className="text-xs sm:text-sm text-muted-foreground select-none">
            Mode
          </span>
          <div className="flex items-center gap-2">
            <span
              className={[
                "text-[11px] sm:text-xs",
                mode === "ai" ? "text-muted-foreground/60" : "text-foreground",
              ].join(" ")}
            >
              CE
            </span>
            <Switch
              aria-label="Toggle site mode"
              checked={mode === "ai"}
              onCheckedChange={handleToggle}
              className=""
            />
            <span
              className={[
                "text-[11px] sm:text-xs",
                mode === "ai" ? "text-foreground" : "text-muted-foreground/60",
              ].join(" ")}
            >
              AI
            </span>
          </div>
        </div>
      </div>

      {/* 3D Tilt Wrapper */}
      <div
        className="w-full px-4"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="mx-auto max-w-4xl [perspective:1200px]">
          <div
            ref={tiltRef}
            className="will-change-transform transition-transform duration-150 ease-out"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Content */}
            <div className="container mx-auto flex w-full max-w-4xl flex-col items-center text-center px-4">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-card/60" style={{ transform: "translateZ(30px)" }}>
                <span className="inline-flex h-2 w-2 rounded-full bg-[var(--ring)] animate-pulse" />
                <span className="text-xs font-medium tracking-wide text-muted-foreground">
                  {tagline}
                </span>
              </div>

              <h1 className="mt-6 text-3xl leading-tight sm:text-4xl md:text-5xl lg:text-6xl font-heading" style={{ transform: "translateZ(45px)" }}>
                {name}
              </h1>

              <p className="mt-4 max-w-2xl text-balance text-sm sm:text-base md:text-lg text-muted-foreground" style={{ transform: "translateZ(20px)" }}>
                {intro}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3" style={{ transform: "translateZ(15px)" }}>
                <Button
                  aria-label="Explore AI Mode"
                  className={[
                    "group relative",
                    "bg-[var(--primary)] text-[var(--primary-foreground)]",
                    "hover:opacity-95",
                    "transition-all duration-200",
                    "shadow-[0_0_0_0_rgba(0,0,0,0)] hover:shadow-[0_8px_30px_rgba(107,110,249,0.25)]",
                    "border-0",
                  ].join(" ")}
                  onClick={() => {
                    setMode("ai");
                    onModeChange?.("ai");
                    onExploreAIMode?.();
                  }}
                >
                  <span className="pointer-events-none absolute -inset-px rounded-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        mode === "ai"
                          ? "linear-gradient(90deg, rgba(139,92,246,0.35), rgba(56,189,248,0.25))"
                          : "linear-gradient(90deg, rgba(245,158,11,0.35), rgba(34,197,94,0.25))",
                    }}
                  />
                  <span className="relative inline-flex items-center gap-2">
                    <BrainCog className="h-4 w-4" aria-hidden="true" />
                    <span>Explore AI Mode</span>
                  </span>
                </Button>

                <Button
                  aria-label="Explore CE Mode"
                  variant="secondary"
                  className={[
                    "group relative border border-[color:var(--border)]",
                    "bg-secondary text-secondary-foreground",
                    "hover:bg-secondary/80",
                    "transition-all duration-200",
                  ].join(" ")}
                  onClick={() => {
                    setMode("ce");
                    onModeChange?.("ce");
                    onExploreCEMode?.();
                  }}
                >
                  <Section className="h-4 w-4 mr-2" aria-hidden="true" />
                  Explore CE Mode
                </Button>

                <Button
                  aria-label="Watch intro"
                  variant="ghost"
                  className="text-foreground/80 hover:text-foreground"
                >
                  <MonitorPlay className="h-4 w-4 mr-2" aria-hidden={true} />
                  Watch intro
                </Button>
              </div>

              {/* Micro copy */}
              <div className="mt-6 text-xs text-muted-foreground" style={{ transform: "translateZ(10px)" }}>
                Toggle modes to see the palette adapt in real time.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom subtle separator glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 opacity-50"
        style={{
          background:
            mode === "ai"
              ? "linear-gradient(to top, rgba(107,110,249,0.25), transparent)"
              : "linear-gradient(to top, rgba(34,197,94,0.25), transparent)",
        }}
      />
    </section>
  );
}