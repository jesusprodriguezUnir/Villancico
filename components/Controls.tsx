import { type FC, type ChangeEvent, type RefObject } from 'react';
import { PlayerState } from '../types';

interface ControlsProps {
  playerState: PlayerState;
  onPlayPause: () => void;
  onSeek: (e: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  onRewind: () => void;
  onForward: () => void;
  audioRef: RefObject<HTMLAudioElement>;
}

const Controls: FC<ControlsProps> = ({
  playerState,
  onPlayPause,
  onSeek,
  onReset,
  onRewind,
  onForward,
  audioRef
}) => {
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="absolute bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-white/10 p-4 z-50 transition-transform duration-300 hover:translate-y-0 translate-y-2">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Progress Bar */}
        <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
          <span>{formatTime(playerState.currentTime)}</span>
          <input
            type="range"
            min={0}
            max={playerState.duration || 100}
            value={playerState.currentTime}
            onChange={onSeek}
            className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400"
          />
          <span>{formatTime(playerState.duration)}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={onRewind}
            className="p-2 text-gray-400 hover:text-white transition-colors hover:scale-110"
            title="Retroceder 10s"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>

          <button
            onClick={onReset}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Reiniciar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={onPlayPause}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-105 transition-all shadow-lg shadow-yellow-500/20"
          >
            {playerState.isPlaying ? (
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={onForward}
            className="p-2 text-gray-400 hover:text-white transition-colors hover:scale-110"
            title="Adelantar 10s"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;