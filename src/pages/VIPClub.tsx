
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  HelpCircle,
  Trophy,
  Crown,
  Gem,
  Shield,
  MessageCircle,
  Globe,
  ChevronDown,
  ChevronRight,
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Define Tiers matching the screenshot
const TIERS = [
  {
    name: 'Bronze',
    minWager: 10000,
    color: '#cd7f32', // Bronze
    benefits: [
      'Monthly bonuses',
      'Level Up bonuses',
      'Rakeback',
      'Weekly bonuses'
    ]
  },
  {
    name: 'Silver',
    minWager: 50000,
    color: '#c0c0c0', // Silver
    benefits: [
      'Monthly bonuses',
      'Level Up bonuses',
      'Rakeback',
      'Weekly bonuses',
      'Bonus growth'
    ]
  },
  {
    name: 'Gold',
    minWager: 100000,
    color: '#ffd700', // Gold
    benefits: [
      'Monthly bonuses',
      'Level Up bonuses',
      'Rakeback',
      'Weekly bonuses',
      'Bonus growth'
    ]
  },
  {
    name: 'Platinum I-III',
    minWager: 250000,
    color: '#22d3ee', // Platinum (Cyan)
    benefits: [
      'Monthly bonuses',
      'Level Up bonuses',
      'Rakeback',
      'Weekly bonuses',
      'Bonus growth',
      'Daily bonuses / Reload'
    ]
  },
];

const BENEFITS = [
  {
    title: 'Boost',
    description: 'Every week and every month, expect a fresh bonus based on your recent games. The more you play, the higher the bonuses.',
    icon: <ZapIcon className="w-6 h-6 text-[#ffd700]" />,
  },
  {
    title: 'Dedicated VIP Host',
    description: 'Receive your own dedicated VIP host who will support and cater to your betting needs.',
    icon: <Crown className="w-6 h-6 text-[#ffd700]" />,
  },
  {
    title: 'Recent Play Bonuses',
    description: 'Having a rough streak of luck? Shiny offers money back on losses every time you level up.',
    icon: <Trophy className="w-6 h-6 text-[#ffd700]" />,
  },
  {
    title: 'Level-Ups',
    description: 'Reach a new level and get paid. The level-ups get better the higher you go.',
    icon: <Gem className="w-6 h-6 text-[#ffd700]" />,
  },
  {
    title: 'Bespoke benefits',
    description: 'Work with your dedicated VIP host to tailor benefits to your gaming needs.',
    icon: <Shield className="w-6 h-6 text-[#ffd700]" />,
  },
];

type FAQCategory = 'General' | 'Benefits' | 'VIP Hosts';

const FAQ_DATA: Record<FAQCategory, { question: string; answer: string }[]> = {
  General: [
    {
      question: 'Why is Shiny\'s VIP program the best?',
      answer: 'Shiny offers the most comprehensive VIP program in the industry with personalized rewards, dedicated hosts, and exclusive benefits tailored to your gaming style.'
    },
    {
      question: 'How much has Shiny given out in bonuses?',
      answer: 'Shiny has distributed millions in bonuses to our VIP members, with amounts increasing as you climb the VIP tiers.'
    },
    {
      question: 'How do I enter the $75,000 weekly raffle?',
      answer: 'VIP members are automatically entered into our weekly raffle based on their activity and tier level.'
    },
    {
      question: 'Where can I find the Shiny Telegram Channel?',
      answer: 'Join our official Telegram channel for updates, exclusive offers, and community engagement.'
    },
    {
      question: 'Where can I find the Shiny VIP Telegram channel?',
      answer: 'VIP members receive an exclusive invitation to our VIP-only Telegram channel with their VIP host.'
    },
  ],
  Benefits: [
    {
      question: 'What is a recent gameplay bonus?',
      answer: 'Recent gameplay bonuses are rewards based on your activity over a specific period. If you\'ve been active, you might receive a bonus to boost your balance.'
    },
    {
      question: 'What is rakeback?',
      answer: 'Rakeback is a benefit where you get a percentage of the house edge back on every bet you place, regardless of whether you win or lose.'
    },
    {
      question: 'What is a reload? How do I claim my reload?',
      answer: 'A reload is a bonus you can claim at specific intervals (daily, hourly, etc.). You can claim it from your VIP dashboard once it becomes available.'
    },
    {
      question: 'When is the Monthly bonus scheduled for?',
      answer: 'Monthly bonuses are typically sent out around the middle of each month. The exact date can vary, so keep an eye on your email and notifications.'
    },
    {
      question: 'How do I calculate the amount I need to wager to move to the next level?',
      answer: 'You can see your progress bar on the VIP page. The remaining percentage tells you how much more you need to wager relative to the tier requirements.'
    },
    {
      question: 'What rewards do I get when I level up?',
      answer: 'Level-up rewards include a cash bonus, increased rakeback percentage, and access to new benefits specific to your new tier.'
    },
    {
      question: 'How do you calculate bonuses?',
      answer: 'Bonuses are calculated based on your recent wagering activity, your VIP level, and the house edge of the games you play.'
    }
  ],
  'VIP Hosts': [
    {
      question: 'What can my VIP Host do for me?',
      answer: 'Your VIP Host can assist with account issues, provide exclusive bonuses, expedite withdrawals, and offer personalized support tailored to your needs.'
    },
    {
      question: 'When I\'m assigned a VIP host, does my Reload become a continuous or renewable benefit?',
      answer: 'Yes, typically VIP hosts can set up renewable reloads for you as long as you maintain your activity levels.'
    },
    {
      question: 'What is the job of a VIP host and how does it differ from regular Live Support assistance?',
      answer: 'Regular support handles general queries. A VIP Host builds a personal relationship with you, proactively offering bonuses and handling complex requests.'
    },
    {
      question: 'When do I get a VIP host?',
      answer: 'You are assigned a dedicated VIP Host once you reach the Platinum IV VIP tier.'
    },
    {
      question: 'What can I do if my VIP host is on vacation?',
      answer: 'If your host is away, another senior VIP host will temporarily manage your account to ensure you continue to receive premium service.'
    }
  ]
};

// Helper icon component
function ZapIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

// Hexagon Background Component
function HexagonBg({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#1a2c38] fill-current">
        <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function VIPClub() {
  const { user } = useAuth();
  const { stats } = useDashboardData();
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('General');

  const totalWagered = stats?.total_wagered || 0;

  // --- Logic Fix: Handle "Member" state (0 - 10k) ---
  let currentTierName = 'Member';
  let nextTierName = 'Bronze';
  let progressPercent = 0;

  // Find the highest tier the user has achieved
  const achievedTierIndex = TIERS.slice().reverse().findIndex(tier => totalWagered >= tier.minWager);
  // Calculate actual index in TIERS array (0=Bronze, 1=Silver...)
  // If achievedTierIndex is -1, user is below Bronze (index -1 effectively)
  const currentTierIndex = achievedTierIndex === -1 ? -1 : TIERS.length - 1 - achievedTierIndex;

  if (currentTierIndex !== -1) {
    // User has reached at least Bronze
    const currentTier = TIERS[currentTierIndex];
    const nextTier = TIERS[currentTierIndex + 1];

    currentTierName = currentTier.name;

    if (nextTier) {
      nextTierName = nextTier.name;
      // Calculate progress between tiers
      const range = nextTier.minWager - currentTier.minWager;
      const progress = totalWagered - currentTier.minWager;
      progressPercent = (progress / range) * 100;
    } else {
      // Max tier reached
      nextTierName = 'Max';
      progressPercent = 100;
    }
  } else {
    // User is still a "Member" (below Bronze)
    currentTierName = 'None'; // Or 'Member'
    nextTierName = 'Bronze';
    progressPercent = (totalWagered / 10000) * 100;
  }

  // Clamp progress
  progressPercent = Math.min(100, Math.max(0, progressPercent));

  return (
    <div className="min-h-screen bg-[#1a2c38] text-white font-sans">

      {/* --- HERO SECTION --- */}
      <div className="relative bg-[#1a2c38] pt-12 pb-24 overflow-hidden">
        {/* Background Pattern - Cubes/Hexagons */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#2f4553 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a2c38] pointer-events-none" />

        {/* Large Star Graphic (Right Side) */}
        <div className="absolute right-[-5%] top-10 w-[600px] h-[600px] pointer-events-none hidden lg:block">
          <div className="relative w-full h-full animate-pulse-slow">
            <Star className="absolute top-0 right-20 w-64 h-64 text-[#ffd700] fill-[#ffd700] opacity-20 rotate-12" />
            <Star className="absolute bottom-20 right-40 w-40 h-40 text-[#b1bad3] fill-[#b1bad3] opacity-10 -rotate-12" />
            <Star className="absolute top-40 right-80 w-32 h-32 text-orange-500 fill-orange-500 opacity-10 rotate-45" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">

          {/* Left: User Progress Card */}
          <div className="w-full max-w-xl z-10">
            {user ? (
              <div className="bg-[#0f212e] border border-[#F7D979]/30 rounded-xl p-8 shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#1a2c38] border border-[#F7D979]/50 flex items-center justify-center text-white font-bold text-xl">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-bold text-xl">{user.email?.split('@')[0]}</div>
                    </div>
                  </div>
                  <Star className="w-6 h-6 text-[#F7D979]" />
                </div>

                {/* Progress Bar Section */}
                <div className="space-y-3 mb-2">
                  <div className="flex justify-between text-sm font-medium">
                    <div className="flex items-center gap-2 text-white">
                      Your VIP Progress
                      <ChevronRight className="w-4 h-4 text-[#b1bad3]" />
                    </div>
                    <div className="text-white font-mono">{progressPercent.toFixed(2)}% <InfoIcon className="inline w-4 h-4 ml-1 text-[#b1bad3]" /></div>
                  </div>

                  <div className="h-2.5 bg-[#1a2c38] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F7D979] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(247,217,121,0.5)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs font-medium mt-2 text-[#b1bad3]">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3 h-3" />
                      <span>{currentTierName === 'None' ? 'Member' : currentTierName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3 h-3" />
                      <span>{nextTierName}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0f212e] border border-[#2f4553] rounded-xl p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Join the VIP Club</h2>
                <p className="text-[#b1bad3] mb-6">Sign up today to start earning rewards!</p>
                <Button className="bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold py-2 px-6 rounded-lg">
                  Register Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- VIP RANKING SYSTEM --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-white mb-12">Shiny VIP ranking system</h2>

          {/* Stepper Row */}
          <div className="relative flex justify-between items-center max-w-3xl mx-auto mb-16">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#2f4553] -z-10" />

            {/* Steps - Dynamic based on currentTierIndex */}
            {TIERS.map((tier, index) => {
              const isPassed = index < currentTierIndex;
              const isCurrent = index === currentTierIndex;
              const isNext = index === currentTierIndex + 1;

              let borderColor = '#2f4553'; // Default for future tiers
              let iconColor = '#b1bad3';
              let shadow = '';

              if (isCurrent) {
                borderColor = '#F7D979';
                iconColor = '#F7D979';
                shadow = '0 0 15px rgba(247,217,121,0.3)';
              } else if (isPassed) {
                borderColor = '#2f4553'; // Border for passed tiers
                iconColor = '#b1bad3'; // Icon color for passed tiers
              } else if (isNext) {
                borderColor = '#22d3ee'; // Cyan for next
                iconColor = '#22d3ee';
              }

              return (
                <div key={tier.name} className="flex flex-col items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-full bg-[#0f212e] border-2 flex items-center justify-center transition-all duration-300"
                    style={{ borderColor, boxShadow: shadow }}
                  >
                    {isPassed ? (
                      <Check className="w-5 h-5 text-[#b1bad3]" />
                    ) : (
                      <Star className="w-5 h-5" style={{ color: iconColor }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier) => {
            const isCurrent = currentTierName === tier.name;

            return (
              <Card
                key={tier.name}
                className={cn(
                  "bg-[#0f212e] rounded-xl overflow-hidden group hover:bg-[#1a2c38] transition-colors",
                  isCurrent ? "border border-[#F7D979] shadow-[0_0_20px_-5px_rgba(247,217,121,0.15)]" : "border-none"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex justify-start mb-4">
                    <Badge
                      className="bg-[#2f4553] text-[#b1bad3] hover:bg-[#2f4553] border-none px-3 py-1 text-xs font-bold uppercase tracking-wider"
                      style={{ color: tier.name === 'Gold' ? '#F7D979' : tier.name === 'Platinum I-III' ? '#22d3ee' : undefined }}
                    >
                      {tier.name}
                    </Badge>
                  </div>

                  <div className="mb-6">
                    <div className="text-3xl font-bold text-white mb-1">
                      ${(tier.minWager / 1000).toLocaleString()}k
                      {tier.name === 'Platinum I-III' && <span className="text-[#b1bad3] text-xl font-normal"> - $1M</span>}
                    </div>
                    <div className="text-xs text-[#b1bad3] font-medium uppercase tracking-wide">Wager amount</div>
                  </div>

                  <ul className="space-y-3">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[#b1bad3]">
                        <div className="mt-0.5 w-4 h-4 rounded-full bg-[#F7D979] flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-[#0f212e]" />
                        </div>
                        <span className="font-medium">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* --- BENEFITS SECTION --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center text-white mb-12">Shiny VIP Club benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {BENEFITS.map((item, i) => (
            <div key={i} className="bg-[#0f212e] rounded-xl p-6 flex items-start gap-6 hover:bg-[#1a2c38] transition-colors group">
              <div className="shrink-0">
                <HexagonBg>
                  {item.icon}
                </HexagonBg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[#F7D979] transition-colors">{item.title}</h3>
                <p className="text-[#b1bad3] text-sm leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- FAQ SECTION --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-2 text-white">Frequently Asked Questions</h2>
          <p className="text-[#b1bad3]">Reach out to our award winning support team</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-1">
            {(['General', 'Benefits', 'VIP Hosts'] as FAQCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "w-full text-left px-4 py-3 font-medium rounded-lg transition-all duration-200",
                  activeCategory === category
                    ? "bg-[#0f212e] text-white border-l-4 border-[#1475e1] shadow-lg rounded-l-none"
                    : "text-[#b1bad3] hover:bg-[#0f212e] hover:text-white"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Accordion */}
          <div className="lg:col-span-3">
            <Accordion type="single" collapsible className="space-y-3">
              {FAQ_DATA[activeCategory].map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-none bg-[#0f212e] rounded-lg px-6 py-1">
                  <AccordionTrigger className="text-white hover:no-underline font-medium text-sm text-left">{item.question}</AccordionTrigger>
                  <AccordionContent className="text-[#b1bad3] text-sm leading-relaxed">{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      {/* --- LIVE SUPPORT SECTION --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="bg-[#0f212e] rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <h3 className="text-xl font-bold text-white mb-2">Live, 24-hour customer support</h3>
            <p className="text-[#b1bad3] text-sm max-w-lg">Real support from real people. We're available through instant live chat and email to help you.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="flex items-center gap-2 bg-[#1a2c38] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#213743] transition-colors">
                Preferred language: <span className="font-bold">English</span>
                <ChevronDown className="w-4 h-4 ml-2 text-[#b1bad3]" />
              </button>
            </div>
            <Link to="/help">
              <Button className="bg-[#1475e1] hover:bg-[#1475e1]/90 text-white font-bold py-2.5 px-6 rounded-lg">
                Chat with us
              </Button>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}
