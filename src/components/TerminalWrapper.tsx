import { ReactNode, useEffect } from 'react';
import CommandTerminal from '@/components/CommandTerminal';
import { useCommandTerminal } from '@/hooks/use-command-terminal';
import { Button } from '@/components/ui/button';
import { Terminal as TerminalIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TerminalWrapperProps {
  children: ReactNode;
}

const TerminalWrapper = ({ children }: TerminalWrapperProps) => {
  const { isTerminalOpen, openTerminal, closeTerminal } = useCommandTerminal();
  const { toast } = useToast();

  // Show a toast notification on first visit to inform about the terminal shortcut
  useEffect(() => {
    const hasSeenTerminalNotice = localStorage.getItem('seen_terminal_notice');
    
    if (!hasSeenTerminalNotice) {
      setTimeout(() => {
        toast({
          title: "Terminal Available",
          description: "Press Ctrl+` or Ctrl+K to open the command terminal",
        });
        localStorage.setItem('seen_terminal_notice', 'true');
      }, 3000);
    }
  }, [toast]);

  return (
    <>
      {children}
      
      {/* Terminal Button (fixed position) - moved from right to left */}
      <Button 
        size="icon"
        variant="outline"
        className="fixed left-4 bottom-4 z-50 h-10 w-10 rounded-full shadow-lg border-primary/30 hover:border-primary hover:bg-primary/20 animate-pulse"
        onClick={openTerminal}
      >
        <TerminalIcon className="h-5 w-5 text-[#8B0000]" />
      </Button>
      
      {/* Terminal Component */}
      <CommandTerminal 
        isOpen={isTerminalOpen}
        onOpenChange={closeTerminal}
      />
    </>
  );
};

export default TerminalWrapper;