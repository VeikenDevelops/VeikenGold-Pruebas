let boostRate=0, boostSkill='';
    let psMode='impact', psSellMode='impact';
    const psConfig = {
      impact:  {name:'Impact',  unit:'Billones (B)', unitShort:'B', buyRate:0.10, sellRate:0.07},
      roatpkz: {name:'RoatPkz', unit:'Millones (M)', unitShort:'M', buyRate:0.05, sellRate:0.03},
      orion:   {name:'Orion',   unit:'Billones (B)', unitShort:'B', buyRate:0.08, sellRate:0.06},
      spawmpk: {name:'SpawnPK', unit:'Trillones (T)',unitShort:'T', buyRate:0.20, sellRate:0.14}
    };
    const deliveryState = {};

    // ── BOOST — filled dynamically from Google Sheets ──
    const BOOST_DATA = { skilling:[], questing:[], diaries:[], pvm:[], minigames:[], ca:[] };
    let boostTab = 'skilling';
    let boostFilter = 'All';
    let boostSortCol = 'name';
    let boostSortDir = 1;
    const boostSelected = {};

    // ── MASTER PRICE OBJECT — filled from Google Sheets ──
    const PRICES = {
      // rs.buy  = A2 = lo que pagamos al proveedor ($0.18) → Sell Gold tab (cliente nos vende)
      // rs.sell = A5 = lo que cobra el cliente    ($0.22) → Buy Gold tab  (cliente nos compra)
      rs:      { buy: 0.18, sell: 0.22 },
      wowc:    { buy: 0.48, sell: 0.60 },
      wowr_us: { buy: 0.65, sell: 0.82 },
      wowr_eu: { buy: 0.65, sell: 0.82 },
      mem:     { wow_gt: 22, osrs_bond: 3.5, wow_ficha: 16 },
      rsps:    {}
    };

    const SHEET_URLS = {
      osrs:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vS0F73I1g1jLRRNsLs4jsny_Kg58A3l15pGA0iSENCkBKfU1Te3mhg1-vAKw4fYpL_hZ4G1XSXkJeOj/pub?gid=1558096304&single=true&output=csv',
      rsps:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vS0F73I1g1jLRRNsLs4jsny_Kg58A3l15pGA0iSENCkBKfU1Te3mhg1-vAKw4fYpL_hZ4G1XSXkJeOj/pub?gid=1417689292&single=true&output=csv',
      mem:    'https://docs.google.com/spreadsheets/d/e/2PACX-1vS0F73I1g1jLRRNsLs4jsny_Kg58A3l15pGA0iSENCkBKfU1Te3mhg1-vAKw4fYpL_hZ4G1XSXkJeOj/pub?gid=209499785&single=true&output=csv',
      wowr:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vS0F73I1g1jLRRNsLs4jsny_Kg58A3l15pGA0iSENCkBKfU1Te3mhg1-vAKw4fYpL_hZ4G1XSXkJeOj/pub?gid=1643071912&single=true&output=csv',
      wowc:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vS0F73I1g1jLRRNsLs4jsny_Kg58A3l15pGA0iSENCkBKfU1Te3mhg1-vAKw4fYpL_hZ4G1XSXkJeOj/pub?gid=2146225598&single=true&output=csv',
      bSkill: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZvP2Rm-Og5oX8dR4NZcCaMu_7a_2azwE7THM8SlYkeYFIpVO3XTZ5uCxybkwFwx2njICn13NjdDWS/pub?gid=251149757&single=true&output=csv',
      bQuest: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZvP2Rm-Og5oX8dR4NZcCaMu_7a_2azwE7THM8SlYkeYFIpVO3XTZ5uCxybkwFwx2njICn13NjdDWS/pub?gid=581980587&single=true&output=csv',
      bMini:  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZvP2Rm-Og5oX8dR4NZcCaMu_7a_2azwE7THM8SlYkeYFIpVO3XTZ5uCxybkwFwx2njICn13NjdDWS/pub?gid=1998036908&single=true&output=csv',
      bPvm:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZvP2Rm-Og5oX8dR4NZcCaMu_7a_2azwE7THM8SlYkeYFIpVO3XTZ5uCxybkwFwx2njICn13NjdDWS/pub?gid=1737097363&single=true&output=csv',
      bDiary: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZvP2Rm-Og5oX8dR4NZcCaMu_7a_2azwE7THM8SlYkeYFIpVO3XTZ5uCxybkwFwx2njICn13NjdDWS/pub?gid=21511996&single=true&output=csv',
      bCapes: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZvP2Rm-Og5oX8dR4NZcCaMu_7a_2azwE7THM8SlYkeYFIpVO3XTZ5uCxybkwFwx2njICn13NjdDWS/pub?gid=2031426521&single=true&output=csv',
      bCA:    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZvP2Rm-Og5oX8dR4NZcCaMu_7a_2azwE7THM8SlYkeYFIpVO3XTZ5uCxybkwFwx2njICn13NjdDWS/pub?gid=1795077270&single=true&output=csv',
      accounts: '', // ← Pega aquí la URL CSV de tu pestaña "Accounts"
    };

    function parseCSV(text) {
      return text.trim().split('\n').map(r => {
        // Handle quoted CSV fields properly
        const cols = [];
        let cur = '', inQ = false;
        for (let i = 0; i < r.length; i++) {
          if (r[i] === '"') { inQ = !inQ; continue; }
          if (r[i] === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
          cur += r[i];
        }
        cols.push(cur.trim());
        return cols.map(c => c.replace(/^\$/, '').trim());
      });
    }
    function cleanNum(v) {
      if (!v) return 0;
      let s = String(v).trim();
      // Remove currency symbols and spaces
      s = s.replace(/[$\s]/g, '');
      // If comma is used as decimal separator (e.g. "0,190" or "3,50")
      // detect: if there's a comma and either no dot, or comma comes after dot
      if (s.includes(',')) {
        const dotIdx = s.indexOf('.');
        const comIdx = s.indexOf(',');
        if (dotIdx === -1) {
          // Only comma: treat as decimal separator -> "0,190" => "0.190"
          s = s.replace(',', '.');
        } else if (comIdx > dotIdx) {
          // dot before comma: European thousands -> "1.000,50" => "1000.50"
          s = s.replace(/\./g, '').replace(',', '.');
        }
        // else: comma before dot -> "1,000.50" already fine, just remove comma
        s = s.replace(/,/g, '');
      }
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    }

    async function fetchSheet(url) {
      try { const r = await fetch(url); return await r.text(); } catch(e) { return null; }
    }

    async function loadAllPrices() {
      // Show loading indicators
      ['rs-buy-rate','rs-sell-rate','wowc-buy-rate','wowc-sell-rate','wowr-buy-rate','wowr-sell-rate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = '...'; el.style.opacity='0.5'; }
      });

      // Fetch all sheets in parallel — failures don't block others
      const results = await Promise.allSettled([
        fetchSheet(SHEET_URLS.osrs),
        fetchSheet(SHEET_URLS.rsps),
        fetchSheet(SHEET_URLS.mem),
        fetchSheet(SHEET_URLS.wowr),
        fetchSheet(SHEET_URLS.wowc),
        fetchSheet(SHEET_URLS.bSkill),
        fetchSheet(SHEET_URLS.bQuest),
        fetchSheet(SHEET_URLS.bMini),
        fetchSheet(SHEET_URLS.bPvm),
        fetchSheet(SHEET_URLS.bDiary),
        fetchSheet(SHEET_URLS.bCapes),
        fetchSheet(SHEET_URLS.bCA),
      ]);
      const [oTxt, rTxt, mTxt, wrTxt, wcTxt,
             bSkillTxt, bQuestTxt, bMiniTxt, bPvmTxt, bDiaryTxt, bCapesTxt, bCATxt
            ] = results.map(r => r.status==='fulfilled' ? r.value : null);

      // ── 1. OSRS ──
      if (oTxt) {
        const rows = parseCSV(oTxt);
        console.log('[OSRS CSV] rows 0-5:', rows.slice(0,6).map(r=>r[0]));
        let found = 0;
        for (let i = 0; i < rows.length; i++) {
          const v = cleanNum(rows[i][0]);
          if (v > 0) {
            found++;
            if (found === 1) { PRICES.rs.buy  = v; console.log('[OSRS] buy=', v, 'row', i); }
            if (found === 2) { PRICES.rs.sell = v; console.log('[OSRS] sell=', v, 'row', i); break; }
          }
        }
      }

      // ── 2. V RSPS ──
      if (rTxt) {
        const rows = parseCSV(rTxt);
        console.log('[RSPS CSV] rows 0-4:', rows.slice(0,4));
        const newRsps = {};
        rows.slice(2).forEach(row => {
          const name         = (row[1]||'').trim();
          const unitRaw      = (row[2]||'').trim();   // e.g. "1B","1M","100M","1T"
          const providerCost = cleanNum(row[3]);       // col D: internal cost (ignored)
          const clientPrice  = cleanNum(row[4]);       // col E: Resultado $ = price we charge
          if (!name || clientPrice <= 0) return;
          // Extract letter: "1B"->B, "100M"->M, "1T"->T
          const m = unitRaw.match(/^(\d+)([BMTG])/i);
          const unitShort = m ? m[2].toUpperCase() : (unitRaw.replace(/\d/g,'').trim() || 'B');
          const key = name.toLowerCase().replace(/\s+/g,'-');
          newRsps[key] = { name, unitRaw, unitShort, clientPrice };
          console.log('[RSPS]', name, unitRaw, '-> $'+clientPrice+'/'+unitShort);
        });
        PRICES.rsps = newRsps;
        console.log('[RSPS] total servers:', Object.keys(PRICES.rsps).length);
        buildRSPSButtons();
      }

      // ── 3. Membresías ──
      if (mTxt) {
        const rows = parseCSV(mTxt);
        console.log('[MEM CSV] rows:', rows.slice(0,5));
        rows.slice(1).forEach(row => {
          const g = (row[1]||'').toLowerCase();
          const p = cleanNum(row[2]);
          if (!p) return;
          if (g.includes('wow gt'))                          PRICES.mem.wow_gt    = p;
          else if (g.includes('osrs'))                       PRICES.mem.osrs_bond = p;
          else if (g.includes('ficha') || g.includes('wow')) PRICES.mem.wow_ficha = p;
        });
        console.log('[MEM] prices:', PRICES.mem);
        updateMemCards();
      }

      // ── 4. WoW Retail ──
      if (wrTxt) {
        const rows = parseCSV(wrTxt);
        console.log('[WOWR CSV] rows 0-12:', rows.slice(0,12).map(r=>r[0]));
        // Find values by scanning — green=buy (lower), red=sell (higher)
        const nums = [];
        for (let i = 0; i < rows.length; i++) {
          const v = cleanNum(rows[i][0]);
          if (v > 0) nums.push({v, i});
        }
        if (nums[0]) PRICES.wowr_us.buy  = nums[0].v;
        if (nums[1]) PRICES.wowr_us.sell = nums[1].v;
        if (nums[2]) PRICES.wowr_eu.buy  = nums[2].v;
        if (nums[3]) PRICES.wowr_eu.sell = nums[3].v;
        console.log('[WOWR] US buy/sell:', PRICES.wowr_us, 'EU:', PRICES.wowr_eu);
      }

      // ── 5. WoW Classic ──
      if (wcTxt) {
        const rows = parseCSV(wcTxt);
        console.log('[WOWC CSV] rows 0-5:', rows.slice(0,5));
        // col C (index 2) = buy price, col F (index 5) = sell price
        const nums = [];
        for (let i = 0; i < rows.length; i++) {
          const v = cleanNum(rows[i][2]);
          if (v > 0) { PRICES.wowc.buy = v; console.log('[WOWC] buy=', v, 'row', i); break; }
        }
        for (let i = 0; i < rows.length; i++) {
          const v = cleanNum(rows[i][5]);
          if (v > 0) { PRICES.wowc.sell = v; console.log('[WOWC] sell=', v, 'row', i); break; }
        }
      }

      // ── Apply to UI ──
      console.log('[VeikenGold] Final prices:', JSON.stringify({rs: PRICES.rs, wowc: PRICES.wowc, wowr_us: PRICES.wowr_us}));

      // ══════════════════════════════════════════
      // BOOST SHEETS — parse CSV, runs here so bSkillTxt etc. are in scope
      // ══════════════════════════════════════════
      function safeRows(txt) {
        if (!txt || !txt.trim()) return [];
        return parseCSV(txt).slice(1).filter(r => r.some(c => c.trim()));
      }

      // Skill Price: Names | Skilling | Method | Level From | Level To | GP/XP | Notes
      if (bSkillTxt) {
        const rows = safeRows(bSkillTxt);
        console.log('[BOOST] Skill rows:', rows.length, rows[0]);
        BOOST_DATA.skilling = rows.map(r => ({
          name: r[1] || r[0] || '', method: r[2] || '',
          from: parseInt(r[3]) || 0, to: parseInt(r[4]) || 0,
          price: cleanNum(r[5]), note: r[6] || ''
        })).filter(r => r.name && r.price > 0);
      }

      // Quest List: Quest Name | Price | Notes
      if (bQuestTxt) {
        const rows = safeRows(bQuestTxt);
        console.log('[BOOST] Quest rows:', rows.length, rows[0]);
        BOOST_DATA.questing = rows.map(r => ({
          name: r[0] || '', price: cleanNum(r[1]), note: r[2] || ''
        })).filter(r => r.name && r.price > 0);
      }

      // Minigame: Minigame | Item | Price | Notes
      if (bMiniTxt) {
        const rows = safeRows(bMiniTxt);
        console.log('[BOOST] Mini rows:', rows.length, rows[0]);
        let lastMini = '';
        BOOST_DATA.minigames = rows.map(r => {
          if (r[0] && r[0].trim()) lastMini = r[0].trim();
          const item = r[1] || '';
          if (!item) return null;
          return { name: item, minigame: lastMini, price: cleanNum(r[2]), note: r[3] || '' };
        }).filter(r => r && r.name && r.price > 0);
      }

      // PvM List: Imagen | Boss Name | Method | Price | Notes | Category
      if (bPvmTxt) {
        const rows = safeRows(bPvmTxt);
        console.log('[BOOST] PvM rows:', rows.length, rows[0]);
        BOOST_DATA.pvm = rows.map(r => ({
          name: r[1] || r[0] || '', method: r[2] || '',
          price: cleanNum(r[3]), note: r[4] || '', category: r[5] || 'Boss'
        })).filter(r => r.name && r.price > 0);
      }

      // Diary List: Diary | Difficulty | Price | Notes
      if (bDiaryTxt) {
        const rows = safeRows(bDiaryTxt);
        console.log('[BOOST] Diary rows:', rows.length, rows[0]);
        BOOST_DATA.diaries = rows.map(r => ({
          name: (r[0]||'').trim()+' '+(r[1]||'').trim(),
          difficulty: (r[1]||'').trim(), price: cleanNum(r[2]), note: r[3] || ''
        })).filter(r => r.difficulty && r.price > 0);
      }

      // Capes: Name | Method | Price | Notes
      if (bCapesTxt) {
        const rows = safeRows(bCapesTxt);
        console.log('[BOOST] Capes rows:', rows.length, rows[0]);
        const capes = rows.map(r => ({
          name: r[0] || '', method: r[1] || '',
          price: cleanNum(r[2]), note: r[3] || '', category: 'Capes'
        })).filter(r => r.name && r.price > 0);
        BOOST_DATA.pvm = [...capes, ...(BOOST_DATA.pvm || [])];
      }

      // Combat Achievements: TIER | TASK | PRICE | NOTES
      if (bCATxt) {
        const rows = safeRows(bCATxt);
        console.log('[BOOST] CA rows:', rows.length, rows[0]);
        BOOST_DATA.ca = rows.map(r => ({
          tier: r[0] || '', name: r[1] || '', price: cleanNum(r[2]), note: r[3] || ''
        })).filter(r => r.name && r.price > 0);
      }

      console.log('[BOOST] Loaded — skilling:', BOOST_DATA.skilling.length,
        'questing:', BOOST_DATA.questing.length, 'pvm:', BOOST_DATA.pvm.length,
        'diaries:', BOOST_DATA.diaries.length, 'minigames:', BOOST_DATA.minigames.length,
        'ca:', BOOST_DATA.ca.length);
      try { buildBoostFilters(); renderBoostTable(); } catch(e) { console.error('[BOOST render]', e); }
      // ── END BOOST ──

      applyAllPricesToUI();
      ['rs-buy-rate','rs-sell-rate','wowc-buy-rate','wowc-sell-rate','wowr-buy-rate','wowr-sell-rate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.opacity = '1';
      });
    }

    function applyAllPricesToUI() {
      // ── RS ──
      const rsBuyRate  = document.getElementById('rs-buy-rate');
      const rsSellRate = document.getElementById('rs-sell-rate');
      if (rsBuyRate)  rsBuyRate.textContent  = '$' + (PRICES.rs.buy ||0.22).toFixed(2);
      if (rsSellRate) rsSellRate.textContent = '$' + (PRICES.rs.sell||0.18).toFixed(2);
      calcRS('buy');
      calcRS('sell');

      // ── WoW Classic ──
      const wcbRateEl = document.getElementById('wowc-buy-rate');
      const wcsRateEl = document.getElementById('wowc-sell-rate');
      if (wcbRateEl) wcbRateEl.textContent = '$' + (PRICES.wowc?.buy  || 0.60).toFixed(3) + '/G';
      if (wcsRateEl) wcsRateEl.textContent = '$' + (PRICES.wowc?.sell || 0.48).toFixed(3) + '/G';
      calcWowClassic('buy');
      calcWowClassic('sell');

      // ── WoW Retail ──
      const wrbRateEl = document.getElementById('wowr-buy-rate');
      const wrsRateEl = document.getElementById('wowr-sell-rate');
      if (wrbRateEl) wrbRateEl.textContent = '$' + (PRICES.wowr_us?.buy  || 0.82).toFixed(2) + '/100K';
      if (wrsRateEl) wrsRateEl.textContent = '$' + (PRICES.wowr_us?.sell || 0.65).toFixed(2) + '/100K';
      calcWowRetail('buy');
      calcWowRetail('sell');

      // ── Membresías ──
      updateMemCards();
    }

    function buildRSPSButtons() {
      const grid = document.getElementById('ps-server-grid');
      if (!grid) { console.warn('[RSPS] ps-server-grid not found'); return; }
      const entries = Object.entries(PRICES.rsps);
      if (!entries.length) { console.warn('[RSPS] no servers to display'); return; }

      // Generate buttons dynamically from sheet data
      grid.innerHTML = entries.map(([key, cfg], idx) =>
        `<div class="server-btn ${idx===0?'active':''}" id="ps-${key}" onclick="selectPS('${key}')">
          <span style="font-size:28px">🎮</span>
          <div class="server-name-lbl">${cfg.name}</div>
          <div class="server-unit">Unit: ${cfg.unitRaw}</div>
          <div class="server-price-lbl">$${cfg.clientPrice.toFixed(2)}/${cfg.unitShort}</div>
        </div>`
      ).join('');

      // Auto-select first server
      const firstKey = entries[0][0];
      psMode = firstKey;
      psSellMode = firstKey;
      selectPS(firstKey);

      // Update nav dropdown and mobile prices
      entries.forEach(([key, cfg]) => {
        const pStr = '$'+cfg.clientPrice.toFixed(2)+'/'+cfg.unitShort;
        document.querySelectorAll('.submenu-item').forEach(item => {
          if (item.textContent.toLowerCase().includes(cfg.name.toLowerCase())) {
            const sp = item.querySelector('.sub-price');
            if (sp) sp.textContent = pStr;
          }
        });
        document.querySelectorAll('.mobile-item').forEach(item => {
          if (item.textContent.toLowerCase().includes(cfg.name.toLowerCase())) {
            const sub = item.querySelector('.mobile-item-sub');
            if (sub) sub.textContent = pStr;
          }
        });
      });
    }

    function selectMem(type) {
      ['bond','wow2m','wow1m'].forEach(t => {
        document.getElementById('mem-'+t).style.display        = t===type ? 'block' : 'none';
        document.getElementById('mem-tab-'+t).classList.toggle('active', t===type);
      });
      calcMem(type);
    }

    function calcMem(type) {
      const qty = parseFloat(document.getElementById('mem-'+type+'-qty').value)||1;
      const prices = PRICES.mem || {};
      let pricePerUnit, timePerUnit, timeUnit;

      if (type === 'bond') {
        pricePerUnit = prices.osrs_bond || 3.5;
        const days   = qty * 14;
        timePerUnit  = days + ' day' + (days !== 1 ? 's' : '');
        timeUnit     = 'Bond';
      } else if (type === 'wow2m') {
        pricePerUnit = prices.wow_gt || 22;
        const months = qty * 2;
        const days   = qty * 60;
        timePerUnit  = months + ' month' + (months !== 1 ? 's' : '') + ' (' + days + ' days)';
        timeUnit     = 'Code';
      } else { // wow1m
        pricePerUnit = prices.wow_ficha || 16;
        const months = qty;
        const days   = qty * 30;
        timePerUnit  = months + ' month' + (months !== 1 ? 's' : '') + ' (' + days + ' days)';
        timeUnit     = 'Month';
      }

      const total = qty * pricePerUnit;
      const rateEl  = document.getElementById('mem-'+type+'-rate');
      const qtyEl   = document.getElementById('mem-'+type+'-qty-show');
      const timeEl  = document.getElementById('mem-'+type+'-time');
      const totalEl = document.getElementById('mem-'+type+'-total');
      if (rateEl)  rateEl.textContent  = '$' + pricePerUnit.toFixed(2);
      if (qtyEl)   qtyEl.textContent   = qty + ' ' + timeUnit + (qty !== 1 ? 's' : '');
      if (timeEl)  timeEl.textContent  = timePerUnit;
      if (totalEl) setConvertedBuy('mem-'+type+'-total', total);
    }

    function updateMemCards() {
      // Update price-per-unit displays using prices from sheet
      const p = PRICES.mem || {};
      const bondRate  = document.getElementById('mem-bond-rate');
      const wow2mRate = document.getElementById('mem-wow2m-rate');
      const wow1mRate = document.getElementById('mem-wow1m-rate');
      if (bondRate  && p.osrs_bond) bondRate.textContent  = '$' + p.osrs_bond.toFixed(2);
      if (wow2mRate && p.wow_gt)    wow2mRate.textContent = '$' + p.wow_gt.toFixed(2);
      if (wow1mRate && p.wow_ficha) wow1mRate.textContent = '$' + p.wow_ficha.toFixed(2);
      // Recalc totals with active type
      ['bond','wow2m','wow1m'].forEach(t => {
        const el = document.getElementById('mem-'+t);
        if (el && el.style.display !== 'none') calcMem(t);
        else calcMem(t); // update all so they're ready when switched
      });
    }

    function syncInput(slider, inputId) {
      const inp = document.getElementById(inputId);
      if(inp) inp.value = slider.value;
      updateSliderFill(slider);
    }
    function syncSlider(inputId, sliderId, min, max) {
      const inp = document.getElementById(inputId);
      const sl = document.getElementById(sliderId);
      if(!inp || !sl) return;
      let v = Math.min(max, Math.max(min, parseFloat(inp.value)||min));
      sl.value = v; updateSliderFill(sl);
    }
    function updateSliderFill(slider) {
      const min=parseFloat(slider.min), max=parseFloat(slider.max), val=parseFloat(slider.value);
      const pct = ((val-min)/(max-min))*100;
      slider.style.background = `linear-gradient(to right, var(--accent) ${pct}%, var(--border) ${pct}%)`;
    }
    function setVal(inputId, sliderId, val) {
      const inp = document.getElementById(inputId);
      const sl = document.getElementById(sliderId);
      if(inp) inp.value = val;
      if(sl) { sl.value = val; updateSliderFill(sl); }
    }
    document.querySelectorAll('.calc-slider').forEach(s => updateSliderFill(s));

    function selectDelivery(prefix, method) {
      deliveryState[prefix] = method;
      const btns = document.querySelectorAll('[id^="' + prefix + '-del-"]');
      btns.forEach(b => b.classList.remove('active'));
      const active = document.getElementById(prefix + '-del-' + method);
      if(active) active.classList.add('active');
      const show = document.getElementById(prefix + '-del-show');
      if(show) {
        const icon = active ? active.querySelector('.delivery-btn-icon').textContent : '';
        const label = active ? active.querySelector('.delivery-btn-label').textContent : method;
        show.textContent = icon + ' ' + label;
      }
    }

function toggleDrop(id, btn) {
  const drop = document.getElementById(id), isOpen = drop.classList.contains('show');
  closeAll();
  if(!isOpen) { drop.classList.add('show'); btn.classList.add('open'); }
}
function closeAll() {
  document.querySelectorAll('.dropdown').forEach(d=>d.classList.remove('show'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('open'));
}
document.addEventListener('click', e => { if(!e.target.closest('.nav-item')) closeAll(); });

    function toggleMobile() {
      const menu = document.getElementById('mobile-menu');
      const btn = document.getElementById('hamburger-btn');
      const open = menu.classList.toggle('open');
      btn.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    function closeMobile() {
      document.getElementById('mobile-menu').classList.remove('open');
      document.getElementById('hamburger-btn').classList.remove('open');
      document.body.style.overflow = '';
    }

    function showView(id) {
      document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
      document.getElementById('view-'+id).classList.add('active');
      closeAll(); closeMobile(); window.scrollTo(0,0);
    }
    function go(id) { showView(id); }
    function goPS(server) { showView('priv'); selectPS(server); selectPSSell(server); }

    function switchTab(game, tab) {
      // Show/hide buy-sell panels
      ['buy','sell'].forEach(m => {
        const el = document.getElementById(game+'-'+m);
        if(el) el.style.display = m===tab ? 'block' : 'none';
      });
      // Sync active state on ALL inner-tab buttons inside this game view
      const view = document.getElementById('view-'+game);
      if(view) {
        view.querySelectorAll('.inner-tab').forEach(t => {
          const isBuy = t.textContent.includes('Comprar') || t.textContent.includes('Buy');
          t.classList.toggle('active', tab==='buy' ? isBuy : !isBuy);
        });
      }
      // Cambiar tasa: buy = cliente compra (tasa alta), sell = cliente vende (tasa baja)
      setRateMode(tab);
    }

    function calcRS(mode) {
      const qty = parseFloat(document.getElementById('rs-'+mode+'-qty').value)||0;
      // "Buy Gold"  tab = cliente COMPRA → nosotros le VENDEMOS → precio weSell (más caro)
      // "Sell Gold" tab = cliente VENDE  → nosotros le COMPRAMOS → precio weBuy (más barato)
      // PRICES.rs.sell = what client pays us ($0.22) → Buy Gold tab
      // PRICES.rs.buy  = what we pay provider ($0.18) → Sell Gold tab
      const weSell = PRICES.rs.sell || 0.22;
      const weBuy  = PRICES.rs.buy  || 0.18;
      if (mode === 'buy') {
        let disc = '', mult = 1;
        if(qty>=2000){disc='-10%';mult=0.9;} else if(qty>=1000){disc='-5%';mult=0.95;} else if(qty>=500){disc='-3%';mult=0.97;}
        document.getElementById('rs-buy-qty-show').textContent = qty>=1000?(qty/1000).toFixed(2).replace(/\.?0+$/,'')+'B':qty+'M';
        document.getElementById('rs-buy-disc').textContent = disc||'—';
        setConverted('rs-buy-total', qty * weSell * mult);
      } else {
        document.getElementById('rs-sell-qty-show').textContent = qty>=1000?(qty/1000).toFixed(2).replace(/\.?0+$/,'')+'B':qty+'M';
        setConverted('rs-sell-total', qty * weBuy);
      }
    }

    function calcWowSimple(prefix, mode, rate) {
      const qty = parseFloat(document.getElementById(prefix+'-'+mode+'-qty').value)||0;
      if(mode==='buy') {
        let disc='', mult=1;
        if(qty>=500){disc='-8%';mult=0.92;} else if(qty>=100){disc='-4%';mult=0.96;}
        document.getElementById(prefix+'-buy-qty-show').textContent = qty+'K';
        document.getElementById(prefix+'-buy-disc').textContent = disc||'—';
        const wowBuyUsd = qty*rate*mult;
        setConverted(prefix+'-buy-total', wowBuyUsd);
      } else {
        document.getElementById(prefix+'-sell-qty-show').textContent = qty+'K';
        const wowSellUsd = qty*rate;
        setConverted(prefix+'-sell-total', wowSellUsd);
      }
    }

    function selectPS(server) {
      psMode = server;
      // Highlight active button
      document.querySelectorAll('#ps-server-grid .server-btn').forEach(b =>
        b.classList.toggle('active', b.id === 'ps-'+server));
      // Get config
      const cfg = PRICES.rsps[server] || {};
      const unitLabel = cfg.unitRaw ? cfg.unitRaw+' ('+cfg.unitShort+')' : 'B';
      const unitEl = document.getElementById('priv-buy-unit');
      if (unitEl) unitEl.textContent = unitLabel;
      const titleEl = document.getElementById('ps-title');
      const descEl  = document.getElementById('ps-desc');
      if (titleEl) titleEl.textContent = 'RS Private — '+(cfg.name||server);
      if (descEl)  descEl.textContent  = 'Unit: '+(cfg.unitRaw||'1B')+' · Buy';
      calcPriv('buy');
    }
    function selectPSSell(server) {
      psSellMode = server;
      const cfg = PRICES.rsps[server] || {};
      const unitLabel = cfg.unitRaw ? cfg.unitRaw+' ('+cfg.unitShort+')' : 'B';
      const unitEl = document.getElementById('priv-sell-unit');
      if (unitEl) unitEl.textContent = unitLabel;
      calcPriv('sell');
    }
    function calcPriv(mode) {
      // RSPS = solo vendemos → siempre ratesBuy (tasa que damos al cliente comprador)
      const qty    = parseFloat(document.getElementById('priv-'+mode+'-qty').value)||0;
      const server = mode==='buy' ? psMode : psSellMode;
      const dyn = PRICES.rsps[server] || PRICES.rsps[server.toLowerCase()] || {};
      const fall = psConfig[server] || {};
      const rate      = dyn.clientPrice  || fall.buyRate || 0;
      const unitShort = dyn.unitShort    || fall.unitShort || 'B';
      const name      = dyn.name        || fall.name || server;
      const qtyStr    = qty + unitShort;
      const rateStr   = '$'+rate.toFixed(2)+'/'+unitShort;
      const privUsd   = qty*rate;
      if (mode==='buy') {
        const s=document.getElementById('priv-buy-server');    if(s) s.textContent=name;
        const r=document.getElementById('priv-buy-rate');      if(r) r.textContent=rateStr;
        const q=document.getElementById('priv-buy-qty-show');  if(q) q.textContent=qtyStr;
        setConvertedBuy('priv-buy-total', privUsd);
      } else {
        const s=document.getElementById('priv-sell-server');   if(s) s.textContent=name;
        const r=document.getElementById('priv-sell-rate');     if(r) r.textContent=rateStr;
        const q=document.getElementById('priv-sell-qty-show'); if(q) q.textContent=qtyStr;
        setConvertedBuy('priv-sell-total', privUsd);
      }
    }

    // ══════════════════════════════════════════
    // WOW CLASSIC — Server / Faction / Username
    // ══════════════════════════════════════════
    const wowcState = {
      buy:  { server: 'Nightslayer', faction: 'Alliance' },
      sell: { server: 'Nightslayer', faction: 'Alliance' }
    };

    function selectWowcServer(mode, server, btn) {
      wowcState[mode].server = server;
      const prefix = 'wowc-' + mode + '-srv-';
      document.querySelectorAll('[id^="' + prefix + '"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('wowc-' + mode + '-srv-show').textContent =
        wowcState[mode].server + ' · ' + wowcState[mode].faction;
    }

    function selectWowcFaction(mode, faction, btn) {
      wowcState[mode].faction = faction;
      const prefix = 'wowc-' + mode + '-fac-';
      document.querySelectorAll('[id^="' + prefix + '"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('wowc-' + mode + '-srv-show').textContent =
        wowcState[mode].server + ' · ' + wowcState[mode].faction;
    }

    function calcWowClassic(mode) {
      const qty = parseFloat(document.getElementById('wowc-' + mode + '-qty').value) || 0;
      // Price is per 1G — use live prices from sheet
      const pricePerG = mode === 'buy'
        ? (PRICES.wowc?.buy  || 0.60)
        : (PRICES.wowc?.sell || 0.48);
      const usd = qty * pricePerG;
      document.getElementById('wowc-' + mode + '-qty-show').textContent = qty + 'G';
      if (mode === 'buy') {
        setConverted('wowc-buy-total', usd);
      } else {
        setConverted('wowc-sell-total', usd);
      }
    }

    function openWowcOrder(mode) {
      const username = (document.getElementById('wowc-' + mode + '-username')?.value || '').trim();
      const state    = wowcState[mode];
      const qty      = document.getElementById('wowc-' + mode + '-qty')?.value || '0';
      const total    = document.getElementById('wowc-' + mode + '-total')?.textContent || '';
      const action   = mode === 'buy' ? 'BUY' : 'SELL';
      const payment = getSelectedPayment();
      let msg = `Hi! I want to ${action} WoW Classic Gold | Server: ${state.server} | Faction: ${state.faction} | Amount: ${qty}G | Total: ${total}`;
      if (username) msg += ` | Character: ${username}`;
      if (payment)  msg += ` | Payment: ${payment}`;
      msg += `. Can you help me?`;
      openTawkChat(msg);
    }

    // ══════════════════════════════════════════
    // WOW RETAIL — Region / Faction / Username
    // ══════════════════════════════════════════
    const wowrState = {
      buy:  { region: 'US', faction: 'Alliance' },
      sell: { region: 'US', faction: 'Alliance' }
    };

    function selectWowrRegion(mode, region, btn) {
      wowrState[mode].region = region;
      const prefix = 'wowr-' + mode + '-reg-';
      document.querySelectorAll('[id^="' + prefix + '"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('wowr-' + mode + '-cfg-show').textContent =
        wowrState[mode].region + ' · ' + wowrState[mode].faction;
      calcWowRetail(mode);
    }

    function selectWowrFaction(mode, faction, btn) {
      wowrState[mode].faction = faction;
      const prefix = 'wowr-' + mode + '-fac-';
      document.querySelectorAll('[id^="' + prefix + '"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('wowr-' + mode + '-cfg-show').textContent =
        wowrState[mode].region + ' · ' + wowrState[mode].faction;
    }

    function calcWowRetail(mode) {
      const qty = parseFloat(document.getElementById('wowr-' + mode + '-qty').value) || 0;
      const region = wowrState[mode].region;
      // Price is per 100K — use live prices, EU uses wowr_eu if available
      let pricePerUnit;
      if (mode === 'buy') {
        pricePerUnit = region === 'EU'
          ? (PRICES.wowr_eu?.buy  || PRICES.wowr_us?.buy  || 0.82)
          : (PRICES.wowr_us?.buy  || 0.82);
      } else {
        pricePerUnit = region === 'EU'
          ? (PRICES.wowr_eu?.sell || PRICES.wowr_us?.sell || 0.65)
          : (PRICES.wowr_us?.sell || 0.65);
      }
      const usd = qty * pricePerUnit;
      document.getElementById('wowr-' + mode + '-qty-show').textContent = (qty * 100) + 'K';
      if (mode === 'buy') {
        setConverted('wowr-buy-total', usd);
      } else {
        setConverted('wowr-sell-total', usd);
      }
    }

    function openWowrOrder(mode) {
      const server   = (document.getElementById('wowr-' + mode + '-server')?.value   || '').trim();
      const username = (document.getElementById('wowr-' + mode + '-username')?.value || '').trim();
      const state    = wowrState[mode];
      const qty      = document.getElementById('wowr-' + mode + '-qty')?.value || '0';
      const total    = document.getElementById('wowr-' + mode + '-total')?.textContent || '';
      const action   = mode === 'buy' ? 'BUY' : 'SELL';
      const gold     = (parseFloat(qty) * 100) + 'K';
      const payment  = getSelectedPayment();
      let msg = `Hi! I want to ${action} WoW Retail Gold | Region: ${state.region} | Faction: ${state.faction} | Amount: ${gold} | Total: ${total}`;
      if (server)   msg += ` | Server: ${server}`;
      if (username) msg += ` | Character: ${username}`;
      if (payment)  msg += ` | Payment: ${payment}`;
      msg += `. Can you help me?`;
      openTawkChat(msg);
    }

    // ── Shims for old references ──
    function selectSkill() {}
    function calcBoost()   {}

    // ══════════════════════════════════════════
    // BOOST UI
    // ══════════════════════════════════════════
    function switchBoostTab(tab, btn) {
      boostTab = tab; boostFilter = 'All';
      document.querySelectorAll('.bsvc-tab').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      const s = document.getElementById('boost-search');
      if (s) s.value = '';
      buildBoostFilters();
      renderBoostTable();
    }

    function buildBoostFilters() {
      const wrap = document.getElementById('boost-filter-wrap');
      if (!wrap) return;
      const data = BOOST_DATA[boostTab] || [];
      let filters = ['All'];
      if      (boostTab === 'skilling')  filters = ['All', ...new Set(data.map(r => r.name).filter(Boolean))];
      else if (boostTab === 'pvm')       filters = ['All', ...new Set(data.map(r => r.category).filter(Boolean))];
      else if (boostTab === 'diaries')   filters = ['All', 'Easy', 'Medium', 'Hard', 'Elite'];
      else if (boostTab === 'minigames') filters = ['All', ...new Set(data.map(r => r.minigame).filter(Boolean))];
      else if (boostTab === 'ca')        filters = ['All', ...new Set(data.map(r => r.tier).filter(Boolean))];
      wrap.innerHTML = filters.map(f =>
        `<button class="bsvc-filter${f===boostFilter?' active':''}" onclick="setBoostFilter(this,'${f.replace(/'/g,"\\'")}')">${f}</button>`
      ).join('');
    }

    function setBoostFilter(btn, f) {
      boostFilter = f;
      document.querySelectorAll('.bsvc-filter').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderBoostTable();
    }

    function boostSort(col) {
      if (boostSortCol === col) boostSortDir *= -1;
      else { boostSortCol = col; boostSortDir = 1; }
      document.querySelectorAll('.sort-arrow').forEach(el => el.textContent = '↕');
      const el = document.getElementById('sarr-' + col);
      if (el) el.textContent = boostSortDir === 1 ? '↑' : '↓';
      renderBoostTable();
    }

    function renderBoostTable() {
      const body = document.getElementById('boost-table-body');
      const col3h = document.getElementById('boost-col3-header');
      if (!body) return;
      const q = (document.getElementById('boost-search')?.value || '').toLowerCase();
      let data = (BOOST_DATA[boostTab] || []).filter(r => {
        const text = Object.values(r).join(' ').toLowerCase();
        if (q && !text.includes(q)) return false;
        if (boostFilter === 'All') return true;
        if (boostTab === 'skilling')   return r.name === boostFilter;
        if (boostTab === 'pvm')        return r.category === boostFilter;
        if (boostTab === 'diaries')    return r.difficulty === boostFilter;
        if (boostTab === 'minigames')  return r.minigame === boostFilter;
        if (boostTab === 'ca')         return r.tier === boostFilter;
        return true;
      });

      data = [...data].sort((a, b) => {
        const av = boostSortCol === 'price' ? a.price : (a.name || '').toLowerCase();
        const bv = boostSortCol === 'price' ? b.price : (b.name || '').toLowerCase();
        return av > bv ? boostSortDir : av < bv ? -boostSortDir : 0;
      });

      const col3labels = { skilling:'Level Range', questing:'—', diaries:'Difficulty', pvm:'Category', minigames:'Minigame', ca:'Tier' };
      if (col3h) col3h.textContent = col3labels[boostTab] || 'Details';

      if (!data.length) {
        const isEmpty = (BOOST_DATA[boostTab] || []).length === 0;
        body.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted);">${isEmpty ? 'Loading prices from sheet...' : 'No results found'}</td></tr>`;
        return;
      }

      body.innerHTML = data.map((r, i) => {
        const key     = boostTab + '_' + i + '_' + r.name.replace(/[^a-z0-9]/gi,'');
        const checked = boostSelected[key] ? 'checked' : '';
        const rowSel  = boostSelected[key] ? 'row-selected' : '';
        const label   = (r.name + (r.method ? ' — ' + r.method : '')).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        const priceFmt = r.price >= 0.001 ? `$${r.price.toFixed(2)}` : `$${r.price.toFixed(6)}/XP`;

        let col3 = '';
        if (boostTab === 'skilling')   col3 = `<span class="bsvc-detail">Lv ${r.from}–${r.to}</span>`;
        else if (boostTab === 'pvm')   col3 = `<span class="bsvc-detail">${r.category||''}<br><span style="color:var(--dim);font-size:10px">${r.method||''}</span></span>`;
        else if (boostTab === 'diaries') col3 = `<span class="bsvc-badge bsvc-badge-diary">${r.difficulty||''}</span>`;
        else if (boostTab === 'minigames') col3 = `<span class="bsvc-detail">${r.minigame||''}</span>`;
        else if (boostTab === 'ca')    col3 = `<span class="bsvc-detail" style="font-size:11px">${r.tier||''}</span>`;

        const method = r.method ? `<div class="bsvc-method">${r.method}</div>` : '';

        return `<tr class="${rowSel}" onclick="toggleBoostRow(event,'${key}',${r.price},'${label}')">
          <td><input type="checkbox" class="bsvc-cb" ${checked} onclick="event.stopPropagation();toggleBoostRow(event,'${key}',${r.price},'${label}')" /></td>
          <td><div class="bsvc-name">${r.name}</div>${method}</td>
          <td><span class="bsvc-price">${priceFmt}</span></td>
          <td>${col3}</td>
          <td><span class="bsvc-note">${r.note||''}</span></td>
        </tr>`;
      }).join('');
    }

    function toggleBoostRow(e, key, price, label) {
      if (boostSelected[key]) delete boostSelected[key];
      else boostSelected[key] = { price, label };
      updateBoostFooter();
      renderBoostTable();
    }

    function updateBoostFooter() {
      const keys = Object.keys(boostSelected);
      const total = keys.reduce((s, k) => s + boostSelected[k].price, 0);
      const c = document.getElementById('boost-selected-count');
      const t = document.getElementById('boost-total-display');
      if (c) c.textContent = `${keys.length} service${keys.length !== 1 ? 's' : ''} selected`;
      if (t) setConvertedBuy('boost-total-display', total);
    }

    function clearBoostSelection() {
      Object.keys(boostSelected).forEach(k => delete boostSelected[k]);
      updateBoostFooter();
      renderBoostTable();
    }

    // ══════════════════════════════════════════
    // ORDEN → CHAT EN VIVO (Tawk.to)
    // ══════════════════════════════════════════
    function openModal(customMsg) {
      let msg = customMsg || buildOrderMessage();
      openTawkChat(msg);
    }

    function getSelectedPayment() {
      // Get selected payment from active calc card custom dropdown
      const activeCard = document.querySelector('.view.active .calc-card');
      if (!activeCard) return '';
      const btn = activeCard.querySelector('.pay-drop-btn');
      return btn ? btn.querySelector('.pay-drop-text')?.textContent?.trim() || '' : '';
    }

    function togglePayDrop(btn) {
      const wrap = btn.closest('.pay-drop-wrap');
      const menu = wrap.querySelector('.pay-drop-menu');
      const isOpen = menu.classList.contains('open');
      // Close all other open dropdowns first
      document.querySelectorAll('.pay-drop-menu.open').forEach(m => {
        m.classList.remove('open');
        m.previousElementSibling?.classList.remove('open');
      });
      if (!isOpen) {
        menu.classList.add('open');
        btn.classList.add('open');
      }
    }

    function selectPayment(item, label, imgUrl) {
      const wrap = item.closest('.pay-drop-wrap');
      const btn  = wrap.querySelector('.pay-drop-btn');
      const menu = wrap.querySelector('.pay-drop-menu');
      // Update button display
      btn.querySelector('.pay-drop-icon').src = imgUrl;
      btn.querySelector('.pay-drop-text').textContent = label;
      // Mark active
      menu.querySelectorAll('.pay-drop-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      // Close
      menu.classList.remove('open');
      btn.classList.remove('open');
    }

    // Close dropdowns on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.pay-drop-wrap')) {
        document.querySelectorAll('.pay-drop-menu.open').forEach(m => {
          m.classList.remove('open');
          m.previousElementSibling?.classList.remove('open');
        });
      }
    });

    function buildOrderMessage() {
      const activeInnerTab = document.querySelector('.inner-tab.active');
      const isBuy = activeInnerTab ? (activeInnerTab.textContent.includes('Buy') || activeInnerTab.textContent.includes('Comprar')) : true;
      const mode  = isBuy ? 'BUY' : 'SELL';
      const modeKey = isBuy ? 'buy' : 'sell';

      // Detect active game view
      const activeView = document.querySelector('.view.active');
      const viewId = activeView ? activeView.id : '';
      let game = 'RuneScape';
      if (viewId.includes('wow-classic')) game = 'WoW Classic';
      else if (viewId.includes('wow-retail')) game = 'WoW Retail';
      else if (viewId.includes('rs')) game = 'OSRS/RS3';

      // Amount and total
      let qty = '', total = '';
      const qtyEl   = document.querySelector('#rs-' + modeKey + '-qty-show, #wowc-' + modeKey + '-qty-show, #wowr-' + modeKey + '-qty-show');
      const totalEl = document.querySelector('#rs-' + modeKey + '-total, #wowc-' + modeKey + '-total, #wowr-' + modeKey + '-total');
      if (qtyEl) qty = qtyEl.textContent;
      if (totalEl) total = totalEl.textContent;

      // RSN (RuneScape Name)
      const rsn = (document.getElementById('rs-' + modeKey + '-username')?.value || '').trim();

      const payment = getSelectedPayment();
      let msg = `Hi! I want to ${mode} Gold from ${game}`;
      if (qty)     msg += ` | Amount: ${qty}`;
      if (total)   msg += ` | Total: ${total}`;
      if (rsn)     msg += ` | RSN: ${rsn}`;
      if (payment) msg += ` | Payment: ${payment}`;
      msg += `. Can you help me?`;
      return msg;
    }

    function openChatForAccount(title, price, type) {
      const priceStr = price > 0 ? '$' + parseFloat(price).toFixed(2) : 'precio a consultar';
      const msg = `Hi! I'm interested in buying the account: "${title}" (${type.toUpperCase()}) - ${priceStr}. Is it available?`;
      openTawkChat(msg);
    }

    function openChatForService(serviceName) {
      const msg = `Hi! I'm interested in the service: "${serviceName}". Can you give me more information?`;
      openTawkChat(msg);
    }

    function openChatForMembership(plan) {
      const msg = `Hi! I want to adquirir una membresía: "${plan}". How do I proceed?`;
      openTawkChat(msg);
    }

    function openTawkChat(msg) {
      // Guardar el mensaje para mostrarlo
      window._pendingOrderMsg = msg;

      // Intentar setear atributos del visitante para que tú los veas en tu panel
      function setTawkAttrs() {
        if (window.Tawk_API && window.Tawk_API.setAttributes) {
          window.Tawk_API.setAttributes({
            'Pedido': msg,
            'name': (window._currentUser && window._currentUser.email) ? window._currentUser.email.split('@')[0] : 'Cliente'
          }, function(){});
        }
      }

      if (window.Tawk_API && window.Tawk_API.maximize) {
        setTawkAttrs();
        window.Tawk_API.maximize();
        showOrderToast(msg);
      } else {
        // Tawk no cargó aún, esperar
        showOrderToast(msg);
        let tries = 0;
        const wait = setInterval(() => {
          tries++;
          if (window.Tawk_API && window.Tawk_API.maximize) {
            clearInterval(wait);
            setTawkAttrs();
            window.Tawk_API.maximize();
          }
          if (tries > 20) clearInterval(wait);
        }, 300);
      }
    }

    function showOrderToast(msg) {
      const existing = document.getElementById('order-toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.id = 'order-toast';
      toast.style.cssText = `
        position:fixed;bottom:100px;right:20px;z-index:99999;
        background:#0d0d18;border:1px solid #4db8ff;
        border-radius:12px;padding:16px 20px;max-width:340px;
        box-shadow:0 8px 32px rgba(0,0,0,.8);font-family:'DM Sans',sans-serif;
        animation:slideUp .3s ease;
      `;
      toast.innerHTML = `
        <button onclick="this.parentElement.remove()" style="position:absolute;top:8px;right:10px;background:none;border:none;color:#7a7890;cursor:pointer;font-size:18px;line-height:1;">×</button>
        <div style="font-size:11px;color:#4db8ff;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">✅ Order registered</div>
        <div style="font-size:12px;color:#c0bdd0;line-height:1.6;margin-bottom:10px;">${msg}</div>
        <div style="font-size:11px;color:#4acc88;">💬 Chat opened — tell our agent about your order and we'll assist you right away.</div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => { if (toast.parentElement) toast.remove(); }, 7000);
    }

    function closeModal(e) {
      if(e && e.currentTarget !== e.target) return;
      const modal = document.getElementById('order-modal');
      if (modal) { modal.style.display='none'; document.body.style.overflow=''; }
    }
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') { closeModal(); closeMobile(); } });

    // ── GOOGLE REVIEWS CAROUSEL (Live) ──
    (function() {
      const track = document.getElementById('greview-track');
      const dotsContainer = document.getElementById('greview-dots');
      const scoreNum = document.getElementById('greview-score-num');
      const scoreTotal = document.getElementById('greview-score-total');
      if (!track) return;

      let current = 0;
      let total = 0;
      let autoTimer;

      const COLORS = ['#00897b','#1565c0','#6a1b9a','#c62828','#2e7d32','#e65100','#0277bd','#4527a0','#558b2f','#f57f17'];

      function getVisible() {
        const w = track.parentElement.offsetWidth;
        if (w < 769) return 1;
        if (w < 1100) return 2;
        return 3;
      }

      function buildDots() {
        dotsContainer.innerHTML = '';
        const vis = getVisible();
        const pages = Math.ceil(total / vis);
        for (let i = 0; i < pages; i++) {
          const d = document.createElement('div');
          d.className = 'greview-dot' + (i === 0 ? ' active' : '');
          d.onclick = () => { resetAuto(); goTo(i * vis); };
          dotsContainer.appendChild(d);
        }
      }

      function updateDots() {
        const vis = getVisible();
        const page = Math.floor(current / vis);
        dotsContainer.querySelectorAll('.greview-dot').forEach((d, i) => {
          d.classList.toggle('active', i === page);
        });
      }

      function goTo(idx) {
        if (total === 0) return;
        const vis = getVisible();
        const maxIdx = Math.max(0, total - vis);
        current = Math.max(0, Math.min(idx, maxIdx));
        const cardW = track.querySelector('.greview-card') 
          ? track.querySelector('.greview-card').offsetWidth + 14 : 0;
        track.style.transform = `translateX(-${current * cardW}px)`;
        updateDots();
      }

      window.moveReviews = function(dir) {
        resetAuto();
        const vis = getVisible();
        const next = current + dir * vis;
        const maxIdx = total - vis;
        if (next > maxIdx) goTo(0);
        else if (next < 0) goTo(maxIdx);
        else goTo(next);
      };

      function autoAdvance() {
        const vis = getVisible();
        const next = current + vis;
        goTo(next > total - vis ? 0 : next);
      }

      function resetAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(autoAdvance, 5000);
      }

      function starsHTML(n) {
        return '★'.repeat(n) + '☆'.repeat(5 - n);
      }

      function renderReviews(reviews) {
        // Shuffle
        for (let i = reviews.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [reviews[i], reviews[j]] = [reviews[j], reviews[i]];
        }
        track.innerHTML = '';
        total = reviews.length;

        reviews.forEach((r, idx) => {
          const title = r.text.length > 40 ? r.text.substring(0, 40) + '...' : r.text;
          const body = r.text.length > 120 ? r.text.substring(0, 120) + '...' : r.text;
          const color = COLORS[idx % COLORS.length];
          const avatarContent = r.avatar
            ? `<img src="${r.avatar}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;" />`
            : `<div class="greview-avatar" style="background:${color};">${r.initials}</div>`;

          const card = document.createElement('div');
          card.className = 'greview-card';
          card.style.cursor = 'pointer';
          card.onclick = () => window.open('https://g.page/r/CXVQJSelnVqlEAE/review', '_blank');
          card.innerHTML = `
            <div class="greview-card-top">
              <div class="greview-stars" style="color:#00b67a;">${starsHTML(r.rating)}</div>
              <span class="greview-date">${r.time}</span>
            </div>
            <div class="greview-title">${title}</div>
            <div class="greview-body">${body}</div>
            <div class="greview-user">
              ${avatarContent}
              <div>
                <div class="greview-name">${r.author}</div>
                <div class="greview-verified">✔ Verified purchase</div>
              </div>
            </div>`;
          track.appendChild(card);
        });

        buildDots();
        goTo(0);
        resetAuto();
      }

      function showFallback() {
        // Keep existing static cards if API fails
        total = track.querySelectorAll('.greview-card').length;
        buildDots();
        goTo(0);
        resetAuto();
      }

      // Fetch from Netlify function
      fetch('/.netlify/functions/reviews')
        .then(r => r.json())
        .then(data => {
          if (data.reviews && data.reviews.length > 0) {
            if (scoreNum) scoreNum.textContent = data.rating ? data.rating.toFixed(1) : '5.0';
            if (scoreTotal) scoreTotal.textContent = data.total ? `· ${data.total}+ reseñas` : '';
            renderReviews(data.reviews);
          } else {
            showFallback();
          }
        })
        .catch(() => showFallback());

      window.addEventListener('resize', () => { buildDots(); goTo(current); });
    })();


    // ── LEGAL MODAL ──
    function openLegal(section) {
      document.getElementById('legal-modal').style.display = 'block';
      document.body.style.overflow = 'hidden';
      switchLegalTab(section, null);
    }
    function closeLegal(e) {
      if (e && e.target !== document.querySelector('#legal-modal .legal-overlay')) return;
      document.getElementById('legal-modal').style.display = 'none';
      document.body.style.overflow = '';
    }
    function switchLegalTab(section, btn) {
      // Hide all sections
      document.querySelectorAll('.legal-section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.legal-tab').forEach(t => t.classList.remove('active'));
      // Show selected
      const sec = document.getElementById('legal-' + section);
      if (sec) sec.classList.add('active');
      // Activate tab button
      if (btn) {
        btn.classList.add('active');
      } else {
        document.querySelectorAll('.legal-tab').forEach(t => {
          if (t.getAttribute('onclick') && t.getAttribute('onclick').includes("'" + section + "'")) {
            t.classList.add('active');
          }
        });
      }
      // Update modal title
      const titles = {
        tos: 'Terms of Service — OSRS / RSPS',
        accounts: 'Account Policy',
        boosting: 'Boosting Rules',
        privacy: 'Privacy Policy',
        refunds: 'Refund Policy'
      };
      const titleEl = document.getElementById('legal-modal-title');
      if (titleEl) titleEl.textContent = titles[section] || 'Legal';
    }
    document.addEventListener('keydown', e => { if(e.key === 'Escape') { closeLegal(); } });


    // ── CURRENCY & LANGUAGE ──
    let currentCurrency = { code: 'USD', symbol: '$', rate: 1 };
    let currentLang = 'en';

    // ── TASAS DE CAMBIO ──
    // ratesBuy  = cliente COMPRA  → tasa alta  (spread + del bot)
    // ratesSell = cliente VENDE   → tasa baja  (spread - del bot)
    const ratesBuy  = { USD:1, EUR:0.92, GBP:0.79, CAD:1.36, ARS:880, VES:40, COP:3900 };
    const ratesSell = { USD:1, EUR:0.92, GBP:0.79, CAD:1.36, ARS:880, VES:40, COP:3900 };
    let   rateMode  = 'buy'; // cambia al hacer click en tab Buy/Sell
    const rates     = { ...ratesBuy }; // objeto activo usado por toda la web

    // Llama esto cuando el usuario cambia entre tab Comprar / Vender
    function setRateMode(mode) {
      rateMode = mode;
      const src = mode === 'sell' ? ratesSell : ratesBuy;
      Object.assign(rates, src);
      if (currentCurrency.code !== 'USD') {
        currentCurrency.rate = rates[currentCurrency.code] || 1;
        updateAllPrices();
      }
    }

    async function loadLiveRates() {
      let botOk = false;

      // ── FUENTE 1: pestaña TASAS_WEB escrita por el bot cada 10 min ──
      try {
        const r   = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vS0F73I1g1jLRRNsLs4jsny_Kg58A3l15pGA0iSENCkBKfU1Te3mhg1-vAKw4fYpL_hZ4G1XSXkJeOj/pub?gid=314158463&single=true&output=csv');
        const txt = await r.text();
        const rows = txt.trim().split('\n').slice(1); // omitir fila header

        // Parse CSV respetando comillas — Google exporta con comillas cuando hay comas en números
        // Ej: "VES","659,99","622,63","2026-04-16 02:43:05"
        function parseCSVRow(row) {
          const cols = [];
          let cur = '', inQ = false;
          for (let i = 0; i < row.length; i++) {
            if (row[i] === '"') { inQ = !inQ; continue; }
            if (row[i] === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
            cur += row[i];
          }
          cols.push(cur.trim());
          return cols;
        }

        // Convierte número con posible coma decimal (1536,6661 → 1536.6661)
        function parseNum(s) {
          if (!s) return NaN;
          // Si tiene punto Y coma: formato europeo miles "1.536,66" → quitar punto, coma→punto
          if (s.includes('.') && s.includes(',')) s = s.replace(/\./g,'').replace(',','.');
          // Si solo tiene coma: decimal europeo "659,99" → "659.99"
          else if (s.includes(',')) s = s.replace(',','.');
          return parseFloat(s);
        }

        let n = 0, ts = '';
        rows.forEach(row => {
          if (!row.trim()) return; // skip empty rows
          const c = parseCSVRow(row);
          const code = c[0];
          const buy  = parseNum(c[1]);
          const sell = parseNum(c[2]);
          if (!code || isNaN(buy) || buy <= 0) return;
          ratesBuy[code]  = buy;
          ratesSell[code] = (!isNaN(sell) && sell > 0) ? sell : buy;
          rates[code]     = rateMode === 'sell' ? ratesSell[code] : ratesBuy[code];
          ts = c[3] || ts; n++;
        });
        if (n > 0) {
          botOk = true;
          console.log(`[Rates] ✅ ${n} monedas del bot (${ts})`);
          _ratesBadge('● BOT LIVE', `Bot rates · ${ts}`);
        }
      } catch(e) { console.warn('[Rates] Sheet del bot falló:', e.message); }

      // ── FUENTE 2: fallback open.er-api para EUR/GBP/CAD/MXN/BRL ──
      if (!botOk) {
        try {
          const r = await fetch('https://open.er-api.com/v6/latest/USD');
          const d = await r.json();
          if (d?.rates) {
            ['EUR','GBP','CAD'].forEach(c => {
              if (d.rates[c]) ratesBuy[c] = ratesSell[c] = rates[c] = d.rates[c];
            });
            _ratesBadge('● LIVE', 'open.er-api fallback');
          }
        } catch(e2) { _ratesBadge('● OFFLINE', 'Approximate rates'); }
      }

      if (currentCurrency.code !== 'USD') {
        currentCurrency.rate = rates[currentCurrency.code] || 1;
        updateAllPrices();
      }
    }

    function _ratesBadge(label, tip) {
      const el = document.querySelector('#currency-panel .nav-panel-title');
      if (!el) return;
      const col = label.includes('BOT') ? 'var(--accent)' : label.includes('OFFLINE') ? '#f87' : 'var(--accent)';
      el.innerHTML = `Currency <span style="color:${col};font-size:9px;letter-spacing:.5px;" title="${tip}">${label}</span>`;
    }

    document.addEventListener('DOMContentLoaded', loadLiveRates);
    if (document.readyState !== 'loading') loadLiveRates();

    // Auto-refresh tasas cada 10 min — sin necesidad de recargar la página
    setInterval(async () => {
      console.log('[Rates] Auto-refreshing rates...');
      await loadLiveRates();
      if (currentCurrency.code !== 'USD') {
        currentCurrency.rate = rates[currentCurrency.code] || 1;
      }
      updateAllPrices();
    }, 10 * 60 * 1000);

    // English only — translations locked to EN
    const translations = {
      en: {
        login: 'Login', register: 'Sign Up',
        welcome_back: 'Welcome back!',
        login_sub: 'Access your account to view your orders.',
        create_account: 'Create an account',
        register_sub: 'Join VeikenGold and start buying safely.',
        email: 'Email', password: 'Password', username: 'Username',
        login_btn: 'Login', register_btn: 'Create Account',
        or: 'or continue with', discord_login: 'Continue with Discord',
        discord_register: 'Sign up with Discord',
        nav_coins: 'Currency', nav_mem: 'Memberships', nav_svc: 'Boosting', nav_accounts: 'Accounts',
        dd_gold_oficial: 'Official Gold', dd_subs: 'Subscriptions & Bonds',
        dd_rs_svc: 'RS Services', dd_game_accounts: 'Game Accounts',
        dd_rs_sub: 'RS3 · OSRS', dd_wow_classic_sub: 'Era · SoD · Hardcore',
        dd_wow_retail_sub: 'The War Within', dd_ps_rs: 'RS Private Servers',
        dd_ps_list: 'Impact · RoatPkz · Orion · SpawnPK',
        dd_pick_server: 'Choose your server',
        dd_bond_sub: '14 days · from $8.00', dd_wow_sub_sub: '30 days · from $12.00',
        dd_calc: 'Services Calculator', dd_calc_sub: 'Skilling · PvM · Minigames · +more',
        dd_osrs_sub: 'Pures · Mains · Skillers · +more',
        mob_ps: 'RS Private Servers', mob_mem_svc: 'Memberships & Services',
        mob_coins: 'Coins', mob_accounts: 'Accounts',
        hero_h1: 'The most trusted<br>marketplace for <em>Gaming Gold</em>',
        hero_p: 'Gold, memberships and boosting for RuneScape and World of Warcraft. Fast delivery, secure transactions.',
        badge_delivery: '⚡ Delivery <10 min', badge_secure: '🔒 Secure payment', badge_reviews: '⭐ 4.9 / 5 reviews',
        games_title: 'Available Games',
        pill_coins: '💰 Coins', pill_accounts: '👤 Accounts', pill_boosting: '⚡ Boosting', pill_mem: '🎫 Memberships',
        tab_buy: '🛒 Buy Gold', tab_sell: '💰 Sell Gold',
        back_btn: '← Back',
        rs_desc: 'Buy and sell gold · RS3 & OSRS',
        rs_buy_title: '🛒 How much gold do you want to buy?',
        rs_sell_title: '💰 How much gold do you want to sell?',
        gold_qty: 'Gold Amount', delivery_method: 'Delivery method',
        del_trade_desc: 'GE or agreed world', del_wild_desc: 'Drop in PvP zone', del_tip_desc: 'Via clan/dungeon',
        del_mail_desc: 'In-game mail', del_trade2_desc: 'Direct trade', del_guild_desc: 'Guild bank',
        price_per_m: 'Price per million', quantity_lbl: 'Amount', discount_lbl: 'Discount',
        delivery_via: 'Delivery via', total_pay: 'Total to pay',
        order_btn: 'Place Order →', sell_btn: 'Sell Now →',
        note_delivery: '⚡ Delivery in less than 10 minutes · Secure payment',
        price_we_pay: 'Price we pay per million', you_receive: "You'll receive",
        note_sell: '💸 Immediate payment · Crypto',
        wowc_desc: 'Buy and sell gold · Era · SoD · Hardcore',
        wowc_buy_title: '🏰 How much WoW Classic gold do you want to buy?',
        wowc_sell_title: '🏰 How much WoW Classic gold do you want to sell?',
        wowr_desc: 'Buy and sell gold · The War Within',
        wowr_buy_title: '🌍 How much WoW Retail gold do you want to buy?',
        wowr_sell_title: '🌍 How much WoW Retail gold do you want to sell?',
        ps_buy_title: '🛒 How much gold do you want to buy?',
        mem_desc: 'RS Bond · WoW Subscription',
        boost_desc: 'Select the service and calculate your budget instantly',
        boost_select: 'Select a skill above', boost_title: '⚡ Skilling Quote',
        level_from: 'Current Level', level_to: 'Desired Level',
        skill_lbl: 'Skill', levels_up: 'Levels to gain', price_per_lvl: 'Price per level',
        total_est: 'Estimated total', select_skill_btn: 'Select a skill',
        note_boost: 'Estimated time by skill · Secure account guaranteed',
        osrs_desc: 'Verified accounts · Secure delivery · Warranty included',
        filter_all: 'All', filter_pures: 'Pures', filter_mains: 'Mains',
        filter_skillers: 'Skillers', filter_zerkers: 'Zerkers', filter_ironman: 'Ironman',
        custom_acc: 'Looking for an account with specific stats?',
        we_get_it: "and we'll get it.",
        reputation: 'Our Reputation — Verify our references',
        pay_methods: 'Accepted payment methods',
        footer_desc: 'Your trusted marketplace!',
        footer_services: 'Services', footer_legal: 'Legal', footer_contact: 'Contact',
        footer_tos: 'Terms of Service', footer_privacy: 'Privacy Policy',
        footer_accounts_pol: 'Account Policy', footer_refunds: 'Refund Policy',
        footer_boosting: 'Boosting Rules',
        contact_title: 'Have a question? Contact us',
        contact_sub: 'Our team is available 24/7. Immediate response guaranteed.',
        contact_discord_btn: 'Contact via Discord',
        copyright: '© 2026 VeikenGold. All rights reserved.',
        footer_tagline: 'Fast delivery · Secure payment · 24/7 Support',
        currency_lbl: 'Currency', lang_lbl: 'Language',
        marketplace: 'The most trusted', confiable: 'marketplace for', game_gold: 'game gold',
        delivery: 'Delivery <10 min', secure: 'Secure payment', reviews: '4.9 / 5 reviews',
        contact_discord: 'Contact us on Discord',
        accounts: 'Account Policy',
      }
    };


    function t(key) {
      return translations.en[key] || key;
    }

    function applyTranslations() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = t(key);
        if (el.tagName === 'INPUT') el.placeholder = val;
        else if (el.hasAttribute('data-i18n-html')) el.innerHTML = val;
        else {
          // If element contains child elements (e.g. SVG icons), only update the text node
          // to avoid destroying child elements like the dropdown arrow SVG
          const hasChildElements = el.children.length > 0;
          if (hasChildElements) {
            // Find and update only the first text node, preserving child elements
            for (const node of el.childNodes) {
              if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                node.textContent = val + ' ';
                break;
              }
            }
          } else {
            el.textContent = val;
          }
        }
      });
      const loginTab = document.getElementById('auth-tab-login');
      const regTab = document.getElementById('auth-tab-register');
      if (loginTab) loginTab.textContent = t('login');
      if (regTab) regTab.textContent = t('register');
      const loginBtn = document.querySelector('.nav-login span');
      const regBtn = document.querySelector('.nav-register span');
      if (loginBtn) loginBtn.textContent = t('login');
      if (regBtn) regBtn.textContent = t('register');
    }

    function setLang(lang) { applyTranslations(); }


    // Called by onclick="selectCurrency(this)" on each currency button
    function selectCurrency(btn) {
      const code   = btn.dataset.code;
      const symbol = btn.dataset.symbol;
      currentCurrency = { code, symbol, rate: rates[code] || 1 };
      // Copy flag image into nav button
      const img = btn.querySelector('img');
      document.getElementById('currency-flag').innerHTML = img ? img.outerHTML : '';
      document.getElementById('currency-code').textContent = code;
      // Mark active button
      document.querySelectorAll('#currency-panel .nav-panel-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateAllPrices();
      closeAllPanels();
    }

    // Legacy alias in case anything else calls setCurrency(code)
    function setCurrency(code) {
      const btn = document.querySelector('#currency-panel .nav-panel-item[data-code="' + code + '"]');
      if (btn) selectCurrency(btn);
    }

    // Inserts converted price line below any total element
    function _fmt(n) {
      return n >= 1000 ? Math.round(n).toLocaleString('en-US') : n.toFixed(2);
    }

    // setConverted     → respects current tab rate (buy or sell)
    // setConvertedBuy  → always uses ratesBuy (for services we only sell: RSPS, Mem, Boosting)
    function setConvertedBuy(elId, usdAmount) {
      const el = document.getElementById(elId);
      if (!el) return;
      const prevSub = document.getElementById(elId + '-sub');
      if (prevSub) prevSub.remove();
      const { code, symbol: sym } = currentCurrency;
      const rate = ratesBuy[code] || 1;
      if (code === 'USD' || rate === 1) {
        el.textContent = '$' + _fmt(usdAmount);
        return;
      }
      el.textContent = sym + _fmt(usdAmount * rate);
      const sub = document.createElement('div');
      sub.id = elId + '-sub';
      sub.className = 'price-usd-sub';
      sub.textContent = '≈ $' + _fmt(usdAmount) + ' USD';
      el.parentElement.insertAdjacentElement('afterend', sub);
    }

    function setConverted(elId, usdAmount) {
      const el = document.getElementById(elId);
      if (!el) return;
      // Remove old sub label
      const prevSub = document.getElementById(elId + '-sub');
      if (prevSub) prevSub.remove();
      const { code, symbol: sym, rate } = currentCurrency;
      if (code === 'USD' || !rate || rate === 1) {
        // USD: show plain dollar amount in the element
        el.textContent = '$' + _fmt(usdAmount);
        return;
      }
      // Non-USD: show converted big, USD small below
      el.textContent = sym + _fmt(usdAmount * rate);
      const sub = document.createElement('div');
      sub.id = elId + '-sub';
      sub.className = 'price-usd-sub';
      sub.textContent = '≈ $' + _fmt(usdAmount) + ' USD';
      el.parentElement.insertAdjacentElement('afterend', sub);
    }

    function convertPrice(usdPrice) {
      const { code, symbol: sym, rate } = currentCurrency;
      if (code === 'USD') return '';
      const converted = usdPrice * rate;
      // Format based on magnitude
      let formatted;
      if (converted >= 100000)      formatted = Math.round(converted).toLocaleString('en-US');
      else if (converted >= 1000)   formatted = Math.round(converted).toLocaleString('en-US');
      else if (converted >= 10)     formatted = converted.toFixed(2);
      else                          formatted = converted.toFixed(2);
      return `<span class="price-converted">≈ ${sym}${formatted} ${code}</span>`;
    }

    function updateAllPrices() {
      // ── Gold calculators ──
      try { calcRS('buy'); calcRS('sell'); } catch(e) {}
      try { calcWowClassic('buy'); calcWowClassic('sell'); } catch(e) {}
      try { calcWowRetail('buy');  calcWowRetail('sell');  } catch(e) {}
      try { calcPriv('buy'); calcPriv('sell'); } catch(e) {}
      // ── Memberships ──
      try { ['bond','wow2m','wow1m'].forEach(t => calcMem(t)); } catch(e) {}
      // ── Boosting ──
      try { updateBoostFooter(); } catch(e) {}
      // ── Accounts — re-render cards with new currency ──
      try { renderAccountGrid(); } catch(e) {}
    }

    // Override result display to show currency conversion
    
    

    function togglePanel(id, btn) {
      const panel = document.getElementById(id);
      const isOpen = panel.classList.contains('show');
      closeAllPanels();
      if (!isOpen) panel.classList.add('show');
    }
    function closeAllPanels() {
      document.querySelectorAll('.nav-panel').forEach(p => p.classList.remove('show'));
    }
    document.addEventListener('click', e => {
      if (!e.target.closest('.nav-tool')) closeAllPanels();
    });

    // ── AUTH MODAL ──
    // ══════════════════════════════════════════
    // FIREBASE AUTH — Registro e inicio de sesión
    // ══════════════════════════════════════════
    const FB_CONFIG = {
      apiKey: "AIzaSyCEipnzMpimKSz2rY-3yyBMjxGJn-_Xnvc",
      authDomain: "veikengold-ae654.firebaseapp.com",
      projectId: "veikengold-ae654",
      storageBucket: "veikengold-ae654.firebasestorage.app",
      messagingSenderId: "630867963145",
      appId: "1:630867963145:web:1ee6d3219fe8d22897f7d8"
    };

    const AVATARS = [
      "https://s13.gifyu.com/images/bqu8F.png",
      "https://s13.gifyu.com/images/bqu8U.png"
    ];

    let _fbAuth = null;
    let _fbStore = null;
    let _currentUser = null;

    async function getFirebaseAuth() {
      if (_fbAuth) return _fbAuth;
      const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
      const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
      const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      const app = getApps().length ? getApps()[0] : initializeApp(FB_CONFIG);
      _fbAuth  = getAuth(app);
      _fbStore = getFirestore(app);
      _fbAuth.onAuthStateChanged(user => {
        _currentUser = user;
        updateNavUI(user);
      });
      return _fbAuth;
    }

    function updateNavUI(user) {
      const guest = document.getElementById('nav-auth-guest');
      const loggedIn = document.getElementById('nav-auth-user');
      if (!guest || !loggedIn) return;
      if (user) {
        guest.style.display = 'none';
        loggedIn.style.display = 'flex';
        const avatar = localStorage.getItem('vg_avatar_' + user.uid) || AVATARS[0];
        const username = localStorage.getItem('vg_username_' + user.uid) || user.email.split('@')[0];
        document.getElementById('nav-avatar').src = avatar;
        document.getElementById('nav-username').textContent = username;
      } else {
        guest.style.display = 'flex';
        loggedIn.style.display = 'none';
      }
    }

    async function doRegister() {
      const username = document.getElementById('reg-username').value.trim();
      const email    = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const errEl    = document.getElementById('register-err');
      const okEl     = document.getElementById('register-ok');
      const btn      = document.getElementById('register-btn');
      errEl.style.display = 'none';
      okEl.style.display  = 'none';

      if (!username) { errEl.textContent = 'Please enter a username.'; errEl.style.display = 'block'; return; }
      if (!email)    { errEl.textContent = 'Please enter your email.'; errEl.style.display = 'block'; return; }
      if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = 'block'; return; }

      btn.disabled = true; btn.textContent = 'Creating account...';
      try {
        const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        const auth = await getFirebaseAuth();
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
        localStorage.setItem('vg_avatar_' + cred.user.uid, avatar);
        localStorage.setItem('vg_username_' + cred.user.uid, username);
        await setDoc(doc(_fbStore, 'users', cred.user.uid), {
          username, email, avatar, createdAt: new Date().toISOString()
        });
        okEl.textContent = 'Account created! Welcome, ' + username + ' 🎉';
        okEl.style.display = 'block';
        setTimeout(() => { closeAuth(); }, 1800);
      } catch(e) {
        const msgs = {
          'auth/email-already-in-use': 'That email is already registered.',
          'auth/invalid-email': 'Invalid email address.',
          'auth/weak-password': 'Password too weak, use at least 6 characters.'
        };
        errEl.textContent = msgs[e.code] || 'Error: ' + e.message;
        errEl.style.display = 'block';
      }
      btn.disabled = false; btn.textContent = 'Crear Cuenta';
    }

    async function doLogin() {
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const errEl    = document.getElementById('login-err');
      const btn      = document.getElementById('login-btn');
      errEl.style.display = 'none';

      if (!email || !password) { errEl.textContent = 'Please fill in all fields.'; errEl.style.display = 'block'; return; }

      btn.disabled = true; btn.textContent = 'Signing in...';
      try {
        const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
        const auth = await getFirebaseAuth();
        await signInWithEmailAndPassword(auth, email, password);
        closeAuth();
      } catch(e) {
        const msgs = {
          'auth/user-not-found': 'No account found with that email.',
          'auth/wrong-password': 'Incorrect password.',
          'auth/invalid-credential': 'Incorrect email or password.',
          'auth/invalid-email': 'Invalid email address.'
        };
        errEl.textContent = msgs[e.code] || 'Login failed. Please try again.';
        errEl.style.display = 'block';
      }
      btn.disabled = false; btn.textContent = 'Iniciar Sesión';
    }

    async function doLogout() {
      const { signOut } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
      const auth = await getFirebaseAuth();
      await signOut(auth);
      closeAuth();
    }

    async function openForgotPassword() {
      const email = document.getElementById('login-email').value.trim();
      const errEl = document.getElementById('login-err');
      errEl.style.display = 'none';

      if (!email) {
        errEl.textContent = 'Escribe tu correo arriba y luego haz clic en ¿Olvidaste tu contraseña?';
        errEl.style.display = 'block';
        return;
      }
      try {
        const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
        const auth = await getFirebaseAuth();
        await sendPasswordResetEmail(auth, email);
        errEl.style.background = 'rgba(74,204,136,.1)';
        errEl.style.borderColor = 'rgba(74,204,136,.3)';
        errEl.style.color = '#4acc88';
        errEl.textContent = '✓ Te enviamos un email para resetear tu contraseña. Revisa tu bandeja.';
        errEl.style.display = 'block';
      } catch(e) {
        const msgs = {
          'auth/user-not-found': 'No account found with that email.',
          'auth/invalid-email': 'Invalid email address.'
        };
        errEl.style.background = 'rgba(255,95,95,.1)';
        errEl.style.borderColor = 'rgba(255,95,95,.3)';
        errEl.style.color = '#ff5f5f';
        errEl.textContent = msgs[e.code] || 'Error al enviar el email.';
        errEl.style.display = 'block';
      }
    }

    // Inicializar auth al cargar la página
    getFirebaseAuth();

    function openAuth(tab) {
      document.getElementById('auth-modal').style.display = 'block';
      document.body.style.overflow = 'hidden';
      if (tab === 'profile' || (_currentUser && tab !== 'register')) {
        switchAuthTab('profile');
        const avatar = localStorage.getItem('vg_avatar_' + _currentUser.uid) || AVATARS[0];
        const username = localStorage.getItem('vg_username_' + _currentUser.uid) || _currentUser.email.split('@')[0];
        document.getElementById('profile-avatar').src = avatar;
        document.getElementById('profile-username').textContent = username;
        document.getElementById('profile-email').textContent = _currentUser.email;
      } else {
        switchAuthTab(tab || 'login');
      }
    }
    function closeAuth(e) {
      if (e && e.target !== document.querySelector('#auth-modal .auth-overlay')) return;
      document.getElementById('auth-modal').style.display = 'none';
      document.body.style.overflow = '';
    }
    function switchAuthTab(tab) {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-section').forEach(s => s.classList.remove('active'));
      const tabEl = document.getElementById('auth-tab-' + tab);
      if (tabEl) tabEl.classList.add('active');
      document.getElementById('auth-' + tab).classList.add('active');
    }
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeAuth(); closeLegal(); closeMobile(); closeAllPanels(); }
    });
    // ── ACCOUNTS FILTER ──
    function filterAccs(btn, type) {
      // Update active button
      document.querySelectorAll('.acc-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Show/hide cards
      document.querySelectorAll('.acc-card').forEach(card => {
        if (type === 'all' || card.dataset.type === type) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    }
    // ── Initialize with English on page load ──
    document.addEventListener('DOMContentLoaded', function() {
      setLang('en');
      loadAllPrices();
      loadOSRSAccounts();
      setupAdminAccess();
    });

    // ══════════════════════════════════════════
    // OSRS ACCOUNTS — Lee desde Firebase Firestore
    // ══════════════════════════════════════════
    const FIREBASE_CONFIG = {
      apiKey: "AIzaSyCEipnzMpimKSz2rY-3yyBMjxGJn-_Xnvc",
      authDomain: "veikengold-ae654.firebaseapp.com",
      projectId: "veikengold-ae654",
      storageBucket: "veikengold-ae654.firebasestorage.app",
      messagingSenderId: "630867963145",
      appId: "1:630867963145:web:1ee6d3219fe8d22897f7d8"
    };

    let ACCOUNTS_DATA    = [];
    let accCurrentFilter = 'all';

    async function loadOSRSAccounts() {
      try {
        const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
        const { getFirestore, collection, getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
        const db  = getFirestore(app);
        const snap = await getDocs(query(collection(db, "accounts"), where("status", "==", "stock")));
        ACCOUNTS_DATA = [];
        snap.forEach(d => ACCOUNTS_DATA.push({ id: d.id, ...d.data() }));
        ACCOUNTS_DATA.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      } catch(e) {
        console.error("[ACCOUNTS] Error cargando desde Firebase:", e);
        ACCOUNTS_DATA = [];
      }
      renderAccountGrid('all');
    }

    function renderAccountGrid(filter) {
      accCurrentFilter = filter;
      const grid    = document.getElementById('acc-grid');
      const loading = document.getElementById('acc-loading');
      const empty   = document.getElementById('acc-empty');

      if (loading) loading.style.display = 'none';

      const data = filter === 'all'
        ? ACCOUNTS_DATA
        : ACCOUNTS_DATA.filter(a => (a.type || '').toLowerCase() === filter);

      if (!data.length) {
        if (grid)  { grid.style.display = 'none'; grid.innerHTML = ''; }
        if (empty) {
          empty.style.display = 'block';
          empty.innerHTML = ACCOUNTS_DATA.length === 0
            ? `<div style="font-size:36px;margin-bottom:12px;">🎮</div>
               <div style="font-size:14px;color:var(--text2);font-weight:600;">No accounts available yet</div>
               <div style="font-size:12px;color:var(--muted);margin-top:6px;">Vuelve pronto o contáctanos por Discord</div>`
            : `<div style="font-size:36px;margin-bottom:12px;">🔍</div>
               <div style="font-size:14px;color:var(--text2);font-weight:600;">No accounts found in this category</div>
               <div style="font-size:12px;color:var(--muted);margin-top:6px;">Try another filter</div>`;
        }
        return;
      }

      if (empty) empty.style.display = 'none';
      if (grid)  { grid.style.display = 'grid'; grid.innerHTML = data.map((acc, idx) => buildAccCard(acc, idx)).join(''); }
    }

    // Override filterAccs para usar renderAccountGrid dinámico
    function filterAccs(btn, type) {
      document.querySelectorAll('.acc-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAccountGrid(type);
    }

    function buildAccCard(acc, idx) {
      const type = (acc.type || 'main').toLowerCase();
      const badgeClass = {
        pure: 'acc-badge-pure', main: 'acc-badge-main', zerker: 'acc-badge-zerker',
        skiller: 'acc-badge-skiller', ironman: 'acc-badge-ironman'
      }[type] || 'acc-badge-main';
      const cardId = 'acc-card-' + idx;

      // Stats: "Atk:60,Str:99,..."
      const stats = (acc.stats || '').split(',').map(s => {
        const [lbl, val] = s.trim().split(':');
        return lbl && val ? `<div class="acc-stat"><span class="acc-stat-val">${val.trim()}</span><span class="acc-stat-lbl">${lbl.trim()}</span></div>` : '';
      }).filter(Boolean).join('');

      // Tags: "Quest Cape ✓, Fire Cape ✓"
      const tags = (acc.tags || '').split(',').map(t =>
        t.trim() ? `<span class="acc-tag">${t.trim()}</span>` : ''
      ).filter(Boolean).join('');

      // Imágenes — el dashboard guarda array JSON en MySQL
      let images = [];
      if (Array.isArray(acc.images) && acc.images.length > 0) {
        images = acc.images.filter(Boolean);
      } else if (typeof acc.image === 'string' && acc.image) {
        images = acc.image.split('|').map(u => u.trim()).filter(Boolean);
      }

      let imgHtml = '';
      if (images.length === 0) {
        imgHtml = `<div class="acc-carousel"><div class="acc-carousel-placeholder">🎮</div></div>`;
      } else if (images.length === 1) {
        imgHtml = `<div class="acc-carousel" id="${cardId}-carousel" data-imgs='${JSON.stringify(images)}' data-idx="0">
          <img class="acc-carousel-img" src="${images[0]}" alt="${acc.title}"
            onclick="openLightbox(${JSON.stringify(images)},0)"
            onerror="this.parentElement.innerHTML='<div class=acc-carousel-placeholder>🎮</div>'" />
          <div class="acc-carousel-zoom">🔍</div>
        </div>`;
      } else {
        const dots = images.map((_, i) =>
          `<span class="acc-dot${i===0?' active':''}" onclick="setCarouselImg('${cardId}',${i});event.stopPropagation()"></span>`
        ).join('');
        imgHtml = `<div class="acc-carousel" id="${cardId}-carousel" data-imgs='${JSON.stringify(images)}' data-idx="0">
          <img class="acc-carousel-img" src="${images[0]}" alt="${acc.title}"
            onclick="openLightbox(JSON.parse(document.getElementById('${cardId}-carousel').dataset.imgs),parseInt(document.getElementById('${cardId}-carousel').dataset.idx))"
            onerror="this.src=''" />
          <button class="acc-carousel-btn acc-carousel-prev" onclick="stepCarousel('${cardId}',-1);event.stopPropagation()">‹</button>
          <button class="acc-carousel-btn acc-carousel-next" onclick="stepCarousel('${cardId}',1);event.stopPropagation()">›</button>
          <div class="acc-carousel-dots">${dots}</div>
          <div class="acc-carousel-count"><span id="${cardId}-cur">1</span>/${images.length}</div>
          <div class="acc-carousel-zoom">🔍</div>
        </div>`;
      }

      const price = parseFloat(acc.price || 0);
      let priceHtml;
      if (price > 0) {
        const { code, symbol: sym, rate } = currentCurrency;
        if (code === 'USD' || !rate || rate === 1) {
          priceHtml = `<span class="acc-price-tag">$<strong>${price.toFixed(2)}</strong></span>`;
        } else {
          const conv = price * rate;
          const fmtC = conv >= 1000 ? Math.round(conv).toLocaleString('en-US') : conv.toFixed(2);
          priceHtml = `<span class="acc-price-tag">
            ${sym}<strong>${fmtC}</strong>
            <span class="acc-price-usd">≈ $${price.toFixed(2)} USD</span>
          </span>`;
        }
      } else {
        priceHtml = `<span class="acc-price-tag" style="font-size:11px;color:var(--muted);">Contact us</span>`;
      }

      return `<div class="acc-card" data-type="${type}" id="${cardId}">
        ${imgHtml}
        <div class="acc-card-top">
          <span class="acc-type-badge ${badgeClass}">${type.toUpperCase()}</span>
          ${priceHtml}
        </div>
        ${acc.title    ? `<div class="acc-card-title">${acc.title}</div>`       : ''}
        ${acc.subtitle ? `<div class="acc-card-subtitle">${acc.subtitle}</div>` : ''}
        ${stats ? `<div class="acc-stats-grid">${stats}</div>` : ''}
        ${tags  ? `<div class="acc-tags">${tags}</div>`         : ''}
        <button class="acc-buy-btn" onclick="openChatForAccount('${acc.title}',${acc.price||0},'${acc.type||'account'}')">🛒 Buy</button>
      </div>`;
    }

    // ── Carousel controls ──
    function stepCarousel(cardId, dir) {
      const el = document.getElementById(cardId + '-carousel');
      if (!el) return;
      const imgs = JSON.parse(el.dataset.imgs);
      let idx = parseInt(el.dataset.idx) + dir;
      if (idx < 0) idx = imgs.length - 1;
      if (idx >= imgs.length) idx = 0;
      setCarouselImg(cardId, idx);
    }

    function setCarouselImg(cardId, idx) {
      const el = document.getElementById(cardId + '-carousel');
      if (!el) return;
      const imgs = JSON.parse(el.dataset.imgs);
      idx = Math.max(0, Math.min(idx, imgs.length - 1));
      el.dataset.idx = idx;

      const img = el.querySelector('.acc-carousel-img');
      if (img) {
        img.style.opacity = '0';
        setTimeout(() => { img.src = imgs[idx]; img.style.opacity = '1'; }, 120);
      }

      // dots
      el.querySelectorAll('.acc-dot').forEach((d, i) => d.classList.toggle('active', i === idx));

      // counter
      const cur = document.getElementById(cardId + '-cur');
      if (cur) cur.textContent = idx + 1;
    }

    // ── Lightbox ──
    let _lbImgs = [], _lbIdx = 0;

    function openLightbox(imgs, idx) {
      // Support string or array
      if (typeof imgs === 'string') {
        try { imgs = JSON.parse(imgs); } catch(e) { imgs = [imgs]; }
      }
      _lbImgs = imgs;
      _lbIdx = idx || 0;

      let lb = document.getElementById('acc-lightbox');
      if (!lb) {
        lb = document.createElement('div');
        lb.id = 'acc-lightbox';
        lb.innerHTML = `
          <div class="lb-overlay" onclick="closeLightbox()"></div>
          <div class="lb-box">
            <button class="lb-close" onclick="closeLightbox()">✕</button>
            <button class="lb-nav lb-prev" onclick="stepLightbox(-1)">‹</button>
            <img class="lb-img" id="lb-main-img" src="" alt="" />
            <button class="lb-nav lb-next" onclick="stepLightbox(1)">›</button>
            <div class="lb-footer">
              <span id="lb-counter"></span>
            </div>
            <div class="lb-dots-row" id="lb-dots"></div>
          </div>`;
        document.body.appendChild(lb);
      }

      document.body.style.overflow = 'hidden';
      lb.style.display = 'flex';
      renderLightbox();
    }

    function renderLightbox() {
      const img = document.getElementById('lb-main-img');
      const counter = document.getElementById('lb-counter');
      const dots = document.getElementById('lb-dots');
      const prev = document.querySelector('.lb-prev');
      const next = document.querySelector('.lb-next');

      if (img) { img.style.opacity = '0'; img.src = _lbImgs[_lbIdx]; img.onload = () => { img.style.opacity = '1'; }; }
      if (counter) counter.textContent = _lbImgs.length > 1 ? `${_lbIdx + 1} / ${_lbImgs.length}` : '';
      if (dots) dots.innerHTML = _lbImgs.length > 1
        ? _lbImgs.map((_, i) => `<span class="lb-dot${i===_lbIdx?' active':''}" onclick="stepLightbox(${i - _lbIdx})"></span>`).join('')
        : '';
      if (prev) prev.style.display = _lbImgs.length > 1 ? 'flex' : 'none';
      if (next) next.style.display = _lbImgs.length > 1 ? 'flex' : 'none';
    }

    function stepLightbox(dir) {
      _lbIdx = (_lbIdx + dir + _lbImgs.length) % _lbImgs.length;
      renderLightbox();
    }

    function closeLightbox() {
      const lb = document.getElementById('acc-lightbox');
      if (lb) lb.style.display = 'none';
      document.body.style.overflow = '';
    }

    document.addEventListener('keydown', e => {
      const lb = document.getElementById('acc-lightbox');
      if (!lb || lb.style.display === 'none') return;
      if (e.key === 'ArrowRight') stepLightbox(1);
      if (e.key === 'ArrowLeft')  stepLightbox(-1);
      if (e.key === 'Escape')     closeLightbox();
    });

    // Override filterAccs to use dynamic data
    function filterAccs(btn, type) {
      document.querySelectorAll('.acc-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAccountGrid(type);
    }

    function setupAdminAccess() {} // Access removed — use secret URL

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeLightbox();
    });
