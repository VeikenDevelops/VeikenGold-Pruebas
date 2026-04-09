let boostRate=0, boostSkill='';
    let psMode='impact', psSellMode='impact';
    const psConfig = {
      impact:  {name:'Impact',  unit:'Billones (B)', unitShort:'B', buyRate:0.10, sellRate:0.07},
      roatpkz: {name:'RoatPkz', unit:'Millones (M)', unitShort:'M', buyRate:0.05, sellRate:0.03},
      orion:   {name:'Orion',   unit:'Billones (B)', unitShort:'B', buyRate:0.08, sellRate:0.06},
      spawmpk: {name:'SpawnPK', unit:'Trillones (T)',unitShort:'T', buyRate:0.20, sellRate:0.14}
    };
    const deliveryState = {};

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
      const tabs = document.querySelectorAll('#view-'+game+' .tab');
      tabs.forEach((t,i) => t.classList.toggle('active', i===(tab==='buy'?0:1)));
      ['buy','sell'].forEach(m => {
        const el = document.getElementById(game+'-'+m);
        if(el) el.style.display = m===tab ? 'block' : 'none';
      });
    }

    function calcRS(mode) {
      const qty = parseFloat(document.getElementById('rs-'+mode+'-qty').value)||0;
      if(mode==='buy') {
        let disc='', mult=1;
        if(qty>=2000){disc='-10%';mult=0.9;} else if(qty>=1000){disc='-5%';mult=0.95;} else if(qty>=500){disc='-3%';mult=0.97;}
        document.getElementById('rs-buy-qty-show').textContent = qty>=1000?(qty/1000).toFixed(2).replace(/\.?0+$/,'')+'B':qty+'M';
        document.getElementById('rs-buy-disc').textContent = disc||'—';
        document.getElementById('rs-buy-total').textContent = '$'+(qty*0.38*mult).toFixed(2);
      } else {
        document.getElementById('rs-sell-qty-show').textContent = qty>=1000?(qty/1000).toFixed(2).replace(/\.?0+$/,'')+'B':qty+'M';
        document.getElementById('rs-sell-total').textContent = '$'+(qty*0.30).toFixed(2);
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
      psMode=server;
      Object.keys(psConfig).forEach(s=>{const b=document.getElementById('ps-'+s);if(b)b.classList.toggle('active',s===server);});
      const cfg=psConfig[server];
      document.getElementById('priv-buy-unit').textContent=cfg.unit;
      document.getElementById('ps-title').textContent='RS Private — '+cfg.name;
      document.getElementById('ps-desc').textContent='Unidad: 1'+cfg.unitShort+' · Compra y venta';
      calcPriv('buy');
    }
    function selectPSSell(server) {
      psSellMode=server;
      Object.keys(psConfig).forEach(s=>{const b=document.getElementById('ps-s-'+s);if(b)b.classList.toggle('active',s===server);});
      document.getElementById('priv-sell-unit').textContent=psConfig[server].unit;
      calcPriv('sell');
    }
    function calcPriv(mode) {
      const qty=parseFloat(document.getElementById('priv-'+mode+'-qty').value)||0;
      const server=mode==='buy'?psMode:psSellMode;
      const cfg=psConfig[server];
      const rate=mode==='buy'?cfg.buyRate:cfg.sellRate;
      if(mode==='buy'){
        document.getElementById('priv-buy-server').textContent=cfg.name;
        document.getElementById('priv-buy-rate').textContent='$'+rate.toFixed(2)+'/'+cfg.unitShort;
        document.getElementById('priv-buy-qty-show').textContent=qty+cfg.unitShort;
        document.getElementById('priv-buy-total').textContent='$'+(qty*rate).toFixed(2);
      } else {
        document.getElementById('priv-sell-server').textContent=cfg.name;
        document.getElementById('priv-sell-rate').textContent='$'+rate.toFixed(2)+'/'+cfg.unitShort;
        document.getElementById('priv-sell-qty-show').textContent=qty+cfg.unitShort;
        document.getElementById('priv-sell-total').textContent='$'+(qty*rate).toFixed(2);
      }
    }

    function selectSkill(el, skill, rate) {
      document.querySelectorAll('.skill-card').forEach(c=>c.classList.remove('selected'));
      el.classList.add('selected');
      boostSkill=skill; boostRate=rate;
      document.getElementById('boost-skill-name').textContent='Habilidad seleccionada: '+skill;
      document.getElementById('boost-skill-name').style.color='var(--gold)';
      calcBoost();
    }
    function calcBoost() {
      if(!boostSkill) return;
      const from=parseInt(document.getElementById('boost-from').value)||1;
      const to=parseInt(document.getElementById('boost-to').value)||99;
      const lvls=Math.max(0,to-from);
      const total=(lvls*boostRate).toFixed(2);
      document.getElementById('boost-res-skill').textContent=boostSkill;
      document.getElementById('boost-res-lvls').textContent=lvls>0?lvls+' niveles':'—';
      document.getElementById('boost-res-rate').textContent='$'+boostRate.toFixed(2)+'/lvl';
      document.getElementById('boost-res-total').textContent=lvls>0?'$'+total:'—';
      const btn=document.getElementById('boost-order-btn');
      btn.disabled=lvls<=0;
      btn.textContent=lvls>0?'Solicitar Boosting → $'+total:'Ingresa niveles válidos';
      btn.style.opacity=lvls>0?'1':'0.5';
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
    let currentLang = 'es';

    // Exchange rates (approximate, vs USD)
    const rates = {
      USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36,
      ARS: 880, VES: 36, COP: 3900, MXN: 17, BRL: 4.97
    };

    const translations = {
      es: {
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
        marketplace: 'El marketplace más', confiable: 'confiable de',
        game_gold: 'game gold',
        hero_sub: 'Gold, membresías y boosting para RuneScape y World of Warcraft. Entrega rápida, transacciones seguras.',
        delivery: 'Entrega <10 min', secure: 'Pago seguro', reviews: '4.9 / 5 reseñas',
        games_title: 'Juegos Disponibles',
        buy_gold: '🛒 Comprar Gold', sell_gold: '💰 Vender Gold',
        back: '← Volver', order_btn: 'Hacer Pedido →', sell_btn: 'Vender Ahora →',
        currency_lbl: 'Moneda', lang_lbl: 'Idioma',
        footer_desc: 'Tu marketplace de confianza!',
        contact_title: '¿Tienes alguna duda? Contáctanos',
        contact_sub: 'Nuestro equipo está disponible 24/7. Respuesta inmediata garantizada.',
        discord_contact: 'Contactar por Discord',
        reputation: 'Nuestra Reputación — Verifica nuestras referencias',
      },
      en: {
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
        marketplace: 'The most trusted', confiable: 'marketplace for',
        game_gold: 'game gold',
        hero_sub: 'Gold, memberships and boosting for RuneScape and World of Warcraft. Fast delivery, secure transactions.',
        delivery: 'Delivery <10 min', secure: 'Secure payment', reviews: '4.9 / 5 reviews',
        games_title: 'Available Games',
        buy_gold: '🛒 Buy Gold', sell_gold: '💰 Sell Gold',
        back: '← Back', order_btn: 'Place Order →', sell_btn: 'Sell Now →',
        currency_lbl: 'Currency', lang_lbl: 'Language',
        footer_desc: 'Your trusted marketplace!',
        contact_title: 'Have a question? Contact us',
        contact_sub: 'Our team is available 24/7. Immediate response guaranteed.',
        discord_contact: 'Contact via Discord',
        reputation: 'Our Reputation — Verify our references',
      }
    };

    function t(key) {
      return translations[currentLang][key] || translations['es'][key] || key;
    }

    function applyTranslations() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.tagName === 'INPUT') el.placeholder = t(key);
        else el.textContent = t(key);
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
      document.getElementById('lang-flag').textContent = lang === 'es' ? '🇪🇸' : '🇺🇸';
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
