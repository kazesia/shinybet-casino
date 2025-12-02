import { useEffect, useState } from 'react';
import { useAdminSettings, useAdminMutations } from '@/hooks/useAdmin';
import { useAuth } from '@/context/AuthContext';
import { AppSetting } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Loader2, Lock } from 'lucide-react';

export default function GlobalSettings() {
  const { profile } = useAuth();
  const { data: settingsData, isLoading } = useAdminSettings();
  const { updateSettings } = useAdminMutations();
  
  const [localSettings, setLocalSettings] = useState<AppSetting[]>([]);
  const isSuperAdmin = profile?.role === 'super_admin';

  useEffect(() => {
    if (settingsData) {
      setLocalSettings(settingsData);
    }
  }, [settingsData]);

  const handleChange = (key: string, value: string) => {
    setLocalSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = () => {
    updateSettings.mutate(localSettings);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#F7D979]" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Global Settings</h1>
        <Button 
          onClick={handleSave} 
          disabled={!isSuperAdmin || updateSettings.isPending} 
          className="bg-gold-gradient text-black font-bold hover:opacity-90"
        >
          {updateSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
          Save Changes
        </Button>
      </div>

      {!isSuperAdmin && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3 text-yellow-500">
          <Lock className="w-5 h-5" />
          <p className="text-sm">You have read-only access. Only Super Admins can modify global configuration.</p>
        </div>
      )}

      <Card className="bg-zinc-900/50 border-white/5">
        <CardHeader>
          <CardTitle>Casino Configuration</CardTitle>
          <CardDescription>Manage house edge, limits, and site variables.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {localSettings.map((setting) => (
            <div key={setting.key} className="grid gap-2">
              <Label htmlFor={setting.key} className="capitalize text-white">{setting.key.replace(/_/g, ' ')}</Label>
              <div className="relative">
                <Input 
                  id={setting.key}
                  value={setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  disabled={!isSuperAdmin}
                  className="bg-zinc-950 border-white/10 focus-visible:ring-[#F7D979]"
                />
              </div>
              {setting.description && <p className="text-xs text-muted-foreground">{setting.description}</p>}
            </div>
          ))}
          
          {localSettings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No settings found. Run database migrations to seed default settings.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
