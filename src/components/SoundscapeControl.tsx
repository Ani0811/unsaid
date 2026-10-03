import React, { useState } from 'react';
import { ambientSound, type SoundscapeType } from '../audio/ambient';
import { Volume2, VolumeX, CloudRain, Flame, Music, X } from 'lucide-react';

export const SoundscapeControl: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeType, setActiveType] = useState<SoundscapeType>(ambientSound.getCurrentType());
  const [volume, setVolume] = useState(ambientSound.getVolume());

  const handleSelect = (type: SoundscapeType) => {
    ambientSound.play(type);
    setActiveType(type);
  };

  const handleVolumeChange = (val: number) => {
    ambientSound.setVolume(val);
    setVolume(val);
  };

  const isPlaying = activeType !== 'off';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-lg border transition ${
          isPlaying
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border-transparent hover:border-zinc-700'
        }`}
        title="Ambient Soundscapes (Rain, Hearth, Drone)"
      >
        {isPlaying ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-[#14151c] border border-zinc-800 rounded-2xl shadow-2xl p-4 z-40 space-y-3.5 text-xs text-zinc-300">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Ambient Soundscapes</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSelect('rain')}
                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                  activeType === 'rain'
                    ? 'bg-sky-950/40 border-sky-500/40 text-sky-200'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <CloudRain className="w-4 h-4 shrink-0 text-sky-400" />
                <span>Rain</span>
              </button>

              <button
                onClick={() => handleSelect('hearth')}
                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                  activeType === 'hearth'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <Flame className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Hearth</span>
              </button>

              <button
                onClick={() => handleSelect('drone')}
                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                  activeType === 'drone'
                    ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <Music className="w-4 h-4 shrink-0 text-purple-400" />
                <span>Drone</span>
              </button>

              <button
                onClick={() => handleSelect('off')}
                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                  activeType === 'off'
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-200 font-medium'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-500'
                }`}
              >
                <VolumeX className="w-4 h-4 shrink-0" />
                <span>Mute</span>
              </button>
            </div>

            {isPlaying && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Volume</span>
                  <span className="font-mono">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
