import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Settings as SettingsIcon, Shield, User, Key, CheckCircle2, Eye, EyeOff, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
  { id: 'api', label: 'API', icon: Key },
  { id: 'verification', label: 'Verification', icon: CheckCircle2 },
];

export default function Settings() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Mock States for new tabs
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey] = useState('sk_live_51Mz...x23a'); // Mock
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  const handleUpdateUsername = async () => {
    if (!user) return;
    if (username.length < 3) return toast.error("Username must be at least 3 characters");
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);

      if (error) throw error;
      toast.success("Username updated successfully");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to update username");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="container py-8 max-w-[1200px]">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-6 h-6 text-[#b1bad3]" />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="flex flex-col gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-[#213743] text-white shadow-sm border-l-4 border-[#1475e1]" 
                    : "text-[#b1bad3] hover:bg-[#1a2c38] hover:text-white"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-[#1a2c38] rounded-md p-6 border border-[#2f4553]">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-lg font-bold text-white">Username</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#b1bad3] text-xs font-bold uppercase">Display Name</Label>
                    <Input 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-[#0f212e] border-[#2f4553] text-white h-11 focus-visible:ring-[#00e701]"
                      placeholder="Enter your username"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleUpdateUsername}
                      disabled={loading || username === profile?.username}
                      className="bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-bold px-6"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a2c38] rounded-md p-6 border border-[#2f4553]">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-lg font-bold text-white">Email</h2>
                  <span className="bg-[#FFD700] text-[#0f212e] text-[10px] font-black px-2 py-0.5 rounded uppercase">Verified</span>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#b1bad3] text-xs font-bold uppercase">Email Address</Label>
                    <Input 
                      readOnly 
                      value={user?.email || ''} 
                      className="bg-[#0f212e] border-[#2f4553] text-[#b1bad3] h-11 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-[#1a2c38] rounded-md p-6 border border-[#2f4553]">
                <h2 className="text-lg font-bold text-white mb-6">Two-Factor Authentication</h2>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-white font-medium">Enable 2FA</p>
                    <p className="text-sm text-[#b1bad3]">Protect your account with an extra layer of security.</p>
                  </div>
                  <Switch checked={is2FAEnabled} onCheckedChange={setIs2FAEnabled} />
                </div>
                {is2FAEnabled && (
                  <div className="mt-6 p-4 bg-[#0f212e] rounded border border-[#2f4553]">
                    <p className="text-sm text-white mb-2">Scan QR Code (Mock)</p>
                    <div className="w-32 h-32 bg-white mx-auto" />
                  </div>
                )}
              </div>

              <div className="bg-[#1a2c38] rounded-md p-6 border border-[#2f4553]">
                <h2 className="text-lg font-bold text-white mb-6">Change Password</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#b1bad3] text-xs font-bold uppercase">Current Password</Label>
                    <Input type="password" className="bg-[#0f212e] border-[#2f4553] text-white h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#b1bad3] text-xs font-bold uppercase">New Password</Label>
                    <Input type="password" className="bg-[#0f212e] border-[#2f4553] text-white h-11" />
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-[#213743] hover:bg-[#2f4553] text-white font-bold px-6">
                      Update Password
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-[#1a2c38] rounded-md p-6 border border-[#2f4553]">
                <h2 className="text-lg font-bold text-white mb-6">General</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[#b1bad3] text-xs font-bold uppercase">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger className="bg-[#0f212e] border-[#2f4553] text-white h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a2c38] border-[#2f4553] text-white">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-white font-medium">Marketing Emails</p>
                      <p className="text-sm text-[#b1bad3]">Receive updates about new games and bonuses.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-white font-medium">Hide Username</p>
                      <p className="text-sm text-[#b1bad3]">Hide your name on public leaderboards.</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API TAB */}
          {activeTab === 'api' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-[#1a2c38] rounded-md p-6 border border-[#2f4553]">
                <h2 className="text-lg font-bold text-white mb-4">API Access</h2>
                <p className="text-sm text-[#b1bad3] mb-6">
                  Use this key to authenticate with our public API. Keep it secret!
                </p>
                
                <div className="space-y-2">
                  <Label className="text-[#b1bad3] text-xs font-bold uppercase">Secret Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        readOnly 
                        value={showApiKey ? apiKey : '•'.repeat(apiKey.length)} 
                        className="bg-[#0f212e] border-[#2f4553] text-white h-11 font-mono pr-10"
                      />
                      <button 
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] hover:text-white"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button size="icon" variant="outline" className="h-11 w-11 border-[#2f4553] bg-[#213743]" onClick={() => copyToClipboard(apiKey)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20">
                    Regenerate Key
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* VERIFICATION TAB */}
          {activeTab === 'verification' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-[#1a2c38] rounded-md p-6 border border-[#2f4553]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">KYC Status</h2>
                  <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded text-xs font-bold border border-yellow-500/20">Level 1 Verified</span>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-[#0f212e] rounded border border-[#2f4553] flex items-start gap-4 opacity-50">
                    <div className="p-2 bg-green-500/20 rounded-full">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Level 1</h3>
                      <p className="text-sm text-[#b1bad3]">Email verification completed.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0f212e] rounded border border-[#2f4553] flex items-start gap-4">
                    <div className="p-2 bg-[#213743] rounded-full">
                      <Shield className="w-5 h-5 text-[#b1bad3]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">Level 2</h3>
                      <p className="text-sm text-[#b1bad3] mb-3">Identity verification required for unlimited withdrawals.</p>
                      <Button className="bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold text-xs">
                        Start Verification
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
