'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import QRCodeList from '@/components/QRCodeList';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

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

export default function CampaignDetail() {
  const params = useParams();
  const campaignId = params.id as string;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchCampaign() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      setCampaign(data);
    } catch (err) {
      console.error('Error fetching campaign:', err);
      setError('Kampanya bilgileri yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchCampaign();

    // Realtime subscription for campaign updates
    const subscription = supabase
      .channel('campaign-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `id=eq.${campaignId}`,
        },
        () => {
          console.log('Campaign updated, fetching new data...');
          fetchCampaign();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [campaignId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-800/10 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400 dark:text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-600">{error || 'Kampanya bulunamadı'}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/admin/campaigns"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Kampanyalara Dön
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.name}</h1>
            <span
              className={`inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium ${
                campaign.status === 'active'
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-800/30 dark:text-teal-500'
                  : campaign.status === 'expired'
                  ? 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-500'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-500'
              }`}
            >
              <span className={`flex w-1.5 h-1.5 rounded-full ${
                campaign.status === 'active'
                  ? 'bg-teal-600 dark:bg-teal-500'
                  : campaign.status === 'expired'
                  ? 'bg-red-600 dark:bg-red-500'
                  : 'bg-gray-600 dark:bg-gray-500'
              }`}></span>
              {campaign.status === 'active'
                ? 'Aktif'
                : campaign.status === 'expired'
                ? 'Süresi Dolmuş'
                : 'Tükenmiş'}
            </span>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{campaign.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Kampanya Detayları
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">İndirim Oranı</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">%{campaign.discount_rate}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Minimum Alışveriş Tutarı</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{campaign.min_purchase_amount} TL</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Maksimum İndirim Tutarı</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{campaign.max_discount_amount} TL</dd>
              </div>
            </dl>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Kullanım Bilgileri
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Toplam Kullanım</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{campaign.total_uses}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Kalan Kullanım</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  <span className={campaign.remaining_uses <= 10 ? 'text-red-600 dark:text-red-500' : ''}>
                    {campaign.remaining_uses}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Kullanım Oranı</dt>
                <dd className="mt-1">
                  <div className="flex items-center">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div
                        className="h-2 bg-blue-600 dark:bg-blue-500 rounded-full"
                        style={{ width: `${((campaign.total_uses - campaign.remaining_uses) / campaign.total_uses) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(((campaign.total_uses - campaign.remaining_uses) / campaign.total_uses) * 100)}%
                    </span>
                  </div>
                </dd>
              </div>
            </dl>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Zaman Bilgileri
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Oluşturulma Tarihi</dt>
                <dd className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                  {format(new Date(campaign.created_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Son Kullanma Tarihi</dt>
                <dd className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                  {format(new Date(campaign.expiry_date), 'dd MMMM yyyy HH:mm', { locale: tr })}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Kalan Süre</dt>
                <dd className="mt-1">
                  {new Date(campaign.expiry_date) > new Date() ? (
                    <span className="text-lg font-medium text-green-600 dark:text-green-500">
                      {Math.ceil((new Date(campaign.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} gün
                    </span>
                  ) : (
                    <span className="text-lg font-medium text-red-600 dark:text-red-500">
                      Süresi Dolmuş
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <QRCodeList campaignId={campaign.id} />
      </div>
    </div>
  );
} 