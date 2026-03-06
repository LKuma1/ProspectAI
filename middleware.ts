import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Cliente anon — usado apenas para autenticação (getUser)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Cliente service role — usado para queries de perfil (bypassa RLS)
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rotas públicas — não precisam de auth
  const publicRoutes = ["/login", "/auth/callback"];
  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return supabaseResponse;
  }

  // Não autenticado → login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Buscar perfil do usuário (tabela pode não existir ainda)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("status, role")
    .eq("id", user.id)
    .single();

  // Tabela não existe ainda (setup pendente) → deixa passar para /waiting com aviso
  if (profileError?.code === "42P01") {
    if (pathname !== "/waiting") {
      return NextResponse.redirect(new URL("/waiting?setup=pending", request.url));
    }
    return supabaseResponse;
  }

  // Sem perfil ainda → waiting
  if (!profile) {
    if (pathname !== "/waiting") {
      return NextResponse.redirect(new URL("/waiting", request.url));
    }
    return supabaseResponse;
  }

  // Pendente → waiting (exceto se já estiver lá)
  if (profile.status === "pending" && pathname !== "/waiting") {
    return NextResponse.redirect(new URL("/waiting", request.url));
  }

  // Bloqueado → login com mensagem
  if (profile.status === "blocked") {
    await supabaseAdmin.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=blocked", request.url));
  }

  // Rota /admin → apenas admins
  if (pathname.startsWith("/admin") && profile.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Ativo tentando acessar /waiting → redireciona para home
  if (profile.status === "active" && pathname === "/waiting") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
