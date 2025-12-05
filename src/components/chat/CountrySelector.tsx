import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

const countries = [
    { value: 'us', label: 'United States', flag: '🇺🇸' },
    { value: 'in', label: 'India', flag: '🇮🇳' },
    { value: 'gb', label: 'United Kingdom', flag: '🇬🇧' },
    { value: 'ca', label: 'Canada', flag: '🇨🇦' },
    { value: 'au', label: 'Australia', flag: '🇦🇺' },
    { value: 'de', label: 'Germany', flag: '🇩🇪' },
    { value: 'fr', label: 'France', flag: '🇫🇷' },
    { value: 'jp', label: 'Japan', flag: '🇯🇵' },
    { value: 'br', label: 'Brazil', flag: '🇧🇷' },
    { value: 'ru', label: 'Russia', flag: '🇷🇺' },
    // Add more as needed
];

interface CountrySelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function CountrySelector({ value, onChange }: CountrySelectorProps) {
    const [open, setOpen] = useState(false);

    const selectedCountry = countries.find((country) => country.flag === value) || countries[0];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[60px] justify-between p-0 h-8 hover:bg-transparent"
                >
                    <span className="text-xl">{selectedCountry?.flag}</span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 bg-[#213743] border-[#2f4553]">
                <Command className="bg-[#213743] text-white">
                    <CommandInput placeholder="Search country..." className="h-9" />
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {countries.map((country) => (
                            <CommandItem
                                key={country.value}
                                value={country.label}
                                onSelect={() => {
                                    onChange(country.flag);
                                    setOpen(false);
                                }}
                                className="text-white hover:bg-[#2f4553] aria-selected:bg-[#2f4553]"
                            >
                                <span className="mr-2 text-lg">{country.flag}</span>
                                {country.label}
                                <Check
                                    className={cn(
                                        "ml-auto h-4 w-4",
                                        value === country.flag ? "opacity-100" : "opacity-0"
                                    )}
                                />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
