import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { 
  ExternalLink, 
  Github, 
  LogOut, 
  Menu, 
  Moon, 
  Sun, 
  Terminal, 
  User 
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { useCommandTerminal } from '@/hooks/use-command-terminal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { openTerminal } = useCommandTerminal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account"
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message || "An error occurred while signing out",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50 transition-all">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md overflow-hidden">
              <img 
                src="/image.png" 
                alt="Prompt or Die" 
                className="h-full w-full object-contain"
              />
            </div>
            <h1 
              className="text-xl font-bold glitch-text hidden sm:block" 
              data-text="Prompt or Die"
            >
              Prompt or Die
            </h1>
          </Link>
          <span className="text-xs text-[#8B0000] font-mono bg-[#8B0000]/10 px-2 py-1 rounded border border-[#8B0000]/20">
            BETA
          </span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/gallery" className="text-sm font-medium hover:text-[#8B0000] transition-colors">Gallery</Link>
          <Link to="/docs" className="text-sm font-medium hover:text-[#8B0000] transition-colors">Docs</Link>
          <a 
            href="https://github.com/promptordie/prompt-builder" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-medium hover:text-[#8B0000] transition-colors flex items-center gap-1"
          >
            GitHub
            <ExternalLink className="h-3 w-3" />
          </a>
        </nav>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={openTerminal}
            title="Open Terminal (Ctrl + `)"
            className="rounded-full"
          >
            <Terminal className="h-[18px] w-[18px] text-[#8B0000]" />
          </Button>
          
          <div className="hidden sm:block">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-border hover:border-[#8B0000] hover:text-[#8B0000]"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {user?.email?.split('@')[0] || 'Account'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000]/10 hover:border-[#8B0000]/60"
                onClick={openTerminal}
              >
                <Terminal className="h-4 w-4 mr-2" />
                Access Terminal
              </Button>
            )}
          </div>
          
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader className="mb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <img src="/image.png" alt="Prompt or Die" className="h-6 w-6" />
                    Prompt or Die
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4">
                  <Link 
                    to="/gallery" 
                    className="text-sm font-medium hover:text-[#8B0000] transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gallery
                  </Link>
                  <Link 
                    to="/docs" 
                    className="text-sm font-medium hover:text-[#8B0000] transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Docs
                  </Link>
                  <a 
                    href="https://github.com/promptordie/prompt-builder" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm font-medium hover:text-[#8B0000] transition-colors flex items-center gap-1 py-2"
                  >
                    GitHub
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </nav>
                <div className="mt-6 space-y-2">
                  <Button 
                    variant="outline"
                    className="w-full justify-start border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000]/10 hover:border-[#8B0000]/60"
                    onClick={() => {
                      setIsMenuOpen(false);
                      openTerminal();
                    }}
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    Access Terminal
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;