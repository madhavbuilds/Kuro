"use client";

import { useEffect, useRef, useState } from "react";
import { CatDraw, type CatState } from "@/lib/catdraw";
import { useCoat } from "@/lib/coat-context";
import { PRESETS } from "@/lib/presets";
import { DOWNLOAD_MAC, DOWNLOAD_WIN } from "@/lib/constants";
import { DownloadButton } from "./DownloadButton";
import { Button, Eyebrow, WindowChrome, Wrap } from "./ui";

type Particle = {
  kind: "heart" | "steam" | "zzz" | "spark";
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
};

const SCENES = [
  { id: "follow", dur: 3000, cap: "follows your cursor" },
  { id: "knead", dur: 2800, cap: "kneads when you type" },
  { id: "heat", dur: 2400, cap: "don't type too fast!" },
  { id: "pet", dur: 2400, cap: "a happy little cat" },
  { id: "sleep", dur: 2600, cap: "sleeps when idle" },
  { id: "agent", dur: 2400, cap: "your agent's done!" },
] as const;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Hero() {
  const { coat, presetId, setPresetId } = useCoat();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const coatRef = useRef(coat);
  const [cap, setCap] = useState<string>(SCENES[0].cap);
  const [capKey, setCapKey] = useState(0);

  useEffect(() => {
    coatRef.current = coat;
  }, [coat]);

  useEffect(() => {
    const cv = canvasRef.current;
    const stage = stageRef.current;
    if (!cv || !stage) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const W = cv.width;
    const H = cv.height;

    if (prefersReducedMotion()) {
      CatDraw.draw(
        ctx,
        { W, H },
        {
          face: "open",
          gaze: { x: 0, y: 0.2 },
          scale: 1,
          pattern: coatRef.current.pattern,
        },
        { ...coatRef.current, scale: 1 },
      );
      return;
    }

    let si = 0;
    let sceneStart = performance.now();
    let mouse = { x: -999, y: -999 };
    let lastUserMove = 0;
    let lastKey = 0;
    let knead = 0;
    let hop = 0;
    let blinkUntil = 0;
    let nextBlink = performance.now() + 2000;
    let gaze = { x: 0, y: 0.2 };
    let tGaze = { x: 0, y: 0.2 };
    const parts: Particle[] = [];
    let audio: AudioContext | null = null;
    let raf = 0;

    const bumpCap = (t: string) => {
      setCap(t);
      setCapKey((k) => k + 1);
    };

    const spawn = (kind: Particle["kind"], x: number, y: number) => {
      parts.push({
        kind,
        x,
        y,
        vx: (Math.random() - 0.5) * 14,
        vy: -20 - Math.random() * 16,
        life: 1,
      });
    };

    const drawParts = (dt: number) => {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 0.6;
        if (p.kind === "steam") {
          p.vx = Math.sin(p.y / 8) * 16;
          p.vy = -30;
        }
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.font = "14px monospace";
        const glyph = { heart: "♥", steam: "〜", zzz: "z", spark: "✦" }[
          p.kind
        ];
        ctx.fillStyle = {
          heart: "#e8607a",
          steam: "#b9c4cc",
          zzz: "#7d8aa0",
          spark: "#f2c14e",
        }[p.kind];
        ctx.fillText(glyph, p.x, p.y);
        ctx.globalAlpha = 1;
      }
    };

    const meow = () => {
      try {
        audio =
          audio ||
          new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)();
        const t = audio.currentTime;
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(620, t);
        o.frequency.exponentialRampToValueAtTime(880, t + 0.12);
        o.frequency.exponentialRampToValueAtTime(430, t + 0.4);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        o.connect(g).connect(audio.destination);
        o.start(t);
        o.stop(t + 0.5);
      } catch {
        /* ignore */
      }
    };

    const onMove = (e: MouseEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
      lastUserMove = performance.now();
    };
    const onKey = () => {
      lastKey = performance.now();
      if (SCENES[si].id !== "heat") {
        si = 1;
        sceneStart = performance.now();
        bumpCap(SCENES[1].cap);
      }
    };
    const onClick = () => {
      hop = 24;
      meow();
      for (let i = 0; i < 6; i++) {
        spawn("spark", W / 2 + (Math.random() - 0.5) * 80, 120);
      }
    };

    stage.addEventListener("mousemove", onMove);
    document.addEventListener("keydown", onKey);
    stage.addEventListener("click", onClick);

    const loop = (now: number) => {
      let sc = SCENES[si];
      if (now - sceneStart > sc.dur) {
        si = (si + 1) % SCENES.length;
        sceneStart = now;
        bumpCap(SCENES[si].cap);
        if (SCENES[si].id === "agent") {
          hop = 22;
          for (let i = 0; i < 6; i++) {
            spawn("spark", W / 2 + (Math.random() - 0.5) * 80, 120);
          }
        }
      }
      sc = SCENES[si];
      const tSec = (now - sceneStart) / 1000;
      const userActive = now - lastUserMove < 1600;

      if (userActive) {
        const r = cv.getBoundingClientRect();
        const dx = mouse.x - (r.left + r.width / 2);
        const dy = mouse.y - (r.top + r.height * 0.42);
        const d = Math.hypot(dx, dy) || 1;
        tGaze = {
          x: dx / d,
          y: Math.max(-0.6, Math.min(1, dy / d)),
        };
      } else {
        tGaze = { x: Math.sin(now / 900) * 0.9, y: 0.12 };
      }
      gaze = {
        x: gaze.x + (tGaze.x - gaze.x) * 0.18,
        y: gaze.y + (tGaze.y - gaze.y) * 0.18,
      };

      if (now > nextBlink) {
        blinkUntil = now + 120;
        nextBlink = now + 1800 + Math.random() * 3000;
      }
      hop = Math.max(0, hop - 1.6);

      const current = coatRef.current;
      const st: CatState = {
        scale: 1,
        pattern: current.pattern,
        gaze,
        tailSway: Math.sin(now / 520) * 0.5,
        hop,
      };

      const typing = now - lastKey < 900;
      let id: string = sc.id;
      if (userActive && id === "sleep") id = "follow";

      if (id === "follow") {
        st.face = now < blinkUntil ? "closed" : "open";
      } else if (id === "knead" || typing) {
        knead += 0.35;
        st.showKeys = true;
        st.pawPhase = knead;
        st.gaze = { x: 0, y: 0.6 };
        st.face = now < blinkUntil ? "closed" : "open";
      } else if (id === "heat") {
        knead += 0.5;
        st.showKeys = true;
        st.pawPhase = knead;
        st.heat = Math.min(1, tSec / 1.2);
        st.blush = (st.heat ?? 0) > 0.4;
        st.gaze = { x: 0, y: 0.6 };
        if (Math.random() < 0.3) {
          spawn("steam", W / 2 + (Math.random() - 0.5) * 70, 120);
        }
      } else if (id === "pet") {
        st.face = "closed";
        st.blush = true;
        if (Math.random() < 0.14) {
          spawn("heart", W / 2 + (Math.random() - 0.5) * 50, 140);
        }
      } else if (id === "sleep") {
        st.face = "sleep";
        if (Math.random() < 0.03) spawn("zzz", W * 0.66, 120);
      } else if (id === "agent") {
        st.face = "wide";
        st.gaze = { x: 0, y: -0.1 };
      }

      ctx.clearRect(0, 0, W, H);
      CatDraw.draw(ctx, { W, H }, st, { ...current, scale: 1 });
      drawParts(1 / 60);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("mousemove", onMove);
      document.removeEventListener("keydown", onKey);
      stage.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <header>
      <Wrap className="grid items-center gap-11 py-[46px] pt-16 max-md:grid-cols-1 max-md:pt-10 md:grid-cols-[1.02fr_0.98fr]">
        <div>
          <Eyebrow>Free · Open source · MIT</Eyebrow>
          <div className="my-3.5 mb-1.5 font-pix text-[60px] leading-none tracking-[2px] max-md:text-[48px]">
            KUR<span className="text-pink">O</span>
          </div>
          <h1 className="font-disp my-1.5 mb-4 text-[40px] font-normal leading-none tracking-[0.5px] text-ink">
            a pixel cat that lives in your computer.
          </h1>
          <p className="mb-6 max-w-[46ch] text-base text-muted">
            It follows your cursor, kneads the keyboard when you type, hops when
            your coding agent finishes, and nudges you to stretch. No account.
            No license key. No telemetry.
          </p>
          <div className="flex flex-wrap items-center gap-[13px]">
            <DownloadButton label="ADOPT IT — FREE" align="left" />
            <Button href="#showcase" variant="ghost">
              SEE IT MOVE ↓
            </Button>
          </div>
          <p className="mt-4 text-[13px] text-muted">
            Runs on <b className="text-ink">macOS</b>,{" "}
            <b className="text-ink">Windows</b> &amp;{" "}
            <b className="text-ink">Linux</b>. Recolor it however you like →
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-muted">
            <a className="underline hover:text-pink" href={DOWNLOAD_MAC}>
              Download for macOS
            </a>
            <span>·</span>
            <a className="underline hover:text-pink" href={DOWNLOAD_WIN}>
              Download for Windows
            </a>
          </div>
        </div>

        <div>
          <WindowChrome title="~/desktop — kuro">
            <div
              ref={stageRef}
              className="relative flex h-[392px] cursor-pointer items-end justify-center overflow-hidden bg-[linear-gradient(180deg,rgba(239,147,164,0.06),transparent_42%),repeating-linear-gradient(0deg,rgba(255,255,255,0.02)_0_1px,transparent_1px_22px),repeating-linear-gradient(90deg,rgba(255,255,255,0.02)_0_1px,transparent_1px_22px)]"
            >
              <div
                key={capKey}
                className="cap-arrow animate-cap-pop absolute top-5 left-1/2 z-[4] -translate-x-1/2 whitespace-nowrap border-2 border-[#20242b] bg-[#fffdf5] px-3 py-[7px] text-[13px] text-[#20242b] shadow-[3px_3px_0_rgba(0,0,0,0.3)]"
              >
                {cap}
              </div>
              <div className="absolute bottom-6 z-[1] h-4 w-40 bg-[radial-gradient(ellipse,rgba(0,0,0,0.55),transparent_70%)]" />
              <canvas
                ref={canvasRef}
                width={300}
                height={360}
                className="relative z-[2]"
              />
            </div>
            <div className="flex items-center gap-2.5 border-t-2 border-line bg-bg2 px-3.5 py-3">
              <span className="mr-0.5 font-pix text-[9px] text-muted">
                ADOPT:
              </span>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={p.name}
                  aria-label={p.name}
                  onClick={() => setPresetId(p.id)}
                  className={`relative h-[30px] w-[30px] cursor-pointer border-2 p-0 ${
                    presetId === p.id
                      ? "border-pink shadow-[0_0_0_2px_var(--pinkdim)]"
                      : "border-line2 hover:border-pink"
                  }`}
                  style={{ background: p.s.baseColor }}
                />
              ))}
            </div>
          </WindowChrome>
          <p className="mt-4 text-center text-[13px] text-muted">
            ↑ it&apos;s live — move your mouse, type, or click the cat
          </p>
        </div>
      </Wrap>
    </header>
  );
}
