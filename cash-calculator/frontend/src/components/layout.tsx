import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Calculator, Clock, BarChart3, Sun, Moon, IndianRupee } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Calculator", icon: Calculator },
  { href: "/history", label: "History", icon: Clock },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="gradient-bg min-h-screen flex flex-col">
      {/* Header */}
      <header className="no-print sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight gradient-text">
              CashCalc
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 animate-fade-in-up">
        {children}
      </main>

      {/* Footer */}
      <footer className="no-print text-center py-4 text-xs text-muted-foreground/50">
        CashCalc — Indian Currency Calculator
      </footer>
    </div>
  );
}
