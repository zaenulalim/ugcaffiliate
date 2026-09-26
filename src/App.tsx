import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, LayoutDashboard, Film, Volume2, Shield, LogOut, CheckCircle, HelpCircle, Loader2, Sparkle } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import LiveStudioPreview from './components/LiveStudioPreview';
import CampaignSettings from './components/CampaignSettings';
import CampaignOutput from './components/CampaignOutput';
import { CampaignState, StoryboardScene, VoiceOverOutput, UGCContentMarketing } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<'blueprint' | 'outputs'>('blueprint');

  // Core Campaign Configuration State
  const [campaignState, setCampaignState] = useState<CampaignState>({
    product: {
      name: '',
      function: '',
      benefits: '',
      targetAudience: '',
      category: '',
      marketingAngle: '',
      rawImage: undefined,
    },
    character: {
      mode: 'generator',
      gender: 'Female',
      ageRange: '26–35',
      hijab: 'Yes',
      referenceImage: undefined,
    },
    background: {
      selected: 'Aesthetic Bedroom',
      customPrompt: '',
    },
    aspectRatio: '9:16',
    cameraAngle: 'Eye Level',
    visualStyle: 'UGC Natural',
    storyboardScenesCount: 5,
    voiceOverStyle: 'Testimonial',
    voiceOverDuration: 30,
    outputCount: 4,
  });

  // Generated Assets State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [generatedData, setGeneratedData] = useState<{
    backgrounds: string[];
    storyboard: StoryboardScene[];
    voiceover: VoiceOverOutput;
    marketing: UGCContentMarketing;
    prompts: any;
  } | null>(null);

  // Steps to trigger while loading so the AI feels professional and reassuring
  const reassuranceMutedSteps = [
    'Locking model physical metrics & facial geometry...',
    'Synthesizing photorealistic environmental backdrops matching product category...',
    'Generating 10 cohesive viral copywriting hooks & captions...',
    'Structuring timeline storyboard scenes with camera directions...',
    'Generating conversational high-converting script and verbal sync rules...'
  ];

  const handleGenerateCampaign = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationStep(0);

    // Reassurance step timer cycles
    const stepInterval = setInterval(() => {
      setGenerationStep(prev => (prev < reassuranceMutedSteps.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const response = await fetch('/api/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignState }),
      });

      if (!response.ok) {
        throw new Error('Creative model generation session failed. Check server status.');
      }

      const campaignResult = await response.json();
      setGeneratedData(campaignResult);
      setActiveView('outputs');
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || 'Error occurred while organizing assets with Gemini.');
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
    }
  };

  // Allow selecting recommended background to test in live monitor viewport in real time
  const handleSelectBackground = (bgName: string) => {
    setCampaignState(prev => ({
      ...prev,
      background: {
        ...prev.background,
        selected: bgName,
      }
    }));
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans flex flex-col selection:bg-purple-500/30 selection:text-purple-300 relative overflow-x-hidden">
      {/* Absolute floating cosmic flares */}
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-purple-900/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-indigo-900/5 rounded-full blur-[160px] pointer-events-none" />

      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-[#050505]/75 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt pointer-events-none" />
            <div className="relative p-2.5 bg-black/40 border border-white/10 rounded-xl flex items-center justify-center">
              <Sparkle className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              OVAL STUDIO
            </h1>
            <p className="text-[10px] text-purple-400 font-mono tracking-widest mt-0.5 uppercase font-bold">
              AI User-Generated Content Suite
            </p>
          </div>
        </div>

        {/* Global Nav Indicators */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full select-none text-[10px] font-mono text-zinc-300">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
            <span>FALAH ENTERPRISE PRO ENGINE</span>
          </div>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="p-2 bg-white/5 w-10 h-10 flex items-center justify-center border border-white/10 hover:border-red-500/40 rounded-xl text-zinc-400 hover:text-red-400 cursor-pointer transition-colors"
            title="Log Out Studio"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* REASSURANCE LOAD SCREEN OVERLAY FOR UGC CREATIONS */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-6"
          >
            <div className="w-full max-w-md space-y-6">
              {/* Rotating glowing geometric icon wrapper */}
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-fuchsia-500 rounded-full blur-xl opacity-60 animate-pulse" />
                <div className="relative w-full h-full bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
                  Synthesizing UGC Assets
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto font-sans">
                  Please hold on as OVAL STUDIO aligns camera frames, character details, copywriting assets, and storyboarding elements.
                </p>
              </div>

              {/* Cycling message display */}
              <div className="bg-zinc-950/70 border border-zinc-950 rounded-2xl p-4 min-h-[70px] flex items-center justify-center">
                <p className="text-xs text-purple-300 font-mono animate-pulse">
                  {reassuranceMutedSteps[generationStep]}
                </p>
              </div>

              {/* Progress Bar indicator */}
              <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  style={{ width: `${((generationStep + 1) / reassuranceMutedSteps.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-fuchsia-400 transition-all duration-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT COCKPIT */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 overflow-x-hidden">
        
        {/* Left Side: Campaign Settings Cockpit (Takes 5 cols) */}
        <div className="lg:col-span-5 h-full flex flex-col gap-6">
          <CampaignSettings
            campaignState={campaignState}
            onChange={(newState) => setCampaignState(newState)}
            onGenerate={handleGenerateCampaign}
            isGenerating={isGenerating}
          />
        </div>

        {/* Right Side: Monitors & Outputs terminal (Takes 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Switch View toggles if campaign is generated */}
          {generatedData && (
            <div className="flex bg-black/40 p-1.5 border border-white/5 rounded-2xl select-none backdrop-blur-md">
              <button
                onClick={() => setActiveView('blueprint')}
                className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activeView === 'blueprint'
                    ? 'bg-white/10 text-white border border-white/20 shadow-inner'
                    : 'bg-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Blueprint Studio Layout
              </button>
              <button
                onClick={() => setActiveView('outputs')}
                className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activeView === 'outputs'
                    ? 'bg-white/10 text-white border border-white/20 shadow-inner'
                    : 'bg-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Generated UGC Deliverables
              </button>
            </div>
          )}

          {/* Conditional View Renders */}
          {activeView === 'blueprint' || !generatedData ? (
            <div className="space-y-6">
              {/* Feature 6, 7 Monitor Preview */}
              <LiveStudioPreview
                aspectRatio={campaignState.aspectRatio}
                cameraAngle={campaignState.cameraAngle}
                visualStyle={campaignState.visualStyle}
                character={campaignState.character}
                product={campaignState.product}
                backgroundType={campaignState.background.selected}
                customBackgroundPrompt={campaignState.background.customPrompt}
              />

              {/* Guide card showing how to build standard assets */}
              {!generatedData && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-center min-h-[160px] text-center shadow-[0_0_50px_rgba(168,85,247,0.05)] backdrop-blur-sm">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-900/10 rounded-full blur-[80px] pointer-events-none" />
                  <p className="text-zinc-300 font-sans text-xs max-w-md mx-auto leading-relaxed relative z-10">
                    Specify your product features and character persona profiles in the left control panel, then trigger the <span className="text-purple-400 font-mono font-bold">Generate</span> engine to output specialized voiceovers, interactive storyboards, copywriting packs, and customized photorealistic assets.
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Complete outputs terminal
            <CampaignOutput
              campaignState={campaignState}
              backgrounds={generatedData.backgrounds}
              storyboard={generatedData.storyboard}
              voiceover={generatedData.voiceover}
              marketing={generatedData.marketing}
              prompts={generatedData.prompts}
              onSelectBackground={handleSelectBackground}
              onRefreshCampaign={handleGenerateCampaign}
            />
          )}

        </div>

      </main>

      {/* FOOTER */}
      <footer className="shrink-0 border-t border-zinc-900/80 bg-zinc-950 py-4 text-center text-xs font-mono text-zinc-600 mt-auto select-none">
        <p>© 2026 OVAL STUDIO. Crafted for enterprise marketing excellence.</p>
      </footer>

    </div>
  );
}
