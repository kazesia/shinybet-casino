import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Copy, Search } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export default function WalletSettings() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();

    // Form State
    const [currency, setCurrency] = useState('BTC');
    const [address, setAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: addresses, isLoading } = useQuery({
        queryKey: ['admin', 'deposit_addresses'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('deposit_addresses')
                .select('*')
                .order('created_at', { ascending: false });

            logger.log('Admin Wallet Settings - Data:', data);
            logger.error('Admin Wallet Settings - Error:', error);

            if (error) throw error;
            return data;
        }
    });

    const [errorMsg, setErrorMsg] = useState('');

    const addAddress = async () => {
        setErrorMsg('');
        if (!address) {
            toast.error("Please enter an address");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('deposit_addresses')
                .insert({
                    user_id: null, // Global address
                    currency,
                    address,
                    active: true
                });

            if (error) throw error;

            toast.success("Global deposit address added successfully");
            setIsAddDialogOpen(false);
            setAddress('');
            queryClient.invalidateQueries({ queryKey: ['admin', 'deposit_addresses'] });
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message || "Failed to add address");
            toast.error(error.message || "Failed to add address");
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteAddress = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;

        try {
            const { error } = await supabase
                .from('deposit_addresses')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success("Address deleted");
            queryClient.invalidateQueries({ queryKey: ['admin', 'deposit_addresses'] });
        } catch (error: any) {
            toast.error("Failed to delete address");
        }
    };

    const filteredAddresses = addresses?.filter(addr =>
        addr.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addr.currency.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Wallet Settings</h1>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Global Address
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1a2c38] border-[#2f4553] text-white">
                        <DialogHeader>
                            <DialogTitle>Add Global Deposit Address</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger className="bg-[#0f212e] border-[#2f4553]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a2c38] border-[#2f4553] text-white">
                                        <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                                        <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                                        <SelectItem value="LTC">Litecoin (LTC)</SelectItem>
                                        <SelectItem value="USDT">Tether (USDT)</SelectItem>
                                        <SelectItem value="SOL">Solana (SOL)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Wallet Address</Label>
                                <Input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="0x..."
                                    className="bg-[#0f212e] border-[#2f4553]"
                                />
                            </div>
                            {errorMsg && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                                    {errorMsg}
                                </div>
                            )}
                            <Button
                                onClick={addAddress}
                                disabled={isSubmitting}
                                className="w-full bg-[#1475e1] hover:bg-[#1475e1]/90 font-bold"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Address
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-[#b1bad3]" />
                    <Input
                        placeholder="Search by Address or Currency..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-[#0f212e] border-[#2f4553] text-white"
                    />
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="border-[#2f4553] hover:bg-transparent">
                            <TableHead className="text-[#b1bad3]">Currency</TableHead>
                            <TableHead className="text-[#b1bad3]">Address</TableHead>
                            <TableHead className="text-[#b1bad3]">Type</TableHead>
                            <TableHead className="text-[#b1bad3]">Created At</TableHead>
                            <TableHead className="text-right text-[#b1bad3]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-[#b1bad3]">Loading...</TableCell>
                            </TableRow>
                        ) : filteredAddresses?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-[#b1bad3]">No addresses found</TableCell>
                            </TableRow>
                        ) : (
                            filteredAddresses?.map((addr) => (
                                <TableRow key={addr.id} className="border-[#2f4553] hover:bg-[#213743]">
                                    <TableCell>
                                        <Badge variant="outline" className="border-[#2f4553] text-white">{addr.currency}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-white">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate max-w-[300px]">{addr.address}</span>
                                            <Copy className="h-3 w-3 cursor-pointer text-[#b1bad3] hover:text-white" onClick={() => {
                                                navigator.clipboard.writeText(addr.address);
                                                toast.success("Address copied");
                                            }} />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={addr.user_id ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}>
                                            {addr.user_id ? 'User Specific' : 'Global'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-[#b1bad3]">
                                        {new Date(addr.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteAddress(addr.id)}
                                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
