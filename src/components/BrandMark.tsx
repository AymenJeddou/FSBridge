import { cn } from "@/lib/utils";

export const BrandMark = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="FSBridge"
      className={cn("shrink-0", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="60" height="60" rx="18" fill="hsl(var(--foreground))" />
      <path d="M14 40Q32 23 50 40" fill="none" stroke="hsl(var(--accent))" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M14 40H50" fill="none" stroke="hsl(var(--background))" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 40V47M32 40V49M42 40V47" fill="none" stroke="hsl(var(--background))" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 16H30V20H22V24H29V28H22V34H18Z" fill="hsl(var(--background))" />
      <path d="M46 17H38V21H44C47.5 21 50 23.1 50 26.4C50 29.6 47.4 32 44 32H38V28H44C45.2 28 46 27.4 46 26.4C46 25.4 45.2 24.8 44 24.8H42C38.6 24.8 36 22.7 36 19.5C36 16.3 38.6 14 42 14H46Z" fill="hsl(var(--background))" />
    </svg>
  );
};