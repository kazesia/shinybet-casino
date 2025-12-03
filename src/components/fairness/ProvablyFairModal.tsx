import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Copy, RefreshCw, ShieldCheck, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProvablyFairModal() {
  const { isFairnessModalOpen, closeFairnessModal } = useUI();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('seeds');
  const [loading, setLoading] = useState(false);
  
  // Seed State
  const [clientSeed, setClientSeed] = useState('');
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [nonce, setNonce] = useState(0);
  const [newClientSeed, setNewClientSeed] = useState('');
  
  // Rotation State
  const [previousServerSeed, setPreviousServerSeed] = useState<string | null>(null);

  useEffect(() => {
    if (isFairnessModalOpen && user) {
      fetchSeeds();
    }
  }, [isFairnessModalOpen, user]);

  const fetchSeeds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_seeds', { p_user_id: user?.id });
      if (error) throw error;
      if (data && data.length > 0) {
        setClientSeed(data[0].client_seed);
        setNewClientSeed(data[0].client_seed);
        setServerSeedHash(data[0].server_seed_hash);
        setNonce(data[0].nonce);
      }
    } catch (error) {
      console.error("Error fetching seeds:", error);
      toast.error("Failed to load fairness data");
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = async () => {
    if (!newClientSeed) return toast.error("Client seed cannot be empty");
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('rotate_seed', { p_new_client_seed: newClientSeed });
      if (error) throw error;
      
      if (data && data.length > 0) {
        setPreviousServerSeed(data[0].previous_server_seed);
        setServerSeedHash(data[0].new_server_seed_hash);
        setNonce(data[0].new_nonce);
        setClientSeed(newClientSeed);
        toast.success("Seed rotated successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to rotate seed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={isFairnessModalOpen} onOpenChange={(open) => !open && closeFairnessModal()}>
      <DialogContent className="sm:max-w-[600px] bg-[#1a2c38] border-[#2f4553] text-white p-0 gap-0 overflow-hidden shadow-2xl">
        
        <DialogHeader className="px-6 py-4 border-b border-[#2f4553] bg-[#0f212e]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#00e701]" />
            <DialogTitle className="text-lg font-bold text-white">Fairness</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#b1bad3]">
            Verify the randomness of your bets.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-4 bg-[#1a2c38]">
            <TabsList className="w-full bg-[#0f212e] border border-[#2f4553]">
              <TabsTrigger value="seeds" className="flex-1 data-[state=active]:bg-[#213743] data-[state=active]:text-white">Seeds</TabsTrigger>
              <TabsTrigger value="verify" className="flex-1 data-[state=active]:bg-[#213743] data-[state=active]:text-white">Verify</TabsTrigger>
            </TabsList>
          </div>

          {/* SEEDS TAB */}
          <TabsContent value="seeds" className="p-6 space-y-6 mt-0">
            
            {/* Active Pair */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00e701] animate-pulse" />
                  Active Key Pair
                </h3>
                <span className="text-xs text-[#b1bad3]">Nonce: <span className="text-white font-mono font-bold">{nonce}</span></span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#b1bad3]">Server Seed (Hashed)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={serverSeedHash} className="bg-[#0f212e] border-[#2f4553] font-mono text-xs text-[#b1bad3]" />
                  <Button size="icon" variant="outline" className="border-[#2f4553] bg-[#213743]" onClick={() => copyToClipboard(serverSeedHash)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#b1bad3]">Client Seed</Label>
                <div className="flex gap-2">
                  <Input 
                    value={newClientSeed} 
                    onChange={(e) => setNewClientSeed(e.target.value)}
                    className="bg-[#0f212e] border-[#2f4553] font-medium text-white focus-visible:ring-[#00e701]" 
                  />
                  <Button size="icon" variant="outline" className="border-[#2f4553] bg-[#213743]" onClick={() => setNewClientSeed(Math.random().toString(36).substring(2, 15))}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleRotate} 
              disabled={loading}
              className="w-full bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] font-bold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Rotate Seed Pair
            </Button>

            {/* Previous Seed (Revealed) */}
            {previousServerSeed && (
              <div className="mt-6 p-4 bg-[#0f212e] rounded-lg border border-[#2f4553] animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-2 text-[#F7D979]">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Previous Server Seed Revealed</span>
                </div>
                <div className="flex gap-2">
                  <Input readOnly value={previousServerSeed} className="bg-[#1a2c38] border-[#2f4553] font-mono text-xs text-white" />
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard(previousServerSeed)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-[#b1bad3] mt-2">
                  You can now use this seed to verify all bets made with the previous pair.
                </p>
              </div>
            )}

          </TabsContent>

          {/* VERIFY TAB */}
          <TabsContent value="verify" className="p-6 space-y-6 mt-0">
            <div className="text-center space-y-2 mb-4">
              <div className="w-12 h-12 bg-[#213743] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-[#b1bad3]" />
              </div>
              <h3 className="text-white font-bold">Verify Bet</h3>
              <p className="text-xs text-[#b1bad3]">
                Third-party verification is recommended. You can use any HMAC SHA256 calculator.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-[#b1bad3]">Game</Label>
                <Input readOnly value="Dice / Mines / CoinFlip" className="bg-[#0f212e] border-[#2f4553]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#b1bad3]">Server Seed</Label>
                <Input placeholder="Paste revealed server seed" className="bg-[#0f212e] border-[#2f4553]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#b1bad3]">Client Seed</Label>
                <Input placeholder="Client seed used" className="bg-[#0f212e] border-[#2f4553]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#b1bad3]">Nonce</Label>
                <Input type="number" placeholder="0" className="bg-[#0f212e] border-[#2f4553]" />
              </div>
            </div>

            <Button variant="outline" className="w-full border-[#2f4553] hover:bg-[#2f4553] text-[#b1bad3]">
              Open External Verifier
            </Button>
          </TabsContent>
        </Tabs>

      </DialogContent>
    </Dialog>
  );
}
