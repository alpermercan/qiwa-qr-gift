'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const navigation = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Kampanyalar', href: '/admin/campaigns' },
  { name: 'QR Kodları', href: '/admin/qr-codes' },
  { name: 'Kullanıcılar', href: '/admin/users' },
];

export default function AdminNavbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-qiwa-primary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-qiwa-light text-xl font-bold">Qiwa QR</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-qiwa-secondary text-qiwa-light'
                          : 'text-gray-300 hover:bg-qiwa-accent hover:text-white'
                      } rounded-md px-3 py-2 text-sm font-medium`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <button
                onClick={() => signOut()}
                className="rounded-md bg-qiwa-accent px-3 py-2 text-sm font-medium text-white hover:bg-qiwa-secondary"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 