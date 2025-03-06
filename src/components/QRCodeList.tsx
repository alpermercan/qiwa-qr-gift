'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getQRCodeUrl } from '@/lib/qrCodeUtils';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import ReactDOM from 'react-dom/client';
import ReactDOMServer from 'react-dom/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive' | 'completed';
  expiry_date: string;
  total_uses: number;
  remaining_uses: number;
}

interface QRCode {
  id: string;
  campaign_id: string;
  slug: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  expires_at: string;
  participant: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null;
}

interface QRCodeListProps {
  campaignId: string;
}

export default function QRCodeList({ campaignId }: QRCodeListProps) {
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQRCodes, setSelectedQRCodes] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    status: 'active' | 'inactive' | 'completed';
    expiry_date: string;
  }>({
    name: '',
    description: '',
    status: 'inactive',
    expiry_date: '',
  });

  useEffect(() => {
    fetchCampaign();
    fetchQRCodes();

    // Realtime subscription for QR code updates
    const subscription = supabase
      .channel('qr-codes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qr_codes',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          fetchQRCodes();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [campaignId]);

  async function fetchCampaign() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      setCampaign(data);
      // Format the date to local datetime string for the input
      const date = new Date(data.expiry_date);
      const formattedDate = date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm

      setEditForm({
        name: data.name,
        description: data.description || '',
        status: data.status,
        expiry_date: formattedDate,
      });
    } catch (err) {
      console.error('Error fetching campaign:', err);
      setError('Kampanya bilgileri yüklenirken bir hata oluştu');
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError(null);
      
      const date = new Date(editForm.expiry_date);
      if (isNaN(date.getTime())) {
        throw new Error('Geçersiz tarih formatı');
      }
      const formattedDate = date.toISOString();
      
      const updateData = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        status: editForm.status,
        expiry_date: formattedDate,
      };

      const { data, error: updateError } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaignId)
        .select()
        .single();

      if (updateError) {
        console.error('Campaign update error:', updateError);
        throw new Error(`Kampanya güncellenirken bir hata oluştu: ${updateError.message}`);
      }

      await fetchCampaign();
      setIsEditModalOpen(false);
      setError('Kampanya başarıyla güncellendi');
      setTimeout(() => setError(null), 3000);

    } catch (err) {
      console.error('Error in handleEditSubmit:', err);
      setError(err instanceof Error ? err.message : 'Kampanya güncellenirken bir hata oluştu');
    }
  }

  async function fetchQRCodes() {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('qr_codes_with_participants')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching QR codes:', error);
        throw error;
      }

      const transformedData = (data || []).map((qrCode: any) => {
        const participant = qrCode.first_name ? {
          first_name: qrCode.first_name,
          last_name: qrCode.last_name,
          email: qrCode.email,
          phone: qrCode.phone
        } : null;
        
        return {
          id: qrCode.id,
          campaign_id: qrCode.campaign_id,
          slug: qrCode.slug,
          is_used: qrCode.is_used,
          used_at: qrCode.used_at,
          created_at: qrCode.created_at,
          expires_at: qrCode.expires_at,
          participant: participant
        };
      });

      setQRCodes(transformedData);
    } catch (err) {
      console.error('Error fetching QR codes:', err);
      setError('QR kodları yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredQRCodes = qrCodes.filter((qrCode) => {
    switch (filter) {
      case 'used':
        return qrCode.is_used;
      case 'unused':
        return !qrCode.is_used;
      default:
        return true;
    }
  });

  const toggleQRCode = (id: string) => {
    const newSelected = new Set(selectedQRCodes);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedQRCodes(newSelected);
  };

  const toggleAllQRCodes = () => {
    if (selectedQRCodes.size === qrCodes.length) {
      setSelectedQRCodes(new Set());
    } else {
      setSelectedQRCodes(new Set(qrCodes.map(code => code.id)));
    }
  };

  const downloadQRCode = async (qrCode: QRCode) => {
    try {
      const url = getQRCodeUrl(qrCode.slug);
      
      // QR kodu oluştur
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Sarı arka plan ekle (Snapchat sarısı)
      ctx.fillStyle = '#718C02';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Yuvarlatılmış köşeler için
      ctx.beginPath();
      const radius = 100; // köşe yuvarlaklık değeri
      ctx.moveTo(radius, 0);
      ctx.lineTo(canvas.width - radius, 0);
      ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
      ctx.lineTo(canvas.width, canvas.height - radius);
      ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
      ctx.lineTo(radius, canvas.height);
      ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.fill();
      
      // QR kodu canvas'a çiz
      await QRCode.toCanvas(canvas, url, {
        width: 800,
        margin: 2,
        color: {
          dark: '#FFFFFF',
          light: '#718C02', // Yeni arka plan rengi
        },
        errorCorrectionLevel: 'H',
      });

      // Logo ekle
      const logo = new Image();
      logo.src = '/images/logo/qiwa-logo.svg';
      
      await new Promise((resolve, reject) => {
        logo.onload = () => {
          // Logo'yu ortala
          const logoSize = 150; // Logo boyutunu büyüttük
          const x = (canvas.width - logoSize) / 2;
          const y = (canvas.height - logoSize) / 2;
          
          // Logo arkasına beyaz daire ekle
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 1.8, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          
          // Logo'yu çiz
          ctx.drawImage(logo, x, y, logoSize, logoSize);
          resolve(true);
        };
        logo.onerror = reject;
      });

      // PNG olarak indir
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `qr-${qrCode.slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('QR kod indirilirken bir hata oluştu');
    }
  };

  const downloadSelectedQRCodes = async () => {
    try {
      const selectedCodes = qrCodes.filter(code => selectedQRCodes.has(code.id));
      if (selectedCodes.length === 0) return;

      const zip = new JSZip();
      
      // Her bir QR kod için PNG oluştur
      const promises = selectedCodes.map(async (code) => {
        const url = getQRCodeUrl(code.slug);
        
        // QR kodu oluştur
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        // Sarı arka plan ekle (Snapchat sarısı)
        ctx.fillStyle = '#718C02';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Yuvarlatılmış köşeler için
        ctx.beginPath();
        const radius = 100;
        ctx.moveTo(radius, 0);
        ctx.lineTo(canvas.width - radius, 0);
        ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
        ctx.lineTo(canvas.width, canvas.height - radius);
        ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
        ctx.lineTo(radius, canvas.height);
        ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.fill();
        
        // QR kodu canvas'a çiz
        await QRCode.toCanvas(canvas, url, {
          width: 800,
          margin: 2,
          color: {
            dark: '#FFFFFF',
            light: '#718C02', // Yeni arka plan rengi
          },
          errorCorrectionLevel: 'H',
        });

        // Logo ekle
        const logo = new Image();
        logo.src = '/images/logo/qiwa-logo.svg';
        
        await new Promise((resolve, reject) => {
          logo.onload = () => {
            // Logo'yu ortala
            const logoSize = 150;
            const x = (canvas.width - logoSize) / 2;
            const y = (canvas.height - logoSize) / 2;
            
            // Logo arkasına beyaz daire ekle
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 1.8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            
            // Logo'yu çiz
            ctx.drawImage(logo, x, y, logoSize, logoSize);
            resolve(true);
          };
          logo.onerror = reject;
        });

        // Canvas'ı blob'a dönüştür
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          }, 'image/png');
        });
        
        // Blob'u ZIP'e ekle
        zip.file(`qr-${code.slug}.png`, blob);
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });

      // Kampanya adını alıp dosya adı için uygun formata getir
      const campaignName = campaign?.name || 'qr-codes';
      const safeFileName = campaignName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      saveAs(content, `${safeFileName}_qr_codes.zip`);
      
      toast.success(`${selectedCodes.length} adet QR kod başarıyla indirildi`);
    } catch (error) {
      console.error('Error downloading QR codes:', error);
      toast.error('QR kodları indirilirken bir hata oluştu');
    }
  };

  const createSingleQRCode = async () => {
    try {
      setIsCreating(true);
      
      // Generate a random slug
      const randomSlug = Math.random().toString(36).substring(2, 15);
      
      // Get campaign data
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('expiry_date, status, total_uses, remaining_uses')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      // Check campaign status
      if (campaignData.status !== 'active') {
        throw new Error('Kampanya aktif değil');
      }

      // Create new QR code
      const { error: qrError } = await supabase
        .from('qr_codes')
        .insert({
          campaign_id: campaignId,
          slug: randomSlug,
          expires_at: campaignData.expiry_date
        });

      if (qrError) throw qrError;

      // Update campaign usage counts
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          total_uses: campaignData.total_uses + 1,
          remaining_uses: campaignData.remaining_uses + 1
        })
        .eq('id', campaignId);

      if (updateError) throw updateError;

      // Refresh QR codes list
      await fetchQRCodes();
    } catch (err) {
      console.error('Error creating QR code:', err);
      setError(err instanceof Error ? err.message : 'QR kod oluşturulurken bir hata oluştu');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-800/10 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400 dark:text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-600">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {campaign && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.name}
              </h1>
              {campaign.description && (
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {campaign.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-x-4">
                <span className={`inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium ${
                  campaign.status === 'active'
                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-800/30 dark:text-teal-500'
                    : campaign.status === 'completed'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500'
                }`}>
                  <span className={`flex w-1.5 h-1.5 rounded-full ${
                    campaign.status === 'active'
                      ? 'bg-teal-600 dark:bg-teal-500'
                      : campaign.status === 'completed'
                      ? 'bg-gray-600 dark:bg-gray-400'
                      : 'bg-yellow-600 dark:bg-yellow-500'
                  }`}></span>
                  {campaign.status === 'active' ? 'Aktif' : campaign.status === 'completed' ? 'Tamamlandı' : 'Pasif'}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Son Kullanım: {format(new Date(campaign.expiry_date), 'dd MMMM yyyy', { locale: tr })}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:pointer-events-none dark:text-blue-500 dark:hover:text-blue-400 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
            >
              <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
              Düzenle
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40"
            onClick={() => setIsEditModalOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <div 
                className="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-900 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleEditSubmit} className="divide-y divide-gray-200 dark:divide-gray-700">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Kampanya Düzenle
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Kampanya Adı
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-base focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-900 dark:text-gray-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Açıklama
                        </label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-base focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-900 dark:text-gray-400"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            Durum
                          </label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' | 'completed' })}
                            className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-base focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-900 dark:text-gray-400"
                          >
                            <option value="active">Aktif</option>
                            <option value="inactive">Pasif</option>
                            <option value="completed">Tamamlandı</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            Son Kullanım Tarihi
                          </label>
                          <input
                            type="datetime-local"
                            value={editForm.expiry_date}
                            onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                            className="block w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-base focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-900 dark:text-gray-400"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800 flex justify-end gap-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-5 py-2.5 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
                    >
                      Kaydet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 grid gap-3 md:flex md:justify-between md:items-center border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              QR Kodları
            </h2>
          </div>

          <div className="flex items-center gap-x-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'used' | 'unused')}
              className="py-2 px-3 pe-9 block border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-900 dark:text-gray-400"
            >
              <option value="all">Tümü</option>
              <option value="used">Kullanılmış</option>
              <option value="unused">Kullanılmamış</option>
            </select>

            <button
              onClick={createSingleQRCode}
              disabled={isCreating}
              className="inline-flex items-center justify-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600 py-2 px-3"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent text-white rounded-full" />
                  <span>Oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  <span>QR Kod Oluştur</span>
                </>
              )}
            </button>

            <button
              onClick={downloadSelectedQRCodes}
              disabled={selectedQRCodes.size === 0}
              className="inline-flex items-center justify-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600 py-2 px-3"
            >
              <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Seçilenleri İndir ({selectedQRCodes.size})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th scope="col" className="px-6 py-3">
                  <div className="flex items-center gap-x-2">
                    <input
                      type="checkbox"
                      checked={selectedQRCodes.size === filteredQRCodes.length}
                      onChange={toggleAllQRCodes}
                      className="shrink-0 border-gray-200 dark:border-gray-700 rounded text-blue-600 focus:ring-blue-500 dark:bg-slate-900 dark:checked:bg-blue-500 dark:checked:border-blue-500"
                    />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-start">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                    QR Kod
                  </span>
                </th>
                <th scope="col" className="px-6 py-3 text-start">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                    Durum
                  </span>
                </th>
                <th scope="col" className="px-6 py-3 text-start">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                    Oluşturulma Tarihi
                  </span>
                </th>
                <th scope="col" className="px-6 py-3 text-start">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                    Kullanım Tarihi
                  </span>
                </th>
                <th scope="col" className="px-6 py-3 text-start">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                    Kullanıcı Bilgileri
                  </span>
                </th>
                <th scope="col" className="px-6 py-3 text-end">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                    İşlemler
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredQRCodes.map((qrCode) => (
                <tr key={qrCode.id} className="bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedQRCodes.has(qrCode.id)}
                      onChange={() => toggleQRCode(qrCode.id)}
                      className="shrink-0 border-gray-200 dark:border-gray-700 rounded text-blue-600 focus:ring-blue-500 dark:bg-slate-900 dark:checked:bg-blue-500 dark:checked:border-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-x-3">
                      <div className="h-10 w-10 bg-[#718C02] dark:bg-[#718C02] rounded-lg p-1">
                        <QRCodeSVG
                          value={getQRCodeUrl(qrCode.slug)}
                          size={32}
                          level="H"
                          bgColor="#718C02"
                          fgColor="#FFFFFF"
                          imageSettings={{
                            src: "/images/logo/qiwa-logo.svg",
                            height: 10,
                            width: 10,
                            excavate: true,
                          }}
                        />
                      </div>
                      <div className="grow">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{qrCode.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium ${
                      qrCode.is_used
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        : new Date(qrCode.expires_at) < new Date()
                        ? 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-500'
                        : 'bg-teal-100 text-teal-800 dark:bg-teal-800/30 dark:text-teal-500'
                    }`}>
                      <span className={`flex w-1.5 h-1.5 rounded-full ${
                        qrCode.is_used
                          ? 'bg-gray-600 dark:bg-gray-400'
                          : new Date(qrCode.expires_at) < new Date()
                          ? 'bg-red-600 dark:bg-red-500'
                          : 'bg-teal-600 dark:bg-teal-500'
                      }`}></span>
                      {qrCode.is_used
                        ? 'Kullanıldı'
                        : new Date(qrCode.expires_at) < new Date()
                        ? 'Süresi Doldu'
                        : 'Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {format(new Date(qrCode.created_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {qrCode.used_at
                        ? format(new Date(qrCode.used_at), 'dd MMMM yyyy HH:mm', { locale: tr })
                        : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {qrCode.participant ? (
                      <div>
                        <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                          {qrCode.participant.first_name} {qrCode.participant.last_name}
                        </span>
                        <span className="block text-sm text-gray-600 dark:text-gray-400">
                          {qrCode.participant.email}
                        </span>
                        <span className="block text-sm text-gray-600 dark:text-gray-400">
                          {qrCode.participant.phone}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-end">
                    <button
                      onClick={() => downloadQRCode(qrCode)}
                      className="inline-flex items-center justify-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600 py-2 px-3"
                    >
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      İndir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 