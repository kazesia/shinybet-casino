import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Gamepad2, Loader2 } from 'lucide-react';

// Validation Schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Forms
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  // Handlers
  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
          },
        },
      });

      if (error) throw error;

      toast.success("Account created! Please check your email.");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = (e.currentTarget.elements.namedItem('reset-email') as HTMLInputElement).value;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent!");
      setIsResetOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-[100%] blur-[100px] -z-10 pointer-events-none" />

      <Card className="w-full max-w-md border-[#FFD700]/30 bg-zinc-950/90 backdrop-blur-xl shadow-[0_0_30px_rgba(255,215,0,0.1)]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center">
            <img
              src="https://media.discordapp.net/attachments/1442506658155855925/1446069962493005844/Collabeco_2_-removebg-preview.png?ex=6932a519&is=69315399&hm=cab9148f2cdcafb486a7ff6e92852c787bcb0e5b193af549d467c257f8913b73&=&format=webp&quality=lossless&width=750&height=750"
              alt="Shiny.bet Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Welcome to Shiny.bet</CardTitle>
          <CardDescription>The premier crypto casino experience</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-900/50">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" {...loginForm.register("email")} className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-[#FFD700]" />
                  {loginForm.formState.errors.email && <p className="text-xs text-red-500">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="px-0 font-normal text-xs text-[#FFD700]">Forgot password?</Button>
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-950 border-zinc-800">
                        <DialogHeader>
                          <DialogTitle>Reset Password</DialogTitle>
                          <DialogDescription>Enter your email to receive a reset link.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={onResetPassword} className="space-y-4 mt-4">
                          <Input id="reset-email" type="email" placeholder="Email address" required className="bg-zinc-900" />
                          <Button type="submit" className="w-full bg-[#FFD700] text-black hover:bg-[#FFD700]/90">Send Link</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input id="password" type="password" {...loginForm.register("password")} className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-[#FFD700]" />
                  {loginForm.formState.errors.password && <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[#F7D979] to-[#D9A94F] text-black font-bold hover:opacity-90">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Username</Label>
                  <Input id="reg-username" placeholder="CryptoKing" {...registerForm.register("username")} className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-[#FFD700]" />
                  {registerForm.formState.errors.username && <p className="text-xs text-red-500">{registerForm.formState.errors.username.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" placeholder="m@example.com" {...registerForm.register("email")} className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-[#FFD700]" />
                  {registerForm.formState.errors.email && <p className="text-xs text-red-500">{registerForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" type="password" {...registerForm.register("password")} className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-[#FFD700]" />
                  {registerForm.formState.errors.password && <p className="text-xs text-red-500">{registerForm.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" {...registerForm.register("confirmPassword")} className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-[#FFD700]" />
                  {registerForm.formState.errors.confirmPassword && <p className="text-xs text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[#F7D979] to-[#D9A94F] text-black font-bold hover:opacity-90">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-center border-t border-white/5 pt-4">
          <p className="text-xs text-muted-foreground">By continuing, you agree to our Terms of Service.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
