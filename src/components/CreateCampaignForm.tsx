'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import eventEmitter, { CAMPAIGN_CREATED } from '@/lib/eventEmitter';
import { generateQRCodes } from '@/lib/qrCodeUtils';
import { Button } from '@/components/ui/Button';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const campaignSchema = z.object({
  name: z.string()
    .min(3, 'Kampanya adı en az 3 karakter olmalıdır')
    .max(50, 'Kampanya adı en fazla 50 karakter olabilir'),
  description: z.string()
    .min(10, 'Açıklama en az 10 karakter olmalıdır')
    .max(200, 'Açıklama en fazla 200 karakter olabilir'),
  discountRate: z.preprocess(
    (val) => Number(val),
    z.number()
      .min(1, 'İndirim oranı en az 1 olmalıdır')
      .max(100, 'İndirim oranı en fazla 100 olabilir')
  ),
  minPurchaseAmount: z.preprocess(
    (val) => Number(val),
    z.number()
      .min(0, 'Minimum alışveriş tutarı 0 veya daha büyük olmalıdır')
  ),
  maxDiscountAmount: z.preprocess(
    (val) => Number(val),
    z.number()
      .min(0, 'Maksimum indirim tutarı 0 veya daha büyük olmalıdır')
  ),
  totalUses: z.preprocess(
    (val) => Number(val),
    z.number()
      .min(1, 'Toplam kullanım sayısı en az 1 olmalıdır')
  ),
  expiryDate: z.string().refine((date) => new Date(date) > new Date(), {
    message: 'Son kullanma tarihi bugünden sonra olmalıdır',
  }),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CreateCampaignFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateCampaignForm({ onClose, onSuccess }: CreateCampaignFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      minPurchaseAmount: 0,
      maxDiscountAmount: 0,
    },
  });

  const onSubmit = async (data: CampaignFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const campaignData = {
        name: data.name,
        description: data.description,
        discount_rate: Number(data.discountRate),
        min_purchase_amount: Number(data.minPurchaseAmount),
        max_discount_amount: Number(data.maxDiscountAmount),
        total_uses: Number(data.totalUses),
        remaining_uses: Number(data.totalUses),
        expiry_date: new Date(data.expiryDate).toISOString(),
        created_at: new Date().toISOString(),
        status: 'active',
      };

      // Kampanyayı oluştur ve ID'sini al
      const { data: insertedCampaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select('id')
        .single();

      if (campaignError) {
        console.error('Campaign creation error:', campaignError);
        throw new Error('Kampanya oluşturulurken bir hata oluştu');
      }

      if (!insertedCampaign?.id) {
        throw new Error('Kampanya ID alınamadı');
      }

      // QR kodları oluştur
      await generateQRCodes(
        insertedCampaign.id,
        Number(data.totalUses),
        new Date(data.expiryDate)
      );

      toast.success('Kampanya ve QR kodları başarıyla oluşturuldu!');
      eventEmitter.emit(CAMPAIGN_CREATED);
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error in form submission:', err);
      setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu');
      toast.error('Kampanya oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/[.5] dark:bg-black/[.7] flex items-center justify-center p-4 z-[60] overflow-y-auto overflow-x-hidden">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Yeni Kampanya Oluştur</h2>
          <button
            onClick={onClose}
            className="flex justify-center items-center w-7 h-7 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <span className="sr-only">Kapat</span>
            <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-4 mb-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-800/10 dark:border-red-900">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-red-400 dark:text-red-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm text-red-800 dark:text-red-600">
                  {error}
                </h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2 dark:text-white">
                Kampanya Adı
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:focus:ring-gray-600"
                placeholder="Kampanya adını girin"
              />
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-2">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="discountRate" className="block text-sm font-medium mb-2 dark:text-white">
                İndirim Oranı (%)
              </label>
              <input
                type="number"
                id="discountRate"
                {...register('discountRate')}
                className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:focus:ring-gray-600"
                placeholder="25"
              />
              {errors.discountRate && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-2">{errors.discountRate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="minPurchaseAmount" className="block text-sm font-medium mb-2 dark:text-white">
                Minimum Alışveriş Tutarı (TL)
              </label>
              <input
                type="number"
                id="minPurchaseAmount"
                {...register('minPurchaseAmount')}
                className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:focus:ring-gray-600"
                placeholder="100"
              />
              {errors.minPurchaseAmount && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-2">{errors.minPurchaseAmount.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="maxDiscountAmount" className="block text-sm font-medium mb-2 dark:text-white">
                Maksimum İndirim Tutarı (TL)
              </label>
              <input
                type="number"
                id="maxDiscountAmount"
                {...register('maxDiscountAmount')}
                className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:focus:ring-gray-600"
                placeholder="50"
              />
              {errors.maxDiscountAmount && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-2">{errors.maxDiscountAmount.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="totalUses" className="block text-sm font-medium mb-2 dark:text-white">
                Toplam Kullanım Sayısı
              </label>
              <input
                type="number"
                id="totalUses"
                {...register('totalUses')}
                className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:focus:ring-gray-600"
                placeholder="100"
              />
              {errors.totalUses && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-2">{errors.totalUses.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium mb-2 dark:text-white">
                Son Kullanma Tarihi
              </label>
              <input
                type="datetime-local"
                id="expiryDate"
                {...register('expiryDate')}
                className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:focus:ring-gray-600"
              />
              {errors.expiryDate && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-2">{errors.expiryDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2 dark:text-white">
              Kampanya Açıklaması
            </label>
            <textarea
              id="description"
              rows={3}
              {...register('description')}
              className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:focus:ring-gray-600"
              placeholder="Kampanya detaylarını girin"
            />
            {errors.description && (
              <p className="text-sm text-red-600 dark:text-red-500 mt-2">{errors.description.message}</p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-x-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
            >
              <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-white rounded-full" role="status" aria-label="loading" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Kampanya Oluştur
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 