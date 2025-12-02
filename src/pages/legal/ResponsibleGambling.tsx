import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function ResponsibleGambling() {
  return (
    <div className="container py-12 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-red-500/10 rounded-xl">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold">Responsible Gambling</h1>
      </div>
      
      <div className="space-y-8 text-muted-foreground">
        <p className="text-lg">Gambling should be entertaining and fun. Please play responsibly and only bet what you can afford to lose.</p>
        
        <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-xl space-y-4">
          <h2 className="text-xl font-bold text-white">Self-Exclusion</h2>
          <p>If you feel you are losing control of your gambling, we offer a self-exclusion facility. This will prevent you from accessing your account for a set period of time.</p>
          <Button variant="destructive">Request Self-Exclusion</Button>
        </div>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-white">Tips for Safe Gambling</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Set a deposit limit before you start playing.</li>
            <li>Never chase your losses.</li>
            <li>Take regular breaks.</li>
            <li>Don't gamble if you are upset, stressed, or under the influence.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-white">External Help</h2>
          <p>If you need professional help, please contact:</p>
          <ul className="list-disc pl-5">
            <li><a href="#" className="text-[#F7D979] hover:underline">Gamblers Anonymous</a></li>
            <li><a href="#" className="text-[#F7D979] hover:underline">Gambling Therapy</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
