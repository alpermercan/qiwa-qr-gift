export interface Admin {
  id: string;
  email: string;
  createdAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  discountRate: number;
  totalUses: number;
  remainingUses: number;
  expiryDate: Date;
  createdAt: Date;
}

export interface QRCode {
  id: string;
  campaignId: string;
  slug: string;
  isUsed: boolean;
  createdAt: Date;
}

export interface CampaignStats {
  totalScans: number;
  uniqueUsers: number;
  conversionRate: number;
} 