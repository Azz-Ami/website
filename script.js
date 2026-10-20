/* Azzam / Liquid Glass — progressive enhancement, no dependencies. Works with orb.js (live sphere). */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const root = document.documentElement, scene = $('.hero-scene');
  const nav = $('.liquid-nav'), directory = $('#directory');
  const langButton = $('#langBtn'), motionButton = $('#motionToggle');
  const projectButtons = $$('.project-pick'), panels = $$('.stage-panel');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let selected = 0, paused = false, visible = true, pointerFrame = 0, glassFrame = 0;
  const translate = (ar, en) => root.lang === 'ar' ? ar : en;
  const orb = () => (window.AzzamOrb && window.AzzamOrb.ok) ? window.AzzamOrb : null;

  /* ---------- Theme: system by default, visitor choice remembered ---------- */
  const themeButton = $('#themeBtn'), systemDark = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches;
  function syncTheme() {
    const dark = isDark();
    $$('img[data-dark]').forEach(img => {
      const next = img.getAttribute(dark ? 'data-dark' : 'data-light');
      if (img.getAttribute('src') !== next) img.setAttribute('src', next);
    });
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.setAttribute('aria-label', dark ? translate('التبديل إلى الوضع الفاتح', 'Switch to light mode') : translate('التبديل إلى الوضع الداكن', 'Switch to dark mode'));
    const o = orb(); if (o) o.refreshTheme();
  }
  function setTheme(next, origin) {
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem('azzam-glass-theme', next); } catch (_) {}
      syncTheme();
    };
    if (!document.startViewTransition || reduced.matches || !origin) return apply();
    // Circular reveal that grows from the toggle button.
    const box = origin.getBoundingClientRect(), x = box.left + box.width / 2, y = box.top + box.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      document.documentElement.animate({clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`]},
        {duration: 650, easing: 'cubic-bezier(.3,.7,.2,1)', pseudoElement: '::view-transition-new(root)'});
    }).catch(() => {});
  }
  themeButton.addEventListener('click', () => setTheme(isDark() ? 'light' : 'dark', themeButton));
  systemDark.addEventListener('change', () => { if (!root.dataset.theme) syncTheme(); });
  themeButton.hidden = false; syncTheme();

  /* Real refraction for the glass on Chromium (backdrop-filter accepts SVG filters there). */
  try {
    const brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
    if (brands.some(b => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand)) && !matchMedia('(prefers-reduced-transparency: reduce)').matches)
      root.classList.add('lg-refract');
  } catch (_) {}
  function resetTilt() {
    scene.style.setProperty('--tilt-x', '0deg');
    scene.style.setProperty('--tilt-y', '0deg');
    scene.style.setProperty('--par-x', '0px');
    scene.style.setProperty('--par-y', '0px');
    const o = orb(); if (o) o.setPointer(0, 0);
  }
  function paintMotion() {
    const stopped = paused || reduced.matches;
    scene.classList.toggle('motion-paused', stopped);
    scene.classList.toggle('art-paused', !visible || document.hidden);
    motionButton.disabled = reduced.matches;
    motionButton.setAttribute('aria-pressed', String(stopped));
    $('#motionLabel').textContent = reduced.matches
      ? translate('الحركة مخفّضة', 'Reduced motion')
      : paused ? translate('تشغيل الحركة', 'Resume motion') : translate('إيقاف الحركة', 'Pause motion');
    if (stopped || !visible || document.hidden) resetTilt();
    const o = orb(); if (o) o.setActive(!stopped && visible && !document.hidden);
  }
  const optionsRow = $('.project-options');
  function revealChip() {
    // On phones the project list scrolls sideways; keep the active name in view.
    if (optionsRow.scrollWidth <= optionsRow.clientWidth) return;
    const row = optionsRow.getBoundingClientRect(), chip = projectButtons[selected].getBoundingClientRect();
    optionsRow.scrollBy({left: chip.left - row.left - (row.width - chip.width) / 2, behavior: reduced.matches ? 'auto' : 'smooth'});
  }
  function selectProject(index, announce = true) {
    selected = Math.max(0, Math.min(projectButtons.length - 1, index));
    projectButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
    panels.forEach((panel, i) => {panel.hidden = i !== selected;});
    scene.style.setProperty('--turn', [0, 18, -15, 32, -28][selected] + 'deg');
    const o = orb(); if (o) o.setProject(selected);
    if (announce) {
      revealChip();
      const title = projectButtons[selected].querySelector('[data-ar]').textContent;
      $('#projectStatus').textContent = translate('المشروع المختار: ', 'Selected project: ') + title;
    }
  }
  function setLanguage(lang) {
    root.lang = lang; root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-ar]').forEach(element => {
      const value = element.getAttribute('data-' + lang);
      if (value !== null) element.textContent = value;
    });
    $$('[data-aria-ar]').forEach(element => element.setAttribute(element.dataset.ariaAttr || 'aria-label', element.getAttribute('data-aria-' + lang)));
    document.title = root.getAttribute('data-title-' + lang);
    try { localStorage.setItem('azzam-glass-language', lang); } catch (_) {}
    $('#formStatus').textContent = ''; $('#copyStatus').textContent = ''; $('#projectStatus').textContent = '';
    paintMotion();
    if (typeof syncTheme === 'function' && themeButton) syncTheme();
    requestAnimationFrame(() => { moveIndicator(); if (typeof movePill === 'function') movePill(); reserveNavSpace(); });
  }
  langButton.addEventListener('click', () => setLanguage(root.lang === 'ar' ? 'en' : 'ar'));
  try {
    const saved = localStorage.getItem('azzam-glass-language');
    if (saved === 'ar' || saved === 'en') setLanguage(saved);
    paused = localStorage.getItem('azzam-glass-paused') === 'true';
  } catch (_) {}
  langButton.hidden = false;
  projectButtons.forEach((button, i) => button.addEventListener('click', () => selectProject(i)));
  $('#projectSwitcher').addEventListener('keydown', event => {
    const i = projectButtons.indexOf(event.target.closest('.project-pick'));
    if (i < 0) return;
    let next;
    if (event.key === 'ArrowDown') next = (i + 1) % projectButtons.length;
    else if (event.key === 'ArrowUp') next = (i - 1 + projectButtons.length) % projectButtons.length;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const forward = event.key === (root.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      next = (i + (forward ? 1 : -1) + projectButtons.length) % projectButtons.length;
    } else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = projectButtons.length - 1;
    else return;
    event.preventDefault(); selectProject(next); projectButtons[next].focus();
  });
  $('#projectSwitcher').hidden = false; selectProject(0, false);
  // Arrows and swipe inside the sphere card (progressive enhancement: hidden until JS runs).
  const cardNav = $('#cardNav'), card = $('#projectCard');
  const step = delta => selectProject((selected + delta + projectButtons.length) % projectButtons.length);
  cardNav.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => step(Number(button.dataset.step))));
  cardNav.hidden = false;
  let swipeX = null;
  card.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse' && !event.target.closest('a,button')) swipeX = event.clientX; });
  card.addEventListener('pointerup', event => {
    if (swipeX === null) return;
    const dx = event.clientX - swipeX; swipeX = null;
    if (Math.abs(dx) < 45) return;
    // Dragging content toward the reading start reveals the next project (mirrored in RTL).
    const forward = root.dir === 'rtl' ? dx > 0 : dx < 0;
    step(forward ? 1 : -1);
  });
  card.addEventListener('pointercancel', () => { swipeX = null; });
  motionButton.addEventListener('click', () => {
    paused = !paused; paintMotion();
    try {localStorage.setItem('azzam-glass-paused', String(paused));} catch (_) {}
  });
  motionButton.hidden = false; paintMotion();
  reduced.addEventListener('change', paintMotion);
  document.addEventListener('visibilitychange', paintMotion);
  scene.addEventListener('pointermove', event => {
    if (!finePointer.matches || reduced.matches || paused || !visible || document.hidden || pointerFrame) return;
    const x = event.clientX, y = event.clientY;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      if (reduced.matches || paused || !visible || document.hidden) return;
      const box = scene.getBoundingClientRect();
      scene.style.setProperty('--tilt-y', ((x - box.left) / box.width * 5 - 2.5).toFixed(2) + 'deg');
      scene.style.setProperty('--tilt-x', (2.5 - (y - box.top) / box.height * 5).toFixed(2) + 'deg');
      // The card inside the sphere drifts slightly against the sphere for depth.
      scene.style.setProperty('--par-x', (((x - box.left) / box.width - .5) * -14).toFixed(1) + 'px');
      scene.style.setProperty('--par-y', (((y - box.top) / box.height - .5) * -10).toFixed(1) + 'px');
      // Gradient spotlight follows the cursor; the live sphere leans toward it.
      scene.style.setProperty('--mx', (x - box.left).toFixed(0) + 'px');
      scene.style.setProperty('--my', (y - box.top).toFixed(0) + 'px');
      scene.classList.add('is-pointer');
      const o = orb(); if (o) o.setPointer(((x - box.left) / box.width - .5) * 2, ((y - box.top) / box.height - .5) * 2);
    });
  }, {passive:true});
  scene.addEventListener('pointerleave', () => { resetTilt(); scene.classList.remove('is-pointer'); });
  finePointer.addEventListener('change', resetTilt);
  nav.addEventListener('pointermove', event => {
    if (!finePointer.matches || reduced.matches || glassFrame) return;
    const x = event.clientX, y = event.clientY;
    glassFrame = requestAnimationFrame(() => {
      glassFrame = 0; const box = nav.getBoundingClientRect();
      nav.style.setProperty('--glass-x', ((x - box.left) / box.width * 100).toFixed(1) + '%');
      nav.style.setProperty('--glass-y', ((y - box.top) / box.height * 100).toFixed(1) + '%');
    });
  }, {passive:true});
  nav.addEventListener('pointerleave', () => {
    if (glassFrame) cancelAnimationFrame(glassFrame);
    glassFrame = 0;nav.style.removeProperty('--glass-x');nav.style.removeProperty('--glass-y');
  });
  // Same pointer-following specular highlight on the glass card inside the sphere.
  const cardShell = $('.orb-card-shell');
  cardShell.addEventListener('pointermove', event => {
    if (!finePointer.matches || reduced.matches) return;
    const box = cardShell.getBoundingClientRect();
    cardShell.style.setProperty('--glass-x', ((event.clientX - box.left) / box.width * 100).toFixed(1) + '%');
    cardShell.style.setProperty('--glass-y', ((event.clientY - box.top) / box.height * 100).toFixed(1) + '%');
  }, {passive:true});
  cardShell.addEventListener('pointerleave', () => { cardShell.style.removeProperty('--glass-x'); cardShell.style.removeProperty('--glass-y'); });

  /* ---------- Liquid indicator: a glass pill that slides between nav links ---------- */
  const navLinks = $('.nav-links'), indicator = $('.nav-indicator');
  function moveIndicator(target) {
    const link = target || navLinks.querySelector('a[aria-current]');
    if (!link || getComputedStyle(navLinks).display === 'none') { indicator.classList.remove('on'); return; }
    navLinks.style.setProperty('--ind-x', link.offsetLeft + 'px');
    navLinks.style.setProperty('--ind-w', link.offsetWidth + 'px');
    indicator.classList.add('on');
  }
  navLinks.classList.add('has-indicator');
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('pointerenter', () => moveIndicator(link));
    link.addEventListener('focus', () => moveIndicator(link));
  });
  navLinks.addEventListener('pointerleave', () => moveIndicator());
  addEventListener('resize', () => moveIndicator(), {passive:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveIndicator());

  /* Keep the hero headline clear of the floating nav: reserve the nav's real width (it changes with language and fonts). */
  function reserveNavSpace() {
    if (innerWidth <= 900) { root.style.removeProperty('--nav-space'); return; }
    const box = nav.getBoundingClientRect();
    const fromEdge = root.dir === 'rtl' ? box.left : innerWidth - box.right;
    root.style.setProperty('--nav-space', Math.ceil(box.width + fromEdge + 40) + 'px');
  }
  reserveNavSpace();
  addEventListener('resize', reserveNavSpace, {passive:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserveNavSpace);

  /* Nav tightens once the page scrolls. */
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, {passive:true}); onScroll();
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && directory.open) { directory.open = false; directory.querySelector('summary').focus(); }
  });
  document.addEventListener('click', event => { if (!directory.contains(event.target)) directory.open = false; });
  directory.addEventListener('focusout', event => { if (!directory.contains(event.relatedTarget)) directory.open = false; });
  directory.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { directory.open = false; }));
  if ('IntersectionObserver' in window) {
    const sceneObserver = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; paintMotion();
    }, {threshold:0});sceneObserver.observe(scene);
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        $$('.liquid-nav a[href^="#"]').forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
        moveIndicator();
      });
    }, {rootMargin:'-12% 0px -70% 0px',threshold:0});
    $$('#home,main > .section').forEach(section => sectionObserver.observe(section));

    /* Scroll reveal: content eases in once, staggered within each group. */
    const groups = ['.section-heading', '.work-filters', '.work-grid > .work-card', '.work-note', '.impact-label', '.hero-stats > div',
      '.about-grid > div > *', '.timeline-item', '.section-head', '.cert-item', '.skills-list > div', '.contact-links > a', '#contactForm > *'];
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); revealObserver.unobserve(entry.target); } });
    }, {rootMargin:'0px 0px -4% 0px', threshold:0.01});
    groups.forEach(selector => $$(selector).forEach((el, i) => {
      if (el.closest('.hero-scene')) return;
      el.classList.add('reveal'); el.style.setProperty('--rd', Math.min(i % 6, 5) * 0.07 + 's');
      revealObserver.observe(el);
    }));
  }
  /* ---------- Work: category filters with a sliding pill, cursor glow on cards ---------- */
  const filterBar = $('#workFilters'), filterPill = $('.filter-pill'), filterButtons = $$('.work-filter'), workCards = $$('.work-card');
  function movePill() {
    const active = filterBar.querySelector('[aria-pressed=true]');
    if (!active) return;
    filterBar.style.setProperty('--pill-x', active.offsetLeft + 'px');
    filterBar.style.setProperty('--pill-w', active.offsetWidth + 'px');
  }
  function applyFilter(filter) {
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    movePill();
    workCards.forEach(card => {
      const show = filter === 'all' || card.dataset.category === filter;
      if (show === !card.hidden) return;
      if (show) {
        card.hidden = false;
        if (!reduced.matches) card.animate([{opacity: 0, transform: 'translateY(14px) scale(.98)'}, {opacity: 1, transform: 'none'}], {duration: 500, easing: 'cubic-bezier(.2,.7,.2,1)'});
      } else card.hidden = true;
    });
  }
  filterButtons.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.filter)));
  filterBar.hidden = false;
  requestAnimationFrame(movePill);
  addEventListener('resize', movePill, {passive:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);
  workCards.forEach(card => card.addEventListener('pointermove', event => {
    if (!finePointer.matches) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty('--x', (event.clientX - box.left) + 'px');
    card.style.setProperty('--y', (event.clientY - box.top) + 'px');
  }, {passive:true}));

  $('#year').textContent = new Date().getFullYear();
  const form = $('#contactForm');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const fields = ['name','email','message'].map(key => form.elements.namedItem(key));
    let firstInvalid;
    fields.forEach(field => {
      const valid = field.checkValidity() && field.value.trim().length >= (field.name === 'message' ? 5 : 2);
      field.closest('.form-field').classList.toggle('has-error', !valid);
      field.setAttribute('aria-invalid', String(!valid));
      if (!valid && !firstInvalid) firstInvalid = field;
    });
    const status = $('#formStatus');
    if (firstInvalid) {
      status.className = 'form-status is-error';
      status.textContent = translate('راجع الحقول المحددة قبل المتابعة.', 'Please check the marked fields.');
      firstInvalid.focus(); return;
    }
    const [name,email,message] = fields.map(field => field.value.trim());
    const subject = translate('رسالة من موقع الأعمال — ', 'Portfolio enquiry — ') + name;
    const body = message + '\n\n' + name + ' (' + email + ')';
    status.className = 'form-status is-success';
    status.textContent = translate('تم تجهيز المسودة لتطبيق البريد. أكّد الإرسال من التطبيق. إن لم يفتح، استخدم رابط البريد أو انسخ العنوان.', 'Your draft is ready for your email app. Confirm sending there. If no app opens, use the email link or copy the address.');
    window.location.href = 'mailto:azzamfiaz00@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
  form.addEventListener('input', event => {
    if (!event.target.matches('input,textarea')) return;
    event.target.closest('.form-field').classList.remove('has-error');event.target.removeAttribute('aria-invalid');$('#formStatus').textContent = '';
  });
  form.hidden = false;
  const copy = $('#copyEmail');
  copy.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText('azzamfiaz00@gmail.com');
      $('#copyStatus').textContent = translate('تم نسخ البريد الإلكتروني.', 'Email address copied.');
    } catch (_) {
      $('#copyStatus').textContent = translate('انسخ البريد يدويًا: azzamfiaz00@gmail.com', 'Copy manually: azzamfiaz00@gmail.com');
    }
  });
  copy.hidden = false;
})();
