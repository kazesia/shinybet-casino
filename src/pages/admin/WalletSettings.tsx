import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Copy, Search, Pencil, QrCode, Image } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CryptoCoin {
    id: string;
    name: string;
    symbol: string;
    icon_url: string | null;
    color: string;
    deposit_address: string | null;
    network: string | null;
    min_deposit: number;
    active: boolean;
    display_order: number;
}

const COLOR_OPTIONS = [
    { value: 'bg-orange-500', label: 'Orange', preview: 'bg-orange-500' },
    { value: 'bg-blue-500', label: 'Blue', preview: 'bg-blue-500' },
    { value: 'bg-green-500', label: 'Green', preview: 'bg-green-500' },
    { value: 'bg-purple-500', label: 'Purple', preview: 'bg-purple-500' },
    { value: 'bg-yellow-500', label: 'Yellow', preview: 'bg-yellow-500' },
    { value: 'bg-red-500', label: 'Red', preview: 'bg-red-500' },
    { value: 'bg-gray-400', label: 'Gray', preview: 'bg-gray-400' },
    { value: 'bg-pink-500', label: 'Pink', preview: 'bg-pink-500' },
    { value: 'bg-cyan-500', label: 'Cyan', preview: 'bg-cyan-500' },
];

export default function WalletSettings() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingCoin, setEditingCoin] = useState<CryptoCoin | null>(null);
    const queryClient = useQueryClient();

    // Form State
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        symbol: '',
        icon_url: '',
        color: 'bg-gray-500',
        deposit_address: '',
        network: '',
        min_deposit: 0,
        active: true,
        display_order: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: coins, isLoading } = useQuery({
        queryKey: ['admin', 'crypto_coins'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('crypto_coins')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data as CryptoCoin[];
        }
    });

    const resetForm = () => {
        setFormData({
            id: '',
            name: '',
            symbol: '',
            icon_url: '',
            color: 'bg-gray-500',
            deposit_address: '',
            network: '',
            min_deposit: 0,
            active: true,
            display_order: coins?.length || 0
        });
    };

    const openEditDialog = (coin: CryptoCoin) => {
        setEditingCoin(coin);
        setFormData({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            icon_url: coin.icon_url || '',
            color: coin.color,
            deposit_address: coin.deposit_address || '',
            network: coin.network || '',
            min_deposit: coin.min_deposit,
            active: coin.active,
            display_order: coin.display_order
        });
        setIsEditDialogOpen(true);
    };

    const saveCoin = async (isEdit: boolean) => {
        if (!formData.id || !formData.name) {
            toast.error("Please fill in required fields (ID and Name)");
            return;
        }

        setIsSubmitting(true);
        try {
            const coinData = {
                id: formData.id.toUpperCase(),
                name: formData.name,
                symbol: formData.symbol,
                icon_url: formData.icon_url || null,
                color: formData.color,
                deposit_address: formData.deposit_address || null,
                network: formData.network || null,
                min_deposit: formData.min_deposit,
                active: formData.active,
                display_order: formData.display_order
            };

            if (isEdit) {
                const { error } = await supabase
                    .from('crypto_coins')
                    .update(coinData)
                    .eq('id', editingCoin?.id);
                if (error) throw error;
                toast.success("Crypto coin updated successfully");
            } else {
                const { error } = await supabase
                    .from('crypto_coins')
                    .insert(coinData);
                if (error) throw error;
                toast.success("Crypto coin added successfully");
            }

            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ['admin', 'crypto_coins'] });
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to save coin");
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteCoin = async (id: string) => {
        if (!confirm("Are you sure you want to delete this crypto coin?")) return;

        try {
            const { error } = await supabase
                .from('crypto_coins')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success("Crypto coin deleted");
            queryClient.invalidateQueries({ queryKey: ['admin', 'crypto_coins'] });
        } catch (error: any) {
            toast.error("Failed to delete coin");
        }
    };

    const toggleActive = async (coin: CryptoCoin) => {
        try {
            const { error } = await supabase
                .from('crypto_coins')
                .update({ active: !coin.active })
                .eq('id', coin.id);

            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['admin', 'crypto_coins'] });
            toast.success(`${coin.name} ${coin.active ? 'disabled' : 'enabled'}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const filteredCoins = coins?.filter(coin =>
        coin.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const CoinFormDialog = ({ isEdit = false }: { isEdit?: boolean }) => (
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Coin ID *</Label>
                    <Input
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                        placeholder="BTC"
                        className="bg-[#0f212e] border-[#2f4553]"
                        disabled={isEdit}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Display Symbol</Label>
                    <Input
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                        placeholder="₿"
                        className="bg-[#0f212e] border-[#2f4553]"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Coin Name *</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Bitcoin"
                    className="bg-[#0f212e] border-[#2f4553]"
                />
            </div>
            <div className="space-y-2">
                <Label>Icon URL (optional)</Label>
                <div className="flex gap-2">
                    <Input
                        value={formData.icon_url}
                        onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                        placeholder="https://example.com/btc-icon.png"
                        className="bg-[#0f212e] border-[#2f4553] flex-1"
                    />
                    {formData.icon_url && (
                        <div className="w-10 h-10 rounded-lg bg-[#0f212e] border border-[#2f4553] flex items-center justify-center overflow-hidden">
                            <img src={formData.icon_url} alt="Preview" className="w-6 h-6 object-contain" />
                        </div>
                    )}
                </div>
            </div>
            <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                        <button
                            key={color.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, color: color.value })}
                            className={cn(
                                "w-8 h-8 rounded-full transition-all",
                                color.preview,
                                formData.color === color.value && "ring-2 ring-white ring-offset-2 ring-offset-[#1a2c38]"
                            )}
                        />
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" /> Deposit Address
                </Label>
                <Input
                    value={formData.deposit_address}
                    onChange={(e) => setFormData({ ...formData, deposit_address: e.target.value })}
                    placeholder="Wallet address for deposits"
                    className="bg-[#0f212e] border-[#2f4553] font-mono text-xs"
                />
                <p className="text-xs text-[#b1bad3]">QR code will be auto-generated from this address</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Network</Label>
                    <Input
                        value={formData.network}
                        onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                        placeholder="Mainnet, ERC20, TRC20..."
                        className="bg-[#0f212e] border-[#2f4553]"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        className="bg-[#0f212e] border-[#2f4553]"
                    />
                </div>
            </div>
            <div className="flex items-center justify-between bg-[#0f212e] p-3 rounded-lg border border-[#2f4553]">
                <div>
                    <Label>Active</Label>
                    <p className="text-xs text-[#b1bad3]">Users can deposit with this coin</p>
                </div>
                <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
            </div>
            <Button
                onClick={() => saveCoin(isEdit)}
                disabled={isSubmitting}
                className="w-full bg-[#1475e1] hover:bg-[#1475e1]/90 font-bold"
            >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update Coin' : 'Add Coin'}
            </Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Crypto Settings</h1>
                    <p className="text-[#b1bad3] text-sm mt-1">Manage cryptocurrencies for deposits and withdrawals</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Crypto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1a2c38] border-[#2f4553] text-white max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Cryptocurrency</DialogTitle>
                        </DialogHeader>
                        <CoinFormDialog isEdit={false} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-[#1a2c38] border-[#2f4553] text-white max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit {editingCoin?.name}</DialogTitle>
                    </DialogHeader>
                    <CoinFormDialog isEdit={true} />
                </DialogContent>
            </Dialog>

            <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-[#b1bad3]" />
                    <Input
                        placeholder="Search by ID or Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-[#0f212e] border-[#2f4553] text-white"
                    />
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="border-[#2f4553] hover:bg-transparent">
                            <TableHead className="text-[#b1bad3]">Coin</TableHead>
                            <TableHead className="text-[#b1bad3]">Deposit Address</TableHead>
                            <TableHead className="text-[#b1bad3]">Network</TableHead>
                            <TableHead className="text-[#b1bad3]">Status</TableHead>
                            <TableHead className="text-right text-[#b1bad3]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-[#b1bad3]">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredCoins?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-[#b1bad3]">No crypto coins found</TableCell>
                            </TableRow>
                        ) : (
                            filteredCoins?.map((coin) => (
                                <TableRow key={coin.id} className="border-[#2f4553] hover:bg-[#213743]">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {coin.icon_url ? (
                                                <div className="w-8 h-8 rounded-full bg-[#0f212e] flex items-center justify-center overflow-hidden">
                                                    <img src={coin.icon_url} alt={coin.name} className="w-5 h-5 object-contain" />
                                                </div>
                                            ) : (
                                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm", coin.color)}>
                                                    {coin.symbol || coin.id[0]}
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-bold text-white">{coin.id}</span>
                                                <p className="text-xs text-[#b1bad3]">{coin.name}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-white">
                                        {coin.deposit_address ? (
                                            <div className="flex items-center gap-2">
                                                <span className="truncate max-w-[200px]">{coin.deposit_address}</span>
                                                <Copy className="h-3 w-3 cursor-pointer text-[#b1bad3] hover:text-white flex-shrink-0" onClick={() => {
                                                    navigator.clipboard.writeText(coin.deposit_address!);
                                                    toast.success("Address copied");
                                                }} />
                                            </div>
                                        ) : (
                                            <span className="text-[#b1bad3] italic">Not set</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-[#b1bad3]">
                                        {coin.network || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={cn(
                                                "cursor-pointer transition-colors",
                                                coin.active
                                                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                            )}
                                            onClick={() => toggleActive(coin)}
                                        >
                                            {coin.active ? 'Active' : 'Disabled'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(coin)}
                                                className="text-[#b1bad3] hover:text-white hover:bg-[#2f4553]"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteCoin(coin.id)}
                                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
