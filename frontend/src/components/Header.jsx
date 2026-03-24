import React from 'react';
import { Bell, Settings, Menu, User, Clock, Sun, Moon } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import { useTheme } from '../contexts/ThemeContext';

export default function Header({ onMenuClick }) {
  const [now, setNow] = React.useState(new Date());
  const { theme, toggleTheme } = useTheme();

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-gradient-to-r dark:from-bg-darker dark:to-bg-dark border-b border-gray-200 dark:border-gray-700/30 backdrop-blur-lg transition-colors duration-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left - Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-bg-light rounded-lg transition-colors"
        >
          <Menu size={24} className="text-accent-gold" />
        </button>

        {/* Center - Time */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
          <Clock size={16} />
          <span>{now.toLocaleTimeString('id-ID')}</span>
        </div>

        {/* Right - Icons */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-bg-light rounded-lg transition-colors group"
            title="Toggle Light/Dark Mode"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="text-gray-400 group-hover:text-accent-gold" />
            ) : (
              <Moon size={20} className="text-gray-500 group-hover:text-accent-gold" />
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-bg-light rounded-lg transition-colors group">
            <Bell size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-accent-gold" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          </button>

          {/* Settings */}
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-bg-light rounded-lg transition-colors group">
            <Settings size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-accent-gold" />
          </button>

          {/* Profile */}
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-bg-light rounded-lg transition-colors group">
            <User size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-accent-gold" />
          </button>
        </div>
      </div>
    </header>
  );
}
