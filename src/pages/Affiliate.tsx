import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users } from 'lucide-react';
import { AffiliateOverview } from '@/components/affiliate/AffiliateOverview';
import { AffiliateCampaigns } from '@/components/affiliate/AffiliateCampaigns';
import { AffiliateCommission } from '@/components/affiliate/AffiliateCommission';
import { AffiliateReferredUsers } from '@/components/affiliate/AffiliateReferredUsers';
import { AffiliateFAQ } from '@/components/affiliate/AffiliateFAQ';
import { useAffiliate } from '@/hooks/useAffiliate';

export default function Affiliate() {
  const [activeTab, setActiveTab] = useState('overview');
  const affiliate = useAffiliate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-8 h-8 text-[#F7D979]" />
        <h1 className="text-3xl font-bold text-white">Affiliate Program</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1a2c38] border-b border-[#2f4553] rounded-none w-full justify-start h-auto p-0 mb-6">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#00e701] rounded-none px-6 py-3 text-[#b1bad3] data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="campaigns"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#00e701] rounded-none px-6 py-3 text-[#b1bad3] data-[state=active]:text-white"
          >
            Campaigns
          </TabsTrigger>
          <TabsTrigger
            value="commission"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#00e701] rounded-none px-6 py-3 text-[#b1bad3] data-[state=active]:text-white"
          >
            Commission
          </TabsTrigger>
          <TabsTrigger
            value="referred-users"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#00e701] rounded-none px-6 py-3 text-[#b1bad3] data-[state=active]:text-white"
          >
            Referred Users
          </TabsTrigger>
          <TabsTrigger
            value="faq"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#00e701] rounded-none px-6 py-3 text-[#b1bad3] data-[state=active]:text-white"
          >
            FAQ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <AffiliateOverview affiliate={affiliate} />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-0">
          <AffiliateCampaigns affiliate={affiliate} />
        </TabsContent>

        <TabsContent value="commission" className="mt-0">
          <AffiliateCommission affiliate={affiliate} />
        </TabsContent>

        <TabsContent value="referred-users" className="mt-0">
          <AffiliateReferredUsers affiliate={affiliate} />
        </TabsContent>

        <TabsContent value="faq" className="mt-0">
          <AffiliateFAQ />
        </TabsContent>
      </Tabs>
    </div>
  );
}
