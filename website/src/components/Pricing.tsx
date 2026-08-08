import { Eyebrow, Section } from "./ui";

export function Pricing() {
  return (
    <Section id="free">
      <Eyebrow>03 — The price</Eyebrow>
      <h2 className="font-disp mt-1.5 mb-0 text-[42px] font-normal tracking-[0.5px]">
        It&apos;s free. There&apos;s no catch.
      </h2>
      <p className="mt-2 mb-8 max-w-[62ch] text-muted">
        Kuro is MIT-licensed and open source. Install it on every machine you
        own, read every line, change whatever you like.
      </p>
      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
        <div className="border-2 border-pink bg-panel p-[26px] shadow-[6px_6px_0_var(--pinkdim)]">
          <div className="font-disp text-[58px] leading-none text-pink">
            $0<small className="text-[18px] text-muted"> / forever</small>
          </div>
          <ul className="mt-4 mb-0 list-none p-0">
            {[
              "Every feature, no tiers",
              "Recolor: tabby, tuxedo, calico, siamese",
              "All platforms · one download",
              "No account, no license key",
              "No telemetry — keystroke contents are never read",
              "Fork it, ship your own cat",
            ].map((item) => (
              <li
                key={item}
                className="relative py-1.5 pl-6 text-sm before:absolute before:left-0 before:text-green before:content-['✓']"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="border-2 border-line bg-panel p-[26px]">
          <div className="font-disp text-[58px] leading-none text-muted">
            what you give up
          </div>
          <ul className="mt-4 mb-0 list-none p-0">
            {[
              "A signed installer (unsigned builds warn on first launch)",
              "Someone else's support desk",
              "That's about it",
            ].map((item) => (
              <li
                key={item}
                className="relative py-1.5 pl-6 text-sm text-muted before:absolute before:left-0 before:text-muted before:content-['–']"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3.5 text-[13px] text-muted">
            Inspired by the lovely <b>Comnyang</b> — an independent, from-scratch
            build with no shared code or art.
          </p>
        </div>
      </div>
    </Section>
  );
}
