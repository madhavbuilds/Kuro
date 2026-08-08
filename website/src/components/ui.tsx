import type { ComponentProps, ReactNode } from "react";

export function Wrap({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-[1120px] px-6 ${className}`}>{children}</div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="font-pix text-[10px] uppercase tracking-[2px] text-pink">
      {children}
    </span>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 border-2 border-line bg-bg2 px-[11px] py-2 font-pix text-[9px] tracking-[1px] text-muted">
      {children}
    </span>
  );
}

const btnBase =
  "inline-flex items-center gap-2 border-2 border-black px-[18px] py-[15px] font-pix text-[11px] tracking-[1px] no-underline transition-[transform,box-shadow,background] duration-100 active:translate-x-[3px] active:translate-y-[3px]";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"a"> & { variant?: "primary" | "ghost" }) {
  const styles =
    variant === "primary"
      ? "bg-pink text-[#2a1116] shadow-[5px_5px_0_#000] hover:bg-pink2 active:shadow-[2px_2px_0_#000]"
      : "border-line2 bg-panel text-ink shadow-[5px_5px_0_rgba(0,0,0,0.45)] hover:border-pink";

  return <a className={`${btnBase} ${styles} ${className}`} {...props} />;
}

export function WindowChrome({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-2 border-line2 bg-gradient-to-b from-[#251f33] to-[#191424] shadow-[10px_10px_0_rgba(0,0,0,0.5)] ${className}`}
    >
      <div className="flex h-[34px] items-center gap-2 border-b-2 border-line bg-panel px-3">
        <span className="h-[11px] w-[11px] border-2 border-black bg-[#e8635f]" />
        <span className="h-[11px] w-[11px] border-2 border-black bg-amber" />
        <span className="h-[11px] w-[11px] border-2 border-black bg-[#79c98a]" />
        <span className="ml-2 text-[13px] text-muted">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function Term({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-2 border-line2 bg-[#0f0c15] shadow-[6px_6px_0_rgba(0,0,0,0.45)]">
      <div className="flex h-[30px] items-center gap-2 border-b-2 border-line bg-[#161020] px-3">
        <span className="h-[11px] w-[11px] border-2 border-black bg-[#e8635f]" />
        <span className="h-[11px] w-[11px] border-2 border-black bg-amber" />
        <span className="h-[11px] w-[11px] border-2 border-black bg-[#79c98a]" />
        <span className="ml-2 text-[13px] text-muted">{title}</span>
      </div>
      <div className="overflow-x-auto p-4 text-[13px] leading-[1.7]">
        {children}
      </div>
    </div>
  );
}

export function Section({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-t-2 border-line py-[66px]">
      <Wrap>{children}</Wrap>
    </section>
  );
}
