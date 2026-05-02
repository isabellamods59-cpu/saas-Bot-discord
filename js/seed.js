/* ============================================================
   Nexa Serviços — Modo Preview (sem Supabase)
   ============================================================
   Quando o Supabase está configurado em js/config.js, este arquivo
   não faz nada. Em modo preview (sem credenciais), produtos vêm de
   js/db.js (seedDemo). Não criamos contas de admin pré-fabricadas:
   a promoção a admin é feita pelo trigger SQL via ADMIN_EMAIL.

   Para testar offline rapidamente, registre-se com qualquer email
   no /register.html — sua conta vira admin se o email bater com
   NEXA_CONFIG.ADMIN_EMAIL.
   ============================================================ */
(function () {
  'use strict';
  // Limpa flags antigas de versões prévias (admin/admin123 hardcoded).
  try {
    localStorage.removeItem('nexa.demo.seedDone');
    localStorage.removeItem('nexa.demo.seedDone.v2');
  } catch (_) {}
})();
