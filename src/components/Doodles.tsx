// Hand-drawn line-art SVGs in Retrofly spirit
export const ScribbleArrow = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 120 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M5 25 C 30 5, 60 5, 100 22" />
    <path d="M90 14 L 102 22 L 92 32" />
  </svg>
);

export const StarSpark = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 60" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M30 6 L34 26 L54 30 L34 34 L30 54 L26 34 L6 30 L26 26 Z" />
  </svg>
);

export const Squiggle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 20" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M2 10 Q 12 2, 22 10 T 42 10 T 62 10 T 82 10 T 102 10 T 122 10 T 142 10 T 162 10 T 182 10 T 198 10" />
  </svg>
);

export const StudentDoodle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {/* head */}
    <circle cx="100" cy="70" r="34" />
    {/* eyes */}
    <circle cx="88" cy="68" r="2.5" fill="currentColor" />
    <circle cx="112" cy="68" r="2.5" fill="currentColor" />
    {/* smile */}
    <path d="M85 82 Q100 92, 115 82" />
    {/* graduation cap */}
    <path d="M60 56 L100 38 L140 56 L100 70 Z" />
    <path d="M140 56 L140 76 Q120 84, 100 84 Q80 84, 60 76 L60 56" />
    <path d="M148 60 L148 84" />
    <circle cx="148" cy="86" r="3" fill="currentColor" />
    {/* body */}
    <path d="M70 110 Q100 100, 130 110 L138 178 L62 178 Z" />
    {/* book */}
    <rect x="78" y="138" width="44" height="28" rx="2" />
    <path d="M100 138 L100 166" />
  </svg>
);

export const StackBooks = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="30" y="140" width="140" height="24" rx="3" />
    <rect x="40" y="110" width="120" height="26" rx="3" />
    <rect x="34" y="80" width="132" height="26" rx="3" transform="rotate(-3 100 93)" />
    <path d="M50 153 L160 153 M55 122 L150 122" />
    <circle cx="155" cy="60" r="14" />
    <path d="M148 60 L153 65 L163 55" />
  </svg>
);

export const ChartDoodle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M30 170 L30 30 M30 170 L180 170" />
    <path d="M40 150 Q70 130, 90 110 T 140 70 T 175 40" />
    <circle cx="90" cy="110" r="4" fill="currentColor" />
    <circle cx="140" cy="70" r="4" fill="currentColor" />
    <circle cx="175" cy="40" r="4" fill="currentColor" />
    <path d="M150 30 L175 40 L165 60" />
  </svg>
);

export const PaperPlane = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M30 100 L170 40 L130 170 L100 120 L30 100 Z" />
    <path d="M30 100 L100 120" />
    <path d="M100 120 L170 40" />
  </svg>
);
