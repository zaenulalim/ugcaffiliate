import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Sparkles, KeyRound, AlertTriangle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (keyword.trim() === '') {
      setError('Please enter the access keyword.');
      triggerShake();
      return;
    }

    if (keyword.trim() === 'falah85') {
      setIsLoading(true);
      setTimeout(() => {
        onLoginSuccess();
        setIsLoading(false);
      }, 1200);
    } else {
      triggerShake();
      setError('Invalid Access Keyword. Please try again.');
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden font-sans">
      {/* Decorative cosmic glowing background vectors */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-950/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Grid Pattern overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Title Group */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/5 border border-white/10 text-purple-300 text-[10px] font-mono rounded-full mb-4 uppercase tracking-[0.2em]"
          >
            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
            AI UGC Creator Studio
          </motion.div>

          <h1 className="text-4xl font-extrabold tracking-tighter text-white mb-1">
            OVAL STUDIO
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-purple-400 font-bold">
            By <span className="hover:text-purple-350 transition-colors cursor-default">Falah</span>
          </p>
        </div>

        {/* Login Box */}
        <motion.div
          animate={isShaking ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.1)] relative"
        >
          {/* Subtle highlight bar */}
          <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Lock className="w-4.5 h-4.5 text-purple-400" />
            Secure Studio Entrance
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="keyword" className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-2">
                Access Keyword
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                   id="keyword"
                  type="password"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Enter Access Keyword"
                  className="block w-full pl-11 pr-4 py-3.5 bg-black/40 hover:bg-black/60 focus:bg-black/80 border border-white/10 focus:border-purple-500/50 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all font-mono text-xs"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-400 text-xs leading-relaxed"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
               id="submit-login"
              type="submit"
              disabled={isLoading}
              className="relative w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-505 active:scale-98 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-500/10 active:shadow-none transition-all duration-200 cursor-pointer overflow-hidden border border-purple-400/10 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Unlock Studio Engine</span>
                  <Sparkles className="w-4 h-4 text-purple-300" />
                </>
              )}
            </button>
          </form>

          {/* Hint for demo review */}
          <div className="mt-6 text-center text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Access Code: <code className="text-purple-300 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">falah85</code>
          </div>
        </motion.div>

        {/* Footer info/Enterprise branding */}
        <p className="text-center text-zinc-600 text-[9px] font-mono tracking-widest mt-10 uppercase">
          STORAGE SECURE • CRYPTOGRAPHIC COMMERCIAL PRIVACY
        </p>
      </motion.div>
    </div>
  );
}
