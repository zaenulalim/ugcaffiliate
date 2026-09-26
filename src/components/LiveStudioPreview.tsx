import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Maximize, RefreshCw, Layers, ZoomIn, Square, Video, Laptop, Focus, Info } from 'lucide-react';
import { AspectRatio, CameraAngle, VisualStyle, CharacterConfig, ProductSpec } from '../types';

interface LiveStudioPreviewProps {
  aspectRatio: AspectRatio;
  cameraAngle: CameraAngle;
  visualStyle: VisualStyle;
  character: CharacterConfig;
  product: ProductSpec;
  backgroundType: string;
  customBackgroundPrompt: string;
}

// Map backgrounds to professional high-quality CDN URLs that reinforce the SaaS UGC layout
const BACKGROUND_MAPPING: Record<string, string> = {
  'Aesthetic Bedroom': 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=800',
  'Minimalist Bedroom': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800',
  'Modern Cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800',
  'Workspace Setup': 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&q=80&w=800',
  'Clean Kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800',
  'White Studio': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
  'Outdoor Nature': 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=800',
  'Luxury Interior': 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&q=80&w=800',
  'Modern Living Room': 'https://images.unsplash.com/photo-1618219944342-824e40a13285?auto=format&fit=crop&q=80&w=800',
  'Beauty Corner': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
  'Custom': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800',
};

// Map generator demographics to tailored high-quality avatars to make it feel extremely cohesive
const MODEL_MAPPING = {
  Male: {
    '18–25': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=350',
    '26–35': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=350',
    '36–45': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=350',
    '46+': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=350',
  },
  Female: {
    hijab: {
      '18–25': 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=350',
      '26–35': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=350',
      '36–45': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=350',
      '46+': 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=350',
    },
    noHijab: {
      '18–25': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=350',
      '26–35': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=350',
      '36–45': 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=350',
      '46+': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=350',
    },
  },
};

export default function LiveStudioPreview({
  aspectRatio,
  cameraAngle,
  visualStyle,
  character,
  product,
  backgroundType,
  customBackgroundPrompt,
}: LiveStudioPreviewProps) {
  const [showGrid, setShowGrid] = useState(true);
  const [productX, setProductX] = useState(30); // percentages
  const [productY, setProductY] = useState(65);
  const [productScale, setProductScale] = useState(1.0);
  const [productRotation, setProductRotation] = useState(0);

  // 1. Get model image
  let modelImage = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=350';
  if (character.mode === 'reference' && character.croppedImage) {
    modelImage = character.croppedImage;
  } else if (character.mode === 'reference' && character.referenceImage) {
    modelImage = character.referenceImage;
  } else {
    // Generated
    const gender = character.gender;
    const age = character.ageRange;
    if (gender === 'Male') {
      modelImage = MODEL_MAPPING.Male[age] || MODEL_MAPPING.Male['26–35'];
    } else {
      const isHijab = character.hijab === 'Yes';
      if (isHijab) {
        modelImage = MODEL_MAPPING.Female.hijab[age] || MODEL_MAPPING.Female.hijab['26–35'];
      } else {
        modelImage = MODEL_MAPPING.Female.noHijab[age] || MODEL_MAPPING.Female.noHijab['26–35'];
      }
    }
  }

  // 2. Get background image
  const bgImage = BACKGROUND_MAPPING[backgroundType] || BACKGROUND_MAPPING['Aesthetic Bedroom'];

  // 3. Aspect Ratio Sizing mappers
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] w-[260px] md:w-[290px]';
      case '1:1':
        return 'aspect-square w-[340px] md:w-[380px]';
      case '16:9':
        return 'aspect-[16/9] w-full max-w-[500px]';
      default:
        return 'aspect-[9/16] w-[290px]';
    }
  };

  // Adjust positioning/clipping based on camera angle
  const getCameraAngleStyles = () => {
    switch (cameraAngle) {
      case 'Close Up':
      case 'Extreme Close Up':
        return { transform: 'scale(1.4) translateY(10%)' };
      case 'POV':
      case 'Product Focus':
        return { transform: 'scale(1.1) translateY(5%)', filter: 'blur(0.5px)' };
      case 'Full Body':
        return { transform: 'scale(0.85) translateY(-5%)' };
      default:
        return { transform: 'scale(1.0) translateY(0)' };
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden h-full flex flex-col justify-between">
      {/* Absolute top accent glow overlay */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="flex items-center justify-between mb-4 shrink-0 relative">
        <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          Live Viewport Monitor
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all cursor-pointer uppercase ${
              showGrid
                ? 'bg-white/15 text-white border-white/25 shadow-sm font-bold'
                : 'bg-black/40 text-zinc-500 border-white/5'
            }`}
          >
            GRID
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 min-h-[400px] flex items-center justify-center py-4 bg-black/20 border border-white/5 rounded-2xl relative overflow-hidden">
        {/* Cam controls overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-mono text-zinc-400 border border-white/10 z-30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          <span>● REC (LIVE)</span>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-mono text-zinc-400 border border-white/10 z-30">
          <Camera className="w-3 h-3 text-purple-400" />
          <span>HD 1080P - 60 FPS</span>
        </div>

        {/* Framing Outer Shell which takes Aspect Ratio sizes */}
        <div
          className={`${getAspectRatioClasses()} transition-all duration-300 relative rounded-2xl overflow-hidden border-2 border-purple-500/30 bg-black shadow-2xl relative select-none`}
        >
          {/* 1. LAYER 1: Campaign Background */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={bgImage}
              alt="UGC Background"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-90 transition-all duration-500"
            />
            {/* Dark contrast gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          </div>

          {/* 2. LAYER 2: Character Model */}
          <motion.div
            style={getCameraAngleStyles()}
            className="absolute inset-0 flex items-center justify-center transition-all duration-500 z-10 pointer-events-none"
          >
            <img
              src={modelImage}
              alt="Model character"
              referrerPolicy="no-referrer"
              className={`object-contain max-h-[85%] rounded-2xl shadow-xl transition-all ${
                cameraAngle === 'Extreme Close Up' ? 'scale-150 origin-center blur-[0.2px]' : ''
              }`}
            />
          </motion.div>

          {/* 3. LAYER 3: Floating Product Sticker overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {product.rawImage ? (
              <motion.div
                drag
                dragMomentum={false}
                style={{
                  position: 'absolute',
                  left: `${productX}%`,
                  top: `${productY}%`,
                  scale: productScale,
                  rotate: `${productRotation}deg`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="pointer-events-auto cursor-grab active:cursor-grabbing"
              >
                <img
                  src={product.rawImage}
                  alt="Product Placement preview"
                  referrerPolicy="no-referrer"
                  className="w-20 md:w-24 h-auto drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] border border-purple-500/30 bg-black/40 rounded-xl p-1.5"
                />
              </motion.div>
            ) : (
              // Default beautiful placeholder serum bottle overlay so there is ALWAYS a product sticker visible
              <motion.div
                style={{
                  position: 'absolute',
                  left: `${productX}%`,
                  top: `${productY}%`,
                  scale: productScale,
                  rotate: `${productRotation}deg`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="pointer-events-auto cursor-grab active:cursor-grabbing flex flex-col items-center"
              >
                <div className="w-14 h-24 bg-gradient-to-b from-purple-500/30 to-purple-900/60 rounded-xl border border-purple-400/40 backdrop-blur-md flex flex-col justify-end p-2 text-[8px] font-mono font-bold text-center text-white shadow-lg shadow-purple-500/20">
                  <div className="bg-black/40 py-0.5 rounded text-[6px] truncate">{product.name || 'UGC SERUM'}</div>
                </div>
              </motion.div>
            )}
          </div>

          {/* 4. LAYER 4: Studio Monitor UI Overlays (Grid, Viewport target lines) */}
          {showGrid && (
            <div className="absolute inset-0 border border-white/10 grid grid-cols-3 grid-rows-3 z-20 pointer-events-none">
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-white/10" />
              <div className="border-r border-white/10" />
              <div />

              {/* Viewfinder crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center opacity-30">
                <div className="w-full h-px bg-white absolute" />
                <div className="w-px h-full bg-white absolute" />
              </div>
            </div>
          )}

          {/* Bottom styling overlay */}
          <div className="absolute bottom-4 inset-x-4 bg-black/70 backdrop-blur-sm p-2 rounded-xl z-20 pointer-events-none text-[9px] font-mono text-zinc-300 flex items-center justify-between border border-white/10">
            <span>ANGLE: {cameraAngle}</span>
            <span>STYLE: {visualStyle}</span>
          </div>
        </div>
      </div>

      {/* Control Widgets for Placement */}
      <div className="border-t border-white/10 pt-4 bg-black/20 px-4 pb-4 mt-3 rounded-2xl border border-white/5">
        <span className="text-[10px] font-mono uppercase text-zinc-550 flex items-center gap-1.5 mb-3.5">
          <Info className="w-3.5 h-3.5 text-purple-400" />
          Drag or adjust the product sticker to place it perfectly in the creator's hands
        </span>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Horizontal Pos</span>
              <span className="text-zinc-550">{productX}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="95"
              value={productX}
              onChange={(e) => setProductX(Number(e.target.value))}
              className="w-full accent-purple-500 h-1 bg-white/15 rounded-lg cursor-pointer appearance-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Vertical Pos</span>
              <span className="text-zinc-550">{productY}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="95"
              value={productY}
              onChange={(e) => setProductY(Number(e.target.value))}
              className="w-full accent-purple-500 h-1 bg-white/15 rounded-lg cursor-pointer appearance-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Sticker Size</span>
              <span className="text-zinc-550">{productScale.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={productScale}
              onChange={(e) => setProductScale(Number(e.target.value))}
              className="w-full accent-purple-500 h-1 bg-white/15 rounded-lg cursor-pointer appearance-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Sticker Rotation</span>
              <span className="text-zinc-550">{productRotation}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={productRotation}
              onChange={(e) => setProductRotation(Number(e.target.value))}
              className="w-full accent-purple-500 h-1 bg-white/15 rounded-lg cursor-pointer appearance-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
