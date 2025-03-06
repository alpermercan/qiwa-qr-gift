'use client';

import { use } from 'react';
import QRCodeList from '@/components/QRCodeList';
import ParticipantList from '@/components/ParticipantList';
import { Tab } from '@headlessui/react';

interface TabItem {
  name: string;
  component: React.ReactNode;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function CampaignDashboard({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = use(params);

  const tabs: TabItem[] = [
    { name: 'QR Kodları', component: <QRCodeList campaignId={campaignId} /> },
    { name: 'Katılımcılar', component: <ParticipantList /> },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-qiwa-primary/20 p-1">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }: { selected: boolean }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white/60 ring-offset-2 ring-offset-qiwa-primary focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-qiwa-primary shadow'
                      : 'text-gray-600 hover:bg-white/[0.12] hover:text-qiwa-primary'
                  )
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-4">
            {tabs.map((tab, idx) => (
              <Tab.Panel
                key={idx}
                className={classNames(
                  'rounded-xl bg-white p-4',
                  'ring-white/60 ring-offset-2 ring-offset-qiwa-primary focus:outline-none focus:ring-2'
                )}
              >
                {tab.component}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </main>
  );
} 