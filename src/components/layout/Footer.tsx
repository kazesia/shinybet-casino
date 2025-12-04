import { Twitter, Facebook, Instagram, Github } from 'lucide-react';

const LOGO_URL = "https://media.discordapp.net/attachments/1446113430150054081/1446113527676010557/Collabeco_2_-removebg-preview.png?ex=6932cdac&is=69317c2c&hm=38303892f78abdbe443b156f1d743bf3b5e6e24eed548173ae79df6013bc646c&=&format=webp&quality=lossless&width=750&height=750";

const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-brand-surface pt-16 pb-24 md:pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={LOGO_URL} alt="Shiny Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold tracking-tight">
                Shiny<span className="text-gold-gradient">.bet</span>
              </span>
            </div>
            <p className="text-sm text-brand-textSecondary leading-relaxed mb-6">
              The world's most trusted crypto casino. Fair, fast, and fun. Licensed and regulated.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-brand-textSecondary hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-brand-textSecondary hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-brand-textSecondary hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-brand-textSecondary hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white">Platform</h4>
            <ul className="space-y-2 text-sm text-brand-textSecondary">
              <li><a href="#" className="hover:text-gold-gradient transition-colors">Games</a></li>
              <li><a href="#" className="hover:text-gold-gradient transition-colors">VIP Club</a></li>
              <li><a href="#" className="hover:text-gold-gradient transition-colors">Promotions</a></li>
              <li><a href="#" className="hover:text-gold-gradient transition-colors">Referral System</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white">Support</h4>
            <ul className="space-y-2 text-sm text-brand-textSecondary">
              <li><a href="#" className="hover:text-gold-gradient transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-gold-gradient transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-gold-gradient transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-gold-gradient transition-colors">Responsible Gambling</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white">Community</h4>
            <ul className="space-y-2 text-sm text-brand-textSecondary">
              <li><a href="#" className="hover:text-gold-gradient transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-gold-gradient transition-colors">Forum</a></li>
              <li><a href="#" className="hover:text-gold-gradient transition-colors">Discord</a></li>
              <li><a href="#" className="hover:text-gold-gradient transition-colors">Telegram</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-brand-textSecondary">
            © 2025 Shiny.bet. All rights reserved. 18+ Only.
          </p>
          <div className="flex gap-6 text-xs text-brand-textSecondary">
            <span>Fairness</span>
            <span>AML Policy</span>
            <span>Self-Exclusion</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
