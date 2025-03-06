'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { brandConfig } from '@/config/brand';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const participantSchema = z.object({
  firstName: z.string()
    .min(2, 'Ad en az 2 karakter olmalıdır')
    .max(50, 'Ad en fazla 50 karakter olabilir'),
  lastName: z.string()
    .min(2, 'Soyad en az 2 karakter olmalıdır')
    .max(50, 'Soyad en fazla 50 karakter olabilir'),
  email: z.string()
    .email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string()
    .min(10, 'Telefon numarası eksik')
    .max(10, 'Telefon numarası fazla uzun')
    .regex(/^5[0-9]{9}$/, 'Geçerli bir telefon numarası giriniz (5XX XXX XX XX)'),
});

type ParticipantFormData = z.infer<typeof participantSchema>;

interface ParticipantFormProps {
  qrCodeId: string;
  campaignId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ParticipantForm({
  qrCodeId,
  campaignId,
  onSuccess,
  onCancel,
}: ParticipantFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema),
  });

  // Telefon numarası formatlama fonksiyonu
  const formatPhoneNumber = (value: string) => {
    // Sadece rakamları al
    const numbers = value.replace(/\D/g, '');
    
    // Formatlı numara oluştur
    let formatted = numbers;
    if (numbers.length > 3) {
      formatted = numbers.slice(0, 3) + ' ' + numbers.slice(3);
    }
    if (numbers.length > 6) {
      formatted = formatted.slice(0, 7) + ' ' + formatted.slice(7);
    }
    if (numbers.length > 8) {
      formatted = formatted.slice(0, 10) + ' ' + formatted.slice(10);
    }
    
    return formatted;
  };

  // Telefon numarası değiştiğinde
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.startsWith('0')) {
      value = value.slice(1);
    }
    const formatted = formatPhoneNumber(value);
    e.target.value = formatted;
    setValue('phone', value); // Sadece rakamları kaydet
  };

  const onSubmit = async (data: ParticipantFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Form data:', data);
      console.log('Campaign ID:', campaignId);
      console.log('QR Code ID:', qrCodeId);

      // Önce kampanya güncelleme işlemini yap
      const { data: campaignUpdateData, error: campaignUpdateError } = await supabase.rpc(
        'decrement_campaign_uses',
        { campaign_id: campaignId }
      );

      console.log('Campaign update result:', campaignUpdateData);

      if (campaignUpdateError) {
        console.error('Campaign update error:', campaignUpdateError);
        throw new Error(`Kampanya güncellenemedi: ${campaignUpdateError.message}`);
      }

      if (!campaignUpdateData) {
        console.error('No campaign update data returned');
        throw new Error('Kampanya bilgisi alınamadı. Lütfen daha sonra tekrar deneyin.');
      }

      if (!campaignUpdateData.success) {
        console.error('Campaign update failed:', campaignUpdateData);
        throw new Error(campaignUpdateData.error || 'Kampanya güncellenemedi. Lütfen daha sonra tekrar deneyin.');
      }

      // Katılımcıyı oluştur
      const { data: participantData, error: participantError } = await supabase
        .from('campaign_participants')
        .insert({
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      console.log('Participant creation result:', participantData);

      if (participantError) {
        // Kampanya güncelleme işlemini geri al
        await supabase.rpc('increment_campaign_uses', { campaign_id: campaignId });
        console.error('Participant creation error details:', participantError);
        throw new Error(`Katılımcı kaydı oluşturulamadı: ${participantError.message}`);
      }

      if (!participantData) {
        // Kampanya güncelleme işlemini geri al
        await supabase.rpc('increment_campaign_uses', { campaign_id: campaignId });
        console.error('No participant data returned');
        throw new Error('Katılımcı kaydı oluşturuldu ancak veri dönmedi');
      }

      // Kampanya katılımını oluştur
      const { data: participationData, error: participationError } = await supabase
        .from('campaign_participations')
        .insert({
          campaign_id: campaignId,
          participant_id: participantData.id,
          qr_code_id: qrCodeId,
          is_used: false,
          created_at: new Date().toISOString(),
          used_at: null
        })
        .select()
        .single();

      console.log('Participation creation result:', participationData);

      if (participationError) {
        // Kampanya güncelleme işlemini geri al
        await supabase.rpc('increment_campaign_uses', { campaign_id: campaignId });
        // Katılımcıyı sil
        await supabase
          .from('campaign_participants')
          .delete()
          .eq('id', participantData.id);
          
        console.error('Participation creation error:', participationError);
        throw new Error(`Kampanya katılımı kaydedilemedi: ${participationError.message}`);
      }

      // Son olarak QR kodu güncelle
      const { error: qrUpdateError } = await supabase
        .from('qr_codes')
        .update({ 
          is_used: true,
          used_at: new Date().toISOString()
        })
        .eq('id', qrCodeId);

      if (qrUpdateError) {
        // Kampanya güncelleme işlemini geri al
        await supabase.rpc('increment_campaign_uses', { campaign_id: campaignId });
        // Katılımı sil
        await supabase
          .from('campaign_participations')
          .delete()
          .eq('id', participationData.id);
        // Katılımcıyı sil
        await supabase
          .from('campaign_participants')
          .delete()
          .eq('id', participantData.id);
          
        console.error('QR code update error:', qrUpdateError);
        throw new Error(`QR kod güncellenemedi: ${qrUpdateError.message}`);
      }

      // Tüm işlemler başarılı oldu
      toast.success('İndirim kodunuz başarıyla kaydedildi!');
      setIsSuccess(true);
      onSuccess();
    } catch (err) {
      console.error('Form submission error:', err);
      
      // Hata mesajını daha anlaşılır hale getir
      let errorMessage = 'Bir hata oluştu';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
              İndirim Kodunuz Hazır!
            </h3>
            <p className="mt-2 text-lg text-gray-600">
              İndirim kodunuz başarıyla kaydedildi. {brandConfig.name}'de görüşmek üzere!
            </p>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-4">
                Hey! ☕️ Daha fazla sürpriz ve özel kampanyalardan haberdar olmak için bizi sosyal medyadan takip etmeyi unutma! ✨
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
                  <span className="font-medium">@{brandConfig.social.instagram.username}</span> 👈 Takip et, kahve keyfini ikiye katla! 🎁
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-6 sm:p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Kahvenizi Hazırlayalım
          </h3>
          <p className="text-gray-500 text-center text-xs mb-8">
            Geldiğinizde baristamıza isminizi söylemeniz yeterli olacak, afiyet olsun :)
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Adınız
              </label>
              <input
                type="text"
                id="firstName"
                {...register('firstName')}
                className="py-3 px-4 block w-full border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none bg-white/80"
                placeholder="Adınızı yazın"
              />
              {errors.firstName && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Soyadınız
              </label>
              <input
                type="text"
                id="lastName"
                {...register('lastName')}
                className="py-3 px-4 block w-full border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none bg-white/80"
                placeholder="Soyadınızı yazın"
              />
              {errors.lastName && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                E-posta Adresiniz
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className="py-3 px-4 block w-full border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none bg-white/80"
                placeholder="E-posta adresinizi yazın"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Telefon Numaranız
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                  0
                </span>
                <input
                  type="tel"
                  id="phone"
                  {...register('phone')}
                  onChange={handlePhoneChange}
                  className="py-3 pl-7 pr-4 block w-full border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none bg-white/80"
                  placeholder="5XX XXX XX XX"
                  maxLength={13}
                />
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-sm text-red-600">{errors.phone.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Örnek: 0532 123 45 67</p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="mt-8">
              <button
                type="submit"
                className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-xl border border-transparent bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-[2px] border-current border-t-transparent text-white rounded-full" />
                    <span>Hazırlanıyor...</span>
                  </>
                ) : (
                  "Kahvemi Hazırla"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 