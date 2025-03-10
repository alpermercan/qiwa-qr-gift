'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <ol className="flex items-center whitespace-nowrap min-w-0" aria-label="Breadcrumb">
      <li className="text-sm">
        <Link href="/admin" className="flex items-center text-gray-500 hover:text-blue-600">
          Ana Sayfa
          <svg className="flex-shrink-0 mx-3 overflow-visible h-2.5 w-2.5 text-gray-400 dark:text-gray-600" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 1L10.6869 7.16086C10.8637 7.35239 10.8637 7.64761 10.6869 7.83914L5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Link>
      </li>
      {items.map((item, index) => (
        <li key={item.href} className="text-sm">
          {index === items.length - 1 ? (
            <span className="font-semibold text-gray-800 truncate dark:text-gray-200">
              {item.name}
            </span>
          ) : (
            <Link href={item.href} className="flex items-center text-gray-500 hover:text-blue-600">
              {item.name}
              <svg className="flex-shrink-0 mx-3 overflow-visible h-2.5 w-2.5 text-gray-400 dark:text-gray-600" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 1L10.6869 7.16086C10.8637 7.35239 10.8637 7.64761 10.6869 7.83914L5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </Link>
          )}
        </li>
      ))}
    </ol>
  );
} 