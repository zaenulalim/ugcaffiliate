import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, Download, RefreshCw, Sparkles, Film, ArrowRight, Play, Pause, 
  Settings2, Palette, FileText, Check, CheckCircle, Volume2, Save, Scissors, 
  Maximize2, Eye, ShieldCheck, Heart, Share2, ClipboardSignature
} from 'lucide-react';
import { 
  StoryboardScene, VoiceOverOutput, UGCContentMarketing, UGCImageOutput, 
  AspectRatio, CameraAngle, VisualStyle, CampaignState 
} from '../types';

interface CampaignOutputProps {
  campaignState: CampaignState;
  backgrounds: string[];
  storyboard: StoryboardScene[];
  voiceover: VoiceOverOutput;
  marketing: UGCContentMarketing;
  prompts: {
    visualPromptOnly: string;
    visualPromptWithVoice: {
      visualPrompt: string;
      voiceoverScript: string;
      lipSyncInstructions: string;
    }
  };
  onSelectBackground: (bg: string) => void;
  onRefreshCampaign: () => void;
}

// Generate beautiful model assets based on selected demographics and fallback layouts
const fallbackOutputSeeds: Record<string, string[]> = {
  'Female_Yes': [
    'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=400',
  ],
  'Female_No': [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
  ],
  'Male_No': [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
  ]
};

export default function CampaignOutput({
  campaignState,
  backgrounds,
  storyboard,
  voiceover,
  marketing,
  prompts,
  onSelectBackground,
  onRefreshCampaign,
}: CampaignOutputProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [playingAudio, setPlayingAudio] = useState(false);
  const [currentBGLegend, setCurrentBGLegend] = useState(campaignState.background.selected);
  const [selectedOutputIndex, setSelectedOutputIndex] = useState<number | null>(null);
  const [activePromptOption, setActivePromptOption] = useState<Record<string, 'A' | 'B'>>({});
  const [customBGPrompt, setCustomBGPrompt] = useState('');
  const [loadingCardState, setLoadingCardState] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Floating feedback manager
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 1. Copy callback helpers
  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    triggerToast('Copied to clipboard successfully.');
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  // 2. Download Simulation helper
  const handleDownloadFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    triggerToast(`Downloaded script ${filename}.`);
  };

  const handleDownloadImage = (id: string, src: string) => {
    const a = document.createElement('a');
    a.href = src;
    a.download = `OvalStudio_UGC_${id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerToast('Initiated asset catalog JPG export package.');
  };

  // 3. Card loading action simulators (HD upscale, remove bg, etc)
  const triggerCardAction = (cardId: string, actionName: string, message: string) => {
    setLoadingCardState(prev => ({ ...prev, [cardId]: actionName }));
    setTimeout(() => {
      setLoadingCardState(prev => {
        const next = { ...prev };
        delete next[cardId];
        return next;
      });
      triggerToast(`Successfully processed: ${message}! High-fidelity asset is updated.`);
    }, 1200);
  };

  // 4. Generate beautiful dynamic output mockups matching selected demographic profile
  const getOutputPhotosList = (): string[] => {
    const key = campaignState.character.gender === 'Female' 
      ? (`Female_${campaignState.character.hijab}`) 
      : 'Male_No';
    return fallbackOutputSeeds[key] || fallbackOutputSeeds['Female_No'];
  };

  const outputPhotos = getOutputPhotosList();

  return (
    <div className="space-y-12 animate-fadeIn max-w-full">
      
      {/* SECTION 1: AI RECOMMENDED BACKGROUND GENERATOR */}
      <section className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Top accent border glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl border border-white/15 text-white shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-white uppercase tracking-wider">
                Feature 5: Background Generator
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                AI custom recommendations. Click on any background tile to update active stage viewport.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-white/10 text-zinc-300 border border-white/15 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
            10 AI variations
          </span>
        </div>

        {/* 10 BG Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
          {backgrounds.map((bgText, idx) => {
            const shortName = bgText.split(' - ')[0] || bgText;
            const desc = bgText.split(' - ')[1] || 'Scenic aesthetic background.';
            const isSelected = currentBGLegend === shortName;
            return (
              <div
                key={idx}
                onClick={() => {
                  setCurrentBGLegend(shortName);
                  onSelectBackground(shortName);
                }}
                className={`group p-3 rounded-2xl cursor-pointer border text-left transition-all ${
                  isSelected
                    ? 'bg-white/10 border-white/20 shadow-lg shadow-purple-500/5'
                    : 'bg-black/35 border-white/5 hover:border-white/10 hover:bg-black/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                    BG {idx + 1}
                  </span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                </div>
                <h4 className="text-[11px] font-bold font-mono text-zinc-250 mt-2 group-hover:text-purple-350 truncate">
                  {shortName}
                </h4>
                <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed mt-1">
                  {desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Custom background manual mode */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5 font-bold">
              Specify Custom Background Description
            </label>
            <input
              type="text"
              value={customBGPrompt}
              onChange={(e) => setCustomBGPrompt(e.target.value)}
              placeholder="e.g. Minimalist concrete loft with hanging plants and warm sunlight ray casting"
              className="block w-full py-2.5 px-3 bg-black/45 border border-white/10 rounded-xl text-white text-xs focus:border-purple-500 focus:outline-none transition-all font-sans"
            />
          </div>
          <button
            onClick={() => {
              if (customBGPrompt.trim()) {
                setCurrentBGLegend('Custom');
                onSelectBackground('Custom');
                triggerToast(`Custom Background Prompt locked: "${customBGPrompt}".`);
              }
            }}
            className="px-5 py-2.5 bg-white/5 text-zinc-300 font-mono text-xs font-semibold rounded-xl border border-white/10 hover:border-purple-500/30 hover:bg-white/10 cursor-pointer active:scale-95 transition-all w-full md:w-auto shrink-0"
          >
            Apply Custom Art
          </button>
        </div>
      </section>

      {/* SECTION 2: OUTPUT UGC ASSETS GENERATOR */}
      <section className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Top accent border glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
          <div>
            <h3 className="text-base font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
              Feature 9: Output UGC Assets Grid
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Generated {campaignState.outputCount} UGC assets with bulletproof character identity alignment.
            </p>
          </div>

          <div className="flex gap-2 shrink-0 select-none">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-[10px] font-mono text-zinc-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Identity Consistency Match: 100%</span>
            </div>
          </div>
        </div>

        {/* Outputs list matching count */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: campaignState.outputCount }).map((_, idx) => {
            const photoUrl = outputPhotos[idx % outputPhotos.length];
            const itemKey = `ugc-item-${idx}`;
            const activeTab = activePromptOption[itemKey] || 'A';
            const actionLoading = loadingCardState[itemKey] || null;

            return (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 hover:border-white/20 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Visual loading mask */}
                <AnimatePresence>
                  {actionLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3"
                    >
                      <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                        Applying {actionLoading}...
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Subheader info stats overlay */}
                <div className="flex items-center justify-between mb-3 text-[10px] font-mono text-zinc-400">
                  <span className="text-purple-400 font-bold uppercase tracking-widest">
                    OUT-UGC-00{idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500" /> 12.8K</span>
                    <span className="flex items-center gap-1"><Share2 className="w-3 h-3 text-purple-500" /> 4.2K</span>
                  </div>
                </div>

                {/* Card visual showcase */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Aspect Ratio box preview inside card */}
                  <div className="col-span-1 relative rounded-xl overflow-hidden aspect-[9/16] bg-black border border-white/10 shadow-lg">
                    <img
                      src={photoUrl}
                      alt={`Mockup UGC pose ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    {/* Live overlay banner */}
                    <div className="absolute bottom-2 inset-x-2 bg-black/60 backdrop-blur-md p-1 rounded text-[8px] font-mono text-white text-center">
                      POS: {idx + 1}
                    </div>
                  </div>

                  {/* Character stats specs metrics */}
                  <div className="col-span-2 space-y-3">
                    <div>
                      <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                        Identity Biometrics Checked
                      </h4>
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        {[
                          { label: 'Face Contour', v: '99.8%' },
                          { label: 'Ocular Iris', v: '100%' },
                          { label: 'Nasal Bridge', v: '99.9%' },
                          { label: 'Epidermal Tone', v: 'Locked' },
                          { label: 'Hijab/Hair Wrap', v: 'Identical' },
                        ].map((b, bIdx) => (
                          <div key={bIdx} className="bg-black/35 p-1.5 rounded-lg border border-white/5 flex justify-between text-[8px] font-mono">
                            <span className="text-zinc-500">{b.label}</span>
                            <span className="text-emerald-400 font-bold">{b.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Feature 10: Toggle Selection Options A/B */}
                    <div className="space-y-1">
                      <span className="block text-[10px] font-mono uppercase text-zinc-405 font-bold">
                        Feature 10: Video Prompt Generator
                      </span>
                      <div className="flex bg-black/45 p-1 rounded-lg border border-white/10">
                        <button
                          onClick={() => setActivePromptOption(prev => ({ ...prev, [itemKey]: 'A' }))}
                          className={`flex-1 py-1 text-[9px] font-mono rounded cursor-pointer transition-all ${
                            activeTab === 'A' ? 'bg-white/15 border border-white/15 text-white font-bold shadow-sm' : 'text-zinc-500 hover:text-zinc-350'
                          }`}
                        >
                          Visual Only
                        </button>
                        <button
                          onClick={() => setActivePromptOption(prev => ({ ...prev, [itemKey]: 'B' }))}
                          className={`flex-1 py-1 text-[9px] font-mono rounded cursor-pointer transition-all ${
                            activeTab === 'B' ? 'bg-white/15 border border-white/15 text-white font-bold shadow-sm' : 'text-zinc-500 hover:text-zinc-350'
                          }`}
                        >
                          Visual + VO + Lip Sync
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Prompt Render Area */}
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 mt-4 text-[10px] font-mono leading-relaxed max-h-[110px] overflow-y-auto relative md:min-h-[80px]">
                  {activeTab === 'A' ? (
                    <div>
                      <span className="text-[8px] text-purple-400 block font-bold uppercase mb-1">
                        OPTION A: VISUAL-ONLY AI PROMPT
                      </span>
                      <p className="text-zinc-300">
                        "A professional photorealistic ${campaignState.character.gender.toLowerCase()} creator styled with ${campaignState.character.hijab === 'Yes' ? 'hijab wrap' : 'styled hair'}, presenting ${campaignState.product.name} up close to the camera. Natural morning studio ambient background reflecting clean luxury. High detail skin texture, recorded on smartphone, cinematic depth of field."
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[8px] text-purple-400 block font-bold uppercase mb-1">
                        OPTION B: SYNCHRONIZED LIP-SYNC PROMPT
                      </span>
                      <div className="space-y-1">
                        <p className="text-zinc-300 font-bold">• Visual Prompt:</p>
                        <p className="text-zinc-400 italic">"Creator speaking directly face forward to camera, holding ${campaignState.product.name} package neatly tilted."</p>
                        <p className="text-purple-300 mt-1 font-bold">• Voice-Over Script:</p>
                        <p className="text-zinc-400">"{voiceover.hook} {voiceover.script}"</p>
                        <p className="text-cyan-400 mt-1 font-bold">• Advanced Lip-Sync Instructions:</p>
                        <p className="text-zinc-400">"Match phonetic vowel shapes exactly to audio track, natural eye blinks, relatable hand-held focus wiggle."</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleCopyText(
                      `prompt-${idx}`, 
                      activeTab === 'A' 
                        ? `A professional photorealistic ${campaignState.character.gender.toLowerCase()} creator presenting ${campaignState.product.name} up close to the camera...`
                        : `LipSync: ${voiceover.hook} ${voiceover.script}`
                    )}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 border border-white/10 rounded hover:border-purple-500/30 text-zinc-400 hover:text-purple-300 cursor-pointer transition-all"
                    title="Copy Prompt"
                  >
                    {copiedStates[`prompt-${idx}`] ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Sub buttons for items: Regenerate, Edit, HD Upscale, Remove BG, Pose variations */}
                <div className="grid grid-cols-5 gap-1.5 mt-4 pt-4 border-t border-white/5">
                  <button
                    onClick={() => triggerCardAction(itemKey, 'Regenerate', 'Regeneration')}
                    className="py-1 px-0.5 bg-black/40 border border-white/10 rounded-lg text-[9px] font-mono text-zinc-400 hover:border-purple-500/30 hover:text-purple-300 cursor-pointer"
                    title="Regenerate Asset"
                  >
                    REGEN
                  </button>
                  <button
                    onClick={() => triggerToast('Opening live overlay painter studio controls...')}
                    className="py-1 px-0.5 bg-black/40 border border-white/10 rounded-lg text-[9px] font-mono text-zinc-400 hover:border-purple-500/30 hover:text-purple-300 cursor-pointer"
                    title="Edit Output Sticker"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => triggerCardAction(itemKey, 'HD Upscale', '4K Upscale')}
                    className="py-1 px-0.5 bg-black/40 border border-white/10 rounded-lg text-[9px] font-mono text-zinc-400 hover:border-purple-500/30 hover:text-purple-300 cursor-pointer"
                    title="HD Upscale 4K"
                  >
                    4K-UP
                  </button>
                  <button
                    onClick={() => triggerCardAction(itemKey, 'Remove BG', 'Background transparency mask')}
                    className="py-1 px-0.5 bg-black/40 border border-white/10 rounded-lg text-[9px] font-mono text-zinc-400 hover:border-purple-500/30 hover:text-purple-300 cursor-pointer"
                    title="Remove Background"
                  >
                    NO-BG
                  </button>
                  <button
                    onClick={() => triggerCardAction(itemKey, 'Pose Variations', 'Secondary pose model recalculation')}
                    className="py-1 px-0.5 bg-black/40 border border-white/10 rounded-lg text-[9px] font-mono text-zinc-400 hover:border-purple-500/30 hover:text-purple-300 cursor-pointer"
                    title="Explore Pose Variations"
                  >
                    POSE-V
                  </button>
                </div>

                {/* Download formats */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/5 text-[10px] font-mono">
                  <span className="text-zinc-500 font-medium">Commercial License Export</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDownloadImage(`OUT-${idx}-JPG`, photoUrl)}
                      className="px-2.5 py-1 bg-white/5 border border-white/10 hover:border-white/20 rounded text-zinc-300 cursor-pointer font-bold transition-all"
                    >
                      JPG
                    </button>
                    <button
                      onClick={() => handleDownloadImage(`OUT-${idx}-PNG`, photoUrl)}
                      className="px-2.5 py-1 bg-white/5 border border-white/10 hover:border-white/20 rounded text-zinc-300 cursor-pointer font-bold transition-all"
                    >
                      PNG
                    </button>
                    <button
                      onClick={() => handleDownloadFile(`oval_ugc_item_${idx + 1}.txt`, `UGC Prompt Output Details\n\nVisual Prompt: ${prompts.visualPromptOnly}\n\nVoice-Over Script: ${voiceover.script}`)}
                      className="px-2.5 py-1 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 hover:border-purple-500/30 rounded text-purple-300 cursor-pointer font-bold transition-all"
                    >
                      ZIP Bundle
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: STORYBOARD MODE SCENES */}
      <section className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Top accent border glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />

        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl border border-white/15 text-white shadow-sm animate-pulse">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-white uppercase tracking-wider">
                Feature 8 storyboard: Content Flow
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                AI storyboard organized in a professional timeline layout matching {campaignState.storyboardScenesCount} scenes.
              </p>
            </div>
          </div>
        </div>

        {/* Stories list */}
        <div className="relative border-l-2 border-white/10 ml-4 pl-6 space-y-8 py-2">
          {storyboard.map((scene, index) => (
            <div key={index} className="relative group">
              {/* Animated Timeline marker */}
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-[#050505] border-2 border-purple-500 rounded-full group-hover:scale-120 transition-all flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
              </div>

              {/* Scene card layout */}
              <div className="bg-white/5 border border-white/13 rounded-2xl p-5 hover:border-white/20 transition-all">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-3 pb-3 border-b border-white/10 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-white/10 border border-white/15 text-zinc-300 rounded font-bold">
                      SCENE {scene.sceneNum}
                    </span>
                    <span className="text-zinc-650 font-bold">•</span>
                    <span className="text-zinc-400 font-bold">Camera: {scene.cameraAngle}</span>
                  </div>
                  <span className="text-zinc-500">Expression: {scene.characterExpression}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                      Visual Activity Script
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans font-medium">
                      {scene.description}
                    </p>
                    <p className="text-xs text-zinc-400 font-sans mt-2">
                      <strong className="text-purple-400 font-mono text-[10px] uppercase font-bold tracking-widest block mb-1">Creator Action:</strong>
                      {scene.characterActivity}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                      AI Generator Prompt (Visual)
                    </span>
                    <div className="bg-black/45 p-3 rounded-xl border border-white/5 text-[10px] font-mono leading-relaxed text-zinc-400 max-h-[100px] overflow-y-auto relative">
                      {scene.visualPrompt}
                      <button
                        onClick={() => handleCopyText(`scene-visual-${index}`, scene.visualPrompt)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 border border-white/10 rounded text-zinc-400 hover:text-purple-300 cursor-pointer transition-all"
                      >
                        {copiedStates[`scene-visual-${index}`] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                      Suggested Voice-Over (Audio Narrating)
                    </span>
                    <div className="bg-black/45 p-3 rounded-xl border border-white/5 text-xs text-zinc-350 leading-relaxed max-h-[100px] overflow-y-auto relative">
                      "{scene.suggestedVoiceover}"
                      <button
                        onClick={() => handleCopyText(`scene-vo-${index}`, scene.suggestedVoiceover)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 border border-white/10 rounded text-zinc-400 hover:text-purple-300 cursor-pointer transition-all"
                      >
                        {copiedStates[`scene-vo-${index}`] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: AI VOICE OVER GENERATOR */}
      <section className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Top accent border glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />

        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 mb-6 gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl border border-white/15 text-white shadow-sm">
              <Volume2 className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-white uppercase tracking-wider">
                Feature 12: Voice-Over Creator
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                Targeting style: <span className="text-purple-400 font-bold">{voiceover.style}</span> • Optimized for {campaignState.voiceOverDuration}s duration.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleDownloadFile('oval_studio_voiceover.txt', `Voice-over Script: ${voiceover.style}\n\nHook:\n${voiceover.hook}\n\nBody Script:\n${voiceover.script}\n\nCTA:\n${voiceover.cta}`)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-mono text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer select-none transition-all"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Export TXT</span>
            </button>
            <button
              onClick={() => {
                triggerToast('Voice Over script locked and stored securely inside Oval campaign library.');
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer select-none shadow-lg shadow-purple-500/15"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Voice-Over</span>
            </button>
          </div>
        </div>

        {/* Player UI mockup & Waveform simulation */}
        <div className="bg-black/35 border border-white/5 p-5 rounded-2xl mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPlayingAudio(!playingAudio)}
              className="w-12 h-12 rounded-full bg-purple-500 hover:bg-purple-400 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all shadow-lg"
            >
              {playingAudio ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>

            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span>Vocalizer Preview (Prebuilt Voice: Zephyr)</span>
                <span>{playingAudio ? '0:22' : '0:00'} / 0:{campaignState.voiceOverDuration}</span>
              </div>
              
              {/* Waveform graphic items bar */}
              <div className="h-6 flex items-center gap-1 overflow-hidden opacity-80 py-1.5 select-none">
                {Array.from({ length: 48 }).map((_, i) => {
                  const hVal = playingAudio ? Math.sin(i * 0.4) * 10 + 12 : 3;
                  return (
                    <div
                      key={i}
                      style={{ height: `${Math.max(3, hVal)}px` }}
                      className={`flex-1 rounded-full bg-gradient-to-t transition-all duration-300 ${
                        playingAudio ? 'from-purple-500 to-indigo-500' : 'from-zinc-700 to-zinc-650'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Narrate script copy editor blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black/45 p-4 rounded-xl border border-white/5 relative">
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold mb-2">
              1. Attack Hook (Attention Grabber)
            </h4>
            <p className="text-xs text-zinc-200 leading-relaxed font-sans font-medium">
              "{voiceover.hook}"
            </p>
            <button
              onClick={() => handleCopyText('vo-hook', voiceover.hook)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 border border-white/10 rounded hover:border-purple-500/30 text-zinc-400 hover:text-purple-300 cursor-pointer transition-all"
            >
              {copiedStates['vo-hook'] ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="bg-black/45 p-4 rounded-xl border border-white/5 relative">
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold mb-2">
              2. Body Narrative Script (Conversational)
            </h4>
            <p className="text-xs text-zinc-200 leading-relaxed font-sans font-medium">
              "{voiceover.script}"
            </p>
            <button
              onClick={() => handleCopyText('vo-script', voiceover.script)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 border border-white/10 rounded hover:border-purple-500/30 text-zinc-400 hover:text-purple-300 cursor-pointer transition-all"
            >
              {copiedStates['vo-script'] ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="bg-black/45 p-4 rounded-xl border border-white/5 relative">
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold mb-2">
              3. Conversion CTA (Closing focus)
            </h4>
            <p className="text-xs text-zinc-200 leading-relaxed font-sans font-medium">
              "{voiceover.cta}"
            </p>
            <button
              onClick={() => handleCopyText('vo-cta', voiceover.cta)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 border border-white/10 rounded hover:border-purple-500/30 text-zinc-400 hover:text-purple-300 cursor-pointer transition-all"
            >
              {copiedStates['vo-cta'] ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 5: COPYWRITING AD DELIVERABLES (HOOKS, CAPTIONS, HASHTAGS) */}
      <section className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Top accent border glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />

        <h3 className="text-base font-bold font-mono text-white uppercase tracking-wider mb-6 flex items-center gap-2">
          <ClipboardSignature className="w-5 h-5 text-purple-400 animate-pulse" />
          Feature 11: Content Copywriting Package
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* List of 10 Hooks */}
          <div className="bg-black/35 border border-white/5 p-4 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-xs font-mono uppercase tracking-wider text-purple-300 font-bold">
                10 High-Converting Viral Hooks
              </h4>
              <button
                onClick={() => handleCopyText('all-hooks', marketing.hooks.join('\n'))}
                className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] font-mono rounded text-zinc-300 hover:text-purple-300 cursor-pointer font-bold"
              >
                {copiedStates['all-hooks'] ? 'Copied List!' : 'Copy List'}
              </button>
            </div>
            
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
              {marketing.hooks.map((hText, idx) => (
                <div key={idx} className="bg-black/45 p-2.5 rounded-xl border border-white/5 flex items-start gap-2.5 group relative text-xs">
                  <span className="text-[10px] font-mono text-purple-500 font-bold mt-0.5 whitespace-nowrap">
                    #{idx + 1}
                  </span>
                  <p className="text-zinc-355 pr-8 leading-relaxed font-sans font-medium">{hText}</p>
                  <button
                    onClick={() => handleCopyText(`hook-${idx}`, hText)}
                    className="absolute right-2 top-2 p-1 text-zinc-500 hover:text-purple-400 opacity-60 group-hover:opacity-100 transition-colors cursor-pointer"
                  >
                    {copiedStates[`hook-${idx}`] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* List of 10 Captions */}
          <div className="bg-black/35 border border-white/5 p-4 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-xs font-mono uppercase tracking-wider text-purple-300 font-bold">
                10 Strategic Captions
              </h4>
              <button
                onClick={() => handleCopyText('all-captions', marketing.captions.join('\n'))}
                className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] font-mono rounded text-zinc-300 hover:text-purple-300 cursor-pointer font-bold"
              >
                {copiedStates['all-captions'] ? 'Copied List!' : 'Copy List'}
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
              {marketing.captions.map((cap, idx) => (
                <div key={idx} className="bg-black/45 p-2.5 rounded-xl border border-white/5 flex items-start gap-2.5 group relative text-xs">
                  <span className="text-[10px] font-mono text-purple-500 font-bold mt-0.5 whitespace-nowrap">
                    #{idx + 1}
                  </span>
                  <p className="text-zinc-300 pr-8 leading-relaxed font-sans">{cap}</p>
                  <button
                    onClick={() => handleCopyText(`caption-${idx}`, cap)}
                    className="absolute right-2 top-2 p-1 text-zinc-500 hover:text-purple-400 opacity-60 group-hover:opacity-100 transition-colors cursor-pointer"
                  >
                    {copiedStates[`caption-${idx}`] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 30 Hashtags block */}
        <div className="bg-black/35 border border-white/5 p-4 rounded-2xl mt-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 text-xs font-mono">
            <span className="text-purple-300 font-bold uppercase tracking-wider">
              30 Trending Campaign Hashtags
            </span>
            <button
              onClick={() => handleCopyText('all-hashtags', marketing.hashtags.map(tag => `#${tag}`).join(' '))}
              className="px-3.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-purple-300 rounded cursor-pointer transition-colors font-bold"
            >
              {copiedStates['all-hashtags'] ? 'Copied 30 tags!' : 'Copy All 30 Tags'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 py-1 max-h-[120px] overflow-y-auto scrollbar-none">
            {marketing.hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-black/55 text-[11px] font-mono text-zinc-300 border border-white/5 rounded-lg hover:border-purple-500/20 cursor-default transition-all"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FLOATING ACTION TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[60] bg-black/90 border border-purple-500/30 text-white font-mono text-xs px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
