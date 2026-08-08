"use client";

import { useEffect, useRef, useState } from "react";
import { CatDraw, type CatState } from "@/lib/catdraw";
import { useCoat } from "@/lib/coat-context";
import { PRESETS } from "@/lib/presets";
import { Eyebrow, Section } from "./ui";

type CardDef = {
  n: string;
  t: string;
  d: string;
  pose?: CatState;
  anim?: string;
  trio?: boolean;
  clock?: boolean;
};

const CARDS: CardDef[] = [
  {
    n: "01",
    t: "Eye follow",
    d: "Its pupils track your cursor across the whole screen.",
    pose: { face: "open", gaze: { x: -1, y: -0.1 } },
    anim: "blink",
  },
  {
    n: "02",
    t: "Keyboard kneading",
    d: "Type and it kneads two little keycaps with its paws.",
    pose: { face: "open", gaze: { x: 0, y: 0.6 }, showKeys: true },
    anim: "knead",
  },
  {
    n: "03",
    t: "Overheat mode",
    d: "Type too fast and it flushes red, steam and all.",
    pose: { face: "open", showKeys: true, heat: 1 },
    anim: "knead",
  },
  {
    n: "04",
    t: "Mochi drag",
    d: "Grab it and it stretches like mochi; drop it and it wobbles.",
    pose: { face: "wide", growY: 1.5, growX: 0.72 },
    anim: "squish",
  },
  {
    n: "05",
    t: "Purring pets",
    d: "Stroke its head and it blushes, closes its eyes, purrs.",
    pose: { face: "closed", blush: true },
    anim: "tail",
  },
  {
    n: "06",
    t: "Mouse hunt",
    d: "Fling the cursor past and it pounces, wide-eyed.",
    pose: { face: "wide", gaze: { x: 0.6, y: 0 } },
    anim: "dart",
  },
  {
    n: "07",
    t: "Stretch breaks",
    d: "Every so often it grows big and stretches with you.",
    pose: { face: "closed", growY: 1.3 },
    anim: "stretch",
  },
  {
    n: "08",
    t: "Sleeps when idle",
    d: "Step away and it curls up. Move the mouse to wake it.",
    pose: { face: "sleep" },
    anim: "breathe",
  },
  {
    n: "09",
    t: "Agent hop",
    d: "When your coding agent finishes, it hops and meows.",
    pose: { face: "wide", hop: 0 },
    anim: "hop",
  },
  {
    n: "10",
    t: "Make it yours",
    d: "Recolor and re-pattern: tabby, tuxedo, calico, siamese.",
    trio: true,
  },
  {
    n: "11",
    t: "Pomodoro & reminders",
    d: "Focus/break loops, water nudges, a daily message it meows.",
    pose: { face: "open", gaze: { x: 0, y: 0.3 } },
    anim: "blink",
    clock: true,
  },
  {
    n: "12",
    t: "Out of the way",
    d: "Click-through overlay, always on top, no telemetry, no fuss.",
    pose: { face: "open", gaze: { x: 0.2, y: -0.2 } },
    anim: "blink",
  },
];

function drawStatic(
  cv: HTMLCanvasElement,
  card: CardDef,
  coat: ReturnType<typeof useCoat>["coat"],
  phase = 0,
) {
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, cv.width, cv.height);

  if (card.trio) {
    const pr = [PRESETS[1], PRESETS[2], PRESETS[3]];
    const third = cv.width / 3;
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(i * third, 0);
      CatDraw.draw(
        ctx,
        { W: third, H: cv.height },
        { face: "open", gaze: { x: 0, y: 0.2 }, scale: 0.4 },
        { ...pr[i].s, scale: 0.4 },
      );
      ctx.restore();
    }
    return;
  }

  const st: CatState = { scale: 0.55, ...card.pose };
  if (card.anim === "knead") {
    st.showKeys = true;
    st.pawPhase = phase * 0.35;
  }
  if (card.anim === "blink") {
    st.face = Math.floor(phase) % 40 === 0 ? "closed" : card.pose?.face || "open";
  }
  if (card.anim === "tail" || card.anim === "breathe") {
    st.tailSway = Math.sin(phase / 8) * 0.6;
  }
  if (card.anim === "hop") {
    st.hop = Math.abs(Math.sin(phase / 9)) * 18;
    st.face = "wide";
  }
  if (card.anim === "squish") {
    st.growY = 1.35 + Math.sin(phase / 6) * 0.14;
    st.growX = 0.78 - Math.sin(phase / 6) * 0.08;
  }
  if (card.anim === "stretch") {
    st.growY = 1.15 + Math.abs(Math.sin(phase / 14)) * 0.28;
    st.face = "closed";
  }
  if (card.anim === "dart") {
    st.gaze = { x: Math.sin(phase / 5), y: 0 };
  }

  CatDraw.draw(ctx, { W: cv.width, H: cv.height }, st, {
    ...coat,
    scale: st.scale || 0.55,
  });

  if (card.clock) {
    ctx.fillStyle = "#ffe9d6";
    ctx.strokeStyle = "#20242b";
    ctx.fillRect(cv.width - 58, cv.height - 40, 50, 20);
    ctx.strokeRect(cv.width - 58, cv.height - 40, 50, 20);
    ctx.fillStyle = "#20242b";
    ctx.font = "bold 12px monospace";
    ctx.fillText("● 24:59", cv.width - 53, cv.height - 25);
  }
}

function FeatureCard({ card }: { card: CardDef }) {
  const { coat } = useCoat();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    drawStatic(cv, card, coat, 0);
  }, [card, coat]);

  const stopAnim = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const cv = canvasRef.current;
    if (cv) drawStatic(cv, card, coat, 0);
  };

  const startAnim = () => {
    if (card.trio || rafRef.current != null) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const tick = () => {
      phaseRef.current += 1;
      const cv = canvasRef.current;
      if (cv) drawStatic(cv, card, coat, phaseRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => stopAnim(), []);

  return (
    <div
      ref={cardRef}
      onMouseEnter={startAnim}
      onMouseLeave={stopAnim}
      className={`overflow-hidden border-2 border-line bg-panel transition-[opacity,transform,border-color] duration-500 hover:-translate-y-1 hover:border-pink ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-3.5 opacity-0"
      }`}
    >
      <div className="relative flex h-[154px] items-end justify-center border-b-2 border-line bg-[radial-gradient(130px_64px_at_50%_122%,rgba(239,147,164,0.1),transparent_70%),var(--bg2)]">
        <span className="absolute top-2 left-2.5 z-3 font-pix text-[9px] text-pink">
          {card.n}
        </span>
        <span className="absolute top-2 right-2.5 z-[3] font-pix text-[7px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
          {card.trio ? "RECOLOR" : "HOVER ▸"}
        </span>
        <canvas
          ref={canvasRef}
          width={card.trio ? 280 : 180}
          height={154}
          className="relative z-[2]"
        />
      </div>
      <div className="px-4 pt-3.5 pb-[18px]">
        <h3 className="mb-1.5 text-[15px]">{card.t}</h3>
        <p className="m-0 text-[13.5px] leading-normal text-muted">{card.d}</p>
      </div>
    </div>
  );
}

export function Showcase() {
  return (
    <Section id="showcase">
      <div className="mb-1.5 flex flex-wrap items-baseline gap-3.5">
        <Eyebrow>01 — What it does</Eyebrow>
      </div>
      <h2 className="font-disp m-0 text-[42px] font-normal tracking-[0.5px]">
        Look what the cat can do.
      </h2>
      <p className="mt-2 mb-8 max-w-[62ch] text-muted">
        Every cat below is drawn by the exact code that ships in the app —
        nothing is a mock-up. Hover a card to bring it to life.
      </p>
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <div key={card.n} className="group">
            <FeatureCard card={card} />
          </div>
        ))}
      </div>
    </Section>
  );
}
