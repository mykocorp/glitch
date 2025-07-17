import React from 'react';
import { RotateCcw, Monitor } from 'lucide-react';

export interface EffectSettings {
  scanlines: number;
  chromatic: number;
  colorBleed: number;
  noise: number;
  pixelation: number;
  crtBezel: boolean;
  // New effects
  datamosh: number;
  pixelSort: number;
  displacement: number;
  colorShift: number;
  anaglyph: number;
  anaglyphOffset: number;
}

interface EffectControlsProps {
  effects: EffectSettings;
  onEffectChange: (key: keyof EffectSettings, value: number | boolean) => void;
  onReset: () => void;
  onPreset: (preset: EffectSettings) => void;
}

export const EffectControls: React.FC<EffectControlsProps> = ({
  effects,
  onEffectChange,
  onReset,
  onPreset
}) => {
  const presets = {
    mild: {
      scanlines: 50, chromatic: 30, colorBleed: 40, noise: 20, pixelation: 0,
      crtBezel: true, datamosh: 15, pixelSort: 0, displacement: 10, colorShift: 20, anaglyph: 0, anaglyphOffset: 5
    },
    heavy: {
      scanlines: 80, chromatic: 60, colorBleed: 70, noise: 50, pixelation: 20,
      crtBezel: true, datamosh: 40, pixelSort: 30, displacement: 35, colorShift: 60, anaglyph: 0, anaglyphOffset: 8
    },
    pixel: {
      scanlines: 40, chromatic: 10, colorBleed: 15, noise: 60, pixelation: 40,
      crtBezel: true, datamosh: 0, pixelSort: 70, displacement: 5, colorShift: 10, anaglyph: 0, anaglyphOffset: 3
    },
    corrupted: {
      scanlines: 90, chromatic: 80, colorBleed: 90, noise: 80, pixelation: 0,
      crtBezel: true, datamosh: 80, pixelSort: 50, displacement: 60, colorShift: 90, anaglyph: 0, anaglyphOffset: 12
    },
    anaglyph3d: {
      scanlines: 30, chromatic: 20, colorBleed: 10, noise: 15, pixelation: 0,
      crtBezel: true, datamosh: 0, pixelSort: 0, displacement: 0, colorShift: 0, anaglyph: 80, anaglyphOffset: 15
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-amber-400">▸ EFFECT CONTROLS</h2>
        <button
          onClick={onReset}
          className="px-3 py-1 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-all text-sm flex items-center gap-1"
        >
          <RotateCcw className="w-4 h-4" />
          RESET
        </button>
      </div>

      <div className="space-y-4">
        {/* Classic VHS Effects */}
        <div className="border border-gray-700 p-4 bg-gray-900/50">
          <h3 className="text-blue-400 mb-3 text-sm">CLASSIC VHS:</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-blue-400 mb-1 text-xs">
                SCANLINES: {effects.scanlines}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={effects.scanlines}
                onChange={(e) => onEffectChange('scanlines', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <label className="block text-blue-400 mb-1 text-xs">
                CHROMATIC: {effects.chromatic}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={effects.chromatic}
                onChange={(e) => onEffectChange('chromatic', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <label className="block text-blue-400 mb-1 text-xs">
                COLOR BLEED: {effects.colorBleed}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={effects.colorBleed}
                onChange={(e) => onEffectChange('colorBleed', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <label className="block text-blue-400 mb-1 text-xs">
                DIGITAL NOISE: {effects.noise}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={effects.noise}
                onChange={(e) => onEffectChange('noise', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <label className="block text-blue-400 mb-1 text-xs">
                PIXELATION: {effects.pixelation}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={effects.pixelation}
                onChange={(e) => onEffectChange('pixelation', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* Advanced Glitch Effects */}
        <div className="border border-gray-700 p-4 bg-gray-900/50">
          <h3 className="text-green-400 mb-3 text-sm">ADVANCED GLITCH:</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-green-400 mb-1 text-xs">
                DATAMOSH: {effects.datamosh}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={effects.datamosh}
                onChange={(e) => onEffectChange('datamosh', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <label className="block text-green-400 mb-1 text-xs">
                PIXEL SORT: {effects.pixelSort}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={effects.pixelSort}
                onChange={(e) => onEffectChange('pixelSort', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <label className="block text-green-400 mb-1 text-xs">
                DISPLACEMENT: {effects.displacement}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={effects.displacement}
                onChange={(e) => onEffectChange('displacement', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <label className="block text-green-400 mb-1 text-xs">
                COLOR SHIFT: {effects.colorShift}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={effects.colorShift}
                onChange={(e) => onEffectChange('colorShift', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* Anaglyph 3D Effects */}
        <div className="border border-gray-700 p-4 bg-gray-900/50">
          <h3 className="text-red-400 mb-3 text-sm">ANAGLYPH 3D:</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-red-400 mb-1 text-xs">
                3D INTENSITY: {effects.anaglyph}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={effects.anaglyph}
                onChange={(e) => onEffectChange('anaglyph', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <label className="block text-red-400 mb-1 text-xs">
                DEPTH OFFSET: {effects.anaglyphOffset}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={effects.anaglyphOffset}
                onChange={(e) => onEffectChange('anaglyphOffset', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
          
          <p className="text-xs text-gray-400 mt-2">
            Use red-blue 3D glasses for best effect
          </p>
        </div>

        {/* CRT Monitor */}
        <div className="border border-gray-700 p-4 bg-gray-900/50">
          <label className="flex items-center gap-3 text-blue-400 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={effects.crtBezel}
              onChange={(e) => onEffectChange('crtBezel', e.target.checked)}
              className="w-4 h-4 accent-amber-400"
            />
            <Monitor className="w-4 h-4" />
            CRT MONITOR BEZEL
          </label>
        </div>

        {/* Presets */}
        <div className="border border-gray-700 p-4 bg-gray-900/50">
          <h3 className="text-blue-400 mb-3 text-sm">QUICK PRESETS:</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onPreset(presets.mild)}
              className="px-3 py-2 border border-green-600 text-green-400 hover:bg-green-600 hover:text-black transition-all text-xs"
            >
              MILD VHS
            </button>
            <button
              onClick={() => onPreset(presets.heavy)}
              className="px-3 py-2 border border-red-600 text-red-400 hover:bg-red-600 hover:text-black transition-all text-xs"
            >
              HEAVY GLITCH
            </button>
            <button
              onClick={() => onPreset(presets.pixel)}
              className="px-3 py-2 border border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-black transition-all text-xs"
            >
              RETRO PIXEL
            </button>
            <button
              onClick={() => onPreset(presets.corrupted)}
              className="px-3 py-2 border border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black transition-all text-xs"
            >
              CORRUPTED
            </button>
            <button
              onClick={() => onPreset(presets.anaglyph3d)}
              className="px-3 py-2 border border-red-600 text-red-400 hover:bg-red-600 hover:text-black transition-all text-xs col-span-2"
            >
              ANAGLYPH 3D
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};