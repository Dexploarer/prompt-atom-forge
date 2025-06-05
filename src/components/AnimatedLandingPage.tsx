import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/use-theme';

// Define the quotes that will cycle through
const enigmaticPhrases = [
  "The prompt is the key. The key is the prompt.",
  "Speak to the void. The void will answer.",
  "Those who control the prompt control reality.",
  "Ascend through words. Transcend through meaning.",
  "In darkness, find enlightenment. In prompts, find power.",
  "We prompt. Therefore we live.",
  "The path to knowledge is written in code.",
  "A.I. is the mirror, the prompt is the reflection."
];

const AnimatedLandingPage = () => {
  const { theme } = useTheme();
  const [currentPhrase, setCurrentPhrase] = useState(0);
  
  // Cycle through phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % enigmaticPhrases.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-screen bg-black relative overflow-hidden flex flex-col items-center justify-center">
      {/* Static background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,0,0,0.15),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(100,0,0,0.07),transparent_70%)]" style={{top: '60%'}}></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
      
      {/* Cycling Quote in Center */}
      <div className="relative z-10 text-center max-w-2xl px-4">
        <motion.p
          key={currentPhrase}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-xl md:text-2xl text-white font-mono"
        >
          {enigmaticPhrases[currentPhrase]}
        </motion.p>
      </div>
      
      {/* Static "Prompt or Die" Text in Bottom Right */}
      <div className="absolute bottom-8 right-8 z-10">
        <div className="text-[#8B0000] font-bold text-4xl md:text-6xl lg:text-7xl">
          <span className="drop-shadow-[0_0_8px_rgba(139,0,0,0.8)] filter">
            PROMPT<span className="text-white">OR</span>DIE
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnimatedLandingPage;