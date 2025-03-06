'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ParticipantForm from '@/components/ParticipantForm';
import confetti from 'canvas-confetti';
import { brandConfig } from '@/config/brand';

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
  status: 'active' | 'expired' | 'depleted';
}

interface QRCode {
  id: string;
  campaign_id: string;
  is_used: boolean;
  expires_at: string;
}

export default function QRCodePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [qrCode, setQRCode] = useState<QRCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isParticipantFormVisible, setIsParticipantFormVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Konfeti efekti için yardımcı fonksiyon
  const triggerConfetti = (isWelcome = false) => {
    const count = isWelcome ? 150 : 200; // Welcome için biraz daha az parçacık
    const defaults = {
      origin: { y: 0.7 },
      spread: 360,
      ticks: isWelcome ? 150 : 200, // Welcome için daha kısa süre
      gravity: 0.6,
      decay: 0.93,
      startVelocity: 35,
    };

    // Kahve tonları
    const colors = [
      '#6F4E37', // Coffee brown
      '#483C32', // Dark brown
      '#7B3F00', // Light coffee
      '#4B371C', // Espresso
      '#3C2F2F', // Dark roast
    ];

    // Merkezi patlama
    confetti({
      ...defaults,
      particleCount: count,
      scalar: 1,
      shapes: ['circle'],
      colors: colors,
    });

    if (!isWelcome) {
      // Başarılı kullanım için ek patlamalar
      // Sol taraftan patlama (300ms sonra)
      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: count * 0.75,
          scalar: 0.8,
          shapes: ['circle'],
          colors: colors,
          origin: { x: 0.1, y: 0.7 },
          angle: 60,
        });
      }, 300);

      // Sağ taraftan patlama (600ms sonra)
      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: count * 0.75,
          scalar: 0.8,
          shapes: ['circle'],
          colors: colors,
          origin: { x: 0.9, y: 0.7 },
          angle: 120,
        });
      }, 600);

      // Merkezi ikinci patlama (900ms sonra)
      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: count * 0.5,
          scalar: 0.75,
          shapes: ['circle'],
          colors: colors,
          spread: 180,
        });
      }, 900);

      // Final patlaması (1200ms sonra)
      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: count * 1.2,
          scalar: 0.6,
          shapes: ['circle'],
          colors: colors,
          spread: 360,
          ticks: 300,
          gravity: 0.5,
          decay: 0.91,
        });
      }, 1200);
    } else {
      // Welcome için yukarıdan aşağı efekt (200ms sonra)
      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: count * 0.6,
          scalar: 0.75,
          shapes: ['circle'],
          colors: colors,
          origin: { y: 0 },
          gravity: 1,
        });
      }, 200);
    }
  };

  useEffect(() => {
    async function fetchQRCodeAndCampaign() {
      try {
        // QR kodu getir
        const { data: qrData, error: qrError } = await supabase
          .from('qr_codes')
          .select('*')
          .eq('slug', slug)
          .single();

        if (qrError) throw new Error('QR kod bulunamadı');
        if (!qrData) throw new Error('QR kod bulunamadı');
        
        setQRCode(qrData);

        // Kampanya bilgilerini getir
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', qrData.campaign_id)
          .single();

        if (campaignError) throw new Error('Kampanya bilgileri alınamadı');
        if (!campaignData) throw new Error('Kampanya bulunamadı');

        setCampaign(campaignData);

        // Veriler başarıyla yüklendiğinde ve QR kod kullanılabilir durumdaysa
        if (!qrData.is_used && campaignData.status === 'active' && new Date(qrData.expires_at) > new Date()) {
          // Kısa bir gecikme ile hoş geldin efektini tetikle
          setTimeout(() => triggerConfetti(true), 500);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchQRCodeAndCampaign();
    }
  }, [slug]);

  const handleSuccess = () => {
    setIsParticipantFormVisible(false);
    setIsSuccess(true);
    triggerConfetti(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qiwa-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign || !qrCode) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Hata</h3>
            <p className="mt-2 text-sm text-gray-500">
              {error || 'QR kod geçersiz veya süresi dolmuş.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (qrCode.is_used) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
              <svg
                className="h-8 w-8 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-2xl font-bold text-gray-900">
              Bu QR kod daha önce kullanılmış
            </h3>
            <p className="mt-2 text-base text-gray-600">
              Her QR kod yalnızca bir kez kullanılabilir.
            </p>

            {/* Social Media Section */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-4">
                Üzülme! Bizi sosyal medyadan takip et, sürpriz hediye ve kampanyaları kaçırma! ✨
              </p>
              <div className="flex items-center justify-center space-x-6">
                <a
                  href={brandConfig.social.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-emerald-600 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href={brandConfig.social.tiktok.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-emerald-600 transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (new Date(qrCode.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              QR kodun süresi dolmuş
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Bu QR kod artık kullanılamaz.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (campaign.status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Kampanya aktif değil
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Bu kampanya şu anda aktif değil.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-2xl font-bold text-gray-900">
              Kahveniz Hazır!
            </h3>
            <p className="mt-2 text-lg text-gray-600">
              İndirim kodunuz başarıyla kaydedildi. Qiwa'da görüşmek üzere!
            </p>

            {/* Social Media Section */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-4">
                Kahve sohbetlerimizi sosyal medyaya taşıyalım! 🌟 Yeni kampanyalar ve sürprizlerden ilk sen haberdar ol! ☕️
              </p>
              <div className="flex items-center justify-center space-x-6">
                <a
                  href={brandConfig.social.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-emerald-600 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href={brandConfig.social.tiktok.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-emerald-600 transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              </div>
              <div className="mt-4 bg-emerald-50/50 rounded-xl px-4 py-3">
                <p className="text-sm text-emerald-800">
                  <span className="font-medium">{brandConfig.social.instagram.username}</span> 👈 Takip et, kahve dostluğumuzu sosyal medyada da sürdürelim! 🎉
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100 flex flex-col items-center">
      {/* Logo */}
      <div className="w-full max-w-lg mx-4 mb-6 mt-6 md:mb-8 md:mt-8">
        <div className="flex justify-center">
          <img
            src="/qiwa-logo.png"
            alt="Qiwa Coffee"
            className="h-32 md:h-32 w-auto"
          />
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="flex-grow flex items-center justify-center w-full">
        <div className="w-full max-w-lg mx-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 md:px-8 py-8 md:py-10">
              {/* Kampanya Başlığı */}
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-4 md:mb-6 leading-tight">
                {campaign.name}
              </h1>
              
              {/* Kampanya Açıklaması */}
              <p className="text-base md:text-lg text-gray-600 text-center mb-8 md:mb-12">
                {campaign.description}
              </p>

              {/* İndirim Detayları */}
              <div className="bg-emerald-50 rounded-xl p-4 md:p-6 mb-8 md:mb-12">
                <div className="flex items-center justify-center space-x-8 md:space-x-12">
                  <div className="text-center">
                    <span className="block text-3xl md:text-4xl font-bold text-emerald-600 mb-1">
                      %{campaign.discount_rate}
                    </span>
                    <span className="text-xs md:text-sm font-medium text-gray-600">İndirim</span>
                  </div>
                  
                  {campaign.min_purchase_amount > 0 && (
                    <div className="text-center">
                      <span className="block text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                        {campaign.min_purchase_amount}₺
                      </span>
                      <span className="text-xs md:text-sm font-medium text-gray-600">Min. Alışveriş</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Katılım Butonu */}
              <div className="mb-8 md:mb-12">
                <button
                  onClick={() => setIsParticipantFormVisible(true)}
                  className="w-full bg-emerald-600 text-white text-lg md:text-xl font-bold py-4 md:py-6 px-6 md:px-8 rounded-xl shadow-lg hover:bg-emerald-700 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-3"
                >
                  <span>Kampanyaya Katıl</span>
                  <svg 
                    className="w-6 h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Son Kullanma Tarihi ve Max Tutar */}
              <div className="text-center space-y-0.5">
                <p className="text-xs text-gray-400">
                  Kampanya son kullanma tarihi: {new Date(qrCode.expires_at).toLocaleDateString('tr-TR')}
                </p>
                {campaign.max_discount_amount > 0 && (
                  <p className="text-xs text-gray-400">
                    Maksimum indirim tutarı: {campaign.max_discount_amount}₺
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sosyal Medya Linkleri */}
      <div className="w-full max-w-lg mx-4 mt-8 mb-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Instagram Kullanıcı Adı */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-gray-600">
            {brandConfig.social.instagram.username}
          </div>
          
          {/* Sosyal Medya İkonları */}
          <div className="flex items-center space-x-6">
            <a
              href={brandConfig.social.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-emerald-600 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href={brandConfig.social.tiktok.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-emerald-600 transition-colors"
              aria-label="TikTok"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {isParticipantFormVisible && (
        <ParticipantForm
          qrCodeId={qrCode.id}
          campaignId={campaign.id}
          onSuccess={handleSuccess}
          onCancel={() => setIsParticipantFormVisible(false)}
        />
      )}
    </div>
  );
} 