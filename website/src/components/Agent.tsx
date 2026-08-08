import { Eyebrow, Section, Term } from "./ui";

export function Agent() {
  return (
    <Section id="agent">
      <Eyebrow>02 — Works while you build</Eyebrow>
      <div className="mt-1.5 grid items-center gap-[26px] max-md:grid-cols-1 md:grid-cols-2">
        <div>
          <h2 className="font-disp m-0 text-[42px] font-normal tracking-[0.5px]">
            It reacts to your AI agent.
          </h2>
          <p className="mt-2 mb-0 max-w-[62ch] text-muted">
            Kuro listens on a tiny local port. Point any tool at it with one
            line: the cat puts on a thinking face while your agent works, then
            hops and meows when it&apos;s done. Nothing leaves your machine.
          </p>
          <div className="mt-[18px] flex flex-wrap gap-2">
            {["CLAUDE CODE", "CODEX CLI", "CURSOR", "ANY SHELL HOOK"].map(
              (chip) => (
                <span
                  key={chip}
                  className="border-2 border-line bg-bg2 px-2.5 py-2 font-pix text-[9px] tracking-[1px] text-muted"
                >
                  {chip}
                </span>
              ),
            )}
          </div>
        </div>
        <Term title="~/.claude/settings.json">
          <pre className="m-0 font-[inherit]">
            <span className="text-[#6f6780]">
              # happy hop when a task finishes
            </span>
            {"\n"}
            <span className="text-pink">curl</span> -X POST{" "}
            <span className="text-key">http://127.0.0.1:41999/agent</span> \
            {"\n"}
            {"     "}-d <span className="text-green">{`'{"state":"done"}'`}</span>
            {"\n\n"}
            <span className="text-[#6f6780]">
              # ...thinking face while it works
            </span>
            {"\n"}
            <span className="text-pink">curl</span> -X POST{" "}
            <span className="text-key">http://127.0.0.1:41999/agent</span> \
            {"\n"}
            {"     "}-d{" "}
            <span className="text-green">{`'{"state":"thinking"}'`}</span>
          </pre>
        </Term>
      </div>
    </Section>
  );
}
