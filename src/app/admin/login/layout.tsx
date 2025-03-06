export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      {children}
    </div>
  );
} 