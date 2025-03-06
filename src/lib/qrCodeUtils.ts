import { customAlphabet } from 'nanoid';
import { createClient } from '@supabase/supabase-js';
import QRCode, { QRCodeToDataURLOptions } from 'qrcode';

// Admin yetkisiyle Supabase client oluştur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Slug için güvenli karakterler (benzer karakterleri çıkardık: 0/O, 1/I/l, etc.)
const generateSlug = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8);

interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export async function generateQRCodes(
  campaignId: string,
  quantity: number,
  expiryDate: Date
): Promise<void> {
  if (!campaignId) {
    throw new Error('Campaign ID is required');
  }

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  try {
    // QR kodları için array oluştur
    const qrCodes = Array.from({ length: quantity }, () => ({
      campaign_id: campaignId,
      slug: generateSlug(),
      is_used: false,
      expires_at: expiryDate.toISOString(),
      created_at: new Date().toISOString()
    }));

    // QR kodları veritabanına ekle
    const { error } = await supabase
      .from('qr_codes')
      .insert(qrCodes);

    if (error) {
      console.error('Error generating QR codes:', error);
      throw new Error(`QR kodları oluşturulurken bir hata oluştu: ${error.message}`);
    }
  } catch (err) {
    console.error('Error in generateQRCodes:', err);
    throw err instanceof Error ? err : new Error('QR kodları oluşturulurken beklenmeyen bir hata oluştu');
  }
}

export function getQRCodeUrl(slug: string): string {
  return `${process.env.NEXT_PUBLIC_QR_BASE_URL || 'https://qr.qiwacoffee.co'}/${slug}`;
}

export async function generateQRCode(text: string, options: QRCodeOptions = {}): Promise<string> {
  try {
    const qrOptions: QRCodeToDataURLOptions = {
      width: options.width || 256,
      margin: options.margin || 4,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#ffffff',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'H',
    };
    
    return await QRCode.toDataURL(text, qrOptions);
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('QR kod oluşturulurken bir hata oluştu');
  }
} 