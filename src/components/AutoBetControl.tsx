import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Play, Pause, Square, ChevronDown, ChevronUp } from 'lucide-react';
import type { AutoBetSettings } from '@/hooks/useEnhancedAutoBet';

interface AutoBetControlProps {
    settings: AutoBetSettings;
    onSettingsChange: (settings: AutoBetSettings) => void;
    onStart: () => void;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    isRunning: boolean;
    isPaused: boolean;
    currentBet: number;
}

export function AutoBetControl({
    settings,
    onSettingsChange,
    onStart,
    onPause,
    onResume,
    onStop,
    isRunning,
    isPaused,
    currentBet,
}: AutoBetControlProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const updateSetting = <K extends keyof AutoBetSettings>(
        key: K,
        value: AutoBetSettings[K]
    ) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-4">
            {/* Bet Amount */}
            <div>
                <Label className="text-sm text-[#b1bad3] mb-2 block">Bet Amount</Label>
                <div className="flex gap-2">
                    <Input
                        type="number"
                        value={settings.baseBet}
                        onChange={(e) => updateSetting('baseBet', parseFloat(e.target.value) || 0)}
                        className="bg-[#0f212e] border-[#2f4553] text-white"
                        step="0.01"
                        min="0.01"
                        disabled={isRunning}
                    />
                    <Button
                        variant="outline"
                        onClick={() => updateSetting('baseBet', settings.baseBet / 2)}
                        className="border-[#2f4553] text-white"
                        disabled={isRunning}
                    >
                        ½
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => updateSetting('baseBet', settings.baseBet * 2)}
                        className="border-[#2f4553] text-white"
                        disabled={isRunning}
                    >
                        2×
                    </Button>
                </div>
            </div>

            {/* Number of Bets */}
            <div>
                <Label className="text-sm text-[#b1bad3] mb-2 block">Number of Bets</Label>
                <div className="relative">
                    <Input
                        type="number"
                        value={settings.numberOfBets}
                        onChange={(e) => updateSetting('numberOfBets', parseInt(e.target.value) || 0)}
                        className="bg-[#0f212e] border-[#2f4553] text-white pr-12"
                        min="1"
                        max="100"
                        disabled={isRunning}
                    />
                    <button
                        onClick={() => updateSetting('numberOfBets', 999999)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1475e1] hover:text-[#1266c9] text-sm font-bold"
                        disabled={isRunning}
                    >
                        ∞
                    </button>
                </div>
            </div>

            {/* Advanced Toggle */}
            <div className="flex items-center justify-between">
                <Label className="text-sm text-[#b1bad3]">Advanced</Label>
                <Switch
                    checked={showAdvanced}
                    onCheckedChange={setShowAdvanced}
                    className="data-[state=checked]:bg-[#00e701]"
                />
            </div>

            {/* Advanced Settings */}
            {showAdvanced && (
                <Card className="bg-[#0f212e] border-[#2f4553] p-4 space-y-4">
                    {/* On Win */}
                    <div>
                        <Label className="text-sm text-[#b1bad3] mb-2 block">On Win</Label>
                        <div className="flex gap-2 mb-2">
                            <Button
                                variant={settings.onWinAction === 'reset' ? 'default' : 'outline'}
                                onClick={() => updateSetting('onWinAction', 'reset')}
                                className={settings.onWinAction === 'reset' ? 'bg-[#1475e1]' : 'border-[#2f4553] text-white'}
                                disabled={isRunning}
                                size="sm"
                            >
                                Reset
                            </Button>
                            <Button
                                variant={settings.onWinAction === 'increase' ? 'default' : 'outline'}
                                onClick={() => updateSetting('onWinAction', 'increase')}
                                className={settings.onWinAction === 'increase' ? 'bg-[#1475e1]' : 'border-[#2f4553] text-white'}
                                disabled={isRunning}
                                size="sm"
                            >
                                Increase by:
                            </Button>
                            <div className="relative flex-1">
                                <Input
                                    type="number"
                                    value={settings.onWinMultiplier}
                                    onChange={(e) => updateSetting('onWinMultiplier', parseFloat(e.target.value) || 1)}
                                    className="bg-[#1a2c38] border-[#2f4553] text-white pr-8"
                                    step="0.1"
                                    min="1"
                                    disabled={isRunning || settings.onWinAction === 'reset'}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] text-sm">%</span>
                            </div>
                        </div>
                    </div>

                    {/* On Loss */}
                    <div>
                        <Label className="text-sm text-[#b1bad3] mb-2 block">On Loss</Label>
                        <div className="flex gap-2 mb-2">
                            <Button
                                variant={settings.onLossAction === 'reset' ? 'default' : 'outline'}
                                onClick={() => updateSetting('onLossAction', 'reset')}
                                className={settings.onLossAction === 'reset' ? 'bg-[#1475e1]' : 'border-[#2f4553] text-white'}
                                disabled={isRunning}
                                size="sm"
                            >
                                Reset
                            </Button>
                            <Button
                                variant={settings.onLossAction === 'increase' ? 'default' : 'outline'}
                                onClick={() => updateSetting('onLossAction', 'increase')}
                                className={settings.onLossAction === 'increase' ? 'bg-[#1475e1]' : 'border-[#2f4553] text-white'}
                                disabled={isRunning}
                                size="sm"
                            >
                                Increase by:
                            </Button>
                            <div className="relative flex-1">
                                <Input
                                    type="number"
                                    value={settings.onLossMultiplier}
                                    onChange={(e) => updateSetting('onLossMultiplier', parseFloat(e.target.value) || 1)}
                                    className="bg-[#1a2c38] border-[#2f4553] text-white pr-8"
                                    step="0.1"
                                    min="1"
                                    disabled={isRunning || settings.onLossAction === 'reset'}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] text-sm">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Stop on Profit */}
                    <div>
                        <Label className="text-sm text-[#b1bad3] mb-2 block">Stop on Profit</Label>
                        <Input
                            type="number"
                            value={settings.stopOnProfit}
                            onChange={(e) => updateSetting('stopOnProfit', parseFloat(e.target.value) || 0)}
                            className="bg-[#1a2c38] border-[#2f4553] text-white"
                            step="1"
                            min="0"
                            disabled={isRunning}
                            placeholder="0.00"
                        />
                    </div>

                    {/* Stop on Loss */}
                    <div>
                        <Label className="text-sm text-[#b1bad3] mb-2 block">Stop on Loss</Label>
                        <Input
                            type="number"
                            value={settings.stopOnLoss}
                            onChange={(e) => updateSetting('stopOnLoss', parseFloat(e.target.value) || 0)}
                            className="bg-[#1a2c38] border-[#2f4553] text-white"
                            step="1"
                            min="0"
                            disabled={isRunning}
                            placeholder="0.00"
                        />
                    </div>
                </Card>
            )}

            {/* Current Bet Display */}
            {isRunning && (
                <Card className="bg-[#0f212e] border-[#2f4553] p-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-[#b1bad3]">Next Bet</span>
                        <span className="text-sm font-bold text-white">${currentBet.toFixed(2)}</span>
                    </div>
                </Card>
            )}

            {/* Control Buttons */}
            <div className="flex gap-2">
                {!isRunning ? (
                    <Button
                        onClick={onStart}
                        className="flex-1 bg-[#00e701] hover:bg-[#00c501] text-black font-bold h-12"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Start Autobet
                    </Button>
                ) : (
                    <>
                        {isPaused ? (
                            <Button
                                onClick={onResume}
                                className="flex-1 bg-[#1475e1] hover:bg-[#1266c9] text-white font-bold h-12"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Resume
                            </Button>
                        ) : (
                            <Button
                                onClick={onPause}
                                className="flex-1 bg-[#F7D979] hover:bg-[#E5C767] text-black font-bold h-12"
                            >
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                            </Button>
                        )}
                        <Button
                            onClick={onStop}
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500/10 h-12 px-6"
                        >
                            <Square className="w-4 h-4 mr-2" />
                            Stop
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
