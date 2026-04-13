# @superapp/next

Web-приложение на Next.js (SSR/SEO) для SuperApp.

## Supabase

1. Скопируйте `.env.example` в `.env.local`.
2. Укажите `NEXT_PUBLIC_SUPABASE_ANON_KEY` (из Project Settings → API в Supabase).
3. Запустите `pnpm dev --filter @superapp/next`.

## Vercel deploy (через GitHub)

1. Push репозиторий в `https://github.com/bairrrich/13.04.26_codex_uniapp`.
2. В Vercel: **Add New Project** → Import Git Repository.
3. Build Command: `npm run build` (в корне, автоматически билдит `apps/next`).
4. Добавьте env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Нажмите Deploy.
