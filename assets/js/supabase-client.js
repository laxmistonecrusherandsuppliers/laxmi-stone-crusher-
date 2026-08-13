// Lakshmi Stone Crusher & Suppliers - Supabase Client Initializer

(function () {
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase JS SDK library not loaded. Make sure script tag is present.');
    return;
  }

  // Clear leftover placeholder keys from localStorage
  let storedKey = localStorage.getItem('lsc_supabase_key');
  if (storedKey && storedKey.includes('placeholder')) {
    localStorage.removeItem('lsc_supabase_key');
    storedKey = null;
  }

  const url = localStorage.getItem('lsc_supabase_url') || window.LSC_CONFIG?.SUPABASE_URL || 'https://ibhgxgvxxfqxtoavofef.supabase.co';
  const key = storedKey || window.LSC_CONFIG?.SUPABASE_ANON_KEY || '';

  // Only create active client if key is valid (not empty and not placeholder)
  if (key && key.trim() !== '' && !key.includes('placeholder')) {
    try {
      window.supabaseClient = window.supabase.createClient(url, key.trim());
      console.log('Supabase client initialized with active key.');
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      window.supabaseClient = null;
    }
  } else {
    console.log('Supabase key is unconfigured. Operating in Local Storage fallback mode.');
    window.supabaseClient = null;
  }
})();
