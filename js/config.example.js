/* ============================================================
   Nexa Serviços V2 — Configuração pública

   Edite os valores abaixo com as credenciais do seu projeto Supabase.
   Veja: supabase/README.md para o passo a passo.

   Os valores DEFAULT são vazios → a aplicação cai automaticamente em
   "modo demonstração" (LocalStorage). Quando você plugar as chaves,
   tudo passa a usar o backend real (Supabase).
   ============================================================ */
window.NEXA_CONFIG = window.NEXA_CONFIG || {
  /** URL do projeto Supabase. Ex.: 'https://abcdefgh.supabase.co' */
  SUPABASE_URL: '',
  /** Chave 'anon public' do Supabase (JWT longo começando com 'eyJ...') */
  SUPABASE_ANON_KEY: '',

  /** Email cuja conta nasce automaticamente como admin */
  ADMIN_EMAIL: 'devbot2026@nexaservicos.app',

  /** Convite oficial do Discord (usado em discord.html) */
  DISCORD_INVITE: 'https://discord.gg/FtWhZEyne',

  /** Nome / branding */
  BRAND: {
    name: 'Nexa Serviços',
    tagline: 'Bots Discord premium — pagamento manual via tickets.',
  },
};
