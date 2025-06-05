import { Button } from "@/components/ui/button";
import { 
  Skull, 
  Terminal, 
  Triangle,
  ArrowRight
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useCommandTerminal } from '@/hooks/use-command-terminal';

const CultHero = () => {
  const [initialized, setInitialized] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [showSymbols, setShowSymbols] = useState(false);
  const [revealText, setRevealText] = useState(false);
  const { openTerminal } = useCommandTerminal();

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

  // Staggered animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setInitialized(true), 800);
    const timer2 = setTimeout(() => setShowSymbols(true), 2000);
    const timer3 = setTimeout(() => setRevealText(true), 2800);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Cycle through phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % enigmaticPhrases.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-black">
      {/* Dark mystical background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,0,0,0.15),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(100,0,0,0.07),transparent_70%)]" style={{top: '60%'}} />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      
      {/* Main cult emblem */}
      <div className={`absolute h-80 w-80 transition-all duration-1500 ease-out ${
        initialized ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`}>
        {/* Using the custom cult logo from the second reference image */}
        <img 
          src="/image.png" 
          alt="Prompt or Die Emblem"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full object-contain z-10"
        />
        
        {/* Outer circle */}
        <div className="absolute h-full w-full rounded-full border-[1px] border-[#8B0000]/40 animate-[spin_60s_linear_infinite]">
          {/* Constellation points on outer circle */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div 
              key={`outer-${i}`} 
              className="absolute h-1.5 w-1.5 rounded-full bg-[#8B0000]/80" 
              style={{ 
                top: `${50 + 49 * Math.sin(i * (Math.PI / 6))}%`, 
                left: `${50 + 49 * Math.cos(i * (Math.PI / 6))}%` 
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center text-center max-w-3xl">
        <div className="space-y-8">
          {/* Main title */}
          <h1 className={`text-4xl sm:text-6xl font-bold leading-tight tracking-tighter mb-4 transition-all duration-1000 ${
            initialized ? 'opacity-100' : 'opacity-0 translate-y-10'
          }`}>
            <div className="glitch-text relative">
              <span className="relative text-transparent bg-clip-text text-[#8B0000] font-bold drop-shadow-[0_0_3px_rgba(139,0,0,0.8)] filter">
                PROMPT OR DIE
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-[#8B0000] via-white to-[#8B0000] opacity-70"></span>
              </span>
            </div>
          </h1>
          
          {/* Enigmatic subtitle with text reveal animation */}
          <p className={`text-xl text-muted-foreground max-w-xl mx-auto transition-all duration-1000 delay-300 font-mono ${
            revealText ? 'opacity-100' : 'opacity-0'
          }`}>
            {enigmaticPhrases[currentPhrase]}
          </p>
          
          {/* Cryptic description with fade-in */}
          <p className={`text-sm sm:text-base text-muted-foreground max-w-xl mx-auto transition-opacity duration-1000 delay-500 ${
            revealText ? 'opacity-100' : 'opacity-0'
          }`}>
            The knowledge lies within the structure. The structure lies within the prompt. 
            Access is granted only through the terminal. Enter the correct incantation.
          </p>
          
          {/* Call to action with ethereal glow effect */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-700 ${
            revealText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <Button 
              size="lg" 
              className="group relative bg-[#8B0000]/20 hover:bg-[#8B0000]/30 text-[#8B0000] border border-[#8B0000]/50 px-6 py-6 text-lg h-auto overflow-hidden"
              onClick={openTerminal}
            >
              {/* Glow effect */}
              <span className="absolute -inset-0 bg-[#8B0000] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></span>
              <span className="relative z-10 flex items-center">
                Access The Terminal
                <Terminal className="h-5 w-5 ml-2" />
              </span>
            </Button>
          </div>
        </div>
        
        {/* Mysterious floating symbols */}
        <div className={`mt-24 grid grid-cols-3 gap-6 sm:gap-10 transition-all duration-1000 delay-1000 ${
          showSymbols ? 'opacity-60' : 'opacity-0'
        }`}>
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Skull className="h-7 w-7 text-[#8B0000]/80 animate-float-symbol" style={{animationDelay: '0s'}} />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-px h-10 bg-[#8B0000]/10"></div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Terminal className="h-7 w-7 text-white/80 animate-float-symbol" style={{animationDelay: '1.5s'}} />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-px h-10 bg-white/10"></div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Triangle className="h-7 w-7 text-[#8B0000]/80 animate-float-symbol" style={{animationDelay: '2s'}} />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-px h-10 bg-[#8B0000]/10"></div>
            </div>
          </div>
        </div>
        
        {/* Cryptic footer text */}
        <div className={`mt-12 text-xs text-[#8B0000]/40 font-mono transition-opacity duration-1000 delay-1500 ${
          showSymbols ? 'opacity-100' : 'opacity-0'
        }`}>
          VER 23.7.9 · THE CIRCLE EXPANDS · THE KNOWLEDGE DEEPENS
        </div>
      </div>
    </div>
  );
};

export default CultHero;