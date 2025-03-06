'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import eventEmitter, { CAMPAIGN_CREATED } from '@/lib/eventEmitter';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Campaign {
  id: string;
  name: string;
  description: string;
  discount_rate: number;
  min_purchase_amount: number;
  max_discount_amount: number;
  total_uses: number;
  remaining_uses: number;
  expiry_date: string;
  created_at: string;
  status: 'active' | 'expired' | 'depleted';
}

export default function CampaignsTable() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();

    // Yeni kampanya oluşturulduğunda listeyi güncelle
    const handleCampaignCreated = () => {
      fetchCampaigns();
    };

    eventEmitter.on(CAMPAIGN_CREATED, handleCampaignCreated);

    return () => {
      eventEmitter.off(CAMPAIGN_CREATED, handleCampaignCreated);
    };
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCampaigns = data.map((campaign: any) => ({
        ...campaign,
        status: getStatus(campaign),
      }));

      setCampaigns(formattedCampaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kampanyalar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = (campaign: Omit<Campaign, 'status'>): Campaign['status'] => {
    const now = new Date();
    const expiryDate = new Date(campaign.expiry_date);

    if (campaign.remaining_uses <= 0) return 'depleted';
    if (expiryDate < now) return 'expired';
    return 'active';
  };

  const navigateToCampaign = (id: string) => {
    router.push(`/admin/campaigns/${id}`);
  };

  if (isLoading) {
    return <div className="text-center py-4">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kampanya Adı
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              İndirim Oranı
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kullanım
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Son Kullanma Tarihi
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Durum
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {campaigns.map((campaign) => (
            <tr 
              key={campaign.id}
              onClick={() => navigateToCampaign(campaign.id)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {campaign.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                %{campaign.discount_rate}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {campaign.remaining_uses}/{campaign.total_uses}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(campaign.expiry_date).toLocaleDateString('tr-TR')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    campaign.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : campaign.status === 'expired'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {campaign.status === 'active'
                    ? 'Aktif'
                    : campaign.status === 'expired'
                    ? 'Süresi Dolmuş'
                    : 'Tükenmiş'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 