export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      aria-hidden="true"
      className={className}
    >
      <polygon points="8,3 6,12 13,10" fill="#2d2a30" stroke="#000" />
      <polygon points="18,3 13,10 20,12" fill="#2d2a30" stroke="#000" />
      <circle cx="13" cy="15" r="10" fill="#2d2a30" stroke="#000" />
      <circle cx="9.5" cy="14" r="2.4" fill="#fff" />
      <circle cx="16.5" cy="14" r="2.4" fill="#fff" />
      <circle cx="9.5" cy="14.4" r="1.1" fill="#20242b" />
      <circle cx="16.5" cy="14.4" r="1.1" fill="#20242b" />
      <rect x="12" y="17" width="2" height="1.6" fill="#ef93a4" />
    </svg>
  );
}
