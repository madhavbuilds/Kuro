import {
  DOWNLOAD_MAC,
  DOWNLOAD_WIN,
  DOWNLOAD_WIN_PORTABLE,
  GITHUB_URL,
} from "@/lib/constants";
import { DownloadButton } from "./DownloadButton";
import { Button, Eyebrow, Pill, Section, Term } from "./ui";

export function Get() {
  return (
    <Section id="get">
      <Eyebrow>04 — Get the cat</Eyebrow>
      <div className="mt-1.5 grid items-center gap-[26px] max-md:grid-cols-1 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 className="font-disp m-0 text-[42px] font-normal tracking-[0.5px]">
            Grab an installer — or clone it.
          </h2>
          <p className="mt-2 mb-0 max-w-[62ch] text-muted">
            Direct downloads for Windows and macOS. Or grab the source, install
            once, run. Right-click the cat for settings; use the tray icon for
            Pomodoro and quit.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-[13px]">
            <DownloadButton label="DOWNLOAD" align="left" />
            <Button href={GITHUB_URL} variant="ghost" target="_blank" rel="noreferrer">
              SOURCE →
            </Button>
          </div>
          <div className="mt-[18px] flex flex-wrap gap-2.5">
            <a href={DOWNLOAD_WIN} className="no-underline hover:opacity-90">
              <Pill>⊞ WINDOWS</Pill>
            </a>
            <a href={DOWNLOAD_MAC} className="no-underline hover:opacity-90">
              <Pill> macOS</Pill>
            </a>
            <a
              href={DOWNLOAD_WIN_PORTABLE}
              className="no-underline hover:opacity-90"
            >
              <Pill>PORTABLE</Pill>
            </a>
          </div>
        </div>
        <Term title="bash">
          <pre className="m-0 font-[inherit]">
            <span className="text-[#6f6780]"># needs Node 18+</span>
            {"\n"}
            <span className="text-pink">$</span> git clone {GITHUB_URL}.git
            {"\n"}
            <span className="text-pink">$</span> cd Kuro
            {"\n"}
            <span className="text-pink">$</span> npm install
            {"\n"}
            <span className="text-pink">$</span> npm start{"        "}
            <span className="text-[#6f6780]"># the cat appears</span>
            {"\n\n"}
            <span className="text-[#6f6780]"># build installers</span>
            {"\n"}
            <span className="text-pink">$</span> npm run dist:win{"   "}
            <span className="text-[#6f6780]"># or :mac / :linux</span>
          </pre>
        </Term>
      </div>
    </Section>
  );
}
