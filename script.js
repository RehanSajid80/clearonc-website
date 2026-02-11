/* ============================================
   ClearOnc Insights — Website Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- Scroll-based animations (Intersection Observer) ---
    const fadeElements = document.querySelectorAll('.fade-up');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    });
    fadeElements.forEach(el => observer.observe(el));

    // --- Navigation scroll state ---
    const nav = document.getElementById('nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    }, { passive: true });

    // --- Mobile nav toggle ---
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    // Close mobile nav when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });

    // --- Audience tabs ---
    const tabs = document.querySelectorAll('.audience-tab');
    const panels = document.querySelectorAll('.audience-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            panels.forEach(p => {
                p.classList.remove('active');
                if (p.id === `panel-${target}`) {
                    p.classList.add('active');
                    // Re-trigger fade animation
                    const fadeEls = p.querySelectorAll('.fade-up');
                    fadeEls.forEach(el => {
                        el.classList.remove('visible');
                        void el.offsetWidth; // force reflow
                        el.classList.add('visible');
                    });
                }
            });
        });
    });

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // --- Animated counters ---
    const statNumbers = document.querySelectorAll('.hero-stat-number');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const text = el.textContent;

                // Only animate pure numbers
                if (/^\d+$/.test(text.replace(/[%$K+M–,]/g, ''))) {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        el.style.transition = 'all 0.5s ease';
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    }, 200);
                }
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => counterObserver.observe(el));

    // --- Parallax for hero shapes ---
    const heroShapes = document.querySelector('.hero-bg-shapes');
    if (heroShapes) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            if (scrolled < window.innerHeight) {
                heroShapes.style.transform = `translateY(${scrolled * 0.15}px)`;
            }
        }, { passive: true });
    }

    // --- Active nav link highlighting ---
    const sections = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY + 120;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                navAnchors.forEach(a => {
                    a.style.color = '';
                    if (a.getAttribute('href') === `#${id}`) {
                        a.style.color = 'var(--color-teal)';
                    }
                });
            }
        });
    }, { passive: true });
});
