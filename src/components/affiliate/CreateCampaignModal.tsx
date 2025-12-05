import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface CreateCampaignModalProps {
    open: boolean;
    onClose: () => void;
    onCreate: (name: string, commissionRate?: number) => Promise<void>;
}

export function CreateCampaignModal({
    open,
    onClose,
    onCreate
}: CreateCampaignModalProps) {
    const [name, setName] = useState('');
    const [campaignId, setCampaignId] = useState('');
    const [loading, setLoading] = useState(false);

    // Generate campaign ID when name changes
    const handleNameChange = (value: string) => {
        setName(value);
        // Auto-generate campaign ID from name
        const id = value
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 20);
        setCampaignId(id || generateRandomId());
    };

    const generateRandomId = () => {
        return Math.random().toString(36).substring(2, 12);
    };

    const getReferralLink = () => {
        if (!campaignId) return '';
        return `${window.location.origin}/?c=${campaignId}`;
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error('Please enter a campaign name');
            return;
        }

        setLoading(true);
        try {
            await onCreate(name, 0.10); // 10% default commission rate
            toast.success('Campaign created successfully!');
            onClose();
            setName('');
            setCampaignId('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a2c38] border-[#2f4553] max-w-[600px]">
                <DialogHeader className="flex flex-row items-center justify-between border-b border-[#2f4553] pb-4">
                    <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-[#1475e1]" />
                        <DialogTitle className="text-white text-xl">Create Campaign</DialogTitle>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#b1bad3] hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Campaign Name */}
                    <div>
                        <Label className="text-white mb-2 block">
                            Campaign Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Enter campaign name"
                            className="bg-[#0f212e] border-[#2f4553] text-white focus:border-[#1475e1]"
                        />
                    </div>

                    {/* Campaign ID */}
                    <div>
                        <Label className="text-white mb-2 block">
                            Campaign ID <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="text"
                            value={campaignId}
                            onChange={(e) => setCampaignId(e.target.value)}
                            placeholder="Auto-generated from name"
                            className="bg-[#0f212e] border-[#2f4553] text-white focus:border-[#1475e1]"
                        />
                        <p className="text-[#b1bad3] text-xs mt-1">
                            This will be used in your referral link
                        </p>
                    </div>

                    {/* Referral Link Preview */}
                    <div>
                        <Label className="text-[#b1bad3] mb-2 block">Referral Link</Label>
                        <div className="bg-[#0f212e] border border-[#2f4553] rounded-lg px-4 py-3 text-[#b1bad3] text-sm font-mono break-all">
                            {getReferralLink() || 'Enter campaign details to see link'}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 bg-transparent border-[#2f4553] text-white hover:bg-[#2f4553]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={loading || !name.trim()}
                            className="flex-1 bg-[#1475e1] hover:bg-[#1266c9] text-white"
                        >
                            {loading ? 'Creating...' : 'Create Campaign'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
