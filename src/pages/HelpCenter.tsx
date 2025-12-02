import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const FAQS = [
  {
    question: "How do I deposit funds?",
    answer: "Go to your Wallet, select 'Deposit', choose your preferred cryptocurrency (BTC, ETH, USDT), and copy the unique address provided. Send funds to that address. Deposits typically credit after 1 network confirmation."
  },
  {
    question: "Is Shiny.bet provably fair?",
    answer: "Yes. All our original games utilize a Provably Fair system allowing you to verify the randomness of every result. You can check the client seed and server seed hash in the game details."
  },
  {
    question: "What is the minimum withdrawal?",
    answer: "The minimum withdrawal amount varies by currency but is generally equivalent to $10 USD. There are no maximum withdrawal limits for verified users."
  },
  {
    question: "How does the VIP program work?",
    answer: "You earn XP for every bet placed. As you level up, you unlock benefits like Rakeback, Weekly Bonuses, and a dedicated VIP host. Check the VIP Club page for specific tier requirements."
  },
  {
    question: "Can I have multiple accounts?",
    answer: "No. Creating multiple accounts is strictly prohibited and will result in a permanent ban and confiscation of funds."
  }
];

export default function HelpCenter() {
  return (
    <div className="container py-12 max-w-3xl space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Help Center</h1>
        <p className="text-muted-foreground">Find answers to common questions or contact support.</p>
        
        <div className="relative max-w-md mx-auto mt-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search for help..." className="pl-10 bg-zinc-900/50 border-white/10 h-12" />
        </div>
      </div>

      <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-6">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-white/5">
              <AccordionTrigger className="text-left hover:text-[#F7D979]">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="text-center pt-8 border-t border-white/5">
        <p className="text-muted-foreground mb-4">Still need help?</p>
        <a href="mailto:support@shiny.bet" className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">
          Contact Support
        </a>
      </div>
    </div>
  );
}
