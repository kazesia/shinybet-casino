/**
 * Provably Fair Modal
 * 
 * Displays provably fair information including:
 * - Current seeds and nonce
 * - Seed rotation controls
 * - Client seed editor
 * - Bet history with verification
 * - How it works explanation
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Copy, Check, ChevronDown, ChevronUp, Shield, Calculator, HelpCircle, History, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    calculateDiceRoll,
    verifyDiceResult,
    truncateHash,
    formatNumber,
    DEFAULT_HOUSE_EDGE,
    type DiceBet,
    type SeedInfo,
} from '@/lib/provablyFair';

interface ProvablyFairModalProps {
    isOpen: boolean;
    onClose: () => void;
    seeds: SeedInfo | null;
    betHistory: DiceBet[];
    onRotateSeed: () => Promise<any>;
    onUpdateClientSeed: (seed: string) => Promise<boolean>;
}

type TabType = 'seeds' | 'verify' | 'history' | 'howItWorks';

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({
    isOpen,
    onClose,
    seeds,
    betHistory,
    onRotateSeed,
    onUpdateClientSeed,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('seeds');
    const [newClientSeed, setNewClientSeed] = useState('');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isRotating, setIsRotating] = useState(false);
    const [revealedSeed, setRevealedSeed] = useState<string | null>(null);
    const [expandedBet, setExpandedBet] = useState<string | null>(null);
    const [verifyingBet, setVerifyingBet] = useState<string | null>(null);
    const [verifyResults, setVerifyResults] = useState<Record<string, boolean>>({});

    // Verification calculator state
    const [calcClientSeed, setCalcClientSeed] = useState('');
    const [calcServerSeed, setCalcServerSeed] = useState('');
    const [calcNonce, setCalcNonce] = useState('0');
    const [calcResult, setCalcResult] = useState<number | null>(null);

    useEffect(() => {
        if (seeds) {
            setNewClientSeed(seeds.client_seed);
        }
    }, [seeds]);

    const copyToClipboard = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleRotateSeed = async () => {
        setIsRotating(true);
        try {
            const result = await onRotateSeed();
            if (result) {
                setRevealedSeed(result.revealed_server_seed);
            }
        } finally {
            setIsRotating(false);
        }
    };

    const handleUpdateClientSeed = async () => {
        if (newClientSeed.trim()) {
            await onUpdateClientSeed(newClientSeed.trim());
        }
    };

    const handleCalculate = async () => {
        if (!calcClientSeed || !calcServerSeed || !calcNonce) return;
        const result = await calculateDiceRoll(calcClientSeed, calcServerSeed, parseInt(calcNonce));
        setCalcResult(result);
    };

    const handleVerifyBet = async (bet: DiceBet) => {
        if (!bet.server_seed) return;

        setVerifyingBet(bet.id);
        const isVerified = await verifyDiceResult(
            bet.client_seed,
            bet.server_seed,
            bet.nonce,
            bet.roll_result
        );
        setVerifyResults(prev => ({ ...prev, [bet.id]: isVerified }));
        setVerifyingBet(null);
    };

    if (!isOpen) return null;

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'seeds', label: 'Seeds', icon: <Shield className="w-4 h-4" /> },
        { id: 'verify', label: 'Verify', icon: <Calculator className="w-4 h-4" /> },
        { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
        { id: 'howItWorks', label: 'Info', icon: <HelpCircle className="w-4 h-4" /> },
    ];

    const verifiableBets = betHistory.filter(bet => bet.server_seed);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-[#1a2c38] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-[#243442]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#243442]">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <h2 className="text-lg font-bold text-white">Provably Fair</h2>
                            <span className="text-xs text-[#b1bad3] bg-[#0f212e] px-2 py-0.5 rounded">
                                {DEFAULT_HOUSE_EDGE}% Edge
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[#2f4553] rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-[#b1bad3]" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[#243442]">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors",
                                    activeTab === tab.id
                                        ? "text-white border-b-2 border-[#00e701] bg-[#213743]"
                                        : "text-[#b1bad3] hover:text-white hover:bg-[#213743]/50"
                                )}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-[calc(85vh-140px)]">
                        {/* Seeds Tab */}
                        {activeTab === 'seeds' && (
                            <div className="space-y-4">
                                {/* Current Seed Info */}
                                <div className="bg-[#0f212e] rounded-lg p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-[#b1bad3]">Server Seed (Hashed)</span>
                                        <button
                                            onClick={() => copyToClipboard(seeds?.server_seed_hash || '', 'serverHash')}
                                            className="flex items-center gap-1 text-xs text-[#b1bad3] hover:text-white"
                                        >
                                            {copiedField === 'serverHash' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                            Copy
                                        </button>
                                    </div>
                                    <div className="font-mono text-sm text-white bg-[#1a2c38] p-3 rounded break-all">
                                        {seeds?.server_seed_hash || 'Loading...'}
                                    </div>
                                </div>

                                {/* Client Seed */}
                                <div className="bg-[#0f212e] rounded-lg p-4 space-y-3">
                                    <span className="text-sm font-semibold text-[#b1bad3]">Client Seed</span>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newClientSeed}
                                            onChange={(e) => setNewClientSeed(e.target.value)}
                                            className="bg-[#1a2c38] border-[#2f4553] text-white font-mono"
                                            placeholder="Enter client seed"
                                        />
                                        <Button
                                            onClick={handleUpdateClientSeed}
                                            className="bg-[#2f4553] hover:bg-[#3d5565] text-white"
                                        >
                                            Set
                                        </Button>
                                    </div>
                                </div>

                                {/* Nonce */}
                                <div className="bg-[#0f212e] rounded-lg p-4 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-[#b1bad3]">Nonce</span>
                                    <span className="text-xl font-bold text-white">{seeds?.nonce || 0}</span>
                                </div>

                                {/* Rotate Button */}
                                <Button
                                    onClick={handleRotateSeed}
                                    disabled={isRotating}
                                    className="w-full bg-gradient-to-r from-[#00e701] to-[#00c701] text-black font-bold hover:opacity-90"
                                >
                                    {isRotating ? (
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                    )}
                                    Rotate Server Seed
                                </Button>

                                {/* Revealed Seed */}
                                {revealedSeed && (
                                    <div className="bg-[#00e701]/10 border border-[#00e701]/30 rounded-lg p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-[#00e701]">Previous Seed Revealed!</span>
                                            <button
                                                onClick={() => copyToClipboard(revealedSeed, 'revealed')}
                                                className="text-xs text-[#00e701]"
                                            >
                                                {copiedField === 'revealed' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                        <div className="font-mono text-xs text-white bg-[#1a2c38] p-2 rounded break-all">
                                            {revealedSeed}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Verify Tab */}
                        {activeTab === 'verify' && (
                            <div className="space-y-4">
                                <p className="text-sm text-[#b1bad3]">
                                    Enter seeds and nonce to calculate the dice roll result.
                                </p>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold text-[#b1bad3] block mb-1">Client Seed</label>
                                        <Input
                                            value={calcClientSeed}
                                            onChange={(e) => setCalcClientSeed(e.target.value)}
                                            className="bg-[#0f212e] border-[#2f4553] text-white font-mono text-sm"
                                            placeholder="client_seed"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-[#b1bad3] block mb-1">Server Seed (Unhashed)</label>
                                        <Input
                                            value={calcServerSeed}
                                            onChange={(e) => setCalcServerSeed(e.target.value)}
                                            className="bg-[#0f212e] border-[#2f4553] text-white font-mono text-sm"
                                            placeholder="64 character hex"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-[#b1bad3] block mb-1">Nonce</label>
                                        <Input
                                            type="number"
                                            value={calcNonce}
                                            onChange={(e) => setCalcNonce(e.target.value)}
                                            className="bg-[#0f212e] border-[#2f4553] text-white font-mono text-sm"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleCalculate}
                                    className="w-full bg-[#2f4553] hover:bg-[#3d5565] text-white"
                                >
                                    Calculate Result
                                </Button>

                                {calcResult !== null && (
                                    <div className="bg-[#0f212e] rounded-lg p-4 text-center">
                                        <span className="text-sm text-[#b1bad3]">Roll Result</span>
                                        <div className="text-4xl font-bold text-[#00e701]">{calcResult.toFixed(2)}</div>
                                    </div>
                                )}

                                {/* Algorithm Explanation */}
                                <div className="bg-[#0f212e] rounded-lg p-3 font-mono text-xs space-y-1 text-[#b1bad3]">
                                    <div><span className="text-white">fullSeed</span> = clientSeed + ":" + serverSeed + ":" + nonce</div>
                                    <div><span className="text-white">hash</span> = SHA256(fullSeed)</div>
                                    <div><span className="text-white">hex</span> = hash.substring(0, 8)</div>
                                    <div><span className="text-white">roll</span> = (parseInt(hex, 16) / 0xFFFFFFFF) * 100</div>
                                </div>
                            </div>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <div className="space-y-3">
                                {verifiableBets.length === 0 ? (
                                    <div className="text-center py-8 text-[#b1bad3]">
                                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No verifiable bets yet.</p>
                                        <p className="text-xs text-[#557086]">Rotate your seed to reveal past bets.</p>
                                    </div>
                                ) : (
                                    verifiableBets.slice(0, 10).map((bet) => (
                                        <div
                                            key={bet.id}
                                            className="bg-[#0f212e] rounded-lg overflow-hidden"
                                        >
                                            <button
                                                onClick={() => setExpandedBet(expandedBet === bet.id ? null : bet.id)}
                                                className="w-full p-3 flex items-center justify-between hover:bg-[#1a2c38] transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                        bet.won ? "bg-[#00e701]/20 text-[#00e701]" : "bg-[#ed4245]/20 text-[#ed4245]"
                                                    )}>
                                                        {bet.roll_result.toFixed(0)}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-bold text-white">
                                                            {bet.won ? '+' : '-'}{bet.won ? bet.profit.toFixed(4) : bet.bet_amount.toFixed(4)}
                                                        </div>
                                                        <div className="text-xs text-[#557086]">
                                                            {bet.roll_condition === 'over' ? '>' : '<'} {bet.target} @ {bet.multiplier.toFixed(2)}x
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {verifyResults[bet.id] !== undefined && (
                                                        <span className={cn(
                                                            "text-xs font-bold",
                                                            verifyResults[bet.id] ? "text-[#00e701]" : "text-[#ed4245]"
                                                        )}>
                                                            {verifyResults[bet.id] ? '✓ Verified' : '✗ Failed'}
                                                        </span>
                                                    )}
                                                    {expandedBet === bet.id ? (
                                                        <ChevronUp className="w-4 h-4 text-[#b1bad3]" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-[#b1bad3]" />
                                                    )}
                                                </div>
                                            </button>

                                            <AnimatePresence>
                                                {expandedBet === bet.id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-[#243442]"
                                                    >
                                                        <div className="p-3 space-y-2 text-xs">
                                                            <div className="flex justify-between">
                                                                <span className="text-[#b1bad3]">Client Seed</span>
                                                                <span className="text-white font-mono">{truncateHash(bet.client_seed, 8)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-[#b1bad3]">Server Seed</span>
                                                                <span className="text-white font-mono">{truncateHash(bet.server_seed || '', 8)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-[#b1bad3]">Nonce</span>
                                                                <span className="text-white">{bet.nonce}</span>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleVerifyBet(bet)}
                                                                disabled={verifyingBet === bet.id}
                                                                className="w-full bg-[#2f4553] hover:bg-[#3d5565] text-white text-xs"
                                                            >
                                                                {verifyingBet === bet.id ? 'Verifying...' : 'Verify This Bet'}
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* How It Works Tab */}
                        {activeTab === 'howItWorks' && (
                            <div className="space-y-4 text-sm text-[#b1bad3]">
                                <div className="bg-[#0f212e] rounded-lg p-4 space-y-3">
                                    <h3 className="text-white font-bold flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-[#00e701]" />
                                        What is Provably Fair?
                                    </h3>
                                    <p>
                                        Provably fair is a cryptographic system that allows you to verify every dice roll was fair and predetermined before you bet.
                                    </p>
                                </div>

                                <div className="bg-[#0f212e] rounded-lg p-4 space-y-3">
                                    <h3 className="text-white font-bold">How It Works</h3>
                                    <ol className="list-decimal list-inside space-y-2">
                                        <li><strong className="text-white">Server Seed:</strong> Generated and hashed before you bet.</li>
                                        <li><strong className="text-white">Client Seed:</strong> You can set this to influence the result.</li>
                                        <li><strong className="text-white">Nonce:</strong> Increments with each bet for unique results.</li>
                                        <li><strong className="text-white">Result:</strong> SHA256(client:server:nonce) → 0.00-99.99</li>
                                        <li><strong className="text-white">Verify:</strong> Rotate seeds to reveal and verify past bets.</li>
                                    </ol>
                                </div>

                                <div className="bg-[#0f212e] rounded-lg p-4">
                                    <h3 className="text-white font-bold mb-2">House Edge: {DEFAULT_HOUSE_EDGE}%</h3>
                                    <p>Multiplier = (100 - {DEFAULT_HOUSE_EDGE}) / Win Chance</p>
                                    <p className="text-xs text-[#557086] mt-2">
                                        This means long-term expected return is {100 - DEFAULT_HOUSE_EDGE}%.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProvablyFairModal;
