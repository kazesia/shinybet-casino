import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { useEthereumAuth } from '@/hooks/useEthereumAuth';
import { useSolanaAuth } from '@/hooks/useSolanaAuth';


// Validation Schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(14, { message: "Username must be 3-14 characters long" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  dateOfBirth: z.string().min(1, { message: "Date of birth is required" }),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
});

import { useLocation } from 'react-router-dom';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authView } = useUI();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(authView);
  const [showPhone, setShowPhone] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  // Web3 wallet auth hooks
  const { connectAndSign: connectEthereum, isConnecting: isEthConnecting } = useEthereumAuth();
  const { connectAndSign: connectSolana, isConnecting: isSolConnecting } = useSolanaAuth();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  // Sync tab with global state request
  useEffect(() => {
    if (isAuthModalOpen) {
      setActiveTab(authView);
    }
  }, [isAuthModalOpen, authView]);

  // Check for referral code in URL or localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('r') || params.get('ref'); // Support both ?r= and ?ref=

    if (ref) {
      // Save to localStorage for persistence
      localStorage.setItem('referral_code', ref);
      registerForm.setValue('referralCode', ref);
      setShowReferral(true);
    } else {
      // Check localStorage if not in URL
      const storedRef = localStorage.getItem('referral_code');
      if (storedRef) {
        registerForm.setValue('referralCode', storedRef);
        setShowReferral(true);
      }
    }
  }, [location, registerForm]);

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      closeAuthModal();
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      // Validate age (must be 18+)
      const birthDate = new Date(data.dateOfBirth);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      if (age < 18) {
        toast.error('You must be at least 18 years old to register');
        setIsLoading(false);
        return;
      }

      // Get referrer ID if provided
      let referredByUserId = null;
      if (data.referralCode) {
        const { data: referrerData } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_id', data.referralCode)
          .single();

        if (referrerData) {
          referredByUserId = referrerData.id;
        }
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            date_of_birth: data.dateOfBirth,
            phone: data.phone || null,
            referred_by_user_id: referredByUserId,
          },
        },
      });

      if (error) throw error;

      toast.success("Account created! Please check your email.");
      closeAuthModal();
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Use environment variable or fallback to current origin
      // Make sure to set VITE_SITE_URL in your .env file for production
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: siteUrl,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  const handleDiscordSignIn = async () => {
    setIsLoading(true);
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: siteUrl,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Discord");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-[400px] bg-zinc-950 border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center items-center">
          <div className="h-16 w-16 mb-4 flex items-center justify-center">
            <img src="/logo.png" alt="Shiny.bet Logo" className="h-full w-full object-contain" />
          </div>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Welcome to <span className="italic">Shiny<span className="text-[#FFD700]">.bet</span></span>
          </DialogTitle>
          <DialogDescription>The premier crypto casino experience</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')} className="w-full">
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
                  <Button variant="link" type="button" className="px-0 font-normal text-xs text-[#FFD700] h-auto p-0">Forgot password?</Button>
                </div>
                <Input id="password" type="password" {...loginForm.register("password")} className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-[#FFD700]" />
                {loginForm.formState.errors.password && <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[#F7D979] to-[#D9A94F] text-black font-bold hover:opacity-90">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 border-gray-300 font-medium"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* Discord Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={handleDiscordSignIn}
                disabled={isLoading}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white border-[#5865F2] font-medium"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Continue with Discord
              </Button>

              {/* Ethereum Wallet */}
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const result = await connectEthereum();
                  if (result) closeAuthModal();
                }}
                disabled={isLoading || isEthConnecting}
                className="w-full bg-[#1a1a2e] hover:bg-[#25254a] text-white border-[#3d3d5c] font-medium"
              >
                {isEthConnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 40 40" fill="none">
                    <path d="M19.9958 5L19.8125 5.62917V25.7304L19.9958 25.9125L29.1875 20.4375L19.9958 5Z" fill="#763D16" />
                    <path d="M19.9958 5L10.8042 20.4375L19.9958 25.9125V16.1021V5Z" fill="#F5841F" />
                    <path d="M19.9958 27.8479L19.8917 27.975V34.6646L19.9958 34.9688L29.1958 22.3792L19.9958 27.8479Z" fill="#763D16" />
                    <path d="M19.9958 34.9688V27.8479L10.8042 22.3792L19.9958 34.9688Z" fill="#F5841F" />
                    <path d="M19.9958 25.9125L29.1875 20.4375L19.9958 16.1021V25.9125Z" fill="#D73B3E" />
                    <path d="M10.8042 20.4375L19.9958 25.9125V16.1021L10.8042 20.4375Z" fill="#F5841F" />
                  </svg>
                )}
                Connect with MetaMask
              </Button>

              {/* Solana Wallet */}
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const result = await connectSolana();
                  if (result) closeAuthModal();
                }}
                disabled={isLoading || isSolConnecting}
                className="w-full bg-[#14F195]/10 hover:bg-[#14F195]/20 text-white border-[#14F195]/30 font-medium"
              >
                {isSolConnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 128 128" fill="none">
                    <circle cx="64" cy="64" r="64" fill="url(#solana-gradient)" />
                    <path d="M40.5 81.7L47.7 74.3C48.2 73.8 48.9 73.5 49.6 73.5H93.4C94.6 73.5 95.2 74.9 94.4 75.8L87.2 83.2C86.7 83.7 86 84 85.3 84H41.5C40.3 84 39.7 82.6 40.5 81.7Z" fill="white" />
                    <path d="M40.5 45.8L47.7 53.2C48.2 53.7 48.9 54 49.6 54H93.4C94.6 54 95.2 52.6 94.4 51.7L87.2 44.3C86.7 43.8 86 43.5 85.3 43.5H41.5C40.3 43.5 39.7 44.9 40.5 45.8Z" fill="white" />
                    <path d="M94.4 63.7L87.2 56.3C86.7 55.8 86 55.5 85.3 55.5H41.5C40.3 55.5 39.7 56.9 40.5 57.8L47.7 65.2C48.2 65.7 48.9 66 49.6 66H93.4C94.6 66 95.2 64.6 94.4 63.7Z" fill="white" />
                    <defs>
                      <linearGradient id="solana-gradient" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#9945FF" />
                        <stop offset="0.5" stopColor="#14F195" />
                        <stop offset="1" stopColor="#00C2FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
                Connect with Phantom
              </Button>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="m@example.com"
                  {...registerForm.register("email")}
                  className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-[#FFD700]"
                />
                {registerForm.formState.errors.email && <p className="text-xs text-red-500">{registerForm.formState.errors.email.message}</p>}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="reg-username">Username <span className="text-red-500">*</span></Label>
                <Input
                  id="reg-username"
                  placeholder="CryptoKing"
                  {...registerForm.register("username")}
                  className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-[#FFD700]"
                />
                {registerForm.formState.errors.username && <p className="text-xs text-red-500">{registerForm.formState.errors.username.message}</p>}
                <p className="text-xs text-muted-foreground">Your username must be 3-14 characters long.</p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password <span className="text-red-500">*</span></Label>
                <Input
                  id="reg-password"
                  type="password"
                  {...registerForm.register("password")}
                  className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-[#FFD700]"
                />
                {registerForm.formState.errors.password && <p className="text-xs text-red-500">{registerForm.formState.errors.password.message}</p>}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth <span className="text-red-500">*</span></Label>
                <Input
                  id="dob"
                  type="date"
                  {...registerForm.register("dateOfBirth")}
                  className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-[#FFD700]"
                />
                {registerForm.formState.errors.dateOfBirth && <p className="text-xs text-red-500">{registerForm.formState.errors.dateOfBirth.message}</p>}
              </div>

              {/* Phone (Optional) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="phone-toggle"
                    checked={showPhone}
                    onChange={(e) => setShowPhone(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-[#FFD700] focus:ring-[#FFD700]"
                  />
                  <Label htmlFor="phone-toggle" className="cursor-pointer text-white">Phone (Optional)</Label>
                </div>
                {showPhone && (
                  <Input
                    type="tel"
                    placeholder="Enter phone number"
                    {...registerForm.register("phone")}
                    className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-[#FFD700] mt-2"
                  />
                )}
              </div>

              {/* Referral Code (Optional) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="referral-toggle"
                    checked={showReferral}
                    onChange={(e) => setShowReferral(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-[#FFD700] focus:ring-[#FFD700]"
                  />
                  <Label htmlFor="referral-toggle" className="cursor-pointer text-white">Referral Code (Optional)</Label>
                </div>
                {showReferral && (
                  <Input
                    placeholder="Enter referral code"
                    {...registerForm.register("referralCode")}
                    className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-[#FFD700] mt-2"
                  />
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[#F7D979] to-[#D9A94F] text-black font-bold hover:opacity-90">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 border-gray-300 font-medium"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* Discord Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={handleDiscordSignIn}
                disabled={isLoading}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white border-[#5865F2] font-medium"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Continue with Discord
              </Button>

              {/* Ethereum Wallet */}
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const result = await connectEthereum();
                  if (result) closeAuthModal();
                }}
                disabled={isLoading || isEthConnecting}
                className="w-full bg-[#1a1a2e] hover:bg-[#25254a] text-white border-[#3d3d5c] font-medium"
              >
                {isEthConnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 40 40" fill="none">
                    <path d="M19.9958 5L19.8125 5.62917V25.7304L19.9958 25.9125L29.1875 20.4375L19.9958 5Z" fill="#763D16" />
                    <path d="M19.9958 5L10.8042 20.4375L19.9958 25.9125V16.1021V5Z" fill="#F5841F" />
                    <path d="M19.9958 27.8479L19.8917 27.975V34.6646L19.9958 34.9688L29.1958 22.3792L19.9958 27.8479Z" fill="#763D16" />
                    <path d="M19.9958 34.9688V27.8479L10.8042 22.3792L19.9958 34.9688Z" fill="#F5841F" />
                    <path d="M19.9958 25.9125L29.1875 20.4375L19.9958 16.1021V25.9125Z" fill="#D73B3E" />
                    <path d="M10.8042 20.4375L19.9958 25.9125V16.1021L10.8042 20.4375Z" fill="#F5841F" />
                  </svg>
                )}
                Connect with MetaMask
              </Button>

              {/* Solana Wallet */}
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const result = await connectSolana();
                  if (result) closeAuthModal();
                }}
                disabled={isLoading || isSolConnecting}
                className="w-full bg-[#14F195]/10 hover:bg-[#14F195]/20 text-white border-[#14F195]/30 font-medium"
              >
                {isSolConnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 128 128" fill="none">
                    <circle cx="64" cy="64" r="64" fill="url(#solana-gradient-2)" />
                    <path d="M40.5 81.7L47.7 74.3C48.2 73.8 48.9 73.5 49.6 73.5H93.4C94.6 73.5 95.2 74.9 94.4 75.8L87.2 83.2C86.7 83.7 86 84 85.3 84H41.5C40.3 84 39.7 82.6 40.5 81.7Z" fill="white" />
                    <path d="M40.5 45.8L47.7 53.2C48.2 53.7 48.9 54 49.6 54H93.4C94.6 54 95.2 52.6 94.4 51.7L87.2 44.3C86.7 43.8 86 43.5 85.3 43.5H41.5C40.3 43.5 39.7 44.9 40.5 45.8Z" fill="white" />
                    <path d="M94.4 63.7L87.2 56.3C86.7 55.8 86 55.5 85.3 55.5H41.5C40.3 55.5 39.7 56.9 40.5 57.8L47.7 65.2C48.2 65.7 48.9 66 49.6 66H93.4C94.6 66 95.2 64.6 94.4 63.7Z" fill="white" />
                    <defs>
                      <linearGradient id="solana-gradient-2" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#9945FF" />
                        <stop offset="0.5" stopColor="#14F195" />
                        <stop offset="1" stopColor="#00C2FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
                Connect with Phantom
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
