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
      rs:      { buy: 0.38, sell: 0.30 },
      wowc:    { buy: 0.010, sell: 0.020 },
      wowr_us: { buy: 3.50, sell: 4.50 },
      wowr_eu: { buy: 2.90, sell: 4.50 },
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
      if (rsBuyRate)  rsBuyRate.textContent  = '$' + PRICES.rs.buy.toFixed(2);
      if (rsSellRate) rsSellRate.textContent = '$' + PRICES.rs.sell.toFixed(2);
      calcRS('buy');
      calcRS('sell');

      // ── WoW Classic ──
      const wcbRate = PRICES.wowc.buy;
      const wcsRate = PRICES.wowc.sell;
      const wcbRateEl = document.getElementById('wowc-buy-rate');
      const wcsRateEl = document.getElementById('wowc-sell-rate');
      if (wcbRateEl) wcbRateEl.textContent = '$' + wcbRate.toFixed(3);
      if (wcsRateEl) wcsRateEl.textContent = '$' + wcsRate.toFixed(3);
      // Repatch inline onclick rates in quick buttons
      document.querySelectorAll('#wowc-buy .quick-btn').forEach(b => {
        const v = parseInt(b.textContent);
        b.onclick = () => { setVal('wowc-buy-qty','wowc-buy-slider',v); calcWowSimple('wowc','buy',wcbRate); };
      });
      document.querySelectorAll('#wowc-sell .quick-btn').forEach(b => {
        const v = parseInt(b.textContent);
        b.onclick = () => { setVal('wowc-sell-qty','wowc-sell-slider',v); calcWowSimple('wowc','sell',wcsRate); };
      });
      // Repatch input handlers
      const wcbQty = document.getElementById('wowc-buy-qty');
      const wcsQty = document.getElementById('wowc-sell-qty');
      if (wcbQty) wcbQty.oninput = () => { calcWowSimple('wowc','buy',wcbRate); syncSlider('wowc-buy-qty','wowc-buy-slider',1,500); };
      if (wcsQty) wcsQty.oninput = () => { calcWowSimple('wowc','sell',wcsRate); syncSlider('wowc-sell-qty','wowc-sell-slider',1,500); };
      const wcbSlider = document.getElementById('wowc-buy-slider');
      const wcsSlider = document.getElementById('wowc-sell-slider');
      if (wcbSlider) wcbSlider.oninput = function(){ syncInput(this,'wowc-buy-qty'); calcWowSimple('wowc','buy',wcbRate); };
      if (wcsSlider) wcsSlider.oninput = function(){ syncInput(this,'wowc-sell-qty'); calcWowSimple('wowc','sell',wcsRate); };
      calcWowSimple('wowc','buy',wcbRate);
      calcWowSimple('wowc','sell',wcsRate);

      // ── WoW Retail ──
      const wrbRate = PRICES.wowr_us.buy / 100;  // sheet stores per 100K, calc needs per K
      const wrsRate = PRICES.wowr_us.sell / 100;
      const wrbRateEl = document.getElementById('wowr-buy-rate');
      const wrsRateEl = document.getElementById('wowr-sell-rate');
      if (wrbRateEl) wrbRateEl.textContent = '$' + PRICES.wowr_us.buy.toFixed(2) + '/100K';
      if (wrsRateEl) wrsRateEl.textContent = '$' + PRICES.wowr_us.sell.toFixed(2) + '/100K';
      document.querySelectorAll('#wowr-buy .quick-btn').forEach(b => {
        const v = parseInt(b.textContent);
        b.onclick = () => { setVal('wowr-buy-qty','wowr-buy-slider',v); calcWowSimple('wowr','buy',wrbRate); };
      });
      document.querySelectorAll('#wowr-sell .quick-btn').forEach(b => {
        const v = parseInt(b.textContent);
        b.onclick = () => { setVal('wowr-sell-qty','wowr-sell-slider',v); calcWowSimple('wowr','sell',wrsRate); };
      });
      const wrbQty = document.getElementById('wowr-buy-qty');
      const wrsQty = document.getElementById('wowr-sell-qty');
      if (wrbQty) wrbQty.oninput = () => { calcWowSimple('wowr','buy',wrbRate); syncSlider('wowr-buy-qty','wowr-buy-slider',1,500); };
      if (wrsQty) wrsQty.oninput = () => { calcWowSimple('wowr','sell',wrsRate); syncSlider('wowr-sell-qty','wowr-sell-slider',1,500); };
      const wrbSlider = document.getElementById('wowr-buy-slider');
      const wrsSlider = document.getElementById('wowr-sell-slider');
      if (wrbSlider) wrbSlider.oninput = function(){ syncInput(this,'wowr-buy-qty'); calcWowSimple('wowr','buy',wrbRate); };
      if (wrsSlider) wrsSlider.oninput = function(){ syncInput(this,'wowr-sell-qty'); calcWowSimple('wowr','sell',wrsRate); };
      calcWowSimple('wowr','buy',wrbRate);
      calcWowSimple('wowr','sell',wrsRate);

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
      if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
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
          const isBuy = t.textContent.includes('Comprar');
          t.classList.toggle('active', tab==='buy' ? isBuy : !isBuy);
        });
      }
    }

    function calcRS(mode) {
      const qty = parseFloat(document.getElementById('rs-'+mode+'-qty').value)||0;
      const buyRate  = (PRICES && PRICES.rs) ? PRICES.rs.buy  : 0.38;
      const sellRate = (PRICES && PRICES.rs) ? PRICES.rs.sell : 0.30;
      if(mode==='buy') {
        let disc='', mult=1;
        if(qty>=2000){disc='-10%';mult=0.9;} else if(qty>=1000){disc='-5%';mult=0.95;} else if(qty>=500){disc='-3%';mult=0.97;}
        document.getElementById('rs-buy-qty-show').textContent = qty>=1000?(qty/1000).toFixed(2).replace(/\.?0+$/,'')+'B':qty+'M';
        document.getElementById('rs-buy-disc').textContent = disc||'—';
        document.getElementById('rs-buy-total').textContent = '$'+(qty*buyRate*mult).toFixed(2);
      } else {
        document.getElementById('rs-sell-qty-show').textContent = qty>=1000?(qty/1000).toFixed(2).replace(/\.?0+$/,'')+'B':qty+'M';
        document.getElementById('rs-sell-total').textContent = '$'+(qty*sellRate).toFixed(2);
      }
    }

    function calcWowSimple(prefix, mode, rate) {
      const qty = parseFloat(document.getElementById(prefix+'-'+mode+'-qty').value)||0;
      if(mode==='buy') {
        let disc='', mult=1;
        if(qty>=500){disc='-8%';mult=0.92;} else if(qty>=100){disc='-4%';mult=0.96;}
        document.getElementById(prefix+'-buy-qty-show').textContent = qty+'K';
        document.getElementById(prefix+'-buy-disc').textContent = disc||'—';
        document.getElementById(prefix+'-buy-total').textContent = '$'+(qty*rate*mult).toFixed(2);
      } else {
        document.getElementById(prefix+'-sell-qty-show').textContent = qty+'K';
        document.getElementById(prefix+'-sell-total').textContent = '$'+(qty*rate).toFixed(2);
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
      if (descEl)  descEl.textContent  = 'Unit: '+(cfg.unitRaw||'1B')+' · Buy & sell';
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
      const qty    = parseFloat(document.getElementById('priv-'+mode+'-qty').value)||0;
      const server = mode==='buy' ? psMode : psSellMode;
      // Use dynamic prices from sheet
      const dyn = PRICES.rsps[server] || PRICES.rsps[server.toLowerCase()] || {};
      const fall = psConfig[server] || {};
      const rate      = dyn.clientPrice  || fall.buyRate || 0;
      const unitShort = dyn.unitShort    || fall.unitShort || 'B';
      const name      = dyn.name        || fall.name || server;
      const qtyStr    = qty + unitShort;
      const rateStr   = '$'+rate.toFixed(2)+'/'+unitShort;
      const total     = '$'+(qty*rate).toFixed(2);
      if (mode==='buy') {
        const s=document.getElementById('priv-buy-server');    if(s) s.textContent=name;
        const r=document.getElementById('priv-buy-rate');      if(r) r.textContent=rateStr;
        const q=document.getElementById('priv-buy-qty-show');  if(q) q.textContent=qtyStr;
        const t=document.getElementById('priv-buy-total');     if(t) t.textContent=total;
      } else {
        const s=document.getElementById('priv-sell-server');   if(s) s.textContent=name;
        const r=document.getElementById('priv-sell-rate');     if(r) r.textContent=rateStr;
        const q=document.getElementById('priv-sell-qty-show'); if(q) q.textContent=qtyStr;
        const t=document.getElementById('priv-sell-total');    if(t) t.textContent=total;
      }
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
      if (t) t.textContent = `$${total.toFixed(2)}`;
    }

    function clearBoostSelection() {
      Object.keys(boostSelected).forEach(k => delete boostSelected[k]);
      updateBoostFooter();
      renderBoostTable();
    }

    function openModal() {
      document.getElementById('order-modal').style.display='block';
      document.body.style.overflow='hidden';
    }
    function closeModal(e) {
      if(e && e.currentTarget !== e.target) return;
      document.getElementById('order-modal').style.display='none';
      document.body.style.overflow='';
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
        tos: 'Términos de Servicio — OSRS / RSPS',
        accounts: 'Política de Cuentas',
        boosting: 'Normas de Boosting',
        privacy: 'Política de Privacidad',
        refunds: 'Política de Reembolsos'
      };
      const titleEl = document.getElementById('legal-modal-title');
      if (titleEl) titleEl.textContent = titles[section] || 'Legal';
    }
    document.addEventListener('keydown', e => { if(e.key === 'Escape') { closeLegal(); } });


    // ── CURRENCY & LANGUAGE ──
    let currentCurrency = { code: 'USD', symbol: '$', rate: 1 };
    let currentLang = 'en';

    // Exchange rates (approximate, vs USD)
    const rates = {
      USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36,
      ARS: 880, VES: 36, COP: 3900, MXN: 17, BRL: 4.97
    };

    const translations = {
      en: {
        // Auth
        login: 'Login', register: 'Sign Up',
        welcome_back: 'Welcome back!',
        login_sub: 'Access your account to view your orders and manage your transactions.',
        login_notice: '🔔 Account management is currently handled through Discord.',
        create_account: 'Create an account',
        register_sub: 'Join VeikenGold and start buying gold safely.',
        register_notice: '🔔 Registration is done through Discord. Join our server to create your account.',
        email: 'Email / Discord User', password: 'Password', username: 'Username',
        login_btn: 'Login', register_btn: 'Create Account',
        or: 'or continue with', discord_login: 'Continue with Discord',
        discord_register: 'Sign up with Discord',
        // Nav
        nav_coins: 'Coins', nav_mem: 'Memberships', nav_svc: 'Services', nav_accounts: 'Accounts',
        dd_gold_oficial: 'Official Gold', dd_subs: 'Subscriptions & Bonds',
        dd_rs_svc: 'RS Services', dd_game_accounts: 'Game Accounts',
        dd_rs_sub: 'RS3 · OSRS', dd_wow_classic_sub: 'Era · SoD · Hardcore',
        dd_wow_retail_sub: 'The War Within', dd_ps_rs: 'RS Private Servers',
        dd_ps_list: 'Impact · RoatPkz · Orion · SpawnPK',
        dd_pick_server: 'Choose your server',
        dd_bond_sub: '14 days · from $8.00', dd_wow_sub_sub: '30 days · from $12.00',
        dd_calc: 'Services Calculator', dd_calc_sub: 'Skilling · PvM · Minigames · +more',
        dd_osrs_sub: 'Pures · Mains · Skillers · +more',
        // Mobile
        mob_ps: 'RS Private Servers', mob_mem_svc: 'Memberships & Services',
        mob_coins: 'Coins', mob_accounts: 'Accounts',
        // Hero
        hero_h1: 'The most trusted<br>marketplace for <em>Gaming Gold</em>',
        hero_p: 'Gold, memberships and boosting for RuneScape and World of Warcraft. Fast delivery, secure transactions.',
        badge_delivery: '⚡ Delivery <10 min', badge_secure: '🔒 Secure payment', badge_reviews: '⭐ 4.9 / 5 reviews',
        // Home
        games_title: 'Available Games',
        pill_coins: '💰 Coins', pill_accounts: '👤 Accounts', pill_boosting: '⚡ Boosting', pill_mem: '🎫 Memberships',
        // Tabs
        tab_buy: '🛒 Buy Gold', tab_sell: '💰 Sell Gold',
        back_btn: '← Back',
        // RS
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
        note_sell: '💸 Immediate payment · PayPal · Crypto',
        // WoW Classic
        wowc_desc: 'Buy and sell gold · Era · SoD · Hardcore',
        wowc_buy_title: '🏰 How much WoW Classic gold do you want to buy?',
        wowc_sell_title: '🏰 How much WoW Classic gold do you want to sell?',
        // WoW Retail
        wowr_desc: 'Buy and sell gold · The War Within',
        wowr_buy_title: '🌍 How much WoW Retail gold do you want to buy?',
        wowr_sell_title: '🌍 How much WoW Retail gold do you want to sell?',
        // PS
        ps_buy_title: '🛒 How much gold do you want to buy?',
        // Memberships
        mem_desc: 'RS Bond · WoW Subscription',
        // Boost
        boost_desc: 'Select the service and calculate your budget instantly',
        boost_select: 'Select a skill above', boost_title: '⚡ Skilling Quote',
        level_from: 'Current Level', level_to: 'Desired Level',
        skill_lbl: 'Skill', levels_up: 'Levels to gain', price_per_lvl: 'Price per level',
        total_est: 'Estimated total', select_skill_btn: 'Select a skill',
        note_boost: 'Estimated time by skill · Secure account guaranteed',
        // OSRS Accounts
        osrs_desc: 'Verified accounts · Secure delivery · Warranty included',
        filter_all: 'All', filter_pures: 'Pures', filter_mains: 'Mains',
        filter_skillers: 'Skillers', filter_zerkers: 'Zerkers', filter_ironman: 'Ironman',
        custom_acc: 'Looking for an account with specific stats?',
        we_get_it: "and we'll get it.",
        // Footer
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
      },
      es: {
        // Auth
        login: 'Iniciar Sesión', register: 'Registrarse',
        welcome_back: '¡Bienvenido de vuelta!',
        login_sub: 'Accede a tu cuenta para ver tus pedidos y gestionar tus transacciones.',
        login_notice: '🔔 Actualmente el sistema de cuentas se gestiona a través de Discord.',
        create_account: 'Crear una cuenta',
        register_sub: 'Únete a VeikenGold y empieza a comprar gold de forma segura.',
        register_notice: '🔔 El registro se realiza a través de Discord. Únete para crear tu cuenta.',
        email: 'Correo / Usuario Discord', password: 'Contraseña', username: 'Nombre de usuario',
        login_btn: 'Iniciar Sesión', register_btn: 'Crear Cuenta',
        or: 'o continúa con', discord_login: 'Continuar con Discord',
        discord_register: 'Registrarse con Discord',
        // Nav
        nav_coins: 'Monedas', nav_mem: 'Membresías', nav_svc: 'Servicios', nav_accounts: 'Cuentas',
        dd_gold_oficial: 'Gold oficial', dd_subs: 'Suscripciones y Bonds',
        dd_rs_svc: 'RS Services', dd_game_accounts: 'Cuentas de juego',
        dd_rs_sub: 'RS3 · OSRS', dd_wow_classic_sub: 'Era · SoD · Hardcore',
        dd_wow_retail_sub: 'The War Within', dd_ps_rs: 'Servidores Privados RS',
        dd_ps_list: 'Impact · RoatPkz · Orion · SpawnPK',
        dd_pick_server: 'Elige tu servidor',
        dd_bond_sub: '14 días · desde $8.00', dd_wow_sub_sub: '30 días · desde $12.00',
        dd_calc: 'Calculadora de Servicios', dd_calc_sub: 'Skilling · PvM · Minigames · +más',
        dd_osrs_sub: 'Pures · Mains · Skillers · +más',
        // Mobile
        mob_ps: 'Servidores Privados RS', mob_mem_svc: 'Membresías y Servicios',
        mob_coins: 'Monedas', mob_accounts: 'Cuentas',
        // Hero
        hero_h1: 'El marketplace más<br>confiable de <em>Gaming Gold</em>',
        hero_p: 'Gold, membresías y boosting para RuneScape y World of Warcraft. Entrega rápida, transacciones seguras.',
        badge_delivery: '⚡ Entrega <10 min', badge_secure: '🔒 Pago seguro', badge_reviews: '⭐ 4.9 / 5 reseñas',
        // Home
        games_title: 'Juegos Disponibles',
        pill_coins: '💰 Monedas', pill_accounts: '👤 Cuentas', pill_boosting: '⚡ Boosting', pill_mem: '🎫 Membresías',
        // Tabs
        tab_buy: '🛒 Comprar Gold', tab_sell: '💰 Vender Gold',
        back_btn: '← Volver',
        // RS
        rs_desc: 'Compra y venta de gold · RS3 y OSRS',
        rs_buy_title: '🛒 ¿Cuánto gold quieres comprar?',
        rs_sell_title: '💰 ¿Cuánto gold quieres vender?',
        gold_qty: 'Cantidad de Gold', delivery_method: 'Método de entrega',
        del_trade_desc: 'GE o mundo acordado', del_wild_desc: 'Drop en zona PvP', del_tip_desc: 'Vía clan/dungeon',
        del_mail_desc: 'Correo en juego', del_trade2_desc: 'Intercambio directo', del_guild_desc: 'Banco de guild',
        price_per_m: 'Precio por millón', quantity_lbl: 'Cantidad', discount_lbl: 'Descuento',
        delivery_via: 'Entrega vía', total_pay: 'Total a pagar',
        order_btn: 'Hacer Pedido →', sell_btn: 'Vender Ahora →',
        note_delivery: '⚡ Entrega en menos de 10 minutos · Pago seguro',
        price_we_pay: 'Precio que pagamos por millón', you_receive: 'Recibirás',
        note_sell: '💸 Pago inmediato · PayPal · Crypto',
        // WoW Classic
        wowc_desc: 'Compra y venta de gold · Era · SoD · Hardcore',
        wowc_buy_title: '🏰 ¿Cuánto gold WoW Classic quieres comprar?',
        wowc_sell_title: '🏰 ¿Cuánto gold WoW Classic quieres vender?',
        // WoW Retail
        wowr_desc: 'Compra y venta de gold · The War Within',
        wowr_buy_title: '🌍 ¿Cuánto gold WoW Retail quieres comprar?',
        wowr_sell_title: '🌍 ¿Cuánto gold WoW Retail quieres vender?',
        // PS
        ps_buy_title: '🛒 ¿Cuánto gold quieres comprar?',
        // Memberships
        mem_desc: 'RS Bond · WoW Suscripción',
        // Boost
        boost_desc: 'Selecciona el servicio y calcula tu presupuesto al instante',
        boost_select: 'Selecciona una habilidad arriba', boost_title: '⚡ Cotización de Skilling',
        level_from: 'Nivel Actual', level_to: 'Nivel Deseado',
        skill_lbl: 'Habilidad', levels_up: 'Niveles a subir', price_per_lvl: 'Precio por nivel',
        total_est: 'Total estimado', select_skill_btn: 'Selecciona una habilidad',
        note_boost: 'Tiempo estimado según habilidad · Cuenta segura garantizada',
        // OSRS Accounts
        osrs_desc: 'Cuentas verificadas · Entrega segura · Garantía incluida',
        filter_all: 'Todos', filter_pures: 'Pures', filter_mains: 'Mains',
        filter_skillers: 'Skillers', filter_zerkers: 'Zerkers', filter_ironman: 'Ironman',
        custom_acc: '¿Buscas una cuenta con stats específicos?',
        we_get_it: 'y la conseguimos.',
        // Footer
        reputation: 'Nuestra Reputación — Verifica nuestras referencias',
        pay_methods: 'Medios de pago aceptados',
        footer_desc: 'Tu marketplace de confianza!',
        footer_services: 'Servicios', footer_legal: 'Legal', footer_contact: 'Contacto',
        footer_tos: 'Términos de Servicio', footer_privacy: 'Política de Privacidad',
        footer_accounts_pol: 'Política de Cuentas', footer_refunds: 'Política de Reembolsos',
        footer_boosting: 'Normas de Boosting',
        contact_title: '¿Tienes alguna duda? Contáctanos',
        contact_sub: 'Nuestro equipo está disponible 24/7. Respuesta inmediata garantizada.',
        contact_discord_btn: 'Contactar por Discord',
        copyright: '© 2026 VeikenGold. Todos los derechos reservados.',
        footer_tagline: 'Entrega rápida · Pago seguro · Soporte 24/7',
        currency_lbl: 'Moneda', lang_lbl: 'Idioma',
        marketplace: 'El marketplace más', confiable: 'confiable de', game_gold: 'game gold',
        delivery: 'Entrega <10 min', secure: 'Pago seguro', reviews: '4.9 / 5 reseñas',
        contact_discord: 'Contáctanos por Discord',
      }
    };

    function t(key) {
      return translations[currentLang][key] || translations['en'][key] || key;
    }

    function applyTranslations() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = t(key);
        if (el.tagName === 'INPUT') el.placeholder = val;
        else if (el.hasAttribute('data-i18n-html')) el.innerHTML = val;
        else el.textContent = val;
      });
      // Update auth tab labels
      const loginTab = document.getElementById('auth-tab-login');
      const regTab = document.getElementById('auth-tab-register');
      if (loginTab) loginTab.textContent = t('login');
      if (regTab) regTab.textContent = t('register');
      // Update nav auth buttons
      const loginBtn = document.querySelector('.nav-login span');
      const regBtn = document.querySelector('.nav-register span');
      if (loginBtn) loginBtn.textContent = t('login');
      if (regBtn) regBtn.textContent = t('register');
    }

    function setLang(lang) {
      currentLang = lang;
      document.getElementById('lang-flag').textContent = lang === 'en' ? '🇺🇸' : '🇪🇸';
      document.getElementById('lang-code').textContent = lang.toUpperCase();
      document.querySelectorAll('#lang-panel .nav-panel-item').forEach(b => b.classList.remove('active'));
      const active = document.querySelector(`#lang-panel .nav-panel-item[onclick="setLang('${lang}')"]`);
      if (active) active.classList.add('active');
      applyTranslations();
      closeAllPanels();
    }

    function setCurrency(code, flag, symbol) {
      currentCurrency = { code, symbol, rate: rates[code] || 1 };
      document.getElementById('currency-flag').textContent = flag;
      document.getElementById('currency-code').textContent = code;
      document.querySelectorAll('#currency-panel .nav-panel-item').forEach(b => b.classList.remove('active'));
      const active = document.querySelector(`#currency-panel .nav-panel-item[onclick*="${code}"]`);
      if (active) active.classList.add('active');
      updateAllPrices();
      closeAllPanels();
    }

    function convertPrice(usdPrice) {
      const converted = usdPrice * currentCurrency.rate;
      const sym = currentCurrency.symbol;
      const code = currentCurrency.code;
      if (code === 'USD') return '';
      if (converted >= 1000) return `≈ ${sym}${Math.round(converted).toLocaleString()} ${code}`;
      return `≈ ${sym}${converted.toFixed(2)} ${code}`;
    }

    function updateAllPrices() {
      // Update game card prices
      const priceMap = {
        'desde $0.38/M': 0.38, 'desde $0.60/K': 0.60, 'desde $0.82/K': 0.82,
        'desde $0.05': 0.05, 'desde $8.00': 8.00, 'desde $5.00': 5.00
      };
      // Re-run calculators to update totals
      try { calcRS('buy'); calcRS('sell'); } catch(e) {}
      try { calcWowSimple('wowc','buy',0.60); calcWowSimple('wowc','sell',0.48); } catch(e) {}
      try { calcWowSimple('wowr','buy',0.82); calcWowSimple('wowr','sell',0.65); } catch(e) {}
      try { calcPriv('buy'); calcPriv('sell'); } catch(e) {}
      try { calcBoost(); } catch(e) {}
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
    function openAuth(tab) {
      document.getElementById('auth-modal').style.display = 'block';
      document.body.style.overflow = 'hidden';
      switchAuthTab(tab || 'login');
    }
    function closeAuth(e) {
      if (e && e.target !== document.querySelector('#auth-modal .auth-overlay')) return;
      document.getElementById('auth-modal').style.display = 'none';
      document.body.style.overflow = '';
    }
    function switchAuthTab(tab) {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-section').forEach(s => s.classList.remove('active'));
      document.getElementById('auth-tab-' + tab).classList.add('active');
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
      loadAccountsFromSheet();
      setupAdminAccess();
    });

    // ══════════════════════════════════════════
    // ACCOUNTS — Dynamic loading from Google Sheet
    // ══════════════════════════════════════════

    // ⬇️ REEMPLAZA ESTA URL con tu Sheet publicado como CSV (pestaña Accounts)
    // Instrucciones en el panel Admin → pestaña "Guía Sheet"
    SHEET_URLS.accounts = '';

    // Datos de cuentas en memoria (fallback si no hay Sheet configurado)
    let ACCOUNTS_DATA = [];
    let accCurrentFilter = 'all';

    async function loadAccountsFromSheet() {
      const url = SHEET_URLS.accounts;
      if (!url || url.trim() === '') {
        // No Sheet configurado — mostrar mensaje de bienvenida
        showAccountsPlaceholder();
        return;
      }
      try {
        const txt = await fetchSheet(url);
        if (!txt) throw new Error('empty');
        const rows = parseCSV(txt);
        const headers = rows[0].map(h => h.toLowerCase().trim());
        ACCOUNTS_DATA = rows.slice(1).map(r => {
          const obj = {};
          headers.forEach((h, i) => obj[h] = (r[i] || '').trim());
          return obj;
        }).filter(r => r.title && String(r.active||'').toLowerCase() !== 'false');
        console.log('[ACCOUNTS] Loaded:', ACCOUNTS_DATA.length, 'accounts');
        renderAccountGrid('all');
      } catch(e) {
        console.error('[ACCOUNTS] Failed to load sheet:', e);
        showAccountsPlaceholder();
      }
    }

    function showAccountsPlaceholder() {
      document.getElementById('acc-loading').style.display = 'none';
      document.getElementById('acc-grid').style.display = 'none';
      const empty = document.getElementById('acc-empty');
      empty.style.display = 'block';
      empty.innerHTML = `
        <div style="font-size:36px;margin-bottom:12px;">🎮</div>
        <div style="font-size:14px;color:var(--text2);font-weight:600;">No hay cuentas configuradas aún</div>
        <div style="font-size:12px;color:var(--muted);margin-top:6px;">Accede al panel admin para agregar cuentas</div>
      `;
    }

    function renderAccountGrid(filter) {
      accCurrentFilter = filter;
      const grid = document.getElementById('acc-grid');
      const loading = document.getElementById('acc-loading');
      const empty = document.getElementById('acc-empty');

      loading.style.display = 'none';

      const data = filter === 'all'
        ? ACCOUNTS_DATA
        : ACCOUNTS_DATA.filter(a => (a.type||'').toLowerCase() === filter);

      if (!data.length) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        empty.innerHTML = `
          <div style="font-size:36px;margin-bottom:12px;">🔍</div>
          <div style="font-size:14px;color:var(--text2);font-weight:600;">No hay cuentas en esta categoría</div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px;">Prueba otro filtro o vuelve pronto</div>
        `;
        return;
      }

      empty.style.display = 'none';
      grid.style.display = 'grid';
      grid.innerHTML = data.map((acc, idx) => buildAccCard(acc, idx)).join('');
    }

    function buildAccCard(acc, idx) {
      const type = (acc.type || 'main').toLowerCase();
      const badgeClass = {
        pure: 'acc-badge-pure', main: 'acc-badge-main', zerker: 'acc-badge-zerker',
        skiller: 'acc-badge-skiller', ironman: 'acc-badge-ironman'
      }[type] || 'acc-badge-main';
      const typeLabel = type.toUpperCase();

      // Stats: "Atk:60,Str:99,Def:1,Rng:75,Mage:70,CB:52"
      const stats = (acc.stats || '').split(',').map(s => {
        const [lbl, val] = s.trim().split(':');
        return lbl && val ? `<div class="acc-stat"><span class="acc-stat-val">${val.trim()}</span><span class="acc-stat-lbl">${lbl.trim()}</span></div>` : '';
      }).filter(Boolean).join('');

      // Tags: "Quest Cape ✓,Fire Cape ✓"
      const tags = (acc.tags || '').split(',').map(t =>
        t.trim() ? `<span class="acc-tag">${t.trim()}</span>` : ''
      ).filter(Boolean).join('');

      // Image
      const imgHtml = acc.image
        ? `<div class="acc-card-img-wrap"><img src="${acc.image}" alt="${acc.title}" onerror="this.parentElement.innerHTML='<div class=acc-card-img-placeholder>🎮</div>'" /></div>`
        : '';

      const price = parseFloat(acc.price || 0);
      const priceHtml = price > 0
        ? `<span class="acc-price-tag">$<strong>${price.toFixed(2)}</strong></span>`
        : `<span class="acc-price-tag" style="font-size:11px;color:var(--muted);">Consultar</span>`;

      const titleHtml = acc.title ? `<div class="acc-card-title">${acc.title}</div>` : '';
      const subtitleHtml = acc.subtitle ? `<div class="acc-card-subtitle">${acc.subtitle}</div>` : '';

      return `<div class="acc-card" data-type="${type}">
        ${imgHtml}
        <div class="acc-card-top">
          <span class="acc-type-badge ${badgeClass}">${typeLabel}</span>
          ${priceHtml}
        </div>
        ${titleHtml}${subtitleHtml}
        ${stats ? `<div class="acc-stats-grid">${stats}</div>` : ''}
        ${tags ? `<div class="acc-tags">${tags}</div>` : ''}
        <button class="acc-buy-btn" onclick="openModal()">Consultar precio</button>
      </div>`;
    }

    // Override filterAccs to use dynamic data
    function filterAccs(btn, type) {
      document.querySelectorAll('.acc-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAccountGrid(type);
    }

    // ══════════════════════════════════════════
    // ADMIN PANEL
    // ══════════════════════════════════════════

    // ⬇️ CAMBIA ESTA CONTRASEÑA antes de subir a producción
    const ADMIN_PASSWORD = 'veikengold2024';

    let adminLogoClickCount = 0;
    let adminLogoClickTimer = null;

    function setupAdminAccess() {
      // Triple-click en el logo abre el admin
      const logo = document.getElementById('logo-wrap-admin');
      if (!logo) return;
      logo.addEventListener('click', function(e) {
        adminLogoClickCount++;
        clearTimeout(adminLogoClickTimer);
        if (adminLogoClickCount >= 3) {
          adminLogoClickCount = 0;
          openAdminPanel();
        } else {
          adminLogoClickTimer = setTimeout(() => { adminLogoClickCount = 0; }, 600);
        }
      });
    }

    function openAdminPanel() {
      document.getElementById('admin-modal').style.display = 'block';
      document.body.style.overflow = 'hidden';
      const passInput = document.getElementById('admin-pass-input');
      if (passInput) setTimeout(() => passInput.focus(), 100);
    }

    function closeAdminPanel() {
      document.getElementById('admin-modal').style.display = 'none';
      document.body.style.overflow = '';
      document.getElementById('admin-pass-input').value = '';
      document.getElementById('admin-pass-error').style.display = 'none';
      document.getElementById('admin-login-screen').style.display = 'block';
      document.getElementById('admin-panel-screen').style.display = 'none';
    }

    function checkAdminPass() {
      const val = document.getElementById('admin-pass-input').value;
      if (val === ADMIN_PASSWORD) {
        document.getElementById('admin-login-screen').style.display = 'none';
        document.getElementById('admin-panel-screen').style.display = 'block';
        document.getElementById('admin-pass-error').style.display = 'none';
        switchAdminTab('add');
        loadAdminAccountList();
      } else {
        document.getElementById('admin-pass-error').style.display = 'block';
        document.getElementById('admin-pass-input').value = '';
        document.getElementById('admin-pass-input').focus();
      }
    }

    function switchAdminTab(tab) {
      ['add','list','guide'].forEach(t => {
        const sec = document.getElementById('admin-section-'+t);
        const btn = document.getElementById('admin-tab-'+t);
        if (!sec || !btn) return;
        const isActive = t === tab;
        sec.style.display = isActive ? 'block' : 'none';
        btn.style.background = isActive ? 'var(--accent2)' : 'none';
        btn.style.color = isActive ? '#fff' : 'var(--muted)';
      });
    }

    function previewAdminCard() {
      const acc = getAdminFormData();
      const wrap = document.getElementById('admin-preview-wrap');
      const card = document.getElementById('admin-preview-card');
      wrap.style.display = 'block';
      card.innerHTML = buildAccCard(acc, 0);
    }

    function getAdminFormData() {
      return {
        title:    (document.getElementById('af-title')?.value || '').trim(),
        subtitle: (document.getElementById('af-subtitle')?.value || '').trim(),
        type:     (document.getElementById('af-type')?.value || 'main'),
        price:    (document.getElementById('af-price')?.value || '0'),
        stats:    (document.getElementById('af-stats')?.value || '').trim(),
        tags:     (document.getElementById('af-tags')?.value || '').trim(),
        image:    (document.getElementById('af-img')?.value || '').trim(),
        active:   'TRUE'
      };
    }

    function saveAccountToSheet() {
      const acc = getAdminFormData();
      const msg = document.getElementById('admin-save-msg');

      if (!acc.title) {
        msg.style.display = 'block';
        msg.style.background = 'rgba(255,96,85,.12)';
        msg.style.color = '#ff6055';
        msg.textContent = '⚠️ El título es obligatorio';
        return;
      }

      const url = SHEET_URLS.accounts;
      if (!url || url.trim() === '') {
        // No hay sheet configurado — guardar localmente
        acc.active = 'TRUE';
        ACCOUNTS_DATA.push(acc);
        renderAccountGrid(accCurrentFilter);

        msg.style.display = 'block';
        msg.style.background = 'rgba(74,204,136,.12)';
        msg.style.color = '#4acc88';
        msg.innerHTML = '✅ Cuenta agregada localmente.<br><small style="color:var(--muted)">Para guardar permanentemente, configura el Google Sheet (ver Guía).</small>';

        // Clear form
        ['af-title','af-subtitle','af-price','af-stats','af-tags','af-img'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        document.getElementById('admin-preview-wrap').style.display = 'none';
        return;
      }

      // Si hay Sheet configurado
      const sheetMsg = `✅ Cuenta guardada localmente.\n\n📋 Para que sea permanente, ve al Sheet y agrega manualmente esta fila:\n\nTítulo: ${acc.title}\nSubtítulo: ${acc.subtitle}\nTipo: ${acc.type}\nPrecio: ${acc.price}\nStats: ${acc.stats}\nTags: ${acc.tags}\nImagen: ${acc.image}\nActive: TRUE`;

      ACCOUNTS_DATA.push(acc);
      renderAccountGrid(accCurrentFilter);

      msg.style.display = 'block';
      msg.style.background = 'rgba(74,204,136,.12)';
      msg.style.color = '#4acc88';
      msg.innerHTML = `✅ Cuenta agregada al listado.<br><small style="color:var(--muted)">Recuerda agregarla también en el Sheet para que sea permanente.</small>`;

      ['af-title','af-subtitle','af-price','af-stats','af-tags','af-img'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      document.getElementById('admin-preview-wrap').style.display = 'none';
    }

    function loadAdminAccountList() {
      const list = document.getElementById('admin-acc-list');
      if (!list) return;

      if (!ACCOUNTS_DATA.length) {
        list.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:13px;padding:20px;">No hay cuentas cargadas aún</div>';
        return;
      }

      list.innerHTML = ACCOUNTS_DATA.map((acc, idx) => {
        const type = (acc.type||'main').toUpperCase();
        const price = parseFloat(acc.price||0) > 0 ? `$${parseFloat(acc.price).toFixed(2)}` : 'Consultar';
        return `<div class="admin-acc-row">
          ${acc.image ? `<img src="${acc.image}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'" />` : `<div style="width:44px;height:44px;border-radius:8px;background:var(--bg3);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px;">🎮</div>`}
          <div class="admin-acc-row-info">
            <div class="admin-acc-row-name">${acc.title || 'Sin título'}</div>
            <div class="admin-acc-row-meta">${type} · ${price}</div>
          </div>
          <button class="admin-del-btn" onclick="deleteAdminAccount(${idx})">🗑 Eliminar</button>
        </div>`;
      }).join('');
    }

    function deleteAdminAccount(idx) {
      if (!confirm(`¿Eliminar "${ACCOUNTS_DATA[idx]?.title}"? Esta acción solo aplica a la sesión actual. Recuerda eliminarlo del Sheet también.`)) return;
      ACCOUNTS_DATA.splice(idx, 1);
      renderAccountGrid(accCurrentFilter);
      loadAdminAccountList();
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeAdminPanel();
      }
    });
