/* ============================================
   UTILITY — IMAGE COMPRESSOR
============================================ */
function compressImage(dataUrl, callback) {
  var img = new Image();
  img.onload = function() {
    var steps = [
      { max: 800, q: 0.70 },
      { max: 600, q: 0.60 },
      { max: 450, q: 0.55 },
      { max: 320, q: 0.50 },
      { max: 220, q: 0.45 }
    ];
    var TARGET = 350 * 1024; // 350 KB base64 target
    var result = null;
    for (var i = 0; i < steps.length; i++) {
      var MAX = steps[i].max, q = steps[i].q;
      var w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else       { w = Math.round(w * MAX / h); h = MAX; }
      }
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      result = canvas.toDataURL('image/jpeg', q);
      if (result.length <= TARGET) break;
    }
    callback(result);
  };
  img.src = dataUrl;
}

/* ============================================
   ADMIN — PHOTO CHANGER
   Trigger: click logo NTT 3 times quickly
============================================ */
(function () {
  const trigger   = document.getElementById('adminTrigger');
  const panel     = document.getElementById('adminPanel');
  const closeBtn  = document.getElementById('adminClose');
  const fileInput = document.getElementById('photoInput');
  const profileImg = document.getElementById('profileImg');
  const fallback   = document.getElementById('photoFallback');

  // Load saved photo from localStorage on page load
  const saved = localStorage.getItem('ntt_profile_photo');
  if (saved && profileImg) {
    profileImg.src = saved;
    profileImg.style.display = 'block';
    if (fallback) fallback.style.display = 'none';
  }

  function setAllAdminMode(on) {
    panel.classList.toggle('visible', on);
    var exportBtn = document.getElementById('adminExportBtn');
    if (exportBtn) exportBtn.classList.toggle('visible', on);
    try { Slideshow.setAdminMode(on); } catch(e) {}
    try { Projects.setAdminMode(on); } catch(e) {}
    try { SectionAdmin.setAdminMode(on); } catch(e) {}
    try { CertDetails.setAdminMode(on); } catch(e) {}
    try { EduDetails.setAdminMode(on); } catch(e) {}
    try { StaticAdmin.setAdminMode(on); } catch(e) {}
    try {
      if (on) ContentEditor.enable();
      else ContentEditor.disable();
    } catch(e) {}
  }

  // Password gate
  const ADMIN_PASS = '190399';
  const pwOverlay  = document.getElementById('pwOverlay');
  const pwInput    = document.getElementById('pwInput');
  const pwError    = document.getElementById('pwError');
  const pwConfirm  = document.getElementById('pwConfirm');

  function openPasswordModal() {
    pwInput.value = '';
    pwError.classList.remove('visible');
    pwInput.classList.remove('error');
    pwOverlay.classList.add('open');
    setTimeout(() => pwInput.focus(), 80);
  }

  function closePasswordModal() {
    pwOverlay.classList.remove('open');
    pwInput.value = '';
  }

  function checkPassword() {
    if (pwInput.value === ADMIN_PASS) {
      closePasswordModal();
      adminActive = true;
      setAllAdminMode(true);
    } else {
      pwError.classList.add('visible');
      pwInput.classList.add('error');
      pwInput.value = '';
      setTimeout(() => {
        pwInput.classList.remove('error');
        pwInput.focus();
      }, 450);
    }
  }

  var pwClose = document.getElementById('pwClose');
  if (pwClose) pwClose.addEventListener('click', closePasswordModal);

  pwConfirm.addEventListener('click', checkPassword);
  pwInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkPassword();
    if (e.key === 'Escape') closePasswordModal();
    pwError.classList.remove('visible');
  });
  pwOverlay.addEventListener('click', (e) => {
    if (e.target === pwOverlay) closePasswordModal();
  });

  // Secret keyword: type "ntt" anywhere → open password modal
  let adminActive = false;
  let keyBuffer = '';
  document.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('admin-edit') && e.target.isContentEditable) return;
    if (pwOverlay.classList.contains('open')) return;
    keyBuffer += e.key.toLowerCase();
    if (keyBuffer.length > 3) keyBuffer = keyBuffer.slice(-3);
    if (keyBuffer === 'ntt') {
      keyBuffer = '';
      if (adminActive) {
        adminActive = false;
        setAllAdminMode(false);
      } else {
        openPasswordModal();
      }
    }
  });

  // Triple-click logo as backup
  let clicks = 0, clickTimer = null;
  trigger.addEventListener('click', () => {
    clicks++;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clicks = 0; }, 700);
    if (clicks >= 3) {
      clicks = 0;
      if (adminActive) {
        adminActive = false;
        setAllAdminMode(false);
      } else {
        openPasswordModal();
      }
    }
  });

  // Close button
  closeBtn.addEventListener('click', () => {
    adminActive = false;
    setAllAdminMode(false);
  });

  // File chosen — update photo everywhere + save to localStorage
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;

      // Update hero photo
      if (profileImg) {
        profileImg.src = dataUrl;
        profileImg.style.display = 'block';
        if (fallback) fallback.style.display = 'none';
      }

      // Save so it persists after refresh
      try {
        localStorage.setItem('ntt_profile_photo', dataUrl);
      } catch (_) {}

      panel.classList.remove('visible');

      // Show success flash
      const flash = document.createElement('div');
      flash.textContent = '✓ Photo updated!';
      flash.style.cssText = `
        position:fixed; bottom:2rem; left:50%; transform:translateX(-50%);
        background:#34d399; color:#000; padding:0.6rem 1.4rem;
        border-radius:8px; font-weight:700; font-size:0.88rem;
        z-index:999; animation:fadeSlideDown 0.3s ease;
      `;
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 2500);
    };
    reader.readAsDataURL(file);
  });
})();


/* ============================================
   PARTICLE BACKGROUND
============================================ */
(function () {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let W, H, dots = [], mouse = { x: -999, y: -999 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initDots() {
    dots = [];
    const count = Math.floor((W * H) / 12000);
    for (let i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        a: Math.random()
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw connections
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(56,189,248,${0.08 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // Draw dots
    dots.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56,189,248,${0.3 + d.a * 0.4})`;
      ctx.fill();

      // Move
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > W) d.vx *= -1;
      if (d.y < 0 || d.y > H) d.vy *= -1;

      // Mouse repel
      const mx = d.x - mouse.x, my = d.y - mouse.y;
      const md = Math.sqrt(mx * mx + my * my);
      if (md < 80) {
        d.x += (mx / md) * 0.8;
        d.y += (my / md) * 0.8;
      }
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); initDots(); });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  resize();
  initDots();
  draw();
})();

/* ============================================
   CURSOR GLOW
============================================ */
(function () {
  const glow = document.getElementById('cursor-glow');
  window.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
})();

/* ============================================
   NAVBAR SCROLL
============================================ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ============================================
   MOBILE MENU
============================================ */
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

menuToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ============================================
   LANGUAGE TOGGLE (EN / KR)
============================================ */
const langToggle = document.getElementById('langToggle');
let lang = 'en';

langToggle.addEventListener('click', () => {
  lang = lang === 'en' ? 'kr' : 'en';
  langToggle.innerHTML = `<span class="lang-icon">🌐</span> ${lang === 'en' ? 'KR' : 'EN'}`;
  document.documentElement.lang = lang === 'en' ? 'en' : 'ko';

  document.querySelectorAll('[data-en]').forEach(el => {
    const val = lang === 'en' ? el.dataset.en : el.dataset.kr;
    if (val !== undefined) el.innerHTML = val;
  });

  // Re-trigger typed animation with new language
  startTyped();
});

/* ============================================
   TYPING ANIMATION
============================================ */
const typedPhrases = {
  en: ['IT Consultant', 'Freelancer', 'MBA Graduate', 'Multilingual Professional'],
  kr: ['IT 컨설턴트', '프리랜서', 'MBA 졸업생', '다국어 전문가']
};

let typedIndex = 0, charIndex = 0, isDeleting = false, typedTimeout;

function startTyped() {
  clearTimeout(typedTimeout);
  typedIndex = 0; charIndex = 0; isDeleting = false;
  typeLoop();
}

function typeLoop() {
  const phrases = typedPhrases[lang];
  const current = phrases[typedIndex % phrases.length];
  const el = document.getElementById('typedText');
  if (!el) return;

  if (isDeleting) {
    el.textContent = current.substring(0, charIndex - 1);
    charIndex--;
  } else {
    el.textContent = current.substring(0, charIndex + 1);
    charIndex++;
  }

  let speed = isDeleting ? 60 : 100;

  if (!isDeleting && charIndex === current.length) {
    speed = 1800;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    typedIndex++;
    speed = 400;
  }

  typedTimeout = setTimeout(typeLoop, speed);
}

startTyped();

/* ============================================
   COUNTER ANIMATION
============================================ */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  let current = 0;
  const increment = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current = Math.min(current + increment, target);
    el.textContent = current + (target > 10 ? '+' : '');
    if (current >= target) clearInterval(timer);
  }, 40);
}

/* ============================================
   SKILL BAR ANIMATION
============================================ */
function animateSkillBars() {
  document.querySelectorAll('.skill-row').forEach(row => {
    const fill = row.querySelector('.skill-fill');
    const level = row.dataset.level;
    if (fill && level) {
      fill.style.width = level + '%';
    }
  });
}

/* ============================================
   INTERSECTION OBSERVER (reveal + triggers)
============================================ */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const el = entry.target;
    el.classList.add('visible');

    // Counter
    if (el.classList.contains('stat-num')) {
      animateCounter(el);
    }

    // Skill bars (trigger when skill block is visible)
    if (el.classList.contains('skill-block')) {
      setTimeout(animateSkillBars, 300);
    }

    observer.unobserve(el);
  });
}, { threshold: 0.15 });

// Observe reveal elements
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* --- Skill ticker (infinite conveyor belt) --- */
function setupSkillTicker(container) {
  if (!container) return;
  var rows = Array.from(container.querySelectorAll('.skill-row'));
  if (rows.length === 0) return;
  var existing = container.querySelector('.skill-ticker');
  if (existing) existing.remove();
  var ticker = document.createElement('div');
  ticker.className = 'skill-ticker';
  rows.forEach(function(row) { ticker.appendChild(row); });
  rows.forEach(function(row) {
    var clone = row.cloneNode(true);
    ticker.appendChild(clone);
  });
  container.appendChild(ticker);
}

// Observe stat numbers
document.querySelectorAll('.stat-num').forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});

/* ─── Activity photos & conditional click-hints ─── */
var actDetails = {};
function loadActDetails() {
  try { actDetails = JSON.parse(localStorage.getItem('ntt_act_details') || '{}'); } catch(e) {}
}

function refreshClickHints() {
  var certDets = {}, eduDets = {};
  try { certDets = JSON.parse(localStorage.getItem('ntt_cert_details') || '{}'); } catch(e) {}
  try { eduDets  = JSON.parse(localStorage.getItem('ntt_edu_details')  || '{}'); } catch(e) {}
  document.querySelectorAll('.cert-card[data-cert-id]').forEach(function(card) {
    var hint = card.querySelector('.click-hint');
    if (hint) hint.style.display = (certDets[card.dataset.certId]||{}).image ? 'flex' : 'none';
  });
  document.querySelectorAll('.edu-item[data-edu-id]').forEach(function(item) {
    var hint = item.querySelector('.click-hint');
    if (hint) hint.style.display = (eduDets[item.dataset.eduId]||{}).image ? 'flex' : 'none';
  });
  document.querySelectorAll('.act-item[data-act-id]').forEach(function(item) {
    var imgs = (actDetails[item.dataset.actId]||{}).images||[];
    var hint = item.querySelector('.click-hint');
    if (hint) hint.style.display = imgs.length ? 'flex' : 'none';
    item.classList.toggle('has-photos', imgs.length > 0);
  });
}

function renderActPhotoStrip(strip, images) {
  if (!strip || !images.length) return;
  strip.innerHTML = '';
  var rots = [-3, 1.5, -1.8, 2.5, -2, 1.2, -1.5, 2.2];
  images.forEach(function(url, i) {
    var thread = document.createElement('div');
    thread.className = 'act-photo-thread';
    thread.style.setProperty('--rot', rots[i % rots.length] + 'deg');
    thread.innerHTML = '<div class="act-thread-line"></div>'+
      '<div class="act-photo-frame"><img src="'+url.replace(/[<>"]/g,'')+'" alt="" loading="lazy"></div>';
    strip.appendChild(thread);
  });
  var stripIo = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.act-photo-thread').forEach(function(t, i) {
        setTimeout(function() { t.classList.add('drop-in'); }, i * 130);
      });
      stripIo.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  stripIo.observe(strip);
}

/* Activity photo accordion (click to expand/collapse with thread drop) */
(function() {
  function openActPhotos(item) {
    var actId = item.dataset.actId;
    var imgs = (actDetails[actId] || {}).images || [];
    if (!imgs.length) return;
    var strip = item.querySelector('.act-photos-strip');
    if (!strip) return;

    // Render threads (without drop-in yet)
    strip.innerHTML = '';
    var rots = [-3, 1.5, -1.8, 2.5, -2, 1.2, -1.5, 2.2];
    imgs.forEach(function(url, i) {
      var thread = document.createElement('div');
      thread.className = 'act-photo-thread';
      thread.style.setProperty('--rot', rots[i % rots.length] + 'deg');
      thread.innerHTML = '<div class="act-thread-line"></div>'+
        '<div class="act-photo-frame"><img src="'+url.replace(/[<>"]/g,'')+'" alt="" loading="lazy"></div>';
      strip.appendChild(thread);
    });

    item.classList.add('photos-open');

    // Stagger drop-in left to right after strip expands
    setTimeout(function() {
      strip.querySelectorAll('.act-photo-thread').forEach(function(t, i) {
        setTimeout(function() { t.classList.add('drop-in'); }, i * 120);
      });
    }, 80);

    // Dim all other act-items
    document.querySelectorAll('.act-item[data-act-id]').forEach(function(el) {
      if (el !== item) el.classList.add('photos-dimmed');
    });
  }

  function closeActPhotos(item) {
    item.classList.remove('photos-open');
    var strip = item.querySelector('.act-photos-strip');
    if (strip) {
      strip.querySelectorAll('.act-photo-thread').forEach(function(t) {
        t.classList.remove('drop-in');
      });
    }
    document.querySelectorAll('.act-item[data-act-id]').forEach(function(el) {
      el.classList.remove('photos-dimmed');
    });
  }

  document.addEventListener('click', function(e) {
    if (e.target.closest('.item-admin-btns')) return;
    if (e.target.closest('.act-pmgr')) return;
    var item = e.target.closest('.act-item[data-act-id]');
    if (!item) return;
    var imgs = (actDetails[item.dataset.actId] || {}).images || [];
    if (!imgs.length) return;

    var isOpen = item.classList.contains('photos-open');
    // Close any open item first
    document.querySelectorAll('.act-item.photos-open').forEach(function(el) {
      closeActPhotos(el);
    });
    if (!isOpen) openActPhotos(item);
  });
})();

/* ─── Activity photo upload helpers (used by index modal + photo manager) ─── */
async function siAddActPhotos(actId, input) {
  var sb = window._sb; var cfg = window._sbCfg;
  if (!sb || !cfg) { alert('Supabase chưa sẵn sàng'); return; }
  var tid = actId || String(Date.now());
  var statusId = 'si-ps-' + (actId || 'new');
  var statusEl = document.getElementById(statusId);
  if (statusEl) statusEl.textContent = 'Đang upload...';
  if (!actDetails[tid]) actDetails[tid] = { images: [] };
  if (!actDetails[tid].images) actDetails[tid].images = [];
  for (var i = 0; i < input.files.length; i++) {
    var file = input.files[i];
    var path = 'act/' + tid + '/' + Date.now() + '_' + file.name.replace(/\s/g,'_');
    var up = await sb.storage.from(cfg.bucket).upload(path, file, { cacheControl: '3600', upsert: true });
    if (up.error) {
      if (statusEl) statusEl.textContent = '❌ Lỗi: ' + up.error.message;
      input.value = ''; return;
    }
    actDetails[tid].images.push(sb.storage.from(cfg.bucket).getPublicUrl(path).data.publicUrl);
  }
  input.value = '';
  var container = document.getElementById('si-act-photos');
  if (container && window._renderSiActPhotos) window._renderSiActPhotos(container, actId);
  var s = document.getElementById(statusId);
  if (s) s.textContent = '✅ ' + actDetails[tid].images.length + ' ảnh';
}

function siDelActPhoto(actId, idx) {
  if (!actId || !actDetails[actId]) return;
  actDetails[actId].images.splice(idx, 1);
  var container = document.getElementById('si-act-photos');
  if (container && window._renderSiActPhotos) window._renderSiActPhotos(container, actId);
}

/* ─── Inline activity photo manager (admin mode on index page) ─── */
function openActPhotoMgr(actId) {
  var existing = document.getElementById('act-pmgr-' + actId);
  if (existing) { existing.remove(); return; }
  var card = document.querySelector('.act-item[data-act-id="' + actId + '"]');
  if (!card) return;
  var panel = document.createElement('div');
  panel.id = 'act-pmgr-' + actId;
  panel.className = 'act-pmgr';
  renderActPmgr(panel, actId);
  card.parentNode.insertBefore(panel, card.nextSibling);
}

function renderActPmgr(panel, actId) {
  var imgs = (actDetails[actId] || {}).images || [];
  panel.innerHTML =
    '<div class="act-pmgr-header"><span>📷 Quản lý ảnh</span>'+
    '<button class="act-pmgr-close" onclick="document.getElementById(\'act-pmgr-'+actId+'\').remove()">✕</button></div>'+
    '<div class="act-pmgr-grid">'+
    imgs.map(function(url, i) {
      return '<div class="act-pmgr-thumb">'+
        '<img src="'+url.replace(/[<>"]/g,'')+'" alt="">'+
        '<button class="act-pmgr-del" onclick="delActPmgrPhoto(\''+actId+'\','+i+')">✕</button>'+
      '</div>';
    }).join('')+
    '</div>'+
    '<label class="act-pmgr-add"><input type="file" accept="image/*" multiple onchange="addActPmgrPhotos(\''+actId+'\',this)"> + Thêm ảnh</label>'+
    '<div class="act-pmgr-status" id="act-pmgr-status-'+actId+'"></div>';
}

async function addActPmgrPhotos(actId, input) {
  var sb = window._sb; var cfg = window._sbCfg;
  var statusEl = document.getElementById('act-pmgr-status-' + actId);
  if (!sb || !cfg) {
    if (statusEl) statusEl.textContent = '❌ Supabase chưa sẵn sàng, tải lại trang';
    return;
  }
  if (statusEl) statusEl.textContent = 'Đang upload...';
  if (!actDetails[actId]) actDetails[actId] = { images: [] };
  if (!actDetails[actId].images) actDetails[actId].images = [];
  try {
    for (var i = 0; i < input.files.length; i++) {
      var file = input.files[i];
      var path = 'act/' + actId + '/' + Date.now() + '_' + file.name.replace(/\s/g,'_');
      var up = await sb.storage.from(cfg.bucket).upload(path, file, { cacheControl: '3600', upsert: true });
      if (up.error) { if (statusEl) statusEl.textContent = '❌ Lỗi: ' + up.error.message; input.value = ''; return; }
      actDetails[actId].images.push(sb.storage.from(cfg.bucket).getPublicUrl(path).data.publicUrl);
    }
    input.value = '';
    await saveActDetailsFromIndex(actId, statusEl);
  } catch(e) {
    if (statusEl) statusEl.textContent = '❌ Lỗi: ' + e.message;
    input.value = '';
  }
}

async function delActPmgrPhoto(actId, idx) {
  if (!actDetails[actId] || !actDetails[actId].images) return;
  if (!confirm('Xóa ảnh này?')) return;
  actDetails[actId].images.splice(idx, 1);
  var panel = document.getElementById('act-pmgr-' + actId);
  if (panel) renderActPmgr(panel, actId);
  await saveActDetailsFromIndex(actId, null);
}

async function saveActDetailsFromIndex(actId, statusEl) {
  var sb = window._sb; if (!sb) return;
  var str = JSON.stringify(actDetails);
  localStorage.setItem('ntt_act_details', str);
  await sb.from('portfolio_data').upsert({ key: 'ntt_act_details', value: str, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  await sb.from('portfolio_data').upsert({ key: '__version', value: Date.now().toString(), updated_at: new Date().toISOString() }, { onConflict: 'key' });
  localStorage.removeItem('ntt_sb_ts');
  var card = document.querySelector('.act-item[data-act-id="' + actId + '"]');
  if (card) {
    var strip = card.querySelector('.act-photos-strip');
    if (strip) { strip.innerHTML = ''; card.classList.remove('photos-open'); }
    var hasImgs = (actDetails[actId].images||[]).length > 0;
    var hint = card.querySelector('.click-hint');
    if (hint) hint.style.display = hasImgs ? 'flex' : 'none';
    card.classList.toggle('has-photos', hasImgs);
  }
  var panel = document.getElementById('act-pmgr-' + actId);
  if (panel) renderActPmgr(panel, actId);
  if (statusEl) statusEl.textContent = '✅ Đã lưu!';
}

/* ─── Global Supabase sync helper (fire-and-forget) ─── */
function syncToSupabase(key, value, _retry) {
  var sb = window._sb;
  if (!sb) {
    if ((_retry || 0) >= 3) { console.warn('[ntt-sync] _sb không tồn tại, bỏ qua:', key); return; }
    setTimeout(function() { syncToSupabase(key, value, (_retry || 0) + 1); }, 2000);
    return;
  }
  var str = typeof value === 'string' ? value : JSON.stringify(value);
  sb.from('portfolio_data')
    .upsert({ key: key, value: str, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .then(function(res) {
      if (res.error) { console.warn('[ntt-sync] lỗi upsert', key, ':', res.error.message); return; }
      return sb.from('portfolio_data').upsert(
        { key: '__version', value: Date.now().toString(), updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    })
    .then(function(res) {
      if (res && res.error) { console.warn('[ntt-sync] lỗi bump version:', res.error.message); return; }
      localStorage.removeItem('ntt_sb_ts');
    })
    .catch(function(e) { console.warn('[ntt-sync] lỗi ghi', key, ':', e && (e.message || e)); });
}

/* ============================================
   TILT EFFECT ON CARDS
============================================ */
document.querySelectorAll('.edu-card, .exp-card, .ccard').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 8;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 8;
    card.style.transform = `perspective(600px) rotateX(${-y}deg) rotateY(${x}deg) translateY(-3px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ============================================
   ABOUT SLIDESHOW — 1 large + 2 thumbs conveyor
============================================ */
const Slideshow = (function () {
  const container   = document.getElementById('aboutSlideshow');
  const slideMain   = document.getElementById('slideMain');
  const slideMainImg= document.getElementById('slideMainImg');
  const slideLeft   = document.getElementById('slideLeft');
  const slideLeftImg= document.getElementById('slideLeftImg');
  const slideRight  = document.getElementById('slideRight');
  const slideRightImg=document.getElementById('slideRightImg');
  const dotsWrap    = document.getElementById('slideshowDots');
  const arrowPrev   = document.getElementById('arrowPrev');
  const arrowNext   = document.getElementById('arrowNext');
  const addBtn      = document.getElementById('slideshowAddBtn');
  const fileInput   = document.getElementById('galleryInput');
  const delMain     = document.getElementById('delMain');
  const delLeft     = document.getElementById('delLeft');
  const delRight    = document.getElementById('delRight');

  const STORAGE_KEY = 'ntt_gallery_photos';
  const INTERVAL_MS = 3000;

  let photos = [];
  let currentIndex = 0;
  let timer = null;
  let isAnimating = false;
  let isAdminMode = false;

  const defaults = ['images/about.jpg', 'images/gallery2.jpg'];

  function loadPhotos() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { photos = JSON.parse(saved); } catch (_) { photos = []; }
    }
    if (photos.length === 0) photos = [...defaults];
  }

  function savePhotos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  }

  function getPhoto(offset) {
    const n = photos.length;
    if (n === 0) return '';
    return photos[((currentIndex + offset) % n + n) % n];
  }

  function setImg(img, src) {
    if (src) { img.src = src; img.style.opacity = '1'; }
    else      { img.src = ''; img.style.opacity = '0'; }
  }

  function renderSlots() {
    setImg(slideMainImg,  getPhoto(0));
    setImg(slideLeftImg,  photos.length > 1 ? getPhoto(1) : '');
    setImg(slideRightImg, photos.length > 2 ? getPhoto(2) : '');
    updateDots();
  }

  function updateDots() {
    dotsWrap.innerHTML = '';
    if (photos.length <= 1) return;
    photos.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 's-dot' + (i === currentIndex ? ' active' : '');
      dot.addEventListener('click', () => { if (!isAnimating) goTo(i); });
      dotsWrap.appendChild(dot);
    });
  }

  function goTo(idx) {
    if (idx === currentIndex || isAnimating) return;
    advance(idx > currentIndex ? 1 : -1, idx);
  }

  function advance(dir, targetIdx) {
    if (isAnimating || photos.length < 2) return;
    isAnimating = true;
    resetTimer();

    const newIndex = targetIdx !== undefined
      ? targetIdx
      : ((currentIndex + dir + photos.length) % photos.length);

    const exitX = dir > 0 ? -14 : 14;

    // Phase 1 — exit: all slots slide + fade out
    [slideMain, slideLeft, slideRight].forEach(el => {
      el.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
      el.style.opacity    = '0';
      el.style.transform  = `translateX(${exitX}px)`;
    });

    setTimeout(() => {
      // Update index and content while invisible
      currentIndex = newIndex;
      renderSlots();

      // Prepare entry positions (off-screen on entry side), no transition
      const entryX = dir > 0 ? 22 : -22;
      [slideMain, slideLeft, slideRight].forEach(el => {
        el.style.transition = 'none';
        el.style.opacity    = '0';
        el.style.transform  = `translateX(${entryX}px)`;
      });

      // Phase 2 — enter: staggered slide-in
      // Main uses a slight scale + Y lift to convey "jumping up" from thumb
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const dur = 'opacity 0.38s ease, transform 0.42s cubic-bezier(.22,1,.36,1)';

        slideMain.style.transition = dur;
        slideMain.style.opacity    = '1';
        slideMain.style.transform  = '';

        setTimeout(() => {
          slideLeft.style.transition = dur;
          slideLeft.style.opacity    = '1';
          slideLeft.style.transform  = '';
        }, 55);

        setTimeout(() => {
          slideRight.style.transition = dur;
          slideRight.style.opacity    = '1';
          slideRight.style.transform  = '';
        }, 110);

        setTimeout(() => { isAnimating = false; }, 540);
      }));
    }, 240);
  }

  function resetTimer() {
    clearInterval(timer);
    if (!isAdminMode) {
      timer = setInterval(() => advance(1), INTERVAL_MS);
    }
  }

  function spliceAndRender(idx) {
    photos.splice(((idx % photos.length) + photos.length) % photos.length, 1);
    if (photos.length > 0) currentIndex = currentIndex % photos.length;
    else currentIndex = 0;
    savePhotos();
    renderSlots();
  }

  // Arrow buttons
  arrowPrev.addEventListener('click', () => advance(-1));
  arrowNext.addEventListener('click', () => advance(1));

  // Delete buttons
  delMain.addEventListener('click', e => {
    e.stopPropagation();
    if (!photos.length) return;
    spliceAndRender(currentIndex);
  });
  delLeft.addEventListener('click', e => {
    e.stopPropagation();
    if (photos.length < 2) return;
    spliceAndRender(currentIndex + 1);
  });
  delRight.addEventListener('click', e => {
    e.stopPropagation();
    if (photos.length < 3) return;
    spliceAndRender(currentIndex + 2);
  });

  // Add photos
  addBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', e => {
    const files = Array.from(e.target.files);
    let loaded = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        photos.push(ev.target.result);
        if (++loaded === files.length) { savePhotos(); renderSlots(); }
      };
      reader.readAsDataURL(file);
    });
    fileInput.value = '';
  });

  function setAdminMode(on) {
    isAdminMode = on;
    container.classList.toggle('admin-mode', on);
    addBtn.classList.toggle('admin-visible', on);
    if (!on) resetTimer(); else clearInterval(timer);
  }

  function refresh() {
    loadPhotos();
    currentIndex = 0;
    renderSlots();
    resetTimer();
  }

  // Init
  loadPhotos();
  renderSlots();
  resetTimer();

  return { setAdminMode, refresh };
})();

/* ============================================
   CONTENT EDITOR (Admin Edit Mode)
============================================ */
const ContentEditor = (function () {
  const STORAGE_KEY = 'ntt_content';

  const EDIT_SELECTORS = [
    '.hero-desc',
    '.about-content p',
    '.edu-year',
    '.edu-card h3',
    '.edu-badge',
    '.edu-school',
    '.edu-desc',
    '.exp-card h3',
    '.exp-org',
    '.exp-list li',
    '.cert-score',
    '.cert-card h3',
    '.cert-org',
    '.cert-date',
    '.act-period',
    '.act-body h3',
    '.act-org',
    '.act-desc',
  ];

  function assignKeys() {
    EDIT_SELECTORS.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el, i) {
        var key = sel.replace(/[^a-zA-Z]/g, '_').replace(/_+/g, '_').replace(/^_|_$/, '');
        el.setAttribute('data-ck', key + '_' + i);
      });
    });
  }

  function loadContent() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      document.querySelectorAll('[data-ck]').forEach(function(el) {
        var s = saved[el.getAttribute('data-ck')];
        if (!s) return;
        if (s.html !== undefined) el.innerHTML = s.html;
        else if (s.en !== undefined) {
          if (el.dataset.en !== undefined) el.setAttribute('data-en', s.en);
          if (s.kr && el.dataset.kr !== undefined) el.setAttribute('data-kr', s.kr);
          el.innerHTML = lang === 'kr' ? (s.kr || s.en) : s.en;
        }
      });
    } catch (_) {}
  }

  function saveContent() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      document.querySelectorAll('[data-ck]').forEach(function(el) {
        var ck = el.getAttribute('data-ck');
        if (el.dataset.en !== undefined) {
          var prev = saved[ck] || {};
          if (lang === 'en') {
            saved[ck] = { en: el.innerHTML, kr: prev.kr || el.getAttribute('data-kr') || '' };
          } else {
            saved[ck] = { en: prev.en || el.getAttribute('data-en') || '', kr: el.innerHTML };
          }
          el.setAttribute('data-en', saved[ck].en);
          el.setAttribute('data-kr', saved[ck].kr);
        } else {
          saved[ck] = { html: el.innerHTML };
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      syncToSupabase(STORAGE_KEY, saved);
    } catch (_) {}
    showFlash('✓ Changes saved!');
  }

  function enable() {
    document.body.classList.add('admin-edit');
    document.querySelectorAll('[data-ck]').forEach(function(el) {
      el.contentEditable = 'true';
    });
    var sb = document.getElementById('adminSaveBtn');
    if (sb) sb.classList.add('visible');
    var rb = document.getElementById('adminResetBtn');
    if (rb) rb.classList.add('visible');
    var eb = document.getElementById('adminEditBtn');
    if (eb) eb.style.background = 'rgba(56,189,248,0.25)';
    showFlash('✏️ Click any highlighted text to edit. Click 💾 Save when done.', 4000);
  }

  function disable() {
    document.body.classList.remove('admin-edit');
    document.querySelectorAll('[data-ck]').forEach(function(el) {
      el.contentEditable = 'false';
    });
    var sb = document.getElementById('adminSaveBtn');
    if (sb) sb.classList.remove('visible');
    var rb = document.getElementById('adminResetBtn');
    if (rb) rb.classList.remove('visible');
    var eb = document.getElementById('adminEditBtn');
    if (eb) eb.style.background = '';
  }

  function resetContent() {
    if (!confirm('Reset all text content to original? This will remove all saved edits.')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    try { localStorage.removeItem('ntt_hidden'); } catch(e) {}
    window.location.reload();
  }

  function showFlash(msg, dur) {
    dur = dur || 2600;
    var f = document.createElement('div');
    f.textContent = msg;
    f.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#34d399;color:#000;padding:0.6rem 1.4rem;border-radius:8px;font-weight:700;font-size:0.88rem;z-index:9999;white-space:nowrap;pointer-events:none;';
    document.body.appendChild(f);
    setTimeout(function() { f.remove(); }, dur);
  }

  // Wire Save button
  var saveBtn = document.getElementById('adminSaveBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveContent);

  // Wire Reset button
  var resetBtn = document.getElementById('adminResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', resetContent);

  // Wire Edit button — toggles edit mode manually too
  var editBtn = document.getElementById('adminEditBtn');
  if (editBtn) editBtn.addEventListener('click', function() {
    if (document.body.classList.contains('admin-edit')) disable();
    else enable();
  });

  assignKeys();
  loadContent();

  return { enable: enable, disable: disable, saveContent: saveContent };
})();

/* ============================================
   PROJECTS — Admin CRUD
============================================ */
const Projects = (function () {
  const grid        = document.getElementById('projectsGrid');
  const empty       = document.getElementById('projEmpty');
  const adminBar    = document.getElementById('projAdminBar');
  const addBtn      = document.getElementById('projAddBtn');
  const overlay     = document.getElementById('pmOverlay');
  const pmTitle     = document.getElementById('pmTitle');
  const pmClose     = document.getElementById('pmClose');
  const pmCancel    = document.getElementById('pmCancel');
  const pmSaveBtn   = document.getElementById('pmSaveBtn');
  const pmName      = document.getElementById('pmName');
  const pmDesc      = document.getElementById('pmDesc');
  const pmTags      = document.getElementById('pmTags');
  const pmLink      = document.getElementById('pmLink');
  const pmImg       = document.getElementById('pmImg');
  const pmImgPreview= document.getElementById('pmImgPreview');

  const STORAGE_KEY = 'ntt_projects';
  let projects = [];
  let isAdminMode = false;
  let editingId = null;
  let pendingImage = null;

  function load() {
    try { projects = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (_) { projects = []; }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    syncToSupabase(STORAGE_KEY, projects);
  }

  function render() {
    grid.querySelectorAll('.proj-card').forEach(c => c.remove());
    empty.style.display = projects.length === 0 ? 'block' : 'none';

    projects.forEach(p => {
      const card = document.createElement('div');
      card.className = 'proj-card reveal';

      // Thumbnail
      const thumb = document.createElement('div');
      thumb.className = 'proj-thumb';
      if (p.image) {
        const img = document.createElement('img');
        img.src = p.image; img.alt = p.title;
        thumb.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.className = 'proj-thumb-placeholder';
        ph.textContent = '🖥️';
        thumb.appendChild(ph);
      }
      card.appendChild(thumb);

      // Body
      const body = document.createElement('div');
      body.className = 'proj-body';

      const h3 = document.createElement('h3');
      h3.textContent = p.title;
      body.appendChild(h3);

      const desc = document.createElement('p');
      desc.textContent = p.description;
      body.appendChild(desc);

      if (p.tags && p.tags.length) {
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'proj-tags';
        p.tags.forEach(t => {
          const s = document.createElement('span');
          s.textContent = t;
          tagsDiv.appendChild(s);
        });
        body.appendChild(tagsDiv);
      }

      if (p.link) {
        const a = document.createElement('a');
        a.href = p.link; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.className = 'proj-link';
        a.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> View →';
        body.appendChild(a);
      }

      card.appendChild(body);

      // Admin controls
      const adm = document.createElement('div');
      adm.className = 'proj-card-admin' + (isAdminMode ? ' visible' : '');

      const eb = document.createElement('button');
      eb.className = 'proj-edit-btn'; eb.title = 'Edit'; eb.textContent = '✏️';
      eb.addEventListener('click', e => { e.stopPropagation(); openModal(p.id); });
      adm.appendChild(eb);

      const db = document.createElement('button');
      db.className = 'proj-del-btn'; db.title = 'Delete'; db.textContent = '✕';
      db.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm('Delete "' + p.title + '"?')) { projects = projects.filter(x => x.id !== p.id); save(); render(); }
      });
      adm.appendChild(db);
      card.appendChild(adm);

      // Tilt
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  - 0.5) * 8;
        const y = ((e.clientY - r.top)  / r.height - 0.5) * 8;
        card.style.transform = `perspective(600px) rotateX(${-y}deg) rotateY(${x}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });

      grid.appendChild(card);
      observer.observe(card);
    });
  }

  function openModal(id) {
    editingId = id || null;
    pendingImage = null;
    pmImgPreview.style.display = 'none';
    pmImgPreview.src = '';

    if (id) {
      const p = projects.find(x => x.id === id);
      if (!p) return;
      pmTitle.textContent = 'Edit Project';
      pmName.value = p.title || '';
      pmDesc.value = p.description || '';
      pmTags.value = (p.tags || []).join(', ');
      pmLink.value = p.link || '';
      if (p.image) { pmImgPreview.src = p.image; pmImgPreview.style.display = 'block'; }
    } else {
      pmTitle.textContent = 'Add Project';
      pmName.value = ''; pmDesc.value = ''; pmTags.value = ''; pmLink.value = '';
    }
    overlay.classList.add('open');
    pmName.focus();
  }

  function closeModal() {
    overlay.classList.remove('open');
    pmImg.value = ''; pendingImage = null;
  }

  function saveProject() {
    const title = pmName.value.trim();
    if (!title) { pmName.style.borderColor = '#ef4444'; pmName.focus(); return; }
    pmName.style.borderColor = '';
    const description = pmDesc.value.trim();
    const tags = pmTags.value.split(',').map(t => t.trim()).filter(Boolean);
    const link = pmLink.value.trim();

    if (editingId) {
      const idx = projects.findIndex(p => p.id === editingId);
      if (idx >= 0) {
        projects[idx] = { ...projects[idx], title, description, tags, link };
        if (pendingImage) projects[idx].image = pendingImage;
      }
    } else {
      projects.push({ id: Date.now(), title, description, tags, link, image: pendingImage || '' });
    }
    save(); render(); closeModal();
    flashGreen('✓ Project saved!');
  }

  function flashGreen(msg) {
    const f = document.createElement('div');
    f.textContent = msg;
    f.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#34d399;color:#000;padding:0.6rem 1.4rem;border-radius:8px;font-weight:700;font-size:0.88rem;z-index:9999;pointer-events:none;';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 2400);
  }

  // Image preview
  pmImg.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => { pendingImage = ev.target.result; pmImgPreview.src = pendingImage; pmImgPreview.style.display = 'block'; };
    r.readAsDataURL(file);
  });

  addBtn.addEventListener('click', () => openModal(null));
  pmClose.addEventListener('click', closeModal);
  pmCancel.addEventListener('click', closeModal);
  pmSaveBtn.addEventListener('click', saveProject);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  pmName.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); pmDesc.focus(); } });

  function setAdminMode(on) {
    isAdminMode = on;
    adminBar.classList.toggle('visible', on);
    grid.querySelectorAll('.proj-card-admin').forEach(a => a.classList.toggle('visible', on));
  }

  load(); render();
  return { setAdminMode };
})();

/* ============================================
   CERTIFICATE DETAIL — in-place card expansion
============================================ */
var CertDetails = (function () {
  var STORAGE_KEY = 'ntt_cert_details';
  var details = {};
  var isAdmin = false;
  var expandedCard = null;
  var expandedId   = null;
  var pendingImg   = null;
  var editingId    = null;

  /* edit overlay elements (admin only) */
  var overlay      = document.getElementById('cdOverlay');
  var closeBtn     = document.getElementById('cdClose');
  var adminBar     = document.getElementById('cdAdminBar');
  var editForm     = document.getElementById('cdEditForm');
  var imgInput     = document.getElementById('cdImgInput');
  var uploadPreview= document.getElementById('cdUploadPreview');
  var clearImgBtn  = document.getElementById('cdClearImgBtn');
  var descInput    = document.getElementById('cdDescInput');
  var linkInput    = document.getElementById('cdLinkInput');
  var saveBtn      = document.getElementById('cdSaveBtn');
  var cancelEdit   = document.getElementById('cdCancelEdit');

  function syncClearBtn() {
    if (clearImgBtn) clearImgBtn.style.display = (uploadPreview.style.display === 'block') ? 'inline-flex' : 'none';
  }

  function load() {
    try { details = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(e) { details = {}; }
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
    } catch(e) {
      alert('⚠️ Ảnh quá lớn, không thể lưu. Hãy chọn ảnh nhỏ hơn.');
      return;
    }
    syncToSupabase(STORAGE_KEY, details);
  }

  function readCard(card) {
    var infoRoot = card.classList.contains('cc-expanded') ? (card.querySelector('.cc-left') || card) : card;
    return {
      icon:  (infoRoot.querySelector('.cert-icon') || {}).textContent || '🏆',
      score: (infoRoot.querySelector('.cert-score') || {}).textContent || '',
      name:  (infoRoot.querySelector('h3') || {}).textContent || '',
      org:   (infoRoot.querySelector('.cert-org') || {}).textContent || '',
      date:  (infoRoot.querySelector('.cert-date') || {}).textContent || '',
    };
  }

  /* ── collapse any open card ── */
  function collapse() {
    if (!expandedCard) return;
    var card = expandedCard;
    var ccLeft = card.querySelector('.cc-left');
    if (ccLeft) {
      Array.from(ccLeft.children).forEach(function(c) { card.insertBefore(c, ccLeft); });
      ccLeft.remove();
    }
    var ccRight = card.querySelector('.cc-right');
    if (ccRight) ccRight.remove();
    card.classList.remove('cc-expanded');
    document.querySelectorAll('.cert-card.cc-shrunken').forEach(function(c) { c.classList.remove('cc-shrunken'); });
    expandedCard = null; expandedId = null;
  }

  /* ── build the right image panel ── */
  function buildRight(certId, cardData) {
    var det = details[certId] || {};
    var ccRight = document.createElement('div');
    ccRight.className = 'cc-right';

    /* close button */
    var x = document.createElement('button');
    x.className = 'cc-close-btn'; x.textContent = '✕';
    x.addEventListener('click', function(e) { e.stopPropagation(); collapse(); });
    ccRight.appendChild(x);

    if (det.image) {
      /* actual image */
      var img = document.createElement('img');
      img.className = 'cc-img'; img.alt = cardData.name || '';
      ccRight.appendChild(img);

      var shimmer = document.createElement('div');
      shimmer.className = 'cc-img-shimmer';
      ccRight.appendChild(shimmer);

      var grad = document.createElement('div');
      grad.className = 'cc-overlay-gradient';
      ccRight.appendChild(grad);

      var bottom = document.createElement('div');
      bottom.className = 'cc-overlay-bottom';
      if (det.link) {
        var vLink = document.createElement('a');
        vLink.className = 'cc-verify-link';
        vLink.href = det.link; vLink.target = '_blank'; vLink.rel = 'noopener noreferrer';
        vLink.textContent = '🔗 Verify';
        bottom.appendChild(vLink);
      } else {
        bottom.appendChild(document.createElement('span'));
      }
      if (isAdmin) {
        var eb = document.createElement('button');
        eb.className = 'cc-edit-btn'; eb.textContent = '✏️ Edit Details';
        eb.addEventListener('click', function(e) { e.stopPropagation(); openEditOverlay(certId); });
        bottom.appendChild(eb);
      }
      ccRight.appendChild(bottom);

      if (det.description) {
        var desc = document.createElement('div');
        desc.className = 'cc-img-desc'; desc.textContent = det.description;
        ccRight.appendChild(desc);
      }

      /* trigger image load after paint */
      requestAnimationFrame(function() { requestAnimationFrame(function() {
        img.onload = function() {
          img.classList.add('cc-loaded');
          bottom.classList.add('visible');
          setTimeout(function() { shimmer.remove(); }, 1500);
          if (det.description) {
            var d = ccRight.querySelector('.cc-img-desc');
            if (d) requestAnimationFrame(function(){ d.classList.add('visible'); });
          }
        };
        img.src = det.image;
      }); });

    } else {
      /* placeholder */
      var ph = document.createElement('div');
      ph.className = 'cc-placeholder';
      var phIcon = document.createElement('div'); phIcon.className = 'cc-ph-icon'; phIcon.textContent = cardData.icon || '🏆';
      var phName = document.createElement('div'); phName.className = 'cc-ph-name'; phName.textContent = cardData.name || '';
      ph.appendChild(phIcon); ph.appendChild(phName);
      if (isAdmin) {
        var addBtn = document.createElement('button');
        addBtn.className = 'cc-add-img-btn'; addBtn.textContent = '📷 Add Image';
        addBtn.addEventListener('click', function(e) { e.stopPropagation(); openEditOverlay(certId); });
        ph.appendChild(addBtn);
      }
      ccRight.appendChild(ph);
      requestAnimationFrame(function() { requestAnimationFrame(function() { ph.classList.add('visible'); }); });
    }

    return ccRight;
  }

  /* ── expand a card ── */
  function expand(card, certId) {
    if (card.classList.contains('cc-expanded')) { collapse(); return; }
    collapse();

    var cardData = readCard(card);

    /* wrap existing (non-admin) children into .cc-left */
    var ccLeft = document.createElement('div');
    ccLeft.className = 'cc-left';
    Array.from(card.children).forEach(function(c) {
      if (!c.classList.contains('item-admin-btns') && !c.classList.contains('static-del-btn'))
        ccLeft.appendChild(c);
    });
    card.insertBefore(ccLeft, card.firstChild);
    card.appendChild(buildRight(certId, cardData));
    card.classList.add('cc-expanded');

    document.querySelectorAll('.cert-card').forEach(function(c) {
      if (c !== card) c.classList.add('cc-shrunken');
    });

    expandedCard = card; expandedId = certId;
  }

  /* ── admin edit overlay ── */
  function openEditOverlay(certId) {
    var det = details[certId] || {};
    editingId = certId; pendingImg = null;
    descInput.value = det.description || '';
    linkInput.value = det.link || '';
    if (det.image) { uploadPreview.src = det.image; uploadPreview.style.display = 'block'; }
    else { uploadPreview.style.display = 'none'; }
    adminBar.classList.add('visible');
    editForm.classList.add('open');
    overlay.classList.add('open');
    syncClearBtn();
  }

  function closeEditOverlay() {
    overlay.classList.remove('open');
    editForm.classList.remove('open');
    pendingImg = null; editingId = null;
  }

  function saveDetails() {
    if (!editingId) return;
    var existing = details[editingId] || {};
    details[editingId] = {
      image:       pendingImg !== null ? pendingImg : (existing.image || ''),
      description: descInput.value.trim(),
      link:        linkInput.value.trim()
    };
    persist();
    if (typeof refreshClickHints === 'function') refreshClickHints();
    var savedId = editingId;
    closeEditOverlay();
    /* re-expand with fresh data */
    var card = document.querySelector('.cert-card[data-cert-id="' + savedId + '"]');
    if (card && expandedCard === card) { collapse(); setTimeout(function(){ expand(card, savedId); }, 60); }
    var f = document.createElement('div');
    f.textContent = '✓ Certificate details saved!';
    f.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#34d399;color:#000;padding:0.6rem 1.4rem;border-radius:8px;font-weight:700;font-size:0.88rem;z-index:9999;pointer-events:none;';
    document.body.appendChild(f);
    setTimeout(function(){ f.remove(); }, 2600);
  }

  /* ── overlay events ── */
  closeBtn.addEventListener('click', closeEditOverlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeEditOverlay(); });
  cancelEdit.addEventListener('click', function() { editForm.classList.remove('open'); overlay.classList.remove('open'); });
  saveBtn.addEventListener('click', saveDetails);
  if (clearImgBtn) clearImgBtn.addEventListener('click', function() {
    pendingImg = '';
    uploadPreview.src = ''; uploadPreview.style.display = 'none';
    imgInput.value = '';
    syncClearBtn();
  });
  imgInput.addEventListener('change', function(e) {
    var file = e.target.files[0]; if (!file) return;
    var r = new FileReader();
    r.onload = function(ev) {
      compressImage(ev.target.result, function(compressed) {
        pendingImg = compressed;
        uploadPreview.src = compressed;
        uploadPreview.style.display = 'block';
        syncClearBtn();
      });
    };
    r.readAsDataURL(file);
  });

  /* ── click delegation ── */
  document.addEventListener('click', function(e) {
    if (e.target.closest('.item-admin-btns')) return;
    if (e.target.closest('#cdOverlay')) return;
    if (e.target.closest('.cc-right')) return;
    var card = e.target.closest('.cert-card[data-cert-id]');
    if (!card) { if (expandedCard && !e.target.closest('#certsGrid')) collapse(); return; }
    expand(card, card.dataset.certId);
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { if (overlay.classList.contains('open')) closeEditOverlay(); else collapse(); }
  });

  function setAdminMode(on) { isAdmin = on; }
  function reload() { load(); }

  load();
  return { setAdminMode: setAdminMode, reload: reload };
})();

/* ============================================
   STATIC ITEM ADMIN — delete buttons on HTML-hardcoded items
============================================ */
var StaticAdmin = (function () {
  var HIDDEN_KEY = 'ntt_hidden';
  var hidden = {};

  function load() {
    try { hidden = JSON.parse(localStorage.getItem(HIDDEN_KEY) || '{}'); } catch(e) { hidden = {}; }
  }

  function save() {
    try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden)); } catch(e) {}
    syncToSupabase(HIDDEN_KEY, hidden);
  }

  function applyHidden() {
    document.querySelectorAll('[data-static-id]').forEach(function(el) {
      if (hidden[el.dataset.staticId]) el.style.display = 'none';
    });
  }

  function injectBtn(el) {
    if (el.querySelector('.static-del-btn')) return;
    var style = window.getComputedStyle(el);
    if (style.position === 'static') el.style.position = 'relative';
    var btn = document.createElement('button');
    btn.className = 'static-del-btn';
    btn.title = 'Delete';
    btn.textContent = '✕';
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!confirm('Delete this item? You can restore it using the 🔄 Reset button.')) return;
      hidden[el.dataset.staticId] = true;
      save();
      el.style.transition = 'opacity 0.3s, transform 0.3s';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.94)';
      setTimeout(function() { el.style.display = 'none'; }, 320);
    });
    el.appendChild(btn);
  }

  function setAdminMode(on) {
    document.querySelectorAll('[data-static-id]').forEach(function(el) {
      if (hidden[el.dataset.staticId]) return;
      injectBtn(el);
      var btn = el.querySelector('.static-del-btn');
      if (btn) btn.classList.toggle('visible', on);
    });
  }

  load();
  applyHidden();
  return { setAdminMode: setAdminMode };
})();

/* ============================================
   EDUCATION DETAILS — click edu-item to view detail
============================================ */
var EduDetails = (function () {
  var STORAGE_KEY = 'ntt_edu_details';
  var details = {};
  var isAdmin  = false;
  var currentId   = null;
  var currentData = null;
  var pendingImg  = null;

  var overlay      = document.getElementById('edOverlay');
  var closeBtn     = document.getElementById('edClose');
  var certImgEl    = document.getElementById('edCertImg');
  var placeholder  = document.getElementById('edPlaceholder');
  var phIcon       = document.getElementById('edPhIcon');
  var phYear       = document.getElementById('edPhYear');
  var phTitle      = document.getElementById('edPhTitle');
  var badgeWrap    = document.getElementById('edBadgeWrap');
  var degreeEl     = document.getElementById('edDegree');
  var schoolEl     = document.getElementById('edSchool');
  var yearLabel    = document.getElementById('edYearLabel');
  var descText     = document.getElementById('edDescText');
  var achieveEl    = document.getElementById('edAchievement');
  var linkEl       = document.getElementById('edLink');
  var adminBar     = document.getElementById('edAdminBar');
  var editToggle   = document.getElementById('edEditToggle');
  var editForm     = document.getElementById('edEditForm');
  var imgInput     = document.getElementById('edImgInput');
  var uploadPreview= document.getElementById('edUploadPreview');
  var clearImgBtn  = document.getElementById('edClearImgBtn');
  var achieveInput = document.getElementById('edAchievementInput');

  function syncClearBtn() {
    if (clearImgBtn) clearImgBtn.style.display = (uploadPreview.style.display === 'block') ? 'inline-flex' : 'none';
  }
  var linkInput    = document.getElementById('edLinkInput');
  var saveBtn      = document.getElementById('edSaveBtn');
  var cancelEdit   = document.getElementById('edCancelEdit');

  function load() {
    try { details = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(e) { details = {}; }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
    } catch(e) {
      alert('⚠️ Ảnh quá lớn, không thể lưu. Hãy chọn ảnh nhỏ hơn.');
      return;
    }
    syncToSupabase(STORAGE_KEY, details);
  }

  function openModal(eduId, data) {
    currentId   = eduId;
    currentData = data;
    pendingImg  = null;

    var det = details[eduId] || {};

    /* image area */
    if (det.image) {
      certImgEl.src = det.image;
      certImgEl.style.display = 'block';
      placeholder.style.display = 'none';
    } else {
      certImgEl.style.display = 'none';
      placeholder.style.display = 'flex';
      phIcon.textContent  = data.icon || '🎓';
      phYear.textContent  = data.year || '';
      phTitle.textContent = data.degree || '';
    }

    /* badge */
    badgeWrap.innerHTML = '';
    if (data.badge) {
      var span = document.createElement('span');
      span.className = 'ed-badge-pill';
      span.textContent = data.badge;
      badgeWrap.appendChild(span);
    }

    /* info */
    degreeEl.textContent  = data.degree || '';
    schoolEl.textContent  = data.school || '';
    yearLabel.textContent = data.year   || '';

    if (data.desc) {
      descText.textContent = data.desc;
      descText.classList.add('visible');
    } else {
      descText.textContent = '';
      descText.classList.remove('visible');
    }

    if (det.achievement) {
      achieveEl.textContent = det.achievement;
      achieveEl.classList.add('visible');
    } else {
      achieveEl.textContent = '';
      achieveEl.classList.remove('visible');
    }

    if (det.link) {
      linkEl.href = det.link;
      linkEl.classList.add('visible');
    } else {
      linkEl.classList.remove('visible');
    }

    /* admin */
    if (isAdmin) adminBar.classList.add('visible');
    else adminBar.classList.remove('visible');
    editForm.classList.remove('open');

    overlay.classList.add('open');
  }

  function closeModal() {
    overlay.classList.remove('open');
    editForm.classList.remove('open');
    currentId = null; currentData = null;
  }

  function openEdit() {
    var det = details[currentId] || {};
    achieveInput.value = det.achievement || '';
    linkInput.value    = det.link || '';
    pendingImg = null;
    if (det.image) {
      uploadPreview.src = det.image;
      uploadPreview.style.display = 'block';
    } else {
      uploadPreview.style.display = 'none';
    }
    syncClearBtn();
    editForm.classList.add('open');
  }

  function saveDetails() {
    if (!currentId) return;
    var existing = details[currentId] || {};
    details[currentId] = {
      image:       pendingImg !== null ? pendingImg : (existing.image || ''),
      achievement: achieveInput.value.trim(),
      link:        linkInput.value.trim()
    };
    persist();
    if (typeof refreshClickHints === 'function') refreshClickHints();
    openModal(currentId, currentData);
    var f = document.createElement('div');
    f.textContent = '✓ Education details saved!';
    f.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#34d399;color:#000;padding:0.6rem 1.4rem;border-radius:8px;font-weight:700;font-size:0.88rem;z-index:9999;pointer-events:none;';
    document.body.appendChild(f);
    setTimeout(function(){ f.remove(); }, 2600);
  }

  function setAdminMode(on) { isAdmin = on; }
  function reload() { load(); }

  /* -- events -- */
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) closeModal(); });
  editToggle.addEventListener('click', openEdit);
  cancelEdit.addEventListener('click', function(){ editForm.classList.remove('open'); });
  saveBtn.addEventListener('click', saveDetails);

  if (clearImgBtn) clearImgBtn.addEventListener('click', function() {
    pendingImg = '';
    uploadPreview.src = ''; uploadPreview.style.display = 'none';
    imgInput.value = '';
    syncClearBtn();
  });
  imgInput.addEventListener('change', function(e) {
    var file = e.target.files[0]; if (!file) return;
    var r = new FileReader();
    r.onload = function(ev){
      compressImage(ev.target.result, function(compressed) {
        pendingImg = compressed;
        uploadPreview.src = compressed;
        uploadPreview.style.display = 'block';
        syncClearBtn();
      });
    };
    r.readAsDataURL(file);
  });

  /* -- click delegation on edu items -- */
  document.addEventListener('click', function(e) {
    if (e.target.closest('.item-admin-btns')) return;
    if (e.target.closest('.ed-modal')) return;
    var item = e.target.closest('.edu-item[data-edu-id]');
    if (!item) return;

    var card    = item.querySelector('.edu-card');
    var yearEl  = item.querySelector('.edu-year');
    var iconEl  = item.querySelector('.edu-logo');
    var badgeEl = item.querySelector('.edu-badge');
    var degEl   = item.querySelector('h3');
    var schEl   = item.querySelector('.edu-school');
    var descEl  = item.querySelector('.edu-desc');

    openModal(item.dataset.eduId, {
      icon:   iconEl  ? iconEl.textContent.trim()  : '🎓',
      year:   yearEl  ? yearEl.textContent.trim()  : '',
      badge:  badgeEl ? badgeEl.textContent.trim() : '',
      degree: degEl   ? degEl.textContent.trim()   : '',
      school: schEl   ? schEl.textContent.trim()   : '',
      desc:   descEl  ? descEl.textContent.trim()  : ''
    });
  });

  load();
  return { setAdminMode: setAdminMode, reload: reload };
})();

/* ============================================
   SECTION ADMIN — Add / Edit / Delete per section
============================================ */
var SectionAdmin = (function () {

  function escH(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  var CFG = {
    about:     { key:'ntt_sec_about',   cId:'aboutInfoCards', barId:'aboutAdminBar',  smId:'aboutSeeMore',  limit:3, sel:'.info-card'  },
    edu:       { key:'ntt_sec_edu',     cId:'eduTimeline',    barId:'eduAdminBar',    smId:'eduSeeMore',    limit:3, sel:'.edu-item'   },
    skillTech: { key:'ntt_sec_st',      cId:'skillListTech',  barId:'skillTechBar',   smId:'skillTechSM',   limit:5, sel:'.skill-row'  },
    skillBiz:  { key:'ntt_sec_sb',      cId:'skillListBiz',   barId:'skillBizBar',    smId:'skillBizSM',    limit:5, sel:'.skill-row'  },
    exp:       { key:'ntt_sec_exp',     cId:'expGrid',        barId:'expAdminBar',    smId:'expSeeMore',    limit:2, sel:'.exp-card'   },
    cert:      { key:'ntt_sec_cert',    cId:'certsGrid',      barId:'certsAdminBar',  smId:'certsSeeMore',  limit:4, sel:'.cert-card'  },
    act:       { key:'ntt_sec_act',     cId:'actList',        barId:'actAdminBar',    smId:'actSeeMore',    limit:3, sel:'.act-item'   },
    contact:   { key:'ntt_sec_contact', cId:'contactCards',   barId:'contactAdminBar',smId:'contactSeeMore',limit:4, sel:'.ccard'      }
  };

  var FORMS = {
    about:     { title:{ en:'Info Card',         kr:'정보 카드'     }, fields:[
      { id:'icon',  label:'Icon (emoji)',  type:'text',     placeholder:'🎓'                        },
      { id:'title', label:'Title',         type:'text',     placeholder:'MBA · GPA 4.3', req:true   },
      { id:'sub',   label:'Subtitle',      type:'text',     placeholder:'University, Location'      }
    ]},
    edu:       { title:{ en:'Education',         kr:'학력'          }, fields:[
      { id:'year',        label:'Year Range',                     type:'text',     placeholder:'2020 — 2024',       req:true },
      { id:'icon',        label:'Icon (emoji)',                   type:'text',     placeholder:'🎓'                          },
      { id:'badge',       label:'Badge',                         type:'text',     placeholder:"Bachelor's"                  },
      { id:'degree',      label:'Degree / Program',              type:'text',     placeholder:'Bachelor of Science', req:true},
      { id:'school',      label:'School',                        type:'text',     placeholder:'University Name',    req:true },
      { id:'location',    label:'Location',                      type:'text',     placeholder:'Seoul, South Korea'          },
      { id:'desc',        label:'Description',                   type:'textarea', placeholder:'Brief description…',  rows:3  },
      { id:'image',       label:'Diploma / Degree Image',        type:'image',    placeholder:''                            },
      { id:'achievement', label:'Achievements / Thesis (optional)',type:'textarea',placeholder:'Dean\'s List, GPA…',  rows:2  },
      { id:'link',        label:'Institution Link (optional)',   type:'text',     placeholder:'https://…'                   }
    ]},
    skillTech: { title:{ en:'Technical Skill',   kr:'기술 스킬'     }, fields:[
      { id:'name',  label:'Skill Name',   type:'text',   placeholder:'React',   req:true },
      { id:'level', label:'Level (0–100)',type:'number', placeholder:'80', min:0, max:100, req:true }
    ]},
    skillBiz:  { title:{ en:'Business Skill',    kr:'비즈니스 스킬' }, fields:[
      { id:'name',  label:'Skill Name',   type:'text',   placeholder:'Excel',   req:true },
      { id:'level', label:'Level (0–100)',type:'number', placeholder:'90', min:0, max:100, req:true }
    ]},
    exp:       { title:{ en:'Experience',        kr:'경험'          }, fields:[
      { id:'period', label:'Period',                       type:'text',     placeholder:'2023.01 — 2024.06', req:true },
      { id:'icon',   label:'Icon (emoji)',                 type:'text',     placeholder:'💼'                          },
      { id:'title',  label:'Job Title',                    type:'text',     placeholder:'IT Consultant',     req:true  },
      { id:'org',    label:'Organization',                 type:'text',     placeholder:'Company Name'                },
      { id:'desc',   label:'Responsibilities (one per line)',type:'textarea',placeholder:'Developed…\nManaged…',rows:4  },
      { id:'tags',   label:'Tags (comma separated)',       type:'text',     placeholder:'Python, SQL, Excel'          }
    ]},
    cert:      { title:{ en:'Certification',     kr:'자격증'        }, fields:[
      { id:'icon',        label:'Icon (emoji)',                  type:'text',     placeholder:'🏆'                          },
      { id:'score',       label:'Score / Level',                type:'text',     placeholder:'95점 / 1급'                  },
      { id:'name',        label:'Certification Name',           type:'text',     placeholder:'TOPIK',           req:true   },
      { id:'org',         label:'Organization',                 type:'text',     placeholder:'National Institute…'         },
      { id:'date',        label:'Date',                         type:'text',     placeholder:'2024.11.28'                   },
      { id:'image',       label:'Certificate Image',            type:'image',    placeholder:''                            },
      { id:'description', label:'Description (optional)',       type:'textarea', placeholder:'Add notes…',      rows:2     },
      { id:'link',        label:'Verification Link (optional)', type:'text',     placeholder:'https://…'                   }
    ]},
    act:       { title:{ en:'Activity',          kr:'활동'          }, fields:[
      { id:'icon',   label:'Icon (emoji)',  type:'text',     placeholder:'🌱'                              },
      { id:'period', label:'Period',        type:'text',     placeholder:'2025.01 — 2025.06',  req:true    },
      { id:'title',  label:'Title',         type:'text',     placeholder:'Volunteer Activity', req:true    },
      { id:'org',    label:'Organization',  type:'text',     placeholder:'Organization Name'               },
      { id:'desc',   label:'Description',   type:'textarea', placeholder:'What did you do?',   rows:3      },
      { id:'status', label:'Status',        type:'select',   options:['Ongoing','Completed']               }
    ]},
    contact:   { title:{ en:'Contact',           kr:'연락처'        }, fields:[
      { id:'label', label:'Label',          type:'text', placeholder:'Gmail',              req:true },
      { id:'value', label:'Display Value',  type:'text', placeholder:'name@gmail.com',     req:true },
      { id:'href',  label:'Link (href)',    type:'text', placeholder:'mailto:name@gmail.com'        },
      { id:'icon',  label:'Icon (emoji)',   type:'text', placeholder:'📧'                           }
    ]}
  };

  var allData = {};
  var isAdmin = false;
  var currentSec = null;
  var editingId  = null;
  var siPendingImg = null;

  var siOverlay  = document.getElementById('siOverlay');
  var siTitleEl  = document.getElementById('siTitle');
  var siBodyEl   = document.getElementById('siBody');
  var siSaveBtn  = document.getElementById('siSave');
  var siCloseBtn = document.getElementById('siClose');
  var siCancelBtn= document.getElementById('siCancel');

  function loadAll() {
    Object.keys(CFG).forEach(function(k) {
      try { allData[k] = JSON.parse(localStorage.getItem(CFG[k].key) || '[]'); }
      catch(e) { allData[k] = []; }
    });
  }

  function saveSec(sec) {
    try { localStorage.setItem(CFG[sec].key, JSON.stringify(allData[sec])); } catch(e) {}
    syncToSupabase(CFG[sec].key, allData[sec]);
  }

  function applyCardTilt(el) {
    el.addEventListener('mousemove', function(e) {
      var r = el.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width  - 0.5) * 8;
      var y = ((e.clientY - r.top)  / r.height - 0.5) * 8;
      el.style.transform = 'perspective(600px) rotateX('+(-y)+'deg) rotateY('+x+'deg) translateY(-3px)';
    });
    el.addEventListener('mouseleave', function() { el.style.transform = ''; });
  }

  function addItemAdmin(el, sec, id) {
    var bar = document.createElement('div');
    bar.className = 'item-admin-btns' + (isAdmin ? ' visible' : '');
    var eb = document.createElement('button');
    eb.className = 'item-edit-btn'; eb.title = 'Edit'; eb.textContent = '✏️';
    eb.addEventListener('click', function(e) { e.stopPropagation(); openModal(sec, id); });
    if (sec === 'act') {
      var pb = document.createElement('button');
      pb.className = 'item-photo-btn'; pb.title = 'Quản lý ảnh'; pb.textContent = '📷';
      pb.addEventListener('click', function(e) { e.stopPropagation(); openActPhotoMgr(id); });
      bar.appendChild(pb);
    }
    var db = document.createElement('button');
    db.className = 'item-del-btn'; db.title = 'Delete'; db.textContent = '✕';
    db.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!confirm('Delete this item?')) return;
      allData[sec] = allData[sec].filter(function(x) { return x.id !== id; });
      saveSec(sec); renderSection(sec); updateSeeMore(sec);
    });
    bar.appendChild(eb); bar.appendChild(db);
    el.style.position = 'relative';
    el.appendChild(bar);
  }

  /* --- CREATE ELEMENTS --- */

  function createAboutCard(item) {
    var div = document.createElement('div');
    div.className = 'info-card'; div.dataset.sid = item.id;
    div.innerHTML = '<div class="info-icon">'+escH(item.icon||'📌')+'</div>'+
      '<div><strong>'+escH(item.title||'')+'</strong><span>'+escH(item.sub||'')+'</span></div>';
    addItemAdmin(div, 'about', item.id);
    return div;
  }

  function createEduItem(item) {
    var div = document.createElement('div');
    div.className = 'edu-item reveal'; div.dataset.sid = item.id;
    div.dataset.eduId = String(item.id);
    div.innerHTML =
      '<div class="edu-year">'+escH(item.year||'')+'</div>'+
      '<div class="edu-card"><div class="edu-card-glow"></div>'+
      '<div class="edu-logo">'+escH(item.icon||'🎓')+'</div>'+
      '<div class="edu-body">'+
        '<span class="edu-badge">'+escH(item.badge||'')+'</span>'+
        '<h3>'+escH(item.degree||'')+'</h3>'+
        '<p class="edu-school">'+escH(item.school||'')+'</p>'+
        (item.location ? '<p class="edu-location">📍 '+escH(item.location)+'</p>' : '')+
        '<p class="edu-desc">'+escH(item.desc||'')+'</p>'+
      '</div><div class="click-hint">Click to view</div></div>';
    var card = div.querySelector('.edu-card');
    if (card) applyCardTilt(card);
    addItemAdmin(div, 'edu', item.id);
    observer.observe(div);
    return div;
  }

  function createSkillRow(sec, item) {
    var div = document.createElement('div');
    div.className = 'skill-row'; div.dataset.level = item.level || 0; div.dataset.sid = item.id;
    var icon = item.icon || '';
    var iconHtml;
    if (icon.startsWith('http')) {
      iconHtml = '<img class="sk-icon" src="' + escH(icon) + '" alt="' + escH(item.name || '') + '">';
    } else if (icon) {
      iconHtml = '<div class="sk-badge" style="font-size:1.3rem;line-height:1">' + escH(icon) + '</div>';
    } else {
      var letter = (item.name || '?')[0].toUpperCase();
      var palette = ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];
      var color = palette[(item.name || '').charCodeAt(0) % palette.length];
      iconHtml = '<div class="sk-badge" style="background:' + color + '">' + escH(letter) + '</div>';
    }
    div.innerHTML =
      iconHtml +
      '<div class="sk-info"><span class="sk-name">' + escH(item.name || '') + '</span><span class="sk-cat">Skill</span></div>' +
      '<div class="skill-bar" style="display:none"><div class="skill-fill"></div></div>';
    addItemAdmin(div, sec, item.id);
    return div;
  }

  function createExpCard(item) {
    var div = document.createElement('div');
    div.className = 'exp-card reveal'; div.dataset.sid = item.id;
    var curLang = (typeof lang !== 'undefined') ? lang : 'en';
    var lines   = (item.desc||'').split('\n').filter(function(l){ return l.trim(); });
    var linesKr = item.desc_kr ? item.desc_kr.split('\n').filter(function(l){ return l.trim(); }) : [];
    var listH = lines.map(function(l, i) {
      var kr = linesKr[i] || '';
      var display = (kr && curLang === 'kr') ? kr : l;
      var krAttr  = kr ? ' data-kr="'+escH(kr)+'"' : '';
      return '<li data-en="'+escH(l)+'"'+krAttr+'>'+escH(display)+'</li>';
    }).join('');
    var titleEn = item.title || '';
    var titleKr = item.title_kr || titleEn;
    var titleDisplay = (curLang === 'kr') ? titleKr : titleEn;
    var tags  = (item.tags||'').split(',').filter(function(t){ return t.trim(); });
    var tagsH = tags.map(function(t){ return '<span>'+escH(t.trim())+'</span>'; }).join('');
    div.innerHTML =
      '<div class="exp-card-top"><div class="exp-icon">'+escH(item.icon||'💼')+'</div>'+
      '<span class="exp-tag">'+escH(item.period||'')+'</span></div>'+
      '<h3 data-en="'+escH(titleEn)+'" data-kr="'+escH(titleKr)+'">'+escH(titleDisplay)+'</h3>'+
      '<p class="exp-org">'+escH(item.org||'')+'</p>'+
      '<ul class="exp-list">'+listH+'</ul>'+
      (tagsH ? '<div class="exp-tags">'+tagsH+'</div>' : '');
    applyCardTilt(div);
    addItemAdmin(div, 'exp', item.id);
    observer.observe(div);
    return div;
  }

  function createCertCard(item) {
    var div = document.createElement('div');
    div.className = 'cert-card reveal'; div.dataset.sid = item.id;
    div.dataset.certId = String(item.id);
    div.innerHTML =
      '<div class="cert-icon">'+escH(item.icon||'🏆')+'</div>'+
      '<div class="cert-body">'+
        '<div class="cert-score">'+escH(item.score||'')+'</div>'+
        '<h3>'+escH(item.name||'')+'</h3>'+
        '<p class="cert-org">'+escH(item.org||'')+'</p>'+
        '<span class="cert-date">'+escH(item.date||'')+'</span>'+
      '</div>'+
      '<div class="click-hint">Click to view</div>';
    addItemAdmin(div, 'cert', item.id);
    observer.observe(div);
    return div;
  }

  function createActItem(item) {
    var div = document.createElement('div');
    div.className = 'act-item reveal'; div.dataset.sid = item.id;
    div.dataset.actId = String(item.id);
    var actImgs = (actDetails[item.id]||{}).images||[];
    div.innerHTML =
      '<div class="act-icon">'+escH(item.icon||'🌱')+'</div>'+
      '<div class="act-body">'+
        '<div class="act-period">'+escH(item.period||'')+'</div>'+
        '<h3>'+escH(item.title||'')+'</h3>'+
        '<p class="act-org">'+escH(item.org||'')+'</p>'+
        '<p class="act-desc">'+escH(item.desc||'')+'</p>'+
        '<div class="act-photos-strip"></div>'+
      '</div>'+
      '<span class="act-tag">'+escH(item.status||'Ongoing')+'</span>'+
      '<div class="click-hint">Click to view photos</div>';
    if (actImgs.length) {
      div.querySelector('.click-hint').style.display = 'flex';
      div.classList.add('has-photos');
    }
    addItemAdmin(div, 'act', item.id);
    observer.observe(div);
    return div;
  }

  function createContactCard(item) {
    var a = document.createElement('a');
    if (item.href) a.href = item.href;
    if (item.href && /^https?:\/\//.test(item.href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    a.className = 'ccard'; a.dataset.sid = item.id;
    var icon = item.icon || '📬';
    var iconContent = icon.startsWith('http')
      ? '<img src="'+escH(icon)+'" style="width:22px;height:22px;object-fit:contain;filter:drop-shadow(0 0 2px rgba(0,0,0,.4))">'
      : escH(icon);
    a.innerHTML =
      '<div class="ccard-icon custom">'+iconContent+'</div>'+
      '<div><span class="ccard-label">'+escH(item.label||'')+'</span>'+
      '<span class="ccard-val">'+escH(item.value||'')+'</span></div>'+
      '<svg class="ccard-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 14 0M13 6l6 6-6 6"/></svg>';
    applyCardTilt(a);
    addItemAdmin(a, 'contact', item.id);
    return a;
  }

  /* --- RENDER SECTION --- */

  function renderSection(sec) {
    var cfg = CFG[sec];
    var container = document.getElementById(cfg.cId);
    if (!container) return;
    container.querySelectorAll('[data-sid]').forEach(function(el) { el.remove(); });
    var savedKr = {};
    if ((allData[sec] || []).length > 0) {
      container.querySelectorAll('[data-static-id]').forEach(function(staticEl) {
        var sid = staticEl.dataset.staticId;
        var krLines = [];
        staticEl.querySelectorAll('li[data-kr]').forEach(function(li) { krLines.push(li.dataset.kr || ''); });
        var h3 = staticEl.querySelector('h3[data-kr]');
        savedKr[sid] = { lines: krLines, title: h3 ? h3.dataset.kr : '' };
        staticEl.remove();
      });
    }
    (allData[sec] || []).forEach(function(item) {
      if (sec === 'exp' && savedKr[item.id] && !item.desc_kr && savedKr[item.id].lines.length) {
        item = Object.assign({}, item, {
          desc_kr: savedKr[item.id].lines.join('\n'),
          title_kr: item.title_kr || savedKr[item.id].title || item.title
        });
      }
      var el = null;
      if      (sec === 'about')     el = createAboutCard(item);
      else if (sec === 'edu')       el = createEduItem(item);
      else if (sec === 'skillTech') el = createSkillRow('skillTech', item);
      else if (sec === 'skillBiz')  el = createSkillRow('skillBiz',  item);
      else if (sec === 'exp')       el = createExpCard(item);
      else if (sec === 'cert')      el = createCertCard(item);
      else if (sec === 'act')       el = createActItem(item);
      else if (sec === 'contact')   el = createContactCard(item);
      if (el) container.appendChild(el);
    });
    if (sec === 'skillTech' || sec === 'skillBiz') {
      var smWrap = document.getElementById(cfg.smId);
      if (smWrap) smWrap.style.display = 'none';
      setTimeout(function() { setupSkillTicker(container); }, 0);
    } else {
      updateSeeMore(sec);
    }
    if (typeof lang !== 'undefined' && lang === 'kr') {
      container.querySelectorAll('[data-en]').forEach(function(el) {
        var val = el.dataset.kr;
        if (val) el.innerHTML = val;
      });
    }
  }

  /* --- SEE MORE --- */

  function updateSeeMore(sec) {
    var cfg = CFG[sec];
    var container = document.getElementById(cfg.cId);
    var smWrap    = document.getElementById(cfg.smId);
    if (!container || !smWrap) return;

    var items    = Array.from(container.querySelectorAll(cfg.sel));
    var limit    = cfg.limit;
    var expanded = container.classList.contains('sec-expanded');

    items.forEach(function(item, i) {
      item.style.display = (!expanded && i >= limit) ? 'none' : '';
    });

    if (items.length > limit) {
      smWrap.style.display = 'flex';
      var btn   = smWrap.querySelector('.see-more-btn');
      var label = btn && btn.querySelector('[data-en]');
      var enT   = expanded ? 'Show Less' : 'See More';
      var krT   = expanded ? '접기'      : '더 보기';
      if (label) {
        label.setAttribute('data-en', enT);
        label.setAttribute('data-kr', krT);
        label.textContent = (typeof lang !== 'undefined' && lang === 'kr') ? krT : enT;
      }
      if (btn) btn.classList.toggle('expanded', expanded);
    } else {
      smWrap.style.display = 'none';
      container.classList.remove('sec-expanded');
    }
  }

  function toggleSeeMore(sec) {
    var container = document.getElementById(CFG[sec] && CFG[sec].cId);
    if (!container) return;
    container.classList.toggle('sec-expanded');
    updateSeeMore(sec);
  }

  /* --- MODAL --- */

  function buildForm(sec) {
    var form = FORMS[sec]; if (!form) return;
    var html = '';
    form.fields.forEach(function(f) {
      html += '<div class="si-field"><label>' + escH(f.label) +
        (f.req ? ' <span style="color:#ef4444">*</span>' : '') + '</label>';
      if (f.type === 'textarea') {
        html += '<textarea id="sif_'+f.id+'" rows="'+(f.rows||3)+'" placeholder="'+escH(f.placeholder||'')+'"></textarea>';
      } else if (f.type === 'select') {
        html += '<select id="sif_'+f.id+'">';
        (f.options||[]).forEach(function(o){ html += '<option value="'+escH(o)+'">'+escH(o)+'</option>'; });
        html += '</select>';
      } else if (f.type === 'image') {
        html += '<label class="si-img-upload-btn" for="sif_img_file">📷 Upload Image</label>';
        html += '<input type="file" id="sif_img_file" accept="image/*" style="display:none">';
        html += '<img id="sif_img_preview" class="si-img-preview" alt="">';
      } else {
        var extra = (f.min !== undefined) ? ' min="'+f.min+'" max="'+f.max+'"' : '';
        html += '<input type="'+f.type+'" id="sif_'+f.id+'" placeholder="'+escH(f.placeholder||'')+ '"'+extra+'>';
      }
      html += '</div>';
    });
    siBodyEl.innerHTML = html;
  }

  function openModal(sec, id) {
    currentSec = sec; editingId = id || null;
    siPendingImg = null;
    var form = FORMS[sec];
    var isEdit = !!id;
    var titleName = form ? ((typeof lang !== 'undefined' && lang === 'kr') ? form.title.kr : form.title.en) : 'Item';
    siTitleEl.textContent = (isEdit ? 'Edit ' : 'Add ') + titleName;
    buildForm(sec);

    if (isEdit && form) {
      var item = (allData[sec]||[]).find(function(x){ return x.id === id; });
      if (item) form.fields.forEach(function(f) {
        if (f.type === 'image') {
          if (item.image) {
            var prev = document.getElementById('sif_img_preview');
            if (prev) { prev.src = item.image; prev.style.display = 'block'; }
          }
          return;
        }
        var el = document.getElementById('sif_'+f.id);
        if (el && item[f.id] !== undefined) el.value = item[f.id];
      });
    }

    // Wire image file input
    var imgFile = document.getElementById('sif_img_file');
    if (imgFile) {
      imgFile.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        var r = new FileReader();
        r.onload = function(ev) {
          siPendingImg = ev.target.result;
          var prev = document.getElementById('sif_img_preview');
          if (prev) { prev.src = siPendingImg; prev.style.display = 'block'; }
        };
        r.readAsDataURL(file);
      });
    }

    if (sec === 'act') {
      siNewActId = editingId ? null : ('act-' + Date.now());
      var photoActId = editingId || siNewActId;
      var photoDiv = document.createElement('div');
      photoDiv.className = 'si-field'; photoDiv.id = 'si-act-photos';
      renderSiActPhotos(photoDiv, photoActId);
      siBodyEl.appendChild(photoDiv);
    }

    siOverlay.classList.add('open');
    var first = siBodyEl.querySelector('input:not([type=file]),textarea,select');
    if (first) setTimeout(function(){ first.focus(); }, 80);
  }

  function renderSiActPhotos(container, actId) {
    container.innerHTML = '';
    var lbl = document.createElement('label');
    lbl.style.cssText = 'font-size:0.78rem;font-weight:600;letter-spacing:.05em;color:var(--txt2);text-transform:uppercase';
    lbl.textContent = 'Ảnh hoạt động';
    container.appendChild(lbl);

    var grid = document.createElement('div');
    grid.className = 'si-photo-grid'; grid.id = 'si-pg-' + (actId || 'new');
    var imgs = actId ? ((actDetails[actId] || {}).images || []) : [];
    imgs.forEach(function(url, i) {
      var wrap = document.createElement('div'); wrap.className = 'si-photo-thumb';
      var img = document.createElement('img'); img.src = url; img.alt = '';
      var del = document.createElement('button');
      del.type = 'button'; del.className = 'si-photo-del'; del.textContent = '✕';
      del.addEventListener('click', (function(aid, idx){ return function(e){ e.stopPropagation(); siDelActPhoto(aid, idx); }; })(actId, i));
      wrap.appendChild(img); wrap.appendChild(del);
      grid.appendChild(wrap);
    });
    container.appendChild(grid);

    var addLbl = document.createElement('label');
    addLbl.className = 'si-photo-add-btn';
    var fileInput = document.createElement('input');
    fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.multiple = true;
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', function() { siAddActPhotos(actId, fileInput); });
    addLbl.appendChild(fileInput);
    addLbl.appendChild(document.createTextNode('📷 Thêm ảnh'));
    container.appendChild(addLbl);

    var status = document.createElement('div');
    status.className = 'si-photo-status'; status.id = 'si-ps-' + (actId || 'new');
    container.appendChild(status);
  }

  function getSiActId() {
    return editingId || String(siNewActId || '');
  }

  var siNewActId = null;

  function closeModal() {
    siOverlay.classList.remove('open');
    currentSec = null; editingId = null;
  }

  function saveItem() {
    if (!currentSec) return;
    var form = FORMS[currentSec]; if (!form) return;
    var valid = true;
    form.fields.forEach(function(f) {
      if (!f.req) return;
      var el = document.getElementById('sif_'+f.id);
      if (el && !el.value.trim()) {
        el.style.borderColor = '#ef4444';
        if (valid) el.focus();
        valid = false;
      } else if (el) { el.style.borderColor = ''; }
    });
    if (!valid) return;

    var item = { id: editingId || siNewActId || Date.now() };
    form.fields.forEach(function(f) {
      if (f.type === 'image') {
        var existing = editingId ? ((allData[currentSec]||[]).find(function(x){return x.id===editingId;})||{}).image || '' : '';
        item[f.id] = siPendingImg || existing;
        return;
      }
      var el = document.getElementById('sif_'+f.id);
      if (el) item[f.id] = f.type === 'number' ? Number(el.value) : el.value;
    });

    if (!allData[currentSec]) allData[currentSec] = [];
    if (editingId) {
      var idx = allData[currentSec].findIndex(function(x){ return x.id === editingId; });
      if (idx >= 0) allData[currentSec][idx] = item;
    } else {
      allData[currentSec].push(item);
    }
    saveSec(currentSec);

    // Sync cert image/description/link to CertDetails storage
    if (currentSec === 'cert' && (item.image || item.description || item.link)) {
      try {
        var cdStore = JSON.parse(localStorage.getItem('ntt_cert_details') || '{}');
        cdStore[String(item.id)] = { image: item.image||'', description: item.description||'', link: item.link||'' };
        localStorage.setItem('ntt_cert_details', JSON.stringify(cdStore));
        syncToSupabase('ntt_cert_details', cdStore);
        if (typeof CertDetails !== 'undefined') CertDetails.reload();
      } catch(e) {}
    }

    // Sync edu image/achievement/link to EduDetails storage
    if (currentSec === 'edu' && (item.image || item.achievement || item.link)) {
      try {
        var edStore = JSON.parse(localStorage.getItem('ntt_edu_details') || '{}');
        edStore[String(item.id)] = { image: item.image||'', achievement: item.achievement||'', link: item.link||'' };
        localStorage.setItem('ntt_edu_details', JSON.stringify(edStore));
        syncToSupabase('ntt_edu_details', edStore);
        if (typeof EduDetails !== 'undefined') EduDetails.reload();
      } catch(e) {}
    }

    // Save activity photos to Supabase when saving an act item
    if (currentSec === 'act') {
      saveActDetailsFromIndex(String(item.id), null);
    }

    renderSection(currentSec);
    if (currentSec === 'skillTech' || currentSec === 'skillBiz') {
      try { setTimeout(animateSkillBars, 100); } catch(e) {}
    }
    closeModal();
    var f = document.createElement('div');
    f.textContent = '✓ Saved!';
    f.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#34d399;color:#000;padding:0.6rem 1.4rem;border-radius:8px;font-weight:700;font-size:0.88rem;z-index:9999;pointer-events:none;';
    document.body.appendChild(f);
    setTimeout(function(){ f.remove(); }, 2400);
  }

  /* --- ADMIN MODE --- */

  function setAdminMode(on) {
    isAdmin = on;
    Object.keys(CFG).forEach(function(k) {
      var bar = document.getElementById(CFG[k].barId);
      if (bar) bar.classList.toggle('visible', on);
    });
    document.querySelectorAll('.item-admin-btns').forEach(function(el) {
      el.classList.toggle('visible', on);
    });
  }

  /* --- EVENTS --- */

  siSaveBtn.addEventListener('click', saveItem);
  siCloseBtn.addEventListener('click', closeModal);
  siCancelBtn.addEventListener('click', closeModal);
  siOverlay.addEventListener('click', function(e){ if (e.target === siOverlay) closeModal(); });

  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.see-more-btn[data-section]');
    if (btn) toggleSeeMore(btn.dataset.section);
  });

  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-add-section]');
    if (btn) openModal(btn.dataset.addSection, null);
  });

  /* --- INIT --- */
  loadAll();
  Object.keys(CFG).forEach(function(k) { renderSection(k); });
  loadActDetails();
  setTimeout(refreshClickHints, 300);
  // Ticker for any static skill rows not replaced by dynamic data
  setTimeout(function() {
    setupSkillTicker(document.getElementById('skillListTech'));
    setupSkillTicker(document.getElementById('skillListBiz'));
  }, 50);

  function refreshAll() {
    loadAll();
    loadActDetails();
    Object.keys(CFG).forEach(function(k) { renderSection(k); });
    setTimeout(refreshClickHints, 100);
  }

  window._renderSiActPhotos = renderSiActPhotos;

  return { setAdminMode: setAdminMode, refresh: refreshAll };

})();

/* ============================================
   BACKGROUND MUSIC + PLAYLIST MANAGER
============================================ */
(function () {
  var PLAYLIST_KEY = 'ntt_playlist';

  var audio     = document.getElementById('bgMusic');
  var player    = document.getElementById('vinylPlayer');
  var playBtn   = document.getElementById('vinylBtn');
  var prevBtn   = document.getElementById('vpPrev');
  var nextBtn   = document.getElementById('vpNext');
  var titleEl   = document.getElementById('vpTitle');
  var mmOverlay = document.getElementById('mmOverlay');
  var mmClose   = document.getElementById('mmClose');
  var mmList    = document.getElementById('mmList');
  var mmTitleIn = document.getElementById('mmTitleInput');
  var mmFileIn  = document.getElementById('mmFileInput');
  var mmAddBtn  = document.getElementById('mmAddBtn');
  var adminMusicBtn = document.getElementById('adminMusicBtn');

  if (!audio || !player) return;

  var playlist = [];
  var idx      = 0;
  var playing  = false;
  var unmuted  = false;

  function loadPlaylist() {
    try {
      var stored = JSON.parse(localStorage.getItem(PLAYLIST_KEY));
      playlist = (stored && stored.length) ? stored : [];
    } catch(e) { playlist = []; }
  }

  function savePlaylist() {
    try { localStorage.setItem(PLAYLIST_KEY, JSON.stringify(playlist)); } catch(e) {}
  }

  function loadTrack(i, autoplay) {
    if (!playlist.length) return;
    idx = ((i % playlist.length) + playlist.length) % playlist.length;
    var track = playlist[idx];
    audio.src  = 'music/' + (track.file || track.src);
    audio.loop = (playlist.length === 1);
    if (titleEl) titleEl.textContent = track.name || track.title || track.file || track.src;
    if (autoplay) {
      audio.muted = !unmuted;
      audio.play().then(function() {
        setUI(true);
        if (unmuted) fadeIn(); else audio.volume = 0.45;
      }).catch(function() { setUI(false); });
    }
  }

  function fadeIn() {
    audio.volume = 0;
    var t = setInterval(function() {
      audio.volume = Math.min(audio.volume + 0.04, 0.45);
      if (audio.volume >= 0.45) clearInterval(t);
    }, 60);
  }

  function fadeOut(cb) {
    var t = setInterval(function() {
      audio.volume = Math.max(audio.volume - 0.06, 0);
      if (audio.volume <= 0) { clearInterval(t); if (cb) cb(); }
    }, 50);
  }

  function setUI(on) {
    playing = on;
    if (player) player.classList.toggle('playing', on);
  }

  audio.addEventListener('ended', function() {
    if (playlist.length > 1) loadTrack(idx + 1, true);
    else loadTrack(idx, true);
  });

  function tryAutoplay() {
    if (!playlist.length) return;
    loadTrack(0, false);
    audio.muted  = false;
    audio.volume = 0.45;
    audio.play().then(function() {
      setUI(true);
      unmuted = true;
      document.removeEventListener('click',   unmute);
      document.removeEventListener('scroll',  unmute);
      document.removeEventListener('keydown', unmute);
    }).catch(function() {
      audio.muted  = true;
      audio.volume = 0.45;
      audio.play().then(function() { setUI(true); }).catch(function() {});
    });
  }

  window.addEventListener('load', function() {
    loadPlaylist();
    tryAutoplay();
  });

  function unmute() {
    if (unmuted) return;
    unmuted = true;
    document.removeEventListener('click',   unmute);
    document.removeEventListener('scroll',  unmute);
    document.removeEventListener('keydown', unmute);
    if (audio.paused) {
      audio.muted = false;
      audio.play().then(function() { setUI(true); fadeIn(); }).catch(function() {});
    } else {
      audio.muted  = false;
      audio.volume = 0;
      fadeIn();
    }
  }
  document.addEventListener('click',   unmute, { passive: true });
  document.addEventListener('scroll',  unmute, { once: true, passive: true });
  document.addEventListener('keydown', unmute, { once: true });

  playBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    unmute();
    if (playing) {
      fadeOut(function() { audio.pause(); setUI(false); });
    } else {
      audio.muted = false;
      audio.play().then(function() { setUI(true); fadeIn(); }).catch(function() {});
    }
  });

  prevBtn.addEventListener('click', function(e) {
    e.stopPropagation(); unmute();
    if (playing) fadeOut(function() { audio.pause(); loadTrack(idx - 1, true); });
    else loadTrack(idx - 1, true);
  });

  nextBtn.addEventListener('click', function(e) {
    e.stopPropagation(); unmute();
    fadeOut(function() { audio.pause(); loadTrack(idx + 1, true); });
  });

  function renderMmList() {
    if (!mmList) return;
    mmList.innerHTML = '';
    playlist.forEach(function(track, i) {
      var row = document.createElement('div');
      row.className = 'mm-item' + (i === idx ? ' active' : '');
      row.innerHTML =
        '<span class="mm-item-icon">' + (i === idx && playing ? '🎵' : '🎶') + '</span>' +
        '<div class="mm-item-info">' +
          '<div class="mm-item-name">' + escMm(track.name || track.title || track.file || track.src) + '</div>' +
          '<div class="mm-item-file">' + escMm(track.file || track.src) + '</div>' +
        '</div>';
      var del = document.createElement('button');
      del.className = 'mm-item-del'; del.title = 'Remove'; del.textContent = '✕';
      (function(ti) {
        del.addEventListener('click', function() {
          playlist.splice(ti, 1);
          savePlaylist();
          if (idx >= playlist.length) idx = Math.max(0, playlist.length - 1);
          if (playlist.length) loadTrack(idx, false); else setUI(false);
          renderMmList();
        });
        row.addEventListener('click', function(e) {
          if (e.target === del) return;
          fadeOut(function() { audio.pause(); loadTrack(ti, true); renderMmList(); });
        });
      })(i);
      row.appendChild(del);
      mmList.appendChild(row);
    });
  }

  function escMm(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function openMusicMgr() {
    loadPlaylist(); renderMmList();
    if (mmTitleIn) mmTitleIn.value = '';
    if (mmFileIn)  mmFileIn.value  = '';
    if (mmOverlay) mmOverlay.classList.add('open');
  }
  function closeMusicMgr() {
    if (mmOverlay) mmOverlay.classList.remove('open');
  }

  if (adminMusicBtn) adminMusicBtn.addEventListener('click', openMusicMgr);
  if (mmClose)   mmClose.addEventListener('click', closeMusicMgr);
  if (mmOverlay) mmOverlay.addEventListener('click', function(e) { if (e.target === mmOverlay) closeMusicMgr(); });

  if (mmAddBtn) mmAddBtn.addEventListener('click', function() {
    var name = (mmTitleIn ? mmTitleIn.value.trim() : '') || '';
    var file = (mmFileIn  ? mmFileIn.value.trim()  : '') || '';
    if (!file) { mmFileIn && mmFileIn.focus(); return; }
    if (!name) name = file.replace(/\.[^.]+$/, '');
    playlist.push({ name: name, file: file });
    savePlaylist();
    if (mmTitleIn) mmTitleIn.value = '';
    if (mmFileIn)  mmFileIn.value  = '';
    renderMmList();
  });

  [mmTitleIn, mmFileIn].forEach(function(el) {
    if (el) el.addEventListener('keydown', function(e) { if (e.key === 'Enter') mmAddBtn && mmAddBtn.click(); });
  });

  loadPlaylist();
  if (titleEl && playlist[0]) titleEl.textContent = playlist[0].name || playlist[0].file;

  window.MusicPlayer = {
    refresh: function() {
      var wasEmpty = !playlist.length;
      loadPlaylist();
      if (titleEl && playlist[0]) titleEl.textContent = playlist[0].name || playlist[0].file;
      if (wasEmpty && playlist.length && audio.paused) tryAutoplay();
    }
  };
})();

/* ============================================
   CONTACT FORM
============================================ */
(function () {
  var form    = document.getElementById('contactForm');
  var nameEl  = document.getElementById('cfName');
  var emailEl = document.getElementById('cfEmail');
  var msgEl   = document.getElementById('cfMsg');
  var submitBtn = document.getElementById('cfSubmit');
  if (!form) return;

  function showToast(text, color) {
    var t = document.createElement('div');
    t.textContent = text;
    t.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:' + color + ';color:#000;padding:0.65rem 1.5rem;border-radius:10px;font-weight:700;font-size:0.88rem;z-index:9999;pointer-events:none;white-space:nowrap;';
    document.body.appendChild(t);
    setTimeout(function(){ t.remove(); }, 3000);
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var name  = nameEl.value.trim();
    var email = emailEl.value.trim();
    var msg   = msgEl.value.trim();
    var valid = true;

    [nameEl, emailEl, msgEl].forEach(function(el){ el.classList.remove('error'); });

    if (!name)  { nameEl.classList.add('error');  valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { emailEl.classList.add('error'); valid = false; }
    if (!msg)   { msgEl.classList.add('error');   valid = false; }
    if (!valid) { showToast('⚠ Please fill in all fields correctly.', '#fbbf24'); return; }

    submitBtn.disabled = true;
    var subject = encodeURIComponent('Portfolio Contact: ' + name);
    var body    = encodeURIComponent('From: ' + name + '\nEmail: ' + email + '\n\n' + msg);
    window.location.href = 'mailto:ntantrung595@gmail.com?subject=' + subject + '&body=' + body;

    setTimeout(function() {
      form.reset();
      submitBtn.disabled = false;
      showToast('✓ Message sent!', '#34d399');
    }, 1000);
  });
})();

/* ============================================
   SMOOTH ACTIVE NAV LINK
============================================ */
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const y = window.scrollY + 120;
  sections.forEach(sec => {
    const top = sec.offsetTop;
    const bottom = top + sec.offsetHeight;
    const link = document.querySelector(`.nav-links a[href="#${sec.id}"]`);
    if (link) link.style.color = y >= top && y < bottom ? 'var(--a1)' : '';
  });
}, { passive: true });

/* ============================================
   EXPORT HTML
============================================ */
(function () {
  var btn = document.getElementById('adminExportBtn');
  if (!btn) return;

  var KEYS = [
    'ntt_profile_photo',
    'ntt_gallery_photos',
    'ntt_content',
    'ntt_projects',
    'ntt_cert_details',
    'ntt_edu_details',
    'ntt_hidden',
    'ntt_playlist',
    'ntt_sec_about',
    'ntt_sec_edu',
    'ntt_sec_st',
    'ntt_sec_sb',
    'ntt_sec_exp',
    'ntt_sec_cert',
    'ntt_sec_act',
    'ntt_sec_contact'
  ];

  btn.addEventListener('click', function () {
    btn.textContent = '⏳ Đang xuất...';
    btn.disabled = true;

    fetch('index.html?nocache=' + Date.now())
      .then(function (r) { return r.text(); })
      .then(function (html) {
        /* collect all localStorage data */
        var data = {};
        KEYS.forEach(function (k) {
          var v = localStorage.getItem(k);
          if (v !== null) data[k] = v;
        });

        var version = Date.now().toString();

        /* build injection script */
        var script = [
          '<script id="ntt-baked-data">',
          '(function(){',
          '  var V=' + JSON.stringify(version) + ';',
          '  if(localStorage.getItem("ntt_export_v")===V)return;',
          '  var D=' + JSON.stringify(data) + ';',
          '  for(var k in D){try{localStorage.setItem(k,D[k]);}catch(e){}}',
          '  localStorage.setItem("ntt_export_v",V);',
          '  location.reload();',
          '})();',
          '<\/script>'
        ].join('\n');

        /* inject right after <head> */
        var exported = html.replace('<head>', '<head>\n' + script);

        /* download */
        var blob = new Blob([exported], { type: 'text/html;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'index.html';
        a.click();
        URL.revokeObjectURL(a.href);

        btn.textContent = '✅ Đã xuất!';
        setTimeout(function () {
          btn.textContent = '📤 Export';
          btn.disabled = false;
        }, 2500);
      })
      .catch(function () {
        alert('Lỗi khi xuất file. Hãy thử lại.');
        btn.textContent = '📤 Export';
        btn.disabled = false;
      });
  });
})();
