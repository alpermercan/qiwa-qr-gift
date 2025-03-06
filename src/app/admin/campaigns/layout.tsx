import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kampanyalar | Qiwa Coffee',
  description: 'Qiwa Coffee kampanya yönetim sistemi',
};

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 