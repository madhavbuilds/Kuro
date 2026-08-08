const BITS = [
  "FREE",
  "OPEN SOURCE",
  "MIT",
  "NO TELEMETRY",
  "NO LICENSE KEY",
  "ADOPT FREELY",
  "macOS · WINDOWS · LINUX",
  "PIXEL PURRS",
];

export function Ticker() {
  const line = BITS.map((b) => `◆ ${b}`).join("   ");
  const doubled = `${line}   ${line}`;

  return (
    <div className="overflow-hidden whitespace-nowrap border-b-2 border-line bg-bg2">
      <div className="animate-marquee inline-block py-[9px] font-pix text-[9px] tracking-[2px] text-muted">
        {doubled.split("◆").map((chunk, i) =>
          i === 0 ? (
            <span key={i}>{chunk}</span>
          ) : (
            <span key={i}>
              <b className="text-pink">◆</b>
              {chunk}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
