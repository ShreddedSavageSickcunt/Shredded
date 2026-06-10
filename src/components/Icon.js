// Minimal stroked line icons (currentColor) — premium, no emoji.
// Usage: <Icon name="target" className="h-5 w-5" />

const PATHS = {
  home: <path d="M3 10.5 12 4l9 6.5M5 9.5V20h14V9.5" />,
  checkin: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2.5" />
      <path d="M9 4.5h6V7H9zM8.5 13.5l2.2 2.2 4.3-4.4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" />
    </>
  ),
  scale: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 8h8M12 8v3.5" />
      <circle cx="12" cy="14" r="2.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  edit: <path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3zM14 7l3 3" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.2a3 3 0 0 1 0 5.6M17 13.5a5 5 0 0 1 3.5 4.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  flame: (
    <path d="M12 3c.5 3-1.8 4.2-2.8 6C8 11 8.4 13 9.5 14c.2-1 .9-1.8 1.6-2.3-.2 1.6.4 2.5 1.4 3.4 1.5 1.4 1.9 3.6.4 5.2C19 19 20 15.5 18.7 12 17 7.5 13.5 6.5 12 3z" />
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  trendUp: <path d="M4 17 10 11l3.5 3.5L20 8m0 0h-4.5M20 8v4.5" />,
  trendDown: <path d="M4 7l6 6 3.5-3.5L20 16m0 0h-4.5M20 16v-4.5" />,
  minus: <path d="M5 12h14" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
  logout: <path d="M15 5h4v14h-4M14 12H4m4-4-4 4 4 4" />,
  flag: <path d="M5 21V4m0 1c3-2 7 2 10 0v8c-3 2-7-2-10 0" />,
};

export default function Icon({ name, className = "h-5 w-5", strokeWidth = 1.8 }) {
  const content = PATHS[name];
  if (!content) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}
