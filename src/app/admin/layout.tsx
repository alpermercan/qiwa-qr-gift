'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOutAdmin } from '@/lib/auth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Login sayfası için minimal layout
  if (isLoginPage) {
    return children;
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOutAdmin();
      router.replace('/admin/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <div
        id="application-sidebar"
        className={`hs-overlay hs-overlay-open:translate-x-0 -translate-x-full transition-all duration-300 transform fixed top-0 start-0 bottom-0 z-[60] w-64 bg-white border-e border-gray-200 pt-7 pb-10 overflow-y-auto lg:block lg:translate-x-0 lg:end-auto lg:bottom-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-slate-700 dark:[&::-webkit-scrollbar-thumb]:bg-slate-500 dark:bg-gray-800 dark:border-gray-700`}
      >
        <div className="px-6">
          <Link href="/admin" className="flex items-center gap-x-3">
            <Image
              src="/qiwa-logo.png"
              alt="Qiwa Coffee"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-semibold text-gray-800 dark:text-white">
              Admin Panel
            </span>
          </Link>
        </div>

        <nav className="hs-accordion-group p-6 w-full flex flex-col flex-wrap">
          <ul className="space-y-1.5">
            <li>
              <Link
                href="/admin"
                className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg ${
                  pathname === '/admin'
                    ? 'bg-gray-100 text-blue-600 dark:bg-gray-900 dark:text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900'
                }`}
              >
                <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Ana Sayfa
              </Link>
            </li>

            <li>
              <Link
                href="/admin/campaigns"
                className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg ${
                  pathname === '/admin/campaigns'
                    ? 'bg-gray-100 text-blue-600 dark:bg-gray-900 dark:text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900'
                }`}
              >
                <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
                  <path d="M18 14h-8"/>
                  <path d="M15 18h-5"/>
                  <path d="M10 6h8v4h-8V6Z"/>
                </svg>
                Kampanyalar
              </Link>
            </li>

            <li>
              <Link
                href="/admin/participants"
                className={`flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg ${
                  pathname === '/admin/participants'
                    ? 'bg-gray-100 text-blue-600 dark:bg-gray-900 dark:text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900'
                }`}
              >
                <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Tüm Katılımcılar
              </Link>
            </li>
          </ul>
        </nav>

        <div className="px-6 mt-auto">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-x-3.5 py-2.5 px-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg dark:text-red-500 dark:hover:bg-red-800/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <svg className="animate-spin h-4 w-4 text-red-600 dark:text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Çıkış yapılıyor...</span>
              </>
            ) : (
              <>
                <svg className="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Çıkış Yap</span>
              </>
            )}
          </button>
        </div>
      </div>
      {/* End Sidebar */}

      {/* Content */}
      <div className="w-full lg:ps-64 min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
        {/* Header */}
        <header className="sticky top-0 inset-x-0 flex flex-wrap sm:justify-start sm:flex-nowrap z-[48] w-full bg-white border-b border-gray-200 text-sm py-2.5 sm:py-4 dark:bg-gray-800 dark:border-gray-700">
          <nav className="flex basis-full items-center w-full mx-auto px-4 sm:px-6 md:px-8" aria-label="Global">
            <div className="flex me-5 lg:me-0 lg:hidden">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-600"
                data-hs-overlay="#application-sidebar"
                aria-controls="application-sidebar"
                aria-label="Toggle navigation"
              >
                <span className="sr-only">Toggle Navigation</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between w-full">
              <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
                Admin Paneli
              </h1>
            </div>
          </nav>
        </header>
        {/* End Header */}

        {/* Main Content */}
        <main className="w-full p-4 sm:p-6 md:p-8 lg:p-10 flex-grow bg-gray-50 dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
} 