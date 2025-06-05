import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import AnimatedLandingPage from "@/components/AnimatedLandingPage";
import { useCommandTerminal } from "@/hooks/use-command-terminal";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const { openTerminal } = useCommandTerminal();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Show a toast hint to use the terminal on first visit
  useEffect(() => {
    const hasSeenTerminalHint = localStorage.getItem('seen_terminal_hint');
    
    if (!hasSeenTerminalHint && !isAuthenticated) {
      setTimeout(() => {
        toast({
          title: "Access Required",
          description: "Use the terminal to log in or join the order",
        });
        localStorage.setItem('seen_terminal_hint', 'true');
      }, 3000);

      // Show a follow-up hint after a delay
      setTimeout(() => {
        toast({
          title: "Terminal Commands",
          description: "Try 'login' or 'register' to begin",
        });
      }, 6000);
    }
  }, [toast, isAuthenticated]);

  // Double click anywhere to open terminal
  const handleDoubleClick = () => {
    if (!isAuthenticated) {
      openTerminal();
    }
  };

  return (
    <div 
      className="min-h-screen bg-black text-white"
      onDoubleClick={handleDoubleClick}
    >
      <AnimatedLandingPage />
    </div>
  );
};

export default Index;