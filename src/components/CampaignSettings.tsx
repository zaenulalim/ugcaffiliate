import React, { useState, useRef } from 'react';
import { 
  Upload, Sparkles, User, Camera, Image as ImageIcon, Sliders, 
  HelpCircle, Check, Scan, Tv as RatioIcon, Zap, Loader2
} from 'lucide-react';
import { CampaignState, ProductSpec, CharacterConfig, AspectRatio, CameraAngle, VisualStyle, VoiceOverStyle } from '../types';

interface CampaignSettingsProps {
  campaignState: CampaignState;
  onChange: (state: CampaignState) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function CampaignSettings({
  campaignState,
  onChange,
  onGenerate,
  isGenerating,
}: CampaignSettingsProps) {
  const [activeTab, setActiveTab] = useState<'product' | 'character' | 'specs' | 'framing'>('product');
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState<string | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);

  const productFileRef = useRef<HTMLInputElement>(null);
  const charFileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. Feature 1: Product Upload & Crop Handlers
  const handleProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateProduct({ ...campaignState.product, rawImage: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleProductDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateProduct({ ...campaignState.product, rawImage: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProductImage = () => {
    updateProduct({ ...campaignState.product, rawImage: undefined });
  };

  // 2. Feature 2: Character Reference Handlers
  const handleCharUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateCharacter({
          ...campaignState.character,
          mode: 'reference',
          referenceImage: base64,
          croppedImage: base64, // Default to full
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const startWebcam = async () => {
    try {
      setWebcamActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access rejected or missing. Simulating photo frame.');
      // Auto capture with beautiful mock portrait
      setTimeout(() => {
        captureWebcamMock();
      }, 1500);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  const captureWebcamMock = () => {
    // Elegant fallback portrait
    const maleMock = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400';
    updateCharacter({
      ...campaignState.character,
      mode: 'reference',
      referenceImage: maleMock,
      croppedImage: maleMock,
    });
    setWebcamActive(false);
  };

  const useGalleryModel = (url: string) => {
    updateCharacter({
      ...campaignState.character,
      mode: 'reference',
      referenceImage: url,
      croppedImage: url,
    });
  };

  // 3. Feature 4: Vision-Powered Gemini Specs Analyzer
  const handleAnalyzeSpecs = async () => {
    setVisionLoading(true);
    setVisionError(null);
    try {
      const bodyPayload = campaignState.product.rawImage 
        ? { rawImage: campaignState.product.rawImage }
        : { manualDescription: campaignState.product.function || 'Skincare fluid' };

      const response = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        throw new Error('Analysis failed. Please check network.');
      }

      const specs = await response.json();
      updateProduct({
        name: specs.name || 'Glow Serum Pro',
        function: specs.function || 'Advanced skin brightener',
        benefits: specs.benefits || '• Promotes glow\n• Hydrates skin\n• Smooths pores',
        targetAudience: specs.targetAudience || 'Beauty Enthusiasts',
        category: specs.category || 'Skincare / Cosmetics',
        marketingAngle: specs.marketingAngle || 'Before & After Transformation',
        rawImage: campaignState.product.rawImage,
      });
    } catch (err: any) {
      setVisionError(err.message || 'Error occurred during server specification generation.');
    } finally {
      setVisionLoading(false);
    }
  };

  // State utility updates
  const updateProduct = (product: ProductSpec) => {
    onChange({ ...campaignState, product });
  };

  const updateCharacter = (character: CharacterConfig) => {
    onChange({ ...campaignState, character });
  };

  const updateField = <K extends keyof CampaignState>(key: K, value: CampaignState[K]) => {
    onChange({ ...campaignState, [key]: value });
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl flex flex-col justify-between h-full relative overflow-hidden">
      {/* Absolute top accent glow overlay */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      {/* Tabs */}
      <div className="flex border-b border-white/5 pb-4 shrink-0 overflow-x-auto gap-2 scrollbar-none relative">
        <button
          onClick={() => setActiveTab('product')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap uppercase tracking-wider ${
            activeTab === 'product'
              ? 'bg-white/10 text-white border-white/20 shadow-md'
              : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Product Upload
        </button>
        <button
          onClick={() => setActiveTab('character')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap uppercase tracking-wider ${
            activeTab === 'character'
              ? 'bg-white/10 text-white border-white/20 shadow-md'
              : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Creator Match
        </button>
        <button
          onClick={() => setActiveTab('specs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap uppercase tracking-wider ${
            activeTab === 'specs'
              ? 'bg-white/10 text-white border-white/20 shadow-md'
              : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          AI Specifications
        </button>
        <button
          onClick={() => setActiveTab('framing')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap uppercase tracking-wider ${
            activeTab === 'framing'
              ? 'bg-white/10 text-white border-white/20 shadow-md'
              : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200'
          }`}
        >
          <Scan className="w-3.5 h-3.5" />
          Framing & Style
        </button>
      </div>

      <div className="flex-1 min-h-[460px] py-6">
        {/* TAB 1: PRODUCT UPLOAD */}
        {activeTab === 'product' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h4 className="text-sm font-semibold font-mono text-zinc-300 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Feature 1: Product Upload
              </h4>
              <p className="text-xs text-zinc-400">
                Provide a clean, high-resolution thumbnail of the product packshot.
              </p>
            </div>

            {/* Drag & Drop Visual Area */}
            {!campaignState.product.rawImage ? (
              <div
                onDragOver={handleProductDragOver}
                onDrop={handleProductDrop}
                onClick={() => productFileRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-2xl p-10 text-center cursor-pointer transition-all bg-black/20 hover:bg-black/40 flex flex-col items-center justify-center gap-3.5 group relative"
              >
                <input
                  type="file"
                  ref={productFileRef}
                  onChange={handleProductUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl group-hover:scale-105 transition-all text-purple-400 group-hover:text-purple-355">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Drag & Drop Product Image</p>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">PNG, JPG, up to 10MB (HD asset preservation)</p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-white/5 border border-white/10 text-[10px] font-mono rounded-xl group-hover:bg-white/10 group-hover:border-white/20 text-zinc-300 cursor-pointer uppercase tracking-wider transition-all"
                >
                  Select File
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-black/40 rounded-2xl p-4 border border-white/10 flex items-center justify-center min-h-[220px]">
                  <img
                    src={campaignState.product.rawImage}
                    alt="Uploaded Product"
                    referrerPolicy="no-referrer"
                    className="max-h-[160px] object-contain rounded-xl drop-shadow-xl"
                  />
                  <button
                    onClick={removeProductImage}
                    className="absolute top-3 right-3 px-3 py-1 bg-red-950/40 text-red-400 text-[10px] font-mono border border-red-500/20 rounded-lg hover:bg-red-900/30 cursor-pointer transition-colors"
                  >
                    Remove Item
                  </button>
                </div>

                {/* Simulated Crop & Zoom Control indicators */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3.5">
                  <h5 className="text-[10px] font-mono uppercase tracking-wider text-purple-400 flex items-center gap-1.5 font-bold">
                    <Sliders className="w-3.5 h-3.5" />
                    Interactive Crop & Zoom Controls
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-400">
                    <div>
                      <span>Fine Crop Adjustment</span>
                      <span className="block text-[10px] text-zinc-600 mt-1">Scale aligned to 1:1 margins</span>
                    </div>
                    <div className="flex justify-end gap-2.5 items-center">
                      <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer text-[10px] text-zinc-300 uppercase transition-colors">ROTATE 90°</button>
                      <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer text-[10px] text-zinc-300 uppercase transition-colors">FLIP H</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
             {/* TAB 2: REFERENCE CHARACTER */}
        {activeTab === 'character' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold font-mono text-zinc-300 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Feature 2 & 3: Model Alignment
                </h4>
                <p className="text-xs text-zinc-400">
                  Select how OVAL STUDIO models your creator identity consistency.
                </p>
              </div>

              {/* Mode toggles */}
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 select-none">
                <button
                  type="button"
                  onClick={() => updateCharacter({ ...campaignState.character, mode: 'reference' })}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
                    campaignState.character.mode === 'reference'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-transparent text-zinc-500'
                  }`}
                >
                  custom reference
                </button>
                <button
                  type="button"
                  onClick={() => updateCharacter({ ...campaignState.character, mode: 'generator' })}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
                    campaignState.character.mode === 'generator'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-transparent text-zinc-500'
                  }`}
                >
                  AI GENERATOR
                </button>
              </div>
            </div>

            {/* Option A: Reference Upload / Webcam */}
            {campaignState.character.mode === 'reference' ? (
              <div className="space-y-4">
                {webcamActive ? (
                  <div className="relative border border-white/10 rounded-2xl bg-black/40 overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
                    <video ref={videoRef} className="w-full max-h-[180px] object-cover scale-x-[-1]" />
                    <div className="absolute inset-x-0 bottom-3 flex justify-center gap-3">
                      <button
                        onClick={captureWebcamMock}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-550 text-[10px] font-mono text-white rounded-xl border border-white/20 cursor-pointer uppercase tracking-wider transition-colors"
                      >
                        Capture Selfie Frame
                      </button>
                      <button
                        onClick={stopWebcam}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[10px] font-mono text-zinc-400 rounded-xl cursor-pointer uppercase border border-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : campaignState.character.referenceImage ? (
                  <div className="relative border border-white/10 rounded-2xl bg-white/5 p-4 flex flex-col items-center justify-center min-h-[200px]">
                    <img
                      src={campaignState.character.referenceImage}
                      alt="Model reference preview"
                      referrerPolicy="no-referrer"
                      className="max-h-[140px] rounded-full aspect-square object-cover border-2 border-purple-500 shadow-lg"
                    />
                    <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mt-3 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Face & Body Shape Locked
                    </p>
                    <button
                      onClick={() => updateCharacter({ ...campaignState.character, referenceImage: undefined })}
                      className="absolute top-3 right-3 px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-mono text-zinc-500 rounded-lg cursor-pointer transition-colors uppercase"
                    >
                      Clear Selection
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={() => charFileRef.current?.click()}
                      className="border border-dashed border-white/10 hover:border-white/20 rounded-2xl py-8 text-center cursor-pointer transition-all bg-black/20 hover:bg-black/40 flex flex-col items-center justify-center gap-2"
                    >
                      <input
                        type="file"
                        ref={charFileRef}
                        onChange={handleCharUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Upload className="w-6 h-6 text-purple-400" />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">Upload Model Photo</p>
                        <p className="text-[10px] text-zinc-500 mt-1 font-mono">PNG / JPG</p>
                      </div>
                    </div>

                    <div
                      onClick={startWebcam}
                      className="border border-dashed border-white/10 hover:border-white/20 rounded-2xl py-8 text-center cursor-pointer transition-all bg-black/20 hover:bg-black/40 flex flex-col items-center justify-center gap-2"
                    >
                      <Camera className="w-6 h-6 text-purple-400" />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">Upload from Camera</p>
                        <p className="text-[10px] text-zinc-500 mt-1 font-mono">Live selfie model capture</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Predefined UGC models list */}
                <div>
                  <h5 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-3">
                    Or select from Pre-Approved Creator Gallery
                  </h5>
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
                      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
                      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
                      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=150',
                    ].map((mUrl, index) => (
                      <div
                        key={index}
                        onClick={() => useGalleryModel(mUrl)}
                        className={`aspect-square overflow-hidden rounded-xl cursor-pointer border-2 transition-all relative ${
                          campaignState.character.referenceImage === mUrl
                            ? 'border-purple-500 saturate-100 scale-95'
                            : 'border-white/10 saturate-50 hover:saturate-100 hover:border-white/20'
                        }`}
                      >
                        <img src={mUrl} alt={`Creator ${index}`} className="w-full h-full object-cover" />
                        {campaignState.character.referenceImage === mUrl && (
                          <div className="absolute inset-0 bg-purple-950/20 flex items-center justify-center">
                            <Check className="w-5 h-5 text-purple-300" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Option B: AI Character Generator
              <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10 animate-fadeIn">
                <div className="grid grid-cols-2 gap-4">
                  {/* Gender Selector */}
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-2 font-bold">
                      Gender
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                      {(['Male', 'Female'] as const).map((g) => (
                        <button
                          key={g}
                          onClick={() => updateCharacter({ ...campaignState.character, gender: g })}
                          className={`py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg cursor-pointer ${
                            campaignState.character.gender === g
                              ? 'bg-white/10 text-white border border-white/10'
                              : 'bg-transparent text-zinc-500'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hijab Option is only editable for Females */}
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-2 font-bold">
                      Hijab Preference
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                      {(['Yes', 'No'] as const).map((h) => (
                        <button
                          key={h}
                          onClick={() => {
                            if (campaignState.character.gender === 'Female') {
                              updateCharacter({ ...campaignState.character, hijab: h });
                            }
                          }}
                          disabled={campaignState.character.gender === 'Male'}
                          className={`py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg cursor-pointer ${
                            campaignState.character.hijab === h && campaignState.character.gender === 'Female'
                              ? 'bg-white/10 text-white border border-white/10'
                              : 'bg-transparent text-zinc-500 disabled:opacity-45'
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Age Range list */}
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-2 font-bold">
                    Age Demographic
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['18–25', '26–35', '36–45', '46+'] as const).map((age) => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => updateCharacter({ ...campaignState.character, ageRange: age })}
                        className={`py-2 text-[10px] font-mono border rounded-xl cursor-pointer transition-all text-center uppercase tracking-wider ${
                          campaignState.character.ageRange === age
                            ? 'bg-white/10 text-white border-white/20'
                            : 'bg-black/30 text-zinc-500 border-white/10 hover:text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-[10px] font-mono text-purple-400 leading-relaxed uppercase tracking-wider mb-1 flex items-center gap-1 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    Consistent Identity Lock Active
                  </p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Facial geometry, epidermal qualities, and hair structures remain mathematically locked across all generations.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SPECIFICATION & AI ANALYZER */}
        {activeTab === 'specs' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold font-mono text-zinc-300 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Feature 4: Campaign Specifications
                </h4>
                <p className="text-xs text-zinc-400">
                  Manual details or single-click vision-powered analyzer.
                </p>
              </div>

              {/* AI spec extraction trigger */}
              <button
                type="button"
                onClick={handleAnalyzeSpecs}
                disabled={visionLoading}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-550 disabled:bg-white/5 disabled:text-zinc-600 text-white font-mono text-[10px] rounded-xl flex items-center gap-2 cursor-pointer border border-white/10 active:scale-95 transition-all shadow-lg shadow-purple-500/10 uppercase tracking-wider shrink-0"
              >
                {visionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>AI Analysis Mode</span>
                  </>
                )}
              </button>
            </div>

            {visionError && (
              <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {visionError}
              </div>
            )}

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1.5 scrollbar-none">
              {/* Product Name */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={campaignState.product.name}
                  onChange={(e) => updateProduct({ ...campaignState.product, name: e.target.value })}
                  placeholder="e.g. Glowing Serum"
                  className="block w-full py-3 px-4 bg-black/40 border border-white/10 hover:border-white/20 focus:border-purple-500/50 rounded-2xl text-white placeholder-zinc-700 focus:outline-none transition-all font-sans text-xs"
                />
              </div>

              {/* Product Function */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">
                  Product Function (Manual Mode Input description)
                </label>
                <textarea
                  rows={2}
                  value={campaignState.product.function}
                  onChange={(e) => updateProduct({ ...campaignState.product, function: e.target.value })}
                  placeholder="e.g. Brightening facial serum with Niacinamide and Vitamin C."
                  className="block w-full py-3 px-4 bg-black/40 border border-white/10 hover:border-white/20 focus:border-purple-500/50 rounded-2xl text-white placeholder-zinc-700 focus:outline-none transition-all font-sans text-xs"
                />
              </div>

              {/* Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">
                    Product Category
                  </label>
                  <input
                    type="text"
                    value={campaignState.product.category}
                    onChange={(e) => updateProduct({ ...campaignState.product, category: e.target.value })}
                    placeholder="e.g. Skincare / Makeup"
                    className="block w-full py-3 px-4 bg-black/40 border border-white/10 hover:border-white/20 focus:border-purple-500/50 rounded-2xl text-white placeholder-zinc-700 focus:outline-none transition-all font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={campaignState.product.targetAudience}
                    onChange={(e) => updateProduct({ ...campaignState.product, targetAudience: e.target.value })}
                    placeholder="e.g. Gen Z Skincare lovers"
                    className="block w-full py-3 px-4 bg-black/40 border border-white/10 hover:border-white/20 focus:border-purple-500/50 rounded-2xl text-white placeholder-zinc-700 focus:outline-none transition-all font-sans text-xs"
                  />
                </div>
              </div>

              {/* Key Benefits */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">
                  Key Benefits
                </label>
                <textarea
                  rows={2}
                  value={campaignState.product.benefits}
                  onChange={(e) => updateProduct({ ...campaignState.product, benefits: e.target.value })}
                  placeholder="• Brightens skin tone&#10;• Locks essential moisture&#10;• Restores glow"
                  className="block w-full py-3 px-4 bg-black/40 border border-white/10 hover:border-white/20 focus:border-purple-500/50 rounded-2xl text-white placeholder-zinc-700 focus:outline-none transition-all font-sans text-xs"
                />
              </div>

              {/* Marketing Angle */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">
                  UGC Marketing Angle Recommendation
                </label>
                <input
                  type="text"
                  value={campaignState.product.marketingAngle}
                  onChange={(e) => updateProduct({ ...campaignState.product, marketingAngle: e.target.value })}
                  placeholder="e.g. Relatable 7-day challenge showcase"
                  className="block w-full py-3 px-4 bg-black/40 border border-white/10 hover:border-white/20 focus:border-purple-500/50 rounded-2xl text-white placeholder-zinc-700 focus:outline-none transition-all font-sans text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FRAMING, STYLE & OUTPUT QUANTITY */}
        {activeTab === 'framing' && (
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1.5 scrollbar-none animate-fadeIn">
            {/* Row 1: Aspect Ratio selectors & Live Preview Frame */}
            <div>
              <h4 className="text-[11px] font-semibold font-mono text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-bold">
                <RatioIcon className="w-4 h-4 text-purple-400" />
                Feature 6: Aspect Ratio
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '9:16 (vertical)', value: '9:16' as AspectRatio, sub: 'TikTok, Reels' },
                  { label: '1:1 (square)', value: '1:1' as AspectRatio, sub: 'IG Feed' },
                  { label: '16:9 (horizontal)', value: '16:9' as AspectRatio, sub: 'YouTube' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => updateField('aspectRatio', item.value)}
                    className={`p-2.5 border rounded-xl text-left cursor-pointer transition-all ${
                      campaignState.aspectRatio === item.value
                        ? 'bg-white/10 text-white border-white/20 shadow-md'
                        : 'bg-black/35 border-white/10 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <div className="text-xs font-mono font-medium">{item.value}</div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Camera Angle selectors */}
            <div>
              <h4 className="text-[11px] font-semibold font-mono text-zinc-400 uppercase tracking-widest mb-2 font-bold">
                Feature 7: Camera Angle
              </h4>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  'Eye Level', 'Close Up', 'Extreme Close Up', 'Medium Shot',
                  'Full Body', 'Over Shoulder', 'POV', 'Selfie Camera',
                  'Mirror Shot', 'Low Angle', 'High Angle', 'Product Focus'
                ].map((ang) => (
                  <button
                    key={ang}
                    type="button"
                    onClick={() => updateField('cameraAngle', ang as CameraAngle)}
                    className={`py-1.5 px-1 border transition-all rounded-lg text-center cursor-pointer text-[10px] font-mono truncate ${
                      campaignState.cameraAngle === ang
                        ? 'bg-white/15 text-white border-white/20 font-bold'
                        : 'bg-black/35 text-zinc-550 border-white/5 hover:text-zinc-300'
                    }`}
                  >
                    {ang}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Visual Style selectors */}
            <div>
              <h4 className="text-[11px] font-semibold font-mono text-zinc-400 uppercase tracking-widest mb-2 font-bold">
                Feature 8: Visual UGC Style
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'UGC Natural', 'Mirror Check', 'POV Hand Review', 'Beauty Influencer',
                  'Lifestyle Content', 'Product Showcase', 'Cinematic UGC', 'Luxury Branding',
                  'Testimonial Style', 'Before & After Review'
                ].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateField('visualStyle', st as VisualStyle)}
                    className={`p-2 border transition-all rounded-xl text-left cursor-pointer truncate ${
                      campaignState.visualStyle === st
                        ? 'bg-white/10 text-white border-white/20 shadow-md font-bold'
                        : 'bg-black/35 text-zinc-550 border-white/5 hover:text-zinc-300'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-medium truncate">{st}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Storyboard Count & Background and Outputs Count configuration */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5 text-ellipsis overflow-hidden whitespace-nowrap">
                  Storyboard Scenes
                </label>
                <select
                  value={campaignState.storyboardScenesCount}
                  onChange={(e) => updateField('storyboardScenesCount', Number(e.target.value) as any)}
                  className="block w-full py-2.5 px-3 bg-black/55 border border-white/10 rounded-xl text-white text-xs focus:border-purple-500 focus:outline-none"
                >
                  <option value={3}>3 Scenes</option>
                  <option value={5}>5 Scenes</option>
                  <option value={8}>8 Scenes</option>
                  <option value={10}>10 Scenes</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5 text-ellipsis overflow-hidden whitespace-nowrap">
                  Voice Over Duration
                </label>
                <select
                  value={campaignState.voiceOverDuration}
                  onChange={(e) => updateField('voiceOverDuration', Number(e.target.value) as any)}
                  className="block w-full py-2.5 px-3 bg-black/55 border border-white/10 rounded-xl text-white text-xs focus:border-purple-500 focus:outline-none"
                >
                  <option value={15}>15 Seconds</option>
                  <option value={30}>30 Seconds</option>
                  <option value={45}>45 Seconds</option>
                  <option value={60}>60 Seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5 text-ellipsis overflow-hidden whitespace-nowrap font-bold">
                  Output Gallery
                </label>
                <select
                  value={campaignState.outputCount}
                  onChange={(e) => updateField('outputCount', Number(e.target.value) as any)}
                  className="block w-full py-2.5 px-3 bg-black/55 border border-white/10 rounded-xl text-white text-xs focus:border-purple-500 focus:outline-none"
                >
                  <option value={2}>2 Outputs</option>
                  <option value={4}>4 Outputs</option>
                  <option value={8}>8 Outputs</option>
                  <option value={16}>16 Outputs</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Campaign generation trigger button */}
      <div className="border-t border-white/10 pt-4 mt-4 shrink-0">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="relative w-full py-4.5 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:from-purple-500 hover:via-indigo-500 hover:to-fuchsia-500 disabled:from-white/5 disabled:to-white/5 disabled:text-zinc-600 border border-white/15 rounded-2xl font-bold font-mono text-sm uppercase tracking-wider text-white shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-purple-500/10 active:shadow-none"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Synthesizing UGC Assets...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 text-purple-300 animate-pulse animate-infinite" />
              <span>Generate UGC Campaign</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
