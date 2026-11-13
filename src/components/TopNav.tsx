import React from 'react';
import { Activity, BarChart3, CalendarDays, PlusSquare } from 'lucide-react';
import { ScreenId } from '../types/telemetry';

interface TopNavProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  isLiveRunning: boolean;
}

const NAV_ITEMS: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'live', label: 'Live Track', icon: Activity },
  { id: 'log', label: 'Log Run', icon: PlusSquare },
  { id: 'analytics', label: 'Split Analytics', icon: BarChart3 },
  { id: 'logbook', label: 'Training Log', icon: CalendarDays },
];

export const TopNav: React.FC<TopNavProps> = ({
  activeScreen,
  onNavigate,
  isLiveRunning,
}) => {
  return (
    <>
      {/* Desktop & Mobile Top Header (56px desktop, 48px mobile) */}
      <header className="sticky top-0 z-40 h-12 md:h-14 border-b border-white/[0.08] bg-[#0D1117]/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-8 px-5 md:px-6">
          {/* Zone 1: Brand Wordmark (single text element, no subtitles/pills) */}
          <button
            type="button"
            onClick={() => onNavigate('logbook')}
            className="font-display text-base md:text-lg font-black tracking-tight text-white uppercase whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10E66A]"
          >
            KINETIC PULSE
          </button>

          {/* Zone 2: 4 single-line navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10E66A] ${
                    isActive
                      ? 'text-[#10E66A] font-semibold'
                      : 'text-[#8B949E] hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-[15px] h-[2px] bg-[#10E66A]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onNavigate(activeScreen === 'log' ? 'live' : 'log')}
              className="rounded bg-[#10E66A] px-4 py-1.5 font-display text-xs font-black uppercase tracking-[0.04em] text-[#0D1117] hover:bg-[#2df37f] active:translate-y-[1px] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {activeScreen === 'log'
                ? isLiveRunning
                  ? 'Active Session'
                  : 'Start Live'
                : 'Log Session'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Tab Bar (56px height -> combined with 48px header = 104px < 15% of mobile viewport) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 border-t border-white/[0.12] bg-[#12161F]/95 backdrop-blur-md"
      >
        <div className="grid h-full grid-cols-4 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex h-full flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  isActive ? 'text-[#10E66A]' : 'text-[#8B949E] hover:text-white'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.04em] whitespace-nowrap">
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
