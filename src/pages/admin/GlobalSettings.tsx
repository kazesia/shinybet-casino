import { useEffect, useState } from 'react';
import { useAdminSettings, useAdminMutations } from '@/hooks/useAdmin';
import { useAuth } from '@/context/AuthContext';
import { AppSetting } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Save, Loader2, Lock, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function GlobalSettings() {
  const { profile } = useAuth();
  const { data: settingsData, isLoading } = useAdminSettings();
  const { updateSettings } = useAdminMutations();

  const [localSettings, setLocalSettings] = useState<AppSetting[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('{}');
  const [newDescription, setNewDescription] = useState('');
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

  const isSuperAdmin = profile?.role === 'super_admin';

  useEffect(() => {
    if (settingsData) {
      setLocalSettings(settingsData);
    }
  }, [settingsData]);

  const validateJSON = (key: string, value: string): boolean => {
    try {
      JSON.parse(value);
      setJsonErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
      return true;
    } catch (e) {
      setJsonErrors(prev => ({
        ...prev,
        [key]: (e as Error).message
      }));
      return false;
    }
  };

  const handleChange = (key: string, value: string) => {
    setLocalSettings(prev => prev.map(s =>
      s.key === key ? { ...s, value: value } : s
    ));
    validateJSON(key, value);
  };

  const handleAddSetting = () => {
    if (!newKey.trim()) {
      toast.error('Key is required');
      return;
    }

    if (!validateJSON('new', newValue)) {
      toast.error('Invalid JSON value');
      return;
    }

    const newSetting: AppSetting = {
      key: newKey.trim(),
      value: newValue,
      description: newDescription.trim() || undefined
    };

    setLocalSettings(prev => [...prev, newSetting]);
    setIsAddDialogOpen(false);
    setNewKey('');
    setNewValue('{}');
    setNewDescription('');
    toast.success('Setting added (remember to save)');
  };

  const handleDeleteSetting = (key: string) => {
    setLocalSettings(prev => prev.filter(s => s.key !== key));
    toast.success('Setting removed (remember to save)');
  };

  const handleSave = () => {
    // Validate all JSON before saving
    const hasErrors = localSettings.some(s => {
      const valueStr = typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
      return !validateJSON(s.key, valueStr);
    });

    if (hasErrors) {
      toast.error('Fix JSON errors before saving');
      return;
    }

    // Convert string values to parsed JSON for storage
    const settingsToSave = localSettings.map(s => ({
      ...s,
      value: typeof s.value === 'string' ? JSON.parse(s.value) : s.value
    }));

    updateSettings.mutate(settingsToSave);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-[#F7D979] h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Global Settings</h1>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              variant="outline"
              className="border-admin-border"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Setting
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!isSuperAdmin || updateSettings.isPending || Object.keys(jsonErrors).length > 0}
            className="bg-gold-gradient text-black font-bold hover:opacity-90"
          >
            {updateSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3 text-yellow-500">
          <Lock className="w-5 h-5" />
          <p className="text-sm">You have read-only access. Only Super Admins can modify global configuration.</p>
        </div>
      )}

      <Card className="bg-admin-surface border-admin-border">
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>Manage system-wide settings stored as JSON values</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {localSettings.map((setting) => {
            const valueStr = typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value, null, 2);
            const hasError = jsonErrors[setting.key];

            return (
              <div key={setting.key} className="grid gap-2 p-4 rounded-lg bg-black/30 border border-admin-border">
                <div className="flex items-center justify-between">
                  <Label htmlFor={setting.key} className="text-white font-bold">
                    {setting.key}
                  </Label>
                  {isSuperAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSetting(setting.key)}
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {setting.description && (
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                )}

                <Textarea
                  id={setting.key}
                  value={valueStr}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  disabled={!isSuperAdmin}
                  className={`bg-black/50 border-admin-border font-mono text-xs min-h-[100px] ${hasError ? 'border-red-500' : ''
                    }`}
                  placeholder='{"key": "value"}'
                />

                {hasError && (
                  <div className="flex items-center gap-2 text-red-500 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    <span>{hasError}</span>
                  </div>
                )}
              </div>
            );
          })}

          {localSettings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No settings found. Run the settings migration or add a new setting.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Setting Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-admin-surface border-admin-border text-white">
          <DialogHeader>
            <DialogTitle>Add New Setting</DialogTitle>
            <DialogDescription>Create a new system configuration setting</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="new-key">Key</Label>
              <Input
                id="new-key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="setting_name"
                className="bg-black/30 border-admin-border"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-value">Value (JSON)</Label>
              <Textarea
                id="new-value"
                value={newValue}
                onChange={(e) => {
                  setNewValue(e.target.value);
                  validateJSON('new', e.target.value);
                }}
                placeholder='{"enabled": true}'
                className={`bg-black/30 border-admin-border font-mono text-xs min-h-[100px] ${jsonErrors['new'] ? 'border-red-500' : ''
                  }`}
              />
              {jsonErrors['new'] && (
                <div className="flex items-center gap-2 text-red-500 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>{jsonErrors['new']}</span>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-description">Description (optional)</Label>
              <Input
                id="new-description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What this setting controls"
                className="bg-black/30 border-admin-border"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSetting} className="bg-admin-accent text-black">
              Add Setting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
