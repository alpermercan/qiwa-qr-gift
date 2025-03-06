'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChartBarIcon, UsersIcon, QrCodeIcon, GiftIcon, CheckCircleIcon, ClockIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalParticipants: number;
  totalQRCodes: number;
  usedQRCodes: number;
  unusedQRCodes: number;
  participantsWithUsedCoupons: number;
  participantsWithUnusedCoupons: number;
  averageDiscountRate: number;
  mostPopularCampaign: {
    name: string;
    usageCount: number;
  } | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalParticipants: 0,
    totalQRCodes: 0,
    usedQRCodes: 0,
    unusedQRCodes: 0,
    participantsWithUsedCoupons: 0,
    participantsWithUnusedCoupons: 0,
    averageDiscountRate: 0,
    mostPopularCampaign: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const now = new Date().toISOString();
      
      const [
        { count: totalCampaigns },
        { count: activeCampaigns },
        { count: totalParticipants },
        { count: totalQRCodes },
        { count: usedQRCodes },
        { data: participantsWithUsedCoupons },
        { data: campaignStats },
        { data: avgDiscount }
      ] = await Promise.all([
        supabase.from('campaigns').select('*', { count: 'exact', head: true }),
        supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .gt('expiry_date', now)
          .gt('remaining_uses', 0),
        supabase.from('campaign_participations').select('*', { count: 'exact', head: true }),
        supabase.from('qr_codes').select('*', { count: 'exact', head: true }),
        supabase.from('qr_codes').select('*', { count: 'exact', head: true }).eq('is_used', true),
        supabase.from('campaign_participations').select('*').eq('is_used', true),
        supabase
          .from('campaigns')
          .select(`
            name,
            id,
            discount_rate,
            campaign_participations!inner (
              count
            )
          `)
          .eq('campaign_participations.is_used', true)
          .order('campaign_participations_count', { ascending: false })
          .limit(1),
        supabase
          .from('campaigns')
          .select('discount_rate')
          .gt('expiry_date', now)
          .gt('remaining_uses', 0)
      ]);

      const unusedQRCodes = (totalQRCodes || 0) - (usedQRCodes || 0);
      const participantsWithUsed = participantsWithUsedCoupons?.length || 0;
      const participantsWithUnused = (totalParticipants || 0) - participantsWithUsed;

      // Ortalama indirim oranını hesapla
      const avgDiscountRate = avgDiscount?.length
        ? Math.round(avgDiscount.reduce((acc, curr) => acc + curr.discount_rate, 0) / avgDiscount.length)
        : 0;

      setStats({
        totalCampaigns: totalCampaigns || 0,
        activeCampaigns: activeCampaigns || 0,
        totalParticipants: totalParticipants || 0,
        totalQRCodes: totalQRCodes || 0,
        usedQRCodes: usedQRCodes || 0,
        unusedQRCodes,
        participantsWithUsedCoupons: participantsWithUsed,
        participantsWithUnusedCoupons: participantsWithUnused,
        averageDiscountRate: avgDiscountRate,
        mostPopularCampaign: campaignStats?.[0] ? {
          name: campaignStats[0].name,
          usageCount: campaignStats[0].campaign_participations?.[0]?.count || 0,
        } : null,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card */}
        <div className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-slate-900 dark:border-gray-800">
          <div className="p-4 md:p-5">
            <div className="flex items-center gap-x-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Kampanyalar
              </p>
              <div className="hs-tooltip inline-block [--placement:right]">
                <button type="button" className="hs-tooltip-toggle flex items-center text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                  <InformationCircleIcon className="w-4 h-4" />
                  <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 max-w-xs bg-gray-900 px-3 py-2 text-sm font-medium text-white rounded-lg shadow-sm dark:bg-slate-700" role="tooltip">
                    Sistemdeki toplam kampanya sayısı ve şu anda aktif durumda olan kampanyaların sayısı. Aktif kampanyalar süresi dolmamış ve kullanım hakkı olan kampanyalardır.
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-x-2">
              <h3 className="text-xl sm:text-2xl font-medium text-gray-800 dark:text-gray-200">
                {stats.totalCampaigns}
              </h3>
              <span className="flex items-center text-green-600">
                <span className="text-sm">{stats.activeCampaigns} aktif</span>
              </span>
            </div>
          </div>
        </div>
        {/* End Card */}

        {/* Card */}
        <div className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-slate-900 dark:border-gray-800">
          <div className="p-4 md:p-5">
            <div className="flex items-center gap-x-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Katılımcılar
              </p>
              <div className="hs-tooltip inline-block [--placement:right]">
                <button type="button" className="hs-tooltip-toggle flex items-center text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                  <InformationCircleIcon className="w-4 h-4" />
                  <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 max-w-xs bg-gray-900 px-3 py-2 text-sm font-medium text-white rounded-lg shadow-sm dark:bg-slate-700" role="tooltip">
                    Sistemde kayıtlı toplam katılımcı sayısı ve bu katılımcılardan kuponlarını kullanmış olanların sayısı. Kupon kullanımı, QR kodun taranıp indirimden faydalanılması anlamına gelir.
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-x-2">
              <h3 className="text-xl sm:text-2xl font-medium text-gray-800 dark:text-gray-200">
                {stats.totalParticipants}
              </h3>
              <span className="flex items-center text-green-600">
                <span className="text-sm">{stats.participantsWithUsedCoupons} kupon kullandı</span>
              </span>
            </div>
          </div>
        </div>
        {/* End Card */}

        {/* Card */}
        <div className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-slate-900 dark:border-gray-800">
          <div className="p-4 md:p-5">
            <div className="flex items-center gap-x-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                QR Kodları
              </p>
              <div className="hs-tooltip inline-block [--placement:right]">
                <button type="button" className="hs-tooltip-toggle flex items-center text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                  <InformationCircleIcon className="w-4 h-4" />
                  <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 max-w-xs bg-gray-900 px-3 py-2 text-sm font-medium text-white rounded-lg shadow-sm dark:bg-slate-700" role="tooltip">
                    Tüm kampanyalar için oluşturulmuş toplam QR kod sayısı ve bu kodlardan kullanılmış olanların sayısı. Kullanılmış QR kodlar tekrar kullanılamaz.
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-x-2">
              <h3 className="text-xl sm:text-2xl font-medium text-gray-800 dark:text-gray-200">
                {stats.totalQRCodes}
              </h3>
              <div className="flex items-center gap-x-2">
                <span className="flex items-center text-green-600 dark:text-green-500">
                  <span className="text-sm">{stats.usedQRCodes} kullanıldı</span>
                </span>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="text-sm">{stats.unusedQRCodes} kullanılmadı</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* End Card */}

        {/* Card */}
        <div className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-slate-900 dark:border-gray-800">
          <div className="p-4 md:p-5">
            <div className="flex items-center gap-x-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Ortalama İndirim
              </p>
              <div className="hs-tooltip inline-block [--placement:right]">
                <button type="button" className="hs-tooltip-toggle flex items-center text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                  <InformationCircleIcon className="w-4 h-4" />
                  <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 max-w-xs bg-gray-900 px-3 py-2 text-sm font-medium text-white rounded-lg shadow-sm dark:bg-slate-700" role="tooltip">
                    Aktif durumdaki tüm kampanyaların ortalama indirim oranı. Bu oran, süresi dolmamış ve kullanım hakkı olan kampanyaların indirim oranlarının ortalamasıdır.
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-x-2">
              <h3 className="text-xl sm:text-2xl font-medium text-gray-800 dark:text-gray-200">
                %{stats.averageDiscountRate}
              </h3>
            </div>
          </div>
        </div>
        {/* End Card */}
      </div>
      {/* End Grid */}

      {/* Grid */}
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card */}
        <div className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-slate-900 dark:border-gray-800">
          <div className="p-4 md:p-5">
            <div className="flex items-center gap-x-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Kupon Kullanım Oranı
              </p>
              <div className="hs-tooltip inline-block [--placement:right]">
                <button type="button" className="hs-tooltip-toggle flex items-center text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                  <InformationCircleIcon className="w-4 h-4" />
                  <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 max-w-xs bg-gray-900 px-3 py-2 text-sm font-medium text-white rounded-lg shadow-sm dark:bg-slate-700" role="tooltip">
                    Tüm QR kodların kullanım durumu ve oranı. Yeşil çubuk kullanılmış kodların oranını, gri çubuk ise kullanılmamış kodların oranını gösterir.
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-1">
              <div className="flex items-center gap-x-2">
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200">
                  {Math.round((stats.usedQRCodes / stats.totalQRCodes) * 100)}%
                </h3>
              </div>

              <div className="mt-2 flex items-center gap-x-1 text-gray-500">
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-600 rounded-full"
                    style={{ width: `${(stats.usedQRCodes / stats.totalQRCodes) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.usedQRCodes} kullanıldı
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">•</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.unusedQRCodes} kullanılmadı
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* End Card */}

        {/* Card */}
        <div className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-slate-900 dark:border-gray-800">
          <div className="p-4 md:p-5">
            <div className="flex items-center gap-x-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Katılımcı Kupon Kullanımı
              </p>
              <div className="hs-tooltip inline-block [--placement:right]">
                <button type="button" className="hs-tooltip-toggle flex items-center text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                  <InformationCircleIcon className="w-4 h-4" />
                  <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 max-w-xs bg-gray-900 px-3 py-2 text-sm font-medium text-white rounded-lg shadow-sm dark:bg-slate-700" role="tooltip">
                    Katılımcıların kupon kullanım durumu ve oranı. Yeşil çubuk kuponunu kullanmış katılımcıların oranını, gri çubuk ise henüz kullanmamış katılımcıların oranını gösterir.
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-1">
              <div className="flex items-center gap-x-2">
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200">
                  {Math.round((stats.participantsWithUsedCoupons / stats.totalParticipants) * 100)}%
                </h3>
              </div>

              <div className="mt-2 flex items-center gap-x-1 text-gray-500">
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-green-600 rounded-full"
                    style={{ width: `${(stats.participantsWithUsedCoupons / stats.totalParticipants) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.participantsWithUsedCoupons} kullandı
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">•</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.participantsWithUnusedCoupons} kullanmadı
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* End Card */}

        {/* Card */}
        <div className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-slate-900 dark:border-gray-800">
          <div className="p-4 md:p-5">
            <div className="flex items-center gap-x-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                En Popüler Kampanya
              </p>
              <div className="hs-tooltip inline-block [--placement:right]">
                <button type="button" className="hs-tooltip-toggle flex items-center text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                  <InformationCircleIcon className="w-4 h-4" />
                  <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 max-w-xs bg-gray-900 px-3 py-2 text-sm font-medium text-white rounded-lg shadow-sm dark:bg-slate-700" role="tooltip">
                    En çok kullanılan kampanya ve bu kampanyanın toplam kullanım sayısı. Bu istatistik, hangi kampanyanın en popüler olduğunu gösterir.
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-1">
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200">
                {stats.mostPopularCampaign?.name || 'Henüz kampanya yok'}
              </h3>
              {stats.mostPopularCampaign && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {stats.mostPopularCampaign.usageCount} kullanım
                </p>
              )}
            </div>
          </div>
        </div>
        {/* End Card */}
      </div>
      {/* End Grid */}
    </div>
  );
} 