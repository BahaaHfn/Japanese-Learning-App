import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';

interface PaceTimerProps {
  targetSeconds: number;
  onExpire?: () => void;
  autoStart?: boolean;
  className?: string;
  showControls?: boolean;
}

export const PaceTimer: React.FC<PaceTimerProps> = ({
  targetSeconds,
  onExpire,
  autoStart = true,
  className = '',
  showControls = true,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(targetSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    setSecondsRemaining(targetSeconds);
    if (autoStart) setIsRunning(true);
  }, [targetSeconds, autoStart]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(interval);
            return 0;
          }
          return next;
        });
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      if (onExpire) onExpire();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining, onExpire]);

  const elapsedRatio = (targetSeconds - secondsRemaining) / (targetSeconds || 1);
  const isOvertime = secondsRemaining === 0;
  const isAmber = elapsedRatio >= 0.8 && !isOvertime;

  // Formatting mm:ss
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Pace status color
  let badgeColor = 'bg-jade-wash text-jade-dark border-jade/30';
  let dotColor = 'bg-jade';
  let statusText = 'On Pace';

  if (isOvertime) {
    badgeColor = 'bg-vermilion-wash text-vermilion border-vermilion/40';
    dotColor = 'bg-vermilion animate-pulse';
    statusText = 'Overtime';
  } else if (isAmber) {
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
    dotColor = 'bg-amber-500 animate-pulse';
    statusText = 'Pacing Alert';
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${badgeColor} ${className}`}>
      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      <Clock className="w-4 h-4 opacity-75" />
      <span className="font-mono font-bold tracking-wider">{formatted}</span>
      <span className="text-xs uppercase tracking-wider opacity-85 ml-1 hidden sm:inline">
        ({statusText})
      </span>

      {showControls && (
        <div className="flex items-center gap-1 ml-2 border-l pl-2 border-current/20">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="p-1 hover:bg-black/5 rounded transition"
            title={isRunning ? 'Pause' : 'Resume'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setSecondsRemaining(targetSeconds);
            }}
            className="p-1 hover:bg-black/5 rounded transition"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
