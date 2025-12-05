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

const LOGO_URL = "https://media.discordapp.net/attachments/1446113430150054081/1446113527676010557/Collabeco_2_-removebg-preview.png?ex=6932cdac&is=69317c2c&hm=38303892f78abdbe443b156f1d743bf3b5e6e24eed548173ae79df6013bc646c&=&format=webp&quality=lossless&width=750&height=750";

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

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-[400px] bg-zinc-950 border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center items-center">
          <div className="h-16 w-16 mb-4 flex items-center justify-center">
            <img src={LOGO_URL} alt="Shiny Logo" className="h-full w-full object-contain" />
          </div>
          <DialogTitle className="text-2xl font-bold">Welcome to Shiny.bet</DialogTitle>
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
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
