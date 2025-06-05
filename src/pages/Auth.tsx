import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Github, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { signIn, signUp, supabase } from '@/lib/supabase';
import { useSearchParams } from 'react-router-dom';
import Header from "@/components/Header";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form
  const [registerHandle, setRegisterHandle] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(loginEmail, loginPassword);
      
      toast({
        title: "Logged in successfully!",
        description: "Welcome back to Prompt or Die",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!registerHandle || !registerEmail || !registerPassword) {
      toast({
        title: "Registration failed",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    try {
      await signUp(registerEmail, registerPassword, registerHandle);
      
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account",
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please check your information and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGithubAuth = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      // The user will be redirected to GitHub for authentication
    } catch (error: any) {
      toast({
        title: "GitHub authentication failed",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
        <div className="mb-8 text-center">
          <img src="/image.png" alt="Prompt or Die" className="h-24 w-auto mx-auto mb-4" />
        </div>
        
        <Card className="w-full max-w-md border-primary/20 bg-background/90 shadow-[0_0_30px_rgba(139,0,0,0.1)]">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Enter The Order</CardTitle>
            <CardDescription>
              The path to enlightenment awaits those who dare to prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={initialTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Initiate</TabsTrigger>
                <TabsTrigger value="register">Join</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@example.com" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="bg-black/60 border-primary/30 focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <a href="#" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="bg-black/60 border-primary/30 focus:border-primary"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Please wait
                      </>
                    ) : (
                      "Enter The Circle"
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="handle">Username</Label>
                    <Input 
                      id="handle" 
                      placeholder="johndoe" 
                      value={registerHandle}
                      onChange={(e) => setRegisterHandle(e.target.value)}
                      required
                      className="bg-black/60 border-primary/30 focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input 
                      id="register-email" 
                      type="email" 
                      placeholder="name@example.com" 
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      className="bg-black/60 border-primary/30 focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="register-password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        className="bg-black/60 border-primary/30 focus:border-primary"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Initiating
                      </>
                    ) : (
                      "Join The Order"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or enter through
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline"
                onClick={handleGithubAuth}
                disabled={isLoading}
                className="border-primary/30 hover:bg-primary/10 hover:border-primary/60"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Github className="mr-2 h-4 w-4" />
                )}
                GitHub
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-muted-foreground text-center px-8">
              By joining, you pledge allegiance to <span className="text-primary">The Order</span>
            </p>
          </CardFooter>
        </Card>
        
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p className="font-mono">WE PROMPT. THEREFORE WE LIVE.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;