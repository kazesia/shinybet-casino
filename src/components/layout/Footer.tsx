import { Twitter, Facebook, Instagram, Github } from 'lucide-react';

const LOGO_URL = "https://cdn.discordapp.com/attachments/1442155264613814302/1445539875116810392/Collabeco_2_-removebg-preview.png?ex=6930b76b&is=692f65eb&hm=9be06a69591c9fba9edca705a2295c341ddde42e5112db67b58dbc0d77f00ed5";

const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-brand-surface pt-16 pb-8">
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
