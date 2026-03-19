import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  {
    name: "Wallet",
    path: "/home",
    icon: (active: boolean) => (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#ff6717" : "#6B7280"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="4" width="20" height="16" rx="2.5" />
        <path d="M2 10h20" />
        <circle cx="18" cy="14.5" r="1" fill={active ? "#ff6717" : "#6B7280"} stroke="none" />
      </svg>
    ),
  },
  {
    name: "NLO",
    path: "/portfolio",
    icon: (active: boolean) => (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
      >
        {/* Left arc - from top-left dot curving down to bottom-center */}
        <path
          d="M5 5 C 2 9.5, 2 15.5, 8.5 19.5"
          fill="none"
          stroke={active ? "#ff6717" : "#6B7280"}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* Right arc - mirrored: from top-center curving down to bottom-right dot */}
        <path
          d="M15.5 4.5 C 22 8.5, 22 14.5, 19 19"
          fill="none"
          stroke={active ? "#ff6717" : "#6B7280"}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* Diagonal line connecting bottom-left arc to top-right arc */}
        <line
          x1="8.5" y1="19.5"
          x2="15.5" y2="4.5"
          stroke={active ? "#ff6717" : "#6B7280"}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* Central circle */}
        <circle cx="12" cy="12" r="3.2" fill={active ? "#FF5B1D" : "#6B7280"} />
        {/* Top-left dot */}
        <circle cx="5" cy="5" r="1.5" fill={active ? "#FF5B1D" : "#6B7280"} />
        {/* Bottom-right dot */}
        <circle cx="19" cy="19" r="1.5" fill={active ? "#FF5B1D" : "#6B7280"} />
      </svg>
    ),
  },
  {
    name: "Settings",
    path: "/settings",
    icon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#ff6717" : "#6B7280"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/home") {
      return (
        location.pathname === "/" ||
        location.pathname === "/home" ||
        location.pathname === "/index.html"
      );
    }
    if (path === "/portfolio") {
      return (
        location.pathname === "/portfolio" ||
        location.pathname === "/nlo-welcome"
      );
    }
    return location.pathname === path;
  };

  return (
    <nav className="flex items-center justify-around bg-dark-bg border-t border-white/[0.06] h-[58px] shrink-0">
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <button
            key={tab.name}
            onClick={() => navigate(tab.path)}
            className="relative flex flex-col items-center justify-center gap-0.5 py-2 flex-1 transition-colors duration-150"
          >
            {active && (
              <span className="absolute top-0 h-[2.5px] w-8 rounded-full bg-XOrange" />
            )}
            <div className="h-6 flex items-center justify-center">
              {tab.icon(active)}
            </div>
            <span
              className={`text-[10px] tracking-wide ${
                active
                  ? "text-XOrange font-semibold"
                  : "text-txt-muted font-medium"
              }`}
            >
              {tab.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
