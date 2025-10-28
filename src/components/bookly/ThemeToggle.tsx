'use client';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme, isInitialized } = useTheme();
  const isDarkMode = theme === 'dark';

  const label = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      disabled={!isInitialized}
      className="flex items-center gap-2"
      aria-label={label}
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
      <span className="sm:hidden">{isDarkMode ? 'Light' : 'Dark'}</span>
    </Button>
  );
}
