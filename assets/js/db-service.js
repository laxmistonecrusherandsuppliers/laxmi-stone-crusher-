// Lakshmi Stone Crusher & Suppliers - Database & Business Logic Service (With Storage Fallback)

window.LSCDB = {
  getClient: function () {
    return window.supabaseClient || null;
  },

  // Seed Data Helpers for Fallback
  getLocalData: function (key, defaultVal = []) {
    const data = localStorage.getItem('lsc_db_' + key);
    if (!data) {
      localStorage.setItem('lsc_db_' + key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return defaultVal;
    }
  },

  saveLocalData: function (key, val) {
    localStorage.setItem('lsc_db_' + key, JSON.stringify(val));
  },

  initLocalSeed: function () {
    const defaultMaterials = [
      { id: 1, name: '80-100mm', is_system: true, is_active: true, rate_per_unit: 450, unit: 'Tonne' },
      { id: 2, name: '40mm', is_system: true, is_active: true, rate_per_unit: 420, unit: 'Tonne' },
      { id: 3, name: '20mm', is_system: true, is_active: true, rate_per_unit: 500, unit: 'Tonne' },
      { id: 4, name: '10mm', is_system: true, is_active: true, rate_per_unit: 520, unit: 'Tonne' },
      { id: 5, name: '6mm', is_system: true, is_active: true, rate_per_unit: 480, unit: 'Tonne' },
      { id: 6, name: '1/8', is_system: true, is_active: true, rate_per_unit: 460, unit: 'Tonne' },
      { id: 7, name: 'Crush Sand', is_system: true, is_active: true, rate_per_unit: 600, unit: 'Tonne' },
      { id: 8, name: 'Wash Sand', is_system: true, is_active: true, rate_per_unit: 750, unit: 'Tonne' },
      { id: 9, name: 'Other', is_system: true, is_active: true, rate_per_unit: 0, unit: 'Tonne' }
    ];
    const defaultCustomers = [
      { id: 1, name: 'Ramesh Infrastructure', mobile: '9822012345', address: 'Highway Construction Site, Zone A', created_at: new Date().toISOString() },
      { id: 2, name: 'Balaji Builders & Developers', mobile: '9423198765', address: 'Plot 45, Sector 12, City Center', created_at: new Date().toISOString() }
    ];
    const defaultStaff = [
      { id: 1, name: 'Suresh Patil', mobile: '9850011223', joining_date: '2025-01-10', salary: 25000, status: 'active' },
      { id: 2, name: 'Ganesh Shinde', mobile: '9850044556', joining_date: '2025-02-01', salary: 20000, status: 'active' }
    ];
    const defaultSettings = {
      business_name: 'Lakshmi Stone Crusher & Suppliers',
      business_address: 'At Post Crusher Zone, Highway Road',
      business_mobile: '+91 98765 43210',
      gstin: '27AAAAA0000A1Z5',
      gst_percent: '18',
      invoice_prefix: 'LSC',
      financial_year: '2526',
      next_invoice_number: '1001',
      thermal_width: '80'
    };

    if (!localStorage.getItem('lsc_db_materials')) this.saveLocalData('materials', defaultMaterials);
    if (!localStorage.getItem('lsc_db_customers')) this.saveLocalData('customers', defaultCustomers);
    if (!localStorage.getItem('lsc_db_staff')) this.saveLocalData('staff', defaultStaff);
    if (!localStorage.getItem('lsc_db_settings')) this.saveLocalData('settings', defaultSettings);
    if (!localStorage.getItem('lsc_db_sales')) this.saveLocalData('sales', []);
    if (!localStorage.getItem('lsc_db_payment_logs')) this.saveLocalData('payment_logs', []);
    if (!localStorage.getItem('lsc_db_attendance')) this.saveLocalData('attendance', []);
    if (!localStorage.getItem('lsc_db_advances')) this.saveLocalData('advances', []);
    if (!localStorage.getItem('lsc_db_leave_requests')) this.saveLocalData('leave_requests', []);
  },

  // ----------------------------------------------------
  // DASHBOARD & SALES STATS
  // ----------------------------------------------------
  getDashboardStats: async function () {
    this.initLocalSeed();
    const supabase = this.getClient();
    const today = new Date().toISOString().split('T')[0];

    try {
      if (supabase) {
        const { data: todaySales, error: err1 } = await supabase
          .from('sales')
          .select('grand_total, amount_paid, amount_due')
          .eq('sale_date', today);

        if (!err1 && todaySales) {
          const today_sales_count = todaySales.length;
          const today_sales_amount = todaySales.reduce((acc, s) => acc + (parseFloat(s.grand_total) || 0), 0);

          const { data: todayLogs } = await supabase
            .from('payment_logs')
            .select('amount_paid')
            .gte('payment_date', `${today}T00:00:00.000Z`);

          const today_collection = (todayLogs || []).reduce((acc, l) => acc + (parseFloat(l.amount_paid) || 0), 0);

          const { data: dueSales } = await supabase.from('sales').select('amount_due').gt('amount_due', 0);
          const total_outstanding = (dueSales || []).reduce((acc, s) => acc + (parseFloat(s.amount_due) || 0), 0);

          const { count: total_customers } = await supabase.from('customers').select('*', { count: 'exact', head: true });

          return { today_sales_count, today_sales_amount, today_collection, total_outstanding, total_customers: total_customers || 0 };
        }
      }
    } catch (e) {
      console.warn('Supabase dashboard query error, using local data:', e);
    }

    // Local Fallback
    const sales = this.getLocalData('sales', []);
    const customers = this.getLocalData('customers', []);
    const logs = this.getLocalData('payment_logs', []);

    const todaySales = sales.filter(s => s.sale_date === today);
    const today_sales_count = todaySales.length;
    const today_sales_amount = todaySales.reduce((acc, s) => acc + (parseFloat(s.grand_total) || 0), 0);
    const today_collection = logs.filter(l => (l.payment_date || '').startsWith(today)).reduce((acc, l) => acc + (parseFloat(l.amount_paid) || 0), 0);
    const total_outstanding = sales.reduce((acc, s) => acc + (parseFloat(s.amount_due) || 0), 0);

    return {
      today_sales_count,
      today_sales_amount,
      today_collection,
      total_outstanding,
      total_customers: customers.length
    };
  },

  getRecentSales: async function (limit = 10) {
    this.initLocalSeed();
    const supabase = this.getClient();

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('sales')
          .select('*, customers(name, mobile)')
          .order('sale_date', { ascending: false })
          .order('id', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data.map(s => ({
            ...s,
            customer_name: s.customers?.name || 'N/A',
            customer_mobile: s.customers?.mobile || ''
          }));
        }
      }
    } catch (e) {
      console.warn('Using local recent sales fallback');
    }

    const sales = this.getLocalData('sales', []);
    const customers = this.getLocalData('customers', []);
    const sorted = [...sales].sort((a, b) => new Date(b.created_at || b.sale_date) - new Date(a.created_at || a.sale_date)).slice(0, limit);

    return sorted.map(s => {
      const c = customers.find(item => item.id == s.customer_id);
      return {
        ...s,
        customer_name: c ? c.name : 'N/A',
        customer_mobile: c ? c.mobile : ''
      };
    });
  },

  getSales: async function ({ from, to, customer_id } = {}) {
    this.initLocalSeed();
    const supabase = this.getClient();
    const materials = this.getLocalData('materials', []);

    try {
      if (supabase) {
        let query = supabase
          .from('sales')
          .select('*, customers(name, mobile)')
          .order('sale_date', { ascending: false })
          .order('id', { ascending: false });

        if (from) query = query.gte('sale_date', from);
        if (to) query = query.lte('sale_date', to);
        if (customer_id) query = query.eq('customer_id', customer_id);

        const { data, error } = await query.limit(100);
        if (!error && data) {
          return data.map(s => ({
            ...s,
            customer_name: s.customers?.name || 'N/A',
            customer_mobile: s.customers?.mobile || ''
          }));
        }
      }
    } catch (e) {
      console.warn('Using local sales list fallback');
    }

    let sales = this.getLocalData('sales', []);
    const customers = this.getLocalData('customers', []);

    if (from) sales = sales.filter(s => s.sale_date >= from);
    if (to) sales = sales.filter(s => s.sale_date <= to);
    if (customer_id) sales = sales.filter(s => s.customer_id == customer_id);

    return sales.map(s => {
      const c = customers.find(item => item.id == s.customer_id);
      const resolvedItems = (s.items || []).map(item => {
        const matObj = materials.find(m => m.id == item.material_id);
        const name = item.custom_material_name || (matObj ? matObj.name : null) || item.material_name || item.name || 'Stone Material';
        return {
          ...item,
          material_name: name
        };
      });

      return {
        ...s,
        items: resolvedItems,
        customer_name: c ? c.name : 'N/A',
        customer_mobile: c ? c.mobile : ''
      };
    });
  },

  getSaleById: async function (id) {
    this.initLocalSeed();
    const supabase = this.getClient();
    const materials = this.getLocalData('materials', []);

    try {
      if (supabase) {
        const { data: sales, error: saleErr } = await supabase
          .from('sales')
          .select('*, customers(name, mobile, address)')
          .eq('id', id);

        if (!saleErr && sales && sales.length > 0) {
          const sale = sales[0];
          sale.customer_name = sale.customers?.name || 'N/A';
          sale.customer_mobile = sale.customers?.mobile || '';
          sale.customer_address = sale.customers?.address || '';

          const { data: items } = await supabase.from('sale_items').select('*, materials(name)').eq('sale_id', id);
          sale.items = (items || []).map(item => ({
            ...item,
            material_name: item.custom_material_name || item.materials?.name || 'Stone Material'
          }));

          const { data: logs } = await supabase.from('payment_logs').select('*').eq('sale_id', id).order('payment_date', { ascending: true });
          sale.payment_logs = logs || [];

          return sale;
        }
      }
    } catch (e) {
      console.warn('Using local getSaleById fallback');
    }

    const sales = this.getLocalData('sales', []);
    const sale = sales.find(s => s.id == id);
    if (!sale) throw new Error('Sale invoice not found');

    const customers = this.getLocalData('customers', []);
    const cust = customers.find(c => c.id == sale.customer_id);

    sale.customer_name = cust ? cust.name : 'N/A';
    sale.customer_mobile = cust ? cust.mobile : '';
    sale.customer_address = cust ? cust.address : '';

    sale.items = (sale.items || []).map(item => {
      const matObj = materials.find(m => m.id == item.material_id);
      const name = item.custom_material_name || (matObj ? matObj.name : null) || item.material_name || item.name || 'Stone Material';
      return {
        ...item,
        material_name: name
      };
    });

    const logs = this.getLocalData('payment_logs', []);
    sale.payment_logs = logs.filter(l => l.sale_id == id);

    return sale;
  },

  createSale: async function (saleData) {
    this.initLocalSeed();
    const supabase = this.getClient();
    const materials = this.getLocalData('materials', []);
    const { customer_id, sale_date, gst_enabled, items, payment_mode, payment_method, amount_paid, notes } = saleData;

    if (!customer_id || !items || !items.length) {
      throw new Error('Customer and bill items are required.');
    }

    const settings = await this.getSettings();
    const prefix = settings.invoice_prefix || 'LSC';
    const year = settings.financial_year || '2526';
    const nextNum = parseInt(settings.next_invoice_number || '1001', 10);
    const numStr = String(nextNum).padStart(4, '0');
    const invoice_number = `${prefix}-${year}-${numStr}`;
    const gst_percent = parseFloat(settings.gst_percent || '18');

    let subtotal = 0;
    items.forEach(item => {
      subtotal += (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    });

    let gst_amount = gst_enabled ? subtotal * (gst_percent / 100) : 0;
    const grand_total = subtotal + gst_amount;
    let actual_paid = 0;
    let due = 0;

    if (payment_mode === 'full') {
      actual_paid = grand_total;
      due = 0;
    } else if (payment_mode === 'due') {
      actual_paid = 0;
      due = grand_total;
    } else {
      actual_paid = parseFloat(amount_paid) || 0;
      due = Math.max(0, grand_total - actual_paid);
    }

    const user = window.LSCAuth.getCurrentUser();
    let newSaleId = Date.now();

    try {
      if (supabase) {
        const { data: saleRes, error: saleErr } = await supabase
          .from('sales')
          .insert([{
            invoice_number,
            customer_id,
            sale_date: sale_date || new Date().toISOString().split('T')[0],
            gst_enabled: !!gst_enabled,
            gst_percent,
            subtotal,
            gst_amount,
            grand_total,
            payment_mode,
            amount_paid: actual_paid,
            amount_due: due,
            notes,
            created_by: user?.id || null
          }])
          .select();

        if (!saleErr && saleRes && saleRes.length > 0) {
          newSaleId = saleRes[0].id;
          const itemsToInsert = items.map(item => ({
            sale_id: newSaleId,
            material_id: item.material_id || null,
            custom_material_name: item.custom_material_name || null,
            quantity: parseFloat(item.quantity),
            unit: item.unit || 'Tonne',
            rate: parseFloat(item.rate),
            amount: (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)
          }));

          await supabase.from('sale_items').insert(itemsToInsert);

          const payMethod = payment_method || 'cash';
          const logNote = notes ? `Initial Payment (${payMethod.toUpperCase()}) - ${notes}` : `Initial Payment (${payMethod.toUpperCase()})`;

          await supabase.from('payment_logs').insert([{
            sale_id: newSaleId,
            customer_id,
            payment_date: new Date().toISOString(),
            amount_paid: actual_paid,
            balance_before: grand_total,
            balance_after: due,
            notes: logNote,
            recorded_by: user?.id || null
          }]);

          await this.updateSettings({ next_invoice_number: nextNum + 1 });
          return { sale_id: newSaleId, invoice_number };
        }
      }
    } catch (e) {
      console.warn('Using local createSale fallback:', e);
    }

    // Local Storage Fallback Creation
    const localSales = this.getLocalData('sales', []);
    const localItems = items.map((item, idx) => {
      const matObj = materials.find(m => m.id == item.material_id);
      const name = item.custom_material_name || (matObj ? matObj.name : null) || 'Stone Material';
      return {
        id: Date.now() + idx,
        sale_id: newSaleId,
        material_id: item.material_id || null,
        material_name: name,
        custom_material_name: item.custom_material_name || null,
        quantity: parseFloat(item.quantity),
        unit: item.unit || 'Tonne',
        rate: parseFloat(item.rate),
        amount: (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)
      };
    });

    const newSale = {
      id: newSaleId,
      invoice_number,
      customer_id: parseInt(customer_id),
      sale_date: sale_date || new Date().toISOString().split('T')[0],
      gst_enabled: !!gst_enabled,
      gst_percent,
      subtotal,
      gst_amount,
      grand_total,
      payment_mode,
      amount_paid: actual_paid,
      amount_due: due,
      notes,
      items: localItems,
      created_at: new Date().toISOString()
    };

    localSales.push(newSale);
    this.saveLocalData('sales', localSales);

    const logs = this.getLocalData('payment_logs', []);
    logs.push({
      id: Date.now(),
      sale_id: newSaleId,
      customer_id: parseInt(customer_id),
      payment_date: new Date().toISOString(),
      amount_paid: actual_paid,
      balance_before: grand_total,
      balance_after: due,
      notes: `Initial Payment (${(payment_method || 'cash').toUpperCase()})`,
      payment_mode: payment_method || 'cash'
    });
    this.saveLocalData('payment_logs', logs);

    await this.updateSettings({ next_invoice_number: nextNum + 1 });
    return { sale_id: newSaleId, invoice_number };
  },

  updateSale: async function (saleId, saleData) {
    this.initLocalSeed();
    const supabase = this.getClient();
    const materials = this.getLocalData('materials', []);
    const { customer_id, sale_date, gst_enabled, gst_percent, items, notes } = saleData;

    if (!customer_id || !items || !items.length) {
      throw new Error('Customer and bill items are required.');
    }

    // Get existing sale to retain payments and invoice number
    const existingSale = await this.getSaleById(saleId);
    
    let subtotal = 0;
    items.forEach(item => {
      subtotal += (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    });

    let gst_amount = gst_enabled ? subtotal * ((parseFloat(gst_percent) || 18) / 100) : 0;
    const grand_total = subtotal + gst_amount;
    
    const actual_paid = parseFloat(existingSale.amount_paid) || 0;
    let due = Math.max(0, grand_total - actual_paid);
    
    let payment_mode = 'due';
    if (due <= 0.01) payment_mode = 'full';
    else if (actual_paid > 0) payment_mode = 'partial';

    try {
      if (supabase) {
        // Update main sale record
        const { error: saleErr } = await supabase
          .from('sales')
          .update({
            customer_id: parseInt(customer_id),
            sale_date: sale_date || new Date().toISOString().split('T')[0],
            gst_enabled: !!gst_enabled,
            gst_percent: parseFloat(gst_percent) || 18,
            subtotal,
            gst_amount,
            grand_total,
            payment_mode,
            amount_due: due,
            notes
          })
          .eq('id', saleId);

        if (!saleErr) {
          // Replace all items
          await supabase.from('sale_items').delete().eq('sale_id', saleId);
          
          const itemsToInsert = items.map(item => ({
            sale_id: saleId,
            material_id: item.material_id || null,
            custom_material_name: item.custom_material_name || null,
            quantity: parseFloat(item.quantity),
            unit: item.unit || 'Tonne',
            rate: parseFloat(item.rate),
            amount: (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)
          }));
          await supabase.from('sale_items').insert(itemsToInsert);

          return { sale_id: saleId, invoice_number: existingSale.invoice_number };
        } else {
            throw saleErr;
        }
      }
    } catch (e) {
      console.warn('Using local updateSale fallback:', e);
    }

    // Local Storage Fallback
    const localSales = this.getLocalData('sales', []);
    const idx = localSales.findIndex(s => s.id == saleId);
    if (idx !== -1) {
      localSales[idx] = {
        ...localSales[idx],
        customer_id: parseInt(customer_id),
        sale_date: sale_date || new Date().toISOString().split('T')[0],
        gst_enabled: !!gst_enabled,
        gst_percent: parseFloat(gst_percent) || 18,
        subtotal,
        gst_amount,
        grand_total,
        payment_mode,
        amount_due: due,
        notes,
        items: items.map((item, i) => {
          const matObj = materials.find(m => m.id == item.material_id);
          const name = item.custom_material_name || (matObj ? matObj.name : null) || 'Stone Material';
          return {
            id: Date.now() + i,
            sale_id: saleId,
            material_id: item.material_id || null,
            material_name: name,
            custom_material_name: item.custom_material_name || null,
            quantity: parseFloat(item.quantity),
            unit: item.unit || 'Tonne',
            rate: parseFloat(item.rate),
            amount: (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)
          };
        })
      };
      this.saveLocalData('sales', localSales);
    }
    
    return { sale_id: saleId, invoice_number: existingSale.invoice_number };
  },

  addPayment: async function (saleId, { amount_paid, payment_method, notes }) {
    this.initLocalSeed();
    const supabase = this.getClient();
    const paymentAmount = parseFloat(amount_paid);
    if (!paymentAmount || paymentAmount <= 0) {
      throw new Error('Please enter a valid payment amount greater than 0');
    }

    const sale = await this.getSaleById(saleId);
    const currentDue = parseFloat(sale.amount_due) || 0;
    const currentPaid = parseFloat(sale.amount_paid) || 0;
    const grandTotal = parseFloat(sale.grand_total) || 0;

    if (paymentAmount > currentDue + 0.01) {
      throw new Error(`Payment amount (₹${paymentAmount}) exceeds outstanding due (₹${currentDue})`);
    }

    const newPaid = currentPaid + paymentAmount;
    const newDue = Math.max(0, grandTotal - newPaid);
    const newStatus = newDue <= 0.01 ? 'full' : 'partial';

    try {
      if (supabase) {
        const { error: updateErr } = await supabase
          .from('sales')
          .update({ amount_paid: newPaid, amount_due: newDue, payment_mode: newStatus })
          .eq('id', saleId);

        if (!updateErr) {
          const user = window.LSCAuth.getCurrentUser();
          const payMode = payment_method || 'cash';
          const logNote = notes ? `${payMode.toUpperCase()} Payment - ${notes}` : `${payMode.toUpperCase()} Payment Settlement`;

          await supabase.from('payment_logs').insert([{
            sale_id: saleId,
            customer_id: sale.customer_id,
            payment_date: new Date().toISOString(),
            amount_paid: paymentAmount,
            balance_before: currentDue,
            balance_after: newDue,
            notes: logNote,
            recorded_by: user?.id || null
          }]);

          return { new_paid: newPaid, new_due: newDue, status: newStatus };
        }
      }
    } catch (e) {
      console.warn('Using local addPayment fallback');
    }

    // Local Storage Payment update
    const sales = this.getLocalData('sales', []);
    const idx = sales.findIndex(s => s.id == saleId);
    if (idx !== -1) {
      sales[idx].amount_paid = newPaid;
      sales[idx].amount_due = newDue;
      sales[idx].payment_mode = newStatus;
      this.saveLocalData('sales', sales);
    }

    const logs = this.getLocalData('payment_logs', []);
    logs.push({
      id: Date.now(),
      sale_id: saleId,
      customer_id: sale.customer_id,
      payment_date: new Date().toISOString(),
      amount_paid: paymentAmount,
      balance_before: currentDue,
      balance_after: newDue,
      notes: notes ? `${(payment_method || 'cash').toUpperCase()} - ${notes}` : `${(payment_method || 'cash').toUpperCase()} Payment`,
      payment_mode: payment_method || 'cash'
    });
    this.saveLocalData('payment_logs', logs);

    return { new_paid: newPaid, new_due: newDue, status: newStatus };
  },

  deleteSale: async function (id) {
    this.initLocalSeed();
    const supabase = this.getClient();
    try {
      if (supabase) {
        await supabase.from('sale_items').delete().eq('sale_id', id);
        await supabase.from('payment_logs').delete().eq('sale_id', id);
        await supabase.from('sales').delete().eq('id', id);
      }
    } catch (e) {}

    let sales = this.getLocalData('sales', []);
    sales = sales.filter(s => s.id != id);
    this.saveLocalData('sales', sales);
  },

  // ----------------------------------------------------
  // CUSTOMERS
  // ----------------------------------------------------
  getCustomers: async function (search = '') {
    this.initLocalSeed();
    const supabase = this.getClient();

    if (supabase) {
      let query = supabase.from('customers').select('*').order('name', { ascending: true });
      if (search.trim()) query = query.or(`name.ilike.%${search.trim()}%,mobile.ilike.%${search.trim()}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      if (data) return data;
    }

    let customers = this.getLocalData('customers', []);
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      customers = customers.filter(c => (c.name && c.name.toLowerCase().includes(term)) || (c.mobile && c.mobile.toLowerCase().includes(term)));
    }
    return customers;
  },

  addCustomer: async function ({ name, mobile, address }) {
    this.initLocalSeed();
    const supabase = this.getClient();
    if (!name || !name.trim()) throw new Error('Customer name is required');

    if (supabase) {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ name: name.trim(), mobile: mobile || null, address: address || null }])
        .select();
      if (error) throw new Error(error.message);
      if (data) return data[0];
    }

    const customers = this.getLocalData('customers', []);
    const newCust = {
      id: Date.now(),
      name: name.trim(),
      mobile: mobile || null,
      address: address || null,
      created_at: new Date().toISOString()
    };
    customers.push(newCust);
    this.saveLocalData('customers', customers);
    return newCust;
  },

  updateCustomer: async function (id, { name, mobile, address }) {
    this.initLocalSeed();
    const supabase = this.getClient();
    if (!name || !name.trim()) throw new Error('Customer name is required');

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('customers')
          .update({ name: name.trim(), mobile: mobile || null, address: address || null, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select();
        if (!error && data) return data[0];
      }
    } catch (e) {}

    const customers = this.getLocalData('customers', []);
    const idx = customers.findIndex(c => c.id == id);
    if (idx !== -1) {
      customers[idx].name = name.trim();
      customers[idx].mobile = mobile || null;
      customers[idx].address = address || null;
      this.saveLocalData('customers', customers);
      return customers[idx];
    }
  },

  deleteCustomer: async function (id) {
    this.initLocalSeed();
    const sales = this.getLocalData('sales', []);
    if (sales.some(s => s.customer_id == id)) {
      throw new Error('Cannot delete customer with existing sales records.');
    }

    const supabase = this.getClient();
    try {
      if (supabase) await supabase.from('customers').delete().eq('id', id);
    } catch (e) {}

    let customers = this.getLocalData('customers', []);
    customers = customers.filter(c => c.id != id);
    this.saveLocalData('customers', customers);
  },

  getCustomerLedger: async function (customerId) {
    this.initLocalSeed();
    const logs = this.getLocalData('payment_logs', []).filter(l => l.customer_id == customerId);
    const sales = this.getLocalData('sales', []).filter(s => s.customer_id == customerId);

    let total_billed = 0, total_paid = 0, total_due = 0;
    sales.forEach(s => {
      total_billed += parseFloat(s.grand_total) || 0;
      total_paid += parseFloat(s.amount_paid) || 0;
      total_due += parseFloat(s.amount_due) || 0;
    });

    return { logs, sales, summary: { total_billed, total_paid, total_due } };
  },

  // ----------------------------------------------------
  // MATERIALS & RATES
  // ----------------------------------------------------
  getMaterials: async function () {
    this.initLocalSeed();
    return this.getLocalData('materials', []);
  },

  addMaterial: async function ({ name, rate_per_unit, unit }) {
    this.initLocalSeed();
    const supabase = this.getClient();
    if (!name || !name.trim()) throw new Error('Material name is required');

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('materials')
          .insert([{ name: name.trim(), rate_per_unit: parseFloat(rate_per_unit) || 0, unit: unit || 'Tonne', is_system: false, is_active: true }])
          .select();
        if (!error && data) return data[0];
      }
    } catch (e) {}

    const materials = this.getLocalData('materials', []);
    const newMat = {
      id: Date.now(),
      name: name.trim(),
      is_system: false,
      is_active: true,
      rate_per_unit: parseFloat(rate_per_unit) || 0,
      unit: unit || 'Tonne'
    };
    materials.push(newMat);
    this.saveLocalData('materials', materials);
    return newMat;
  },

  updateMaterial: async function (id, { name, rate_per_unit, unit }) {
    this.initLocalSeed();
    const supabase = this.getClient();
    if (!name || !name.trim()) throw new Error('Material name is required');

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('materials')
          .update({ name: name.trim(), rate_per_unit: parseFloat(rate_per_unit) || 0, unit: unit || 'Tonne' })
          .eq('id', id)
          .select();
        if (!error && data) return data[0];
      }
    } catch (e) {}

    const materials = this.getLocalData('materials', []);
    const idx = materials.findIndex(m => m.id == id);
    if (idx !== -1) {
      materials[idx].name = name.trim();
      materials[idx].rate_per_unit = parseFloat(rate_per_unit) || 0;
      materials[idx].unit = unit || 'Tonne';
      this.saveLocalData('materials', materials);
      return materials[idx];
    }
  },

  deleteMaterial: async function (id) {
    this.initLocalSeed();
    const supabase = this.getClient();
    try {
      if (supabase) await supabase.from('materials').delete().eq('id', id);
    } catch (e) {}

    let materials = this.getLocalData('materials', []);
    materials = materials.filter(m => m.id != id);
    this.saveLocalData('materials', materials);
  },

  // ----------------------------------------------------
  // STAFF & ATTENDANCE
  // ----------------------------------------------------
  getStaff: async function () {
    this.initLocalSeed();
    return this.getLocalData('staff', []);
  },

  addStaff: async function ({ name, mobile, joining_date, salary }) {
    this.initLocalSeed();
    const staff = this.getLocalData('staff', []);
    const newSt = {
      id: Date.now(),
      name: name.trim(),
      mobile: mobile || null,
      joining_date: joining_date || new Date().toISOString().split('T')[0],
      salary: parseFloat(salary) || 0,
      status: 'active'
    };
    staff.push(newSt);
    this.saveLocalData('staff', staff);
    return newSt;
  },

  deleteStaff: async function (staffId) {
    this.initLocalSeed();
    let staff = this.getLocalData('staff', []);
    const idx = staff.findIndex(s => s.id == staffId);
    if (idx !== -1) {
      staff.splice(idx, 1);
      this.saveLocalData('staff', staff);
      return true;
    }
    throw new Error('Staff not found');
  },


  getAttendance: async function (dateStr) {
    this.initLocalSeed();
    const date = dateStr || new Date().toISOString().split('T')[0];
    const staff = this.getLocalData('staff', []);
    const attendance = this.getLocalData('attendance', []).filter(a => a.date === date);
    const attMap = {};
    attendance.forEach(a => attMap[a.staff_id] = a);

    return staff.map(st => ({
      id: st.id,
      name: st.name,
      mobile: st.mobile,
      status: attMap[st.id]?.status || 'present',
      notes: attMap[st.id]?.notes || '',
      isMarked: !!attMap[st.id]
    }));
  },

  getAllAttendance: async function () {
    this.initLocalSeed();
    const attendance = this.getLocalData('attendance', []);
    const staff = this.getLocalData('staff', []);
    
    // Join with staff names
    return attendance.map(a => {
      const st = staff.find(s => s.id == a.staff_id);
      return {
        ...a,
        staff_name: st ? st.name : 'Unknown Staff'
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort latest first
  },

  saveAttendance: async function (staffId, date, status, notes) {
    this.initLocalSeed();
    const attendance = this.getLocalData('attendance', []);
    const idx = attendance.findIndex(a => a.staff_id == staffId && a.date === date);

    if (idx !== -1) {
      attendance[idx].status = status;
      attendance[idx].notes = notes;
    } else {
      attendance.push({ id: Date.now(), staff_id: parseInt(staffId), date, status, notes });
    }

    this.saveLocalData('attendance', attendance);
  },

  getAdvances: async function () {
    this.initLocalSeed();
    const advances = this.getLocalData('advances', []);
    const staff = this.getLocalData('staff', []);
    return advances.map(a => {
      const st = staff.find(s => s.id == a.staff_id);
      return { ...a, staff_name: st ? st.name : 'N/A' };
    });
  },

  addAdvance: async function ({ staff_id, amount, advance_date, notes }) {
    this.initLocalSeed();
    const advances = this.getLocalData('advances', []);
    const newAdv = {
      id: Date.now(),
      staff_id: parseInt(staff_id),
      amount: parseFloat(amount) || 0,
      advance_date: advance_date || new Date().toISOString().split('T')[0],
      notes: notes || null
    };
    advances.push(newAdv);
    this.saveLocalData('advances', advances);
    return newAdv;
  },

  getLeaves: async function () {
    this.initLocalSeed();
    const leaves = this.getLocalData('leave_requests', []);
    const staff = this.getLocalData('staff', []);
    return leaves.map(l => {
      const st = staff.find(s => s.id == l.staff_id);
      return { ...l, staff_name: st ? st.name : 'N/A' };
    });
  },

  addLeave: async function ({ staff_id, from_date, to_date, type, reason }) {
    this.initLocalSeed();
    const leaves = this.getLocalData('leave_requests', []);
    const newL = {
      id: Date.now(),
      staff_id: parseInt(staff_id),
      from_date,
      to_date,
      type: type || 'Casual',
      reason: reason || null,
      status: 'approved'
    };
    leaves.push(newL);
    this.saveLocalData('leave_requests', leaves);
    return newL;
  },

  // ----------------------------------------------------
  // REPORTS
  // ----------------------------------------------------
  getReports: async function (type, { from, to, customer_id } = {}) {
    this.initLocalSeed();
    const sales = await this.getSales({ from, to, customer_id });
    const customers = this.getLocalData('customers', []);
    const materials = this.getLocalData('materials', []);

    if (type === 'customer-statement') {
      return sales.map(s => {
        const c = customers.find(item => item.id == s.customer_id);
        const matSummary = (s.items || []).map(i => {
          const matObj = materials.find(m => m.id == i.material_id);
          const name = i.custom_material_name || (matObj ? matObj.name : null) || i.material_name || i.name || 'Stone Material';
          return `${name} (${i.quantity} ${i.unit || 'Tonne'})`;
        }).join(', ');

        return {
          id: s.id,
          invoice_number: s.invoice_number,
          sale_date: s.sale_date,
          customer_name: c ? c.name : (s.customer_name || 'N/A'),
          customer_mobile: c ? c.mobile : '',
          material_summary: matSummary || 'Stone Crusher Materials',
          gst_enabled: s.gst_enabled,
          grand_total: parseFloat(s.grand_total) || 0,
          amount_paid: parseFloat(s.amount_paid) || 0,
          amount_due: parseFloat(s.amount_due) || 0,
          payment_mode: s.payment_mode || 'due'
        };
      }).sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
    }

    if (type === 'customer-wise') {
      const map = {};
      sales.forEach(s => {
        const cId = s.customer_id;
        const c = customers.find(item => item.id == cId);
        const name = c ? c.name : (s.customer_name || 'Unknown');
        if (!map[cId]) {
          map[cId] = { customer_id: cId, customer_name: name, customer_mobile: c?.mobile || '', total_orders: 0, total_billed: 0, total_paid: 0, total_due: 0 };
        }
        map[cId].total_orders += 1;
        map[cId].total_billed += parseFloat(s.grand_total) || 0;
        map[cId].total_paid += parseFloat(s.amount_paid) || 0;
        map[cId].total_due += parseFloat(s.amount_due) || 0;
      });
      return Object.values(map).sort((a, b) => b.total_billed - a.total_billed);
    }

    if (type === 'material-wise') {
      const map = {};
      sales.forEach(s => {
        (s.items || []).forEach(item => {
          const matObj = materials.find(m => m.id == item.material_id);
          const mName = item.custom_material_name || (matObj ? matObj.name : null) || item.material_name || item.name || 'Stone Material';
          if (!map[mName]) {
            map[mName] = { material_name: mName, total_quantity: 0, unit: item.unit || 'Tonne', total_amount: 0, count: 0 };
          }
          map[mName].total_quantity += parseFloat(item.quantity) || 0;
          map[mName].total_amount += parseFloat(item.amount) || 0;
          map[mName].count += 1;
        });
      });
      return Object.values(map).map(m => ({
        ...m,
        avg_rate: m.total_quantity ? (m.total_amount / m.total_quantity) : 0
      })).sort((a, b) => b.total_amount - a.total_amount);
    }

    if (type === 'due') {
      return sales.filter(s => parseFloat(s.amount_due) > 0).sort((a, b) => b.amount_due - a.amount_due);
    }

    // Daily Summary
    const map = {};
    sales.forEach(s => {
      const d = s.sale_date;
      if (!map[d]) {
        map[d] = { sale_date: d, total_orders: 0, total_billed: 0, total_paid: 0, total_due: 0 };
      }
      map[d].total_orders += 1;
      map[d].total_billed += parseFloat(s.grand_total) || 0;
      map[d].total_paid += parseFloat(s.amount_paid) || 0;
      map[d].total_due += parseFloat(s.amount_due) || 0;
    });

    return Object.values(map).sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
  },

  // ----------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------
  getSettings: async function () {
    this.initLocalSeed();
    return this.getLocalData('settings', {});
  },

  updateSettings: async function (settingsObj) {
    this.initLocalSeed();
    const current = this.getLocalData('settings', {});
    const updated = { ...current, ...settingsObj };
    this.saveLocalData('settings', updated);

    const supabase = this.getClient();
    try {
      if (supabase) {
        for (const [key, value] of Object.entries(settingsObj)) {
          await supabase.from('settings').upsert({ key, value: String(value) }, { onConflict: 'key' });
        }
      }
    } catch (e) {}
  }
};
