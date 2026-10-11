// Lavender Logistics - Static Multi-View Showcase Controller
// 100% Client-Side - Compatible with file:/// and GitHub Pages

// Application Global State
const state = {
  activeView: 'landing',
  cart: [
    { id: 1, name: 'كرتون حليب طازج كامل الدسم (12 لتر)', price: 68, qty: 15, unit: 'كرتون', temp: 'مبرد (+4°C)' },
    { id: 2, name: 'حبوب قهوة مختصة كولومبية إكسلسو', price: 95, qty: 10, unit: 'كجم', temp: 'جاف' },
    { id: 3, name: 'قوالب كيك فاخرة مشكلة (تموين كافيهات)', price: 140, qty: 4, unit: 'قالب', temp: 'مبرد (+4°C)' }
  ],
  locations: [
    { id: 1, name: 'فرع العليا - طريق التحلية', city: 'الرياض', notes: 'بوابة الاستلام الخلفية - هاتف الفرع 0114567890', isDefault: true },
    { id: 2, name: 'فرع طريق الملك عبد الله', city: 'الرياض', notes: 'التحميل قبل الساعة 7:00 صباحاً', isDefault: false },
    { id: 3, name: 'المستودع المركزي - السلي', city: 'الرياض', notes: 'مستودع التبريد والتخزين الرئيسي', isDefault: false }
  ],
  activeLocationIndex: 0,
  orderTimelineStep: 5,
  telemetryTemp: 2.4,
  isBillStamped: false
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initLucideIcons();
  initCalculator();
  initTelemetryLoop();
  updateCartUI();
  setupEventListeners();
});

function initLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// -------------------------------------------------------------
// 1. Client-Side Hash Router (file:/// & GitHub Pages Friendly)
// -------------------------------------------------------------
const validViews = [
  'landing', 'home', 'shop', 'order_step_one', 'order_step_two',
  'tracking', 'order_detail', 'order_list', 'locations', 'login', 'signup', 'admin'
];

function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  let hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (!hash || !validViews.includes(hash)) {
    hash = 'landing';
  }
  navigateTo(hash, false);
}

function navigateTo(viewName, updateHash = true) {
  if (!validViews.includes(viewName)) viewName = 'landing';
  state.activeView = viewName;

  if (updateHash) {
    window.location.hash = `#/${viewName}`;
  }

  // Hide all view containers
  document.querySelectorAll('.app-view').forEach(el => {
    el.classList.add('hidden');
  });

  // Show active view
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update Quick Switcher Pills Active State
  document.querySelectorAll('.quick-pill').forEach(pill => {
    if (pill.dataset.view === viewName) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  // Re-render icons for newly displayed view
  initLucideIcons();
}

// -------------------------------------------------------------
// 2. Interactive Cold-Chain Price Calculator
// -------------------------------------------------------------
function initCalculator() {
  const originEl = document.getElementById('calcOrigin');
  const destEl = document.getElementById('calcDest');
  const vehicleEl = document.getElementById('calcVehicle');
  const tempModeEls = document.querySelectorAll('input[name="tempMode"]');
  
  if (!originEl || !destEl || !vehicleEl) return;

  const distanceValEl = document.getElementById('calcResultDistance');
  const timeValEl = document.getElementById('calcResultTime');
  const priceValEl = document.getElementById('calcResultPrice');
  const tempDisplayEl = document.getElementById('calcResultTemp');
  const whatsappCtaEl = document.getElementById('calcWhatsappCta');

  function calculate() {
    const origin = originEl.value;
    const dest = destEl.value;
    const vehicle = vehicleEl.value;
    let tempMode = 'مبرد';
    tempModeEls.forEach(el => {
      if (el.checked) tempMode = el.value;
    });

    const distances = {
      'الرياض-الرياض': 45,
      'الرياض-الخرج': 85,
      'الرياض-القصيم': 360,
      'الرياض-الدمام': 410,
      'الرياض-جدة': 960,
      'جدة-مكة المكرمة': 85,
      'جدة-المدينة المنورة': 430,
      'الدمام-الخبر': 30,
    };

    const key = `${origin}-${dest}`;
    const revKey = `${dest}-${origin}`;
    const distanceKm = distances[key] || distances[revKey] || (origin === dest ? 50 : 520);

    let vRate = 1.0;
    if (vehicle.includes('دينا')) vRate = 1.7;
    else if (vehicle.includes('كبرى')) vRate = 3.0;
    else if (vehicle.includes('وانيت')) vRate = 1.0;
    else if (vehicle.includes('حافلة')) vRate = 1.4;

    let tRate = 1.0;
    let tempText = 'جاف (+25°C)';
    if (tempMode === 'مبرد') {
      tRate = 1.25;
      tempText = 'مبرد (+0°C إلى +4°C)';
    } else if (tempMode === 'مجمد') {
      tRate = 1.45;
      tempText = 'مجمد (-18°C إلى -22°C)';
    }

    const baseFare = origin === dest ? 200 : 380;
    const totalCost = Math.round(baseFare + (distanceKm * 1.55 * vRate * tRate));
    const hoursEst = Math.max(1, Math.round(distanceKm / 65));

    if (distanceValEl) distanceValEl.innerText = `${distanceKm} كم`;
    if (timeValEl) timeValEl.innerText = `${hoursEst} ساعة تقريباً`;
    if (tempDisplayEl) tempDisplayEl.innerText = tempText;
    if (priceValEl) priceValEl.innerHTML = `${totalCost} <span class="text-sm font-normal text-violet-400">ر.س</span>`;

    if (whatsappCtaEl) {
      const msg = encodeURIComponent(`مرحباً لافندر للخدمات اللوجستية، أود حجز شحنة ببيانات:\n- مسار: من ${origin} إلى ${dest}\n- نوع المركبة: ${vehicle}\n- نمط التبريد: ${tempMode}\n- التقدير: حوالي ${totalCost} ر.س\nأرجو تزويدي بعرض رسمي.`);
      whatsappCtaEl.href = `https://wa.me/966508500685?text=${msg}`;
    }
  }

  originEl.addEventListener('change', calculate);
  destEl.addEventListener('change', calculate);
  vehicleEl.addEventListener('change', calculate);
  tempModeEls.forEach(el => el.addEventListener('change', calculate));

  calculate();
}

// -------------------------------------------------------------
// 3. Telemetry Ticks (Cold-Chain IoT Simulation)
// -------------------------------------------------------------
function initTelemetryLoop() {
  const tempEls = document.querySelectorAll('.live-temp-display');
  setInterval(() => {
    state.telemetryTemp = (2.2 + Math.random() * 0.7).toFixed(1);
    tempEls.forEach(el => {
      el.innerText = `+${state.telemetryTemp}°C`;
    });
  }, 3500);
}

// -------------------------------------------------------------
// 4. Cart Operations
// -------------------------------------------------------------
function updateCartUI() {
  const cartCountBadges = document.querySelectorAll('.cart-count-badge');
  const cartItemsContainer = document.getElementById('cartItemsList');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartDeliveryFeeEl = document.getElementById('cartDeliveryFee');
  const cartTotalEl = document.getElementById('cartTotal');

  const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryFee = 180; // Standard Cold Chain dispatch fee
  const grandTotal = subtotal + deliveryFee;

  cartCountBadges.forEach(b => {
    b.innerText = totalCount;
    b.style.display = totalCount > 0 ? 'inline-flex' : 'none';
  });

  if (cartSubtotalEl) cartSubtotalEl.innerText = `${subtotal.toLocaleString()} ر.س`;
  if (cartDeliveryFeeEl) cartDeliveryFeeEl.innerText = `${deliveryFee} ر.س`;
  if (cartTotalEl) cartTotalEl.innerText = `${grandTotal.toLocaleString()} ر.س`;

  if (cartItemsContainer) {
    if (state.cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="text-center py-8 text-slate-400">
          <i data-lucide="shopping-bag" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
          <p>السلة فارغة حالياً</p>
        </div>
      `;
    } else {
      cartItemsContainer.innerHTML = state.cart.map(item => `
        <div class="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div class="flex-1">
            <h5 class="text-xs font-bold text-slate-900">${item.name}</h5>
            <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
              <span class="bg-lavender-100 text-lavender-700 px-2 py-0.5 rounded-md font-semibold">${item.temp}</span>
              <span>${item.price} ر.س / ${item.unit}</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden text-xs">
              <button onclick="changeCartQty(${item.id}, -1)" class="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold">-</button>
              <span class="px-3 py-1 font-bold text-slate-900 font-mono">${item.qty}</span>
              <button onclick="changeCartQty(${item.id}, 1)" class="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold">+</button>
            </div>
            <span class="font-bold text-xs text-lavender-900 min-w-[70px] text-left font-mono">${(item.price * item.qty).toLocaleString()} ر.س</span>
          </div>
        </div>
      `).join('');
    }
  }

  initLucideIcons();
}

window.changeCartQty = function(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      state.cart = state.cart.filter(i => i.id !== id);
    }
    updateCartUI();
  }
};

window.addItemToCart = function(name, price, unit, temp) {
  const existing = state.cart.find(i => i.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({
      id: Date.now(),
      name,
      price,
      qty: 1,
      unit,
      temp
    });
  }
  updateCartUI();
  showToast(`تمت إضافة "${name}" إلى السلة`);
};

// -------------------------------------------------------------
// 5. Stamped Bill (e-POD) Operations
// -------------------------------------------------------------
window.handleStampBillUpload = function() {
  const btn = document.getElementById('btnUploadEpodStatic');
  const badge = document.getElementById('epodSuccessBadgeStatic');
  if (!btn || !badge) return;

  btn.disabled = true;
  btn.innerHTML = `<span class="animate-spin inline-block ml-2">⏳</span> جاري التحقق من ختم المستلم...`;

  setTimeout(() => {
    btn.classList.add('hidden');
    badge.classList.remove('hidden');
    state.isBillStamped = true;
    showToast('تم اعتماد ورفع الفاتورة المختومة (e-POD) بنجاح');
  }, 1200);
};

// -------------------------------------------------------------
// 6. Setup Event Listeners & Modals
// -------------------------------------------------------------
function setupEventListeners() {
  // Quick Switcher Pills click handling
  document.querySelectorAll('.quick-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const target = pill.dataset.view;
      if (target) navigateTo(target);
    });
  });

  // Mobile menu toggle
  const mobileBtn = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileMenuDrawer');
  if (mobileBtn && mobileDrawer) {
    mobileBtn.addEventListener('click', () => {
      mobileDrawer.classList.toggle('hidden');
    });
  }

  // Quote form submission simulation
  const quoteForm = document.getElementById('staticQuoteForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const ref = `QUO-${Math.floor(100000 + Math.random() * 900000)}`;
      document.getElementById('staticQuoteRef').innerText = ref;
      document.getElementById('quoteSuccessModal').classList.remove('hidden');
      quoteForm.reset();
    });
  }

  // Close modals
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.app-modal').forEach(m => m.classList.add('hidden'));
    });
  });
}

// Simple Toast Notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-6 left-6 z-50 bg-violet-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-violet-500/40 text-sm flex items-center gap-3 transition-all transform duration-300 translate-y-4 opacity-0';
  toast.innerHTML = `
    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
    <span class="font-medium">${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
