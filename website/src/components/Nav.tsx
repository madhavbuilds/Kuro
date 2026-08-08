import { BrandMark } from "./BrandMark";
import { DownloadButton } from "./DownloadButton";
import { Wrap } from "./ui";
import { GITHUB_URL } from "@/lib/constants";

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b-2 border-line bg-[rgba(19,16,25,0.82)] backdrop-blur-[9px]">
      <Wrap className="flex h-[66px] items-center justify-between">
        <div className="flex items-center gap-2.5 font-pix text-[14px] tracking-[2px]">
          <BrandMark />
          KURO
        </div>
        <div className="flex items-center gap-[22px] text-[14px] text-muted">
          <a
            href="#showcase"
            className="hidden no-underline hover:text-pink md:inline"
          >
            Features
          </a>
          <a
            href="#agent"
            className="hidden no-underline hover:text-pink md:inline"
          >
            AI agents
          </a>
          <a
            href="#free"
            className="hidden no-underline hover:text-pink md:inline"
          >
            Pricing
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-[7px] border-2 border-line2 bg-panel px-[11px] py-[9px] font-pix text-[9px] text-ink no-underline hover:border-pink"
          >
            ★ STAR
          </a>
          <DownloadButton className="[&>button]:!px-3 [&>button]:!py-2.5 [&>button]:!text-[9px]" />
        </div>
      </Wrap>
    </nav>
  );
}
