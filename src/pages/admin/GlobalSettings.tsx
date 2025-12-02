import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AppSetting } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

export default function GlobalSettings() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('settings').select('*');
    if (data) setSettings(data);
    else {
      // Initialize defaults if empty
      setSettings([
        { key: 'site_name', value: 'Shiny.bet', description: 'Global site title' },
        { key: 'house_edge', value: '0.01', description: 'Default house edge (decimal)' },
        { key: 'min_deposit', value: '10', description: 'Minimum deposit amount' },
        { key: 'max_withdrawal', value: '10000', description: 'Maximum auto-withdrawal' }
      ]);
    }
    setLoading(false);
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('settings').upsert(settings, { onConflict: 'key' });
      if (error) throw error;
      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Global Settings</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-gold-gradient text-black font-bold">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>

      <Card className="bg-zinc-900/50 border-white/5">
        <CardHeader>
          <CardTitle>Application Configuration</CardTitle>
          <CardDescription>Manage global variables and limits for the casino.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings.map((setting) => (
            <div key={setting.key} className="grid gap-2">
              <Label htmlFor={setting.key} className="capitalize">{setting.key.replace('_', ' ')}</Label>
              <Input 
                id={setting.key}
                value={setting.value}
                onChange={(e) => handleChange(setting.key, e.target.value)}
                className="bg-zinc-950 border-white/10"
              />
              {setting.description && <p className="text-xs text-muted-foreground">{setting.description}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
