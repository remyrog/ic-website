// Animations d’entrée et de scroll haut de gamme via GSAP
window.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    // Animation d’arrivée pour le hero
    gsap.from('.hero-inner', {
        opacity: 0,
        y: 60,
        duration: 1.3,
        ease: 'power3.out'
    });
    // Apparition en cascade des cartes de sommaire
    gsap.from('.toc-card', {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.15,
        delay: 0.3
    });
    // Révélations au scroll des blocs principaux
    document.querySelectorAll('.block').forEach((el) => {
        gsap.from(el, {
            opacity: 0,
            y: 80,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 80%',
                end: 'bottom 60%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    // Animation des soulignages décoratifs sous les titres
    document.querySelectorAll('.block-underline').forEach((underline) => {
        gsap.fromTo(underline, { scaleX: 0 }, {
            scaleX: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: underline.parentElement.parentElement,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    // Animation d'apparition des icônes de section
    document.querySelectorAll('.block-icon').forEach((icon) => {
        gsap.from(icon, {
            opacity: 0,
            y: 20,
            rotation: -15,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: icon.parentElement.parentElement,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    // Animation de tracé des icônes (dessin au trait)
    document.querySelectorAll('.block-icon path').forEach((path) => {
        const length = path.getTotalLength ? path.getTotalLength() : 300;
        // Réinitialiser dasharray et dashoffset à la longueur
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: path.closest('.block'),
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    // ====== Animation premium : poignée de main et personnages ======
    // Mise en scène au scroll : les deux personnages glissent vers le centre et se serrent la main.
    const clientPerson = document.getElementById('client-person');
    const providerPerson = document.getElementById('provider-person');
    const leftArm = document.getElementById('left-arm');
    const rightArm = document.getElementById('right-arm');
    const labelContainer = document.querySelector('.handshake-labels');
    if (clientPerson && providerPerson && leftArm && rightArm && labelContainer) {
        // Définir les positions initiales hors du cadre
        gsap.set([clientPerson, leftArm], { x: -200, opacity: 0 });
        gsap.set([providerPerson, rightArm], { x: 200, opacity: 0 });
        gsap.set(labelContainer, { opacity: 0, y: 20 });
        gsap.set('#handshake-svg', { opacity: 1 });
        // Animation synchronisée avec le défilement
        const tlHandshake = gsap.timeline({
            scrollTrigger: {
                trigger: document.getElementById('hero'),
                start: 'top top',
                end: '+=400',
                scrub: true
            }
        });
        tlHandshake.to(clientPerson, { x: 0, opacity: 1, ease: 'power2.out' }, 0);
        tlHandshake.to(providerPerson, { x: 0, opacity: 1, ease: 'power2.out' }, 0);
        tlHandshake.to(leftArm, { x: 0, opacity: 1, ease: 'power2.out' }, 0.15);
        tlHandshake.to(rightArm, { x: 0, opacity: 1, ease: 'power2.out' }, 0.15);
        tlHandshake.to(labelContainer, { opacity: 1, y: -10, ease: 'power2.out' }, 0.3);
    }

    // ====== Sticky navigation et scrollspy ======
    const tocSection = document.getElementById('sommaire');
    const stickyNav = document.getElementById('stickyNav');
    const currentSpan = stickyNav ? stickyNav.querySelector('.current-section') : null;
    const prevLink = stickyNav ? stickyNav.querySelector('.prev-section') : null;
    const nextLink = stickyNav ? stickyNav.querySelector('.next-section') : null;
    const cards = Array.from(document.querySelectorAll('.toc-card'));
    const sections = Array.from(document.querySelectorAll('.grid .block'));
    const sectionIds = sections.map(s => s.id);

    // Affichage de la sticky nav quand le sommaire est scrolled hors de la vue
    if (tocSection && stickyNav) {
        ScrollTrigger.create({
            trigger: tocSection,
            start: 'bottom top-=80',
            end: 'bottom top',
            onEnter: () => stickyNav.classList.add('show'),
            onLeaveBack: () => stickyNav.classList.remove('show')
        });
    }

    /*
     * Mise à jour de la navigation et des cartes actives au scroll
     * On utilise ScrollTrigger plutôt qu'IntersectionObserver pour plus de fiabilité.
     */
    function updateNav(section) {
        const id = section.id;
        // activer la carte correspondante
        cards.forEach(card => {
            card.classList.toggle('active', card.getAttribute('href') === `#${id}`);
        });
        // mettre à jour le texte courant et les liens prev/next
        if (stickyNav && currentSpan) {
            const titleEl = section.querySelector('.block-title');
            currentSpan.textContent = titleEl ? titleEl.textContent.trim() : '';
            const index = sectionIds.indexOf(id);
            const prevId = sectionIds[index - 1];
            const nextId = sectionIds[index + 1];
            if (prevLink) {
                if (prevId) {
                    prevLink.href = `#${prevId}`;
                    prevLink.style.visibility = 'visible';
                } else {
                    prevLink.href = '#';
                    prevLink.style.visibility = 'hidden';
                }
            }
            if (nextLink) {
                if (nextId) {
                    nextLink.href = `#${nextId}`;
                    nextLink.style.visibility = 'visible';
                } else {
                    nextLink.href = '#';
                    nextLink.style.visibility = 'hidden';
                }
            }
        }
    }
    // ScrollTrigger pour chaque section
    sections.forEach((section) => {
        ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => updateNav(section),
            onEnterBack: () => updateNav(section)
        });
    });
});