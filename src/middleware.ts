import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    // Mevcut URL'yi kontrol et
    const requestUrl = new URL(request.url);
    const isAdminRoute = requestUrl.pathname.startsWith('/admin');
    const isLoginPage = requestUrl.pathname === '/admin/login';

    // Admin rotası değilse middleware'i atla
    if (!isAdminRoute) {
      return NextResponse.next();
    }

    const res = NextResponse.next();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            res.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            res.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Oturum kontrolü
    const { data: { session } } = await supabase.auth.getSession();

    // Login sayfasındaysa ve oturum varsa campaigns'e yönlendir
    if (isLoginPage && session) {
      return NextResponse.redirect(new URL('/admin/campaigns', request.url));
    }

    // Login sayfası değilse ve oturum yoksa login'e yönlendir
    if (!isLoginPage && !session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Oturum varsa admin kontrolü yap
    if (session) {
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      // Admin değilse ve login sayfasında değilse, login'e yönlendir
      if (!adminData && !isLoginPage) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/admin/:path*']
}; 