// Lakshmi Stone Crusher & Suppliers - Supabase Client Initializer

(function () {
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase JS SDK library not loaded. Make sure script tag is present.');
    return;
  }

  const url = window.LSC_CONFIG?.SUPABASE_URL || 'https://ibhgxgvxxfqxtoavofef.supabase.co';
  const key = window.LSC_CONFIG?.SUPABASE_ANON_KEY || 'placeholder';

  // Initialize Supabase Client
  window.supabaseClient = window.supabase.createClient(url, key);
  console.log('Supabase client initialized successfully.');
})();
