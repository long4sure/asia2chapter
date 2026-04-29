/* ============================================================
   main.js — Tau Gamma Phi Website Interactivity
   ============================================================ */

/* ---- HERO BACKGROUND SLIDER ---- */
function initHeroSlider() {
  const track = document.getElementById('heroBgTrack');
  const indicatorsWrap = document.getElementById('heroIndicators');
  if (!track) return;

  const slides = track.querySelectorAll('.hero-bg-slide');
  const count = slides.length;
  let current = 0;

  // Build indicators
  indicatorsWrap.innerHTML = '';
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'hero-indicator' + (i === 0 ? ' active' : '');
    dot.onclick = () => goHero(i);
    indicatorsWrap.appendChild(dot);
  });

  function goHero(idx) {
    // Fade out current, fade in next
    slides[current].style.opacity = '0';
    slides[current].style.position = 'absolute';
    slides[current].style.inset = '0';

    current = idx;
    slides.forEach((s, i) => {
      s.style.opacity = i === current ? '1' : '0';
      s.style.position = i === current ? 'relative' : 'absolute';
    });

    indicatorsWrap.querySelectorAll('.hero-indicator').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  // Set initial styles
  slides.forEach((s, i) => {
    s.style.transition = 'opacity 1.2s ease';
    s.style.minWidth = '100%';
    s.style.height = '100%';
    s.style.backgroundSize = 'cover';
    s.style.backgroundPosition = 'center';
    if (i !== 0) {
      s.style.opacity = '0';
      s.style.position = 'absolute';
      s.style.inset = '0';
    }
  });
  track.style.position = 'relative';

  // Auto advance every 5 seconds
  setInterval(() => goHero((current + 1) % count), 5000);
}

/* ---- PHOTO SLIDERS ---- */
const sliderState = {};

function initSliders() {
  ['cleanup', 'breakfast'].forEach(id => {
    const track = document.getElementById(id + 'Track');
    const dotsEl = document.getElementById(id + 'Dots');
    if (!track) return;
    const count = track.children.length;
    sliderState[id] = { index: 0, count };
    // Build dots
    dotsEl.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const d = document.createElement('span');
      d.className = 'slider-dot' + (i === 0 ? ' active' : '');
      d.onclick = () => goToSlide(id, i);
      dotsEl.appendChild(d);
    }
    // Auto-advance
    setInterval(() => slidePhoto(id, 1), 4000 + (id === 'breakfast' ? 1000 : 0));
  });
}

function slidePhoto(id, dir) {
  const s = sliderState[id];
  if (!s) return;
  s.index = (s.index + dir + s.count) % s.count;
  goToSlide(id, s.index);
}

function goToSlide(id, idx) {
  sliderState[id].index = idx;
  const track = document.getElementById(id + 'Track');
  const dots  = document.querySelectorAll('#' + id + 'Dots .slider-dot');
  track.style.transform = `translateX(-${idx * 100}%)`;
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initHeroSlider();
  renderMembers();
  initMembersFilter();
  initContactForm();
  initSliders();
});

/* ---- NAV ---- */
function initNav() {
  const navbar  = document.getElementById('navbar');
  const toggle  = document.getElementById('navToggle');
  const drawer  = document.getElementById('navDrawer');

  // Scroll shadow + active link
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    highlightNav();
  });

  // Mobile drawer
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      drawer.classList.toggle('open');
      const spans = toggle.querySelectorAll('span');
      const isOpen = drawer.classList.contains('open');
      spans[0].style.transform = isOpen ? 'rotate(45deg) translate(4.5px, 4.5px)' : '';
      spans[1].style.opacity   = isOpen ? '0' : '1';
      spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(4.5px, -4.5px)' : '';
    });
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        drawer.classList.remove('open');
        toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '1'; });
      });
    });
  }
}

function highlightNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a, .nav-drawer a');
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 100) current = sec.getAttribute('id');
  });
  links.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}

/* ---- MEMBERS ---- */
function renderMembers(filter = 'all') {
  const grid = document.getElementById('membersGrid');
  if (!grid) return;

  const filtered = filter === 'all'
    ? MEMBERS
    : MEMBERS.filter(m => getMemberTier(m.role) === filter);

  grid.innerHTML = filtered.map(m => {
    const initials = getInitials(m.name);
    const avatarContent = m.photo
      ? `<img src="${m.photo}" alt="${m.name}" loading="lazy">`
      : initials;
    return `
      <div class="member-card" data-tier="${getMemberTier(m.role)}">
        <div class="member-avatar">${avatarContent}</div>
        <div class="member-num">#${String(m.id).padStart(2,'0')}</div>
        <div class="member-name">${m.name}</div>
        <div class="member-role">${m.role}</div>
      </div>
    `;
  }).join('');

  const countEl = document.getElementById('membersCount');
  if (countEl) countEl.textContent = filtered.length;
}

function initMembersFilter() {
  const btns = document.querySelectorAll('.filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMembers(btn.dataset.filter);
    });
  });
}

/* ---- CONTACT FORM ---- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
  });
}

function sendMessage() {
  const name    = document.getElementById('senderName').value.trim();
  const email   = document.getElementById('senderEmail').value.trim();
  const subject = document.getElementById('msgSubject').value;
  const body    = document.getElementById('msgBody').value.trim();
  const success = document.getElementById('formSuccess');

  if (!name || !email || !subject || !body) {
    alert('Please fill in all fields before sending.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  const recipient  = 'jemisa@sscrcan.edu.ph';
  const mailSub    = encodeURIComponent('[TGP Asia 2] ' + subject + ' — from ' + name);
  const mailBody   = encodeURIComponent(
    'Name: ' + name + '\n' +
    'Email: ' + email + '\n' +
    'Subject: ' + subject + '\n\n' +
    'Message:\n' + body + '\n\n---\nSent via TGP Asia 2 Chapter Website'
  );
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${mailSub}&body=${mailBody}`;
  window.open(gmailUrl, '_blank');

  if (success) success.style.display = 'block';
  document.getElementById('senderName').value  = '';
  document.getElementById('senderEmail').value = '';
  document.getElementById('msgSubject').value  = '';
  document.getElementById('msgBody').value     = '';
}
