import { BrandMark } from "./BrandMark";
import { Wrap } from "./ui";

export function Footer() {
  return (
    <footer className="border-t-2 border-line py-[34px] text-[13px] text-muted">
      <Wrap className="flex flex-wrap items-center justify-between gap-4">
        <span className="flex items-center gap-2 font-pix text-[12px] tracking-[2px] text-ink">
          <BrandMark />
          KURO
        </span>
        <span>MIT licensed · made for people who like cats and clean desktops</span>
        <span>
          <a href="#showcase" className="no-underline hover:text-pink">
            features
          </a>
          {" · "}
          <a href="#agent" className="no-underline hover:text-pink">
            agents
          </a>
          {" · "}
          <a href="#get" className="no-underline hover:text-pink">
            download
          </a>
        </span>
      </Wrap>
    </footer>
  );
}
