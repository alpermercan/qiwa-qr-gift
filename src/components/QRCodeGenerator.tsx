'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/Button';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Campaign {
  id: string;
  name: string;
}

export default function QRCodeGenerator() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('status', 'active');

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Kampanyalar yüklenirken bir hata oluştu');
    }
  }

  async function generateQRCodes() {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      if (!selectedCampaign) {
        setError('Lütfen bir kampanya seçin');
        return;
      }

      if (quantity < 1) {
        setError('Lütfen geçerli bir miktar girin');
        return;
      }

      const { data: campaign } = await supabase
        .from('campaigns')
        .select('remaining_uses')
        .eq('id', selectedCampaign)
        .single();

      if (!campaign || campaign.remaining_uses < quantity) {
        setError('Kampanya için yeterli kullanım hakkı bulunmuyor');
        return;
      }

      const { error: qrError } = await supabase.rpc('generate_qr_codes', {
        p_campaign_id: selectedCampaign,
        p_quantity: quantity
      });

      if (qrError) throw qrError;

      setSuccess(`${quantity} adet QR kod başarıyla oluşturuldu`);
      setQuantity(1);
      setSelectedCampaign('');
    } catch (err) {
      console.error('Error generating QR codes:', err);
      setError('QR kodları oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 grid gap-3 md:flex md:justify-between md:items-center border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">QR Kod Üret</h2>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4 lg:gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="campaign" className="block mb-2 text-sm text-gray-700 font-medium">
                  Kampanya
                </label>
                <select
                  id="campaign"
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-qiwa-primary focus:ring-qiwa-primary"
                >
                  <option value="">Kampanya Seçin</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="block mb-2 text-sm text-gray-700 font-medium">
                  Miktar
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-qiwa-primary focus:ring-qiwa-primary"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 border rounded-lg border-red-200 bg-red-50">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-red-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                  </svg>
                </div>
                <div className="ms-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 border rounded-lg border-green-200 bg-green-50">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-green-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                </div>
                <div className="ms-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-x-2">
            <button
              onClick={generateQRCodes}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600 py-3 px-4"
            >
              {isLoading ? (
                <div className="animate-spin w-4 h-4 border-[3px] border-current border-t-transparent text-white rounded-full" role="status" aria-label="loading">
                  <span className="sr-only">Loading...</span>
                </div>
              ) : (
                <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3h6v6H3z"></path>
                  <path d="M15 3h6v6h-6z"></path>
                  <path d="M3 15h6v6H3z"></path>
                  <path d="M15 15h6v6h-6z"></path>
                </svg>
              )}
              QR Kod Oluştur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 