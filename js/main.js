/* ==========================================================================
   Informatique Cerdagne — JS “clean”
   - Préloader + transition
   - Progress bar scroll
   - Liens ancre (offset natif via scroll-padding-top)
   - Effets “magnet” sur boutons
   - Car & Sun animés (GSAP MotionPath)
   - Carousel d’avis (JSON local)
   - Respect prefers-reduced-motion
   ========================================================================== */

(() => {
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Préloader & transition ---------- */
  const preloader = $('#preloader');
  const pageTrans = $('#pageTransition');

  function hidePreloader() {
    if (!preloader) return;
    preloader.style.display = 'none';
  }

  function revealTransition() {
    if (!pageTrans || prefersReduce) return;
    // simple slide-down / slide-up
    pageTrans.style.transform = 'translateY(0)';
    pageTrans.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)';
    requestAnimationFrame(() => {
      pageTrans.style.transform = 'translateY(0)';
      setTimeout(() => {
        pageTrans.style.transform = 'translateY(-100%)';
      }, 60);
    });
  }

  window.addEventListener('load', () => {
    hidePreloader();
    revealTransition();
  });

  /* ---------- Scroll progress ---------- */
  const progressBar = $('.progress span');
  function updateProgress() {
    if (!progressBar) return;
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  }
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- Liens ancre (lissage natif) ---------- */
  $$('[data-scrolllink]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        const target = $(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /* ---------- Magnet buttons ---------- */
  const MAGNET_STRENGTH = 18; // px
  $$('.btn-magnet').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width/2)) / (r.width/2);
      const y = (e.clientY - (r.top + r.height/2)) / (r.height/2);
      el.style.transform = `translate(${x * MAGNET_STRENGTH}px, ${y * MAGNET_STRENGTH}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0,0)'; });
  });

  /* ---------- GSAP animations (guarded by reduce-motion) ---------- */
  if (!prefersReduce && window.gsap) {
    const { gsap } = window;
    const MotionPathPlugin = window.MotionPathPlugin;
    if (MotionPathPlugin) gsap.registerPlugin(MotionPathPlugin, window.ScrollTrigger);

    // Car along path
    const car = $('#carHero');
    const road = $('#roadPathHero');
    if (car && road && MotionPathPlugin) {
      gsap.set(car, { transformOrigin: '50% 50%' });
      gsap.to(car, {
        duration: 16,
        repeat: -1,
        ease: 'none',
        motionPath: {
          path: road,
          align: road,
          autoRotate: true,
          alignOrigin: [0.5, 0.5]
        }
      });
    }

    // Sun along its arc
    const sun = $('#sun');
    const sunPath = $('#sunPath');
    if (sun && sunPath && MotionPathPlugin) {
      gsap.to(sun, {
        duration: 18,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        motionPath: { path: sunPath, align: sunPath, autoRotate: false }
      });
    }

    // Light “trail” on the title on scroll enter
    const speedTitle = $('.speed-title');
    if (speedTitle) {
      const trail = $('.trail', speedTitle);
      const glow  = $('.glow', speedTitle);
      const spark = $('.spark', speedTitle);
      gsap.timeline({
        scrollTrigger: { trigger: speedTitle, start: 'top 70%', once: true }
      })
      .set([trail, glow, spark], { opacity: 1 })
      .fromTo(trail, { xPercent: -30 }, { xPercent: 80, duration: 1.2, ease: 'power3.out' }, 0)
      .fromTo(glow,  { width: 0 },      { width: '60%', duration: 1.2, ease: 'power3.out' }, 0)
      .fromTo(spark, { scaleX: 0 },     { scaleX: 1, x: 80, duration: 1.0, ease: 'power2.out' }, 0)
      .to([trail, glow, spark], { opacity: 0, duration: 0.4 }, '<0.2');
    }
  }

  /* ---------- Avis (carousel minimal) ---------- */
  const REVIEWS = [
    { initials: 'JR', stars: 5, text: 'Intervention rapide et efficace, explications claires. Je recommande.' },
    { initials: 'ML', stars: 5, text: 'Très pédagogue, mise en service aux petits oignons. Merci !' },
    { initials: 'AS', stars: 4, text: 'Bon conseil matériel et sécurisation après arnaque, rassurant.' }
  ];

  const reviewsHost = $('.reviews');
  const prevBtn = $('.reviews__controls .prev');
  const nextBtn = $('.reviews__controls .next');

  if (reviewsHost) {
    reviewsHost.setAttribute('id', 'reviews');
    reviewsHost.innerHTML = REVIEWS.map((r, i) => `
      <article class="review${i===0 ? ' active' : ''}">
        <div class="review__avatar" aria-hidden="true">${r.initials}</div>
        <div>
          <div class="review__stars" aria-label="${r.stars} étoiles">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</div>
          <p>${r.text}</p>
        </div>
      </article>
    `).join('');
    let idx = 0;
    const $items = $$('.review', reviewsHost);
    const show = (n) => {
      $items[idx].classList.remove('active');
      idx = (n + $items.length) % $items.length;
      $items[idx].classList.add('active');
    };
    prevBtn && prevBtn.addEventListener('click', () => show(idx - 1));
    nextBtn && nextBtn.addEventListener('click', () => show(idx + 1));
  }

  /* ---------- Year in footer ---------- */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();