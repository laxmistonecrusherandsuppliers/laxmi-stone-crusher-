// Lakshmi Stone Crusher & Suppliers - Supabase Client Initializer

(function () {
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase JS SDK library not loaded. Make sure script tag is present.');
    return;
  }

  const url = localStorage.getItem('lsc_supabase_url') || window.LSC_CONFIG?.SUPABASE_URL || 'https://ibhgxgvxxfqxtoavofef.supabase.co';
  const key = localStorage.getItem('lsc_supabase_key') || window.LSC_CONFIG?.SUPABASE_ANON_KEY || '';

  // Only create active client if key is not a placeholder
  if (key && !key.includes('placeholder')) {
    try {
      window.supabaseClient = window.supabase.createClient(url, key);
      console.log('Supabase client initialized with valid key.');
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      window.supabaseClient = null;
    }
  } else {
    console.warn('Supabase key is unconfigured or a placeholder token. Using local storage fallback.');
    window.supabaseClient = null;
  }
})();
