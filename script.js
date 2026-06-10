document.addEventListener('DOMContentLoaded', () => {
    if (window.createIcons) window.createIcons();

    // Header Scroll Effect
    const header = document.querySelector('.header');
    const navToggle = document.querySelector('.nav-toggle');
    const siteNav = document.getElementById('site-nav');
    const mobileNavMq = window.matchMedia('(max-width: 768px)');

    const setMobileMenuOpen = (open) => {
        if (!header || !navToggle) return;
        header.classList.toggle('is-menu-open', open);
        document.body.classList.toggle('nav-open', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    if (header && navToggle && siteNav) {
        navToggle.addEventListener('click', () => {
            if (!mobileNavMq.matches) return;
            setMobileMenuOpen(!header.classList.contains('is-menu-open'));
        });

        siteNav.querySelectorAll('a[href^="#"]').forEach((link) => {
            link.addEventListener('click', () => {
                if (mobileNavMq.matches) closeMobileMenu();
            });
        });

        const syncMobileMenuViewport = () => {
            if (!mobileNavMq.matches) closeMobileMenu();
        };

        mobileNavMq.addEventListener('change', syncMobileMenuViewport);
        window.addEventListener('resize', syncMobileMenuViewport);
    }

    // Intersection Observer for Reveal Animations
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, revealOptions);

    const revealElements = document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up');
    revealElements.forEach(el => {
        if (el.closest('.hero')) return;
        revealObserver.observe(el);
    });

    // Marketing lead forms → Inchbrick API
    const INCHBRICK_CONTACT_URL = 'https://admin.inchbrick.com/api/contact';
    const LEAD_PAGE_SOURCE = 'Godrej Samaris Website';
    const THANK_YOU_URL = 'thank-you.html?lead=1';

    const getLeadFeedbackEl = (form) => form.querySelector('[data-lead-feedback]');

    const setLeadFeedback = (form, text, variant) => {
        const el = getLeadFeedbackEl(form);
        if (!el) return;
        el.textContent = text || '';
        el.classList.remove('lead-form-feedback--error', 'lead-form-feedback--success');
        if (variant === 'error') el.classList.add('lead-form-feedback--error');
        if (variant === 'success') el.classList.add('lead-form-feedback--success');
    };

    const hasMeaningfulMobile = (raw) => {
        const t = (raw || '').trim();
        if (!t) return false;
        return /\d/.test(t);
    };

    const getFormMobile = (form) => {
        const codeEl = form.querySelector('[name="country_code"]');
        const mobileInput = form.querySelector('[name="mobile"]');
        const code = (codeEl && codeEl.value) ? codeEl.value.trim() : '+91';
        let local = (mobileInput && mobileInput.value) ? mobileInput.value.trim() : '';
        if (!local) return '';
        const digitsOnly = local.replace(/\D/g, '');
        if (!digitsOnly) return '';
        return `${code} ${digitsOnly}`;
    };

    const hasMeaningfulEmail = (raw) => (raw || '').trim().length > 0;

    async function parseInchbrickErrorMessage(response) {
        const text = await response.text();
        if (!text) return 'Something went wrong. Please try again.';
        try {
            const data = JSON.parse(text);
            if (data && typeof data.message === 'string' && data.message.trim()) return data.message.trim();
            if (data && typeof data.error === 'string' && data.error.trim()) return data.error.trim();
        } catch {
            /* not JSON */
        }
        return text.length > 280 ? `${text.slice(0, 280)}…` : text;
    }

    const attachLeadForm = (formId) => {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = form.querySelector('button[type="submit"]');
            const nameInput = form.querySelector('[name="name"]');
            const emailInput = form.querySelector('[name="email"]');
            const mobileInput = form.querySelector('[name="mobile"]');

            const name = (nameInput && nameInput.value) ? nameInput.value.trim() : '';
            const email = (emailInput && emailInput.value) ? emailInput.value.trim() : '';
            const mobile = getFormMobile(form);

            setLeadFeedback(form, '', null);

            if (!name) {
                setLeadFeedback(form, 'Please enter your name.', 'error');
                if (nameInput) nameInput.focus();
                return;
            }

            if (!hasMeaningfulEmail(email) && !hasMeaningfulMobile(mobile)) {
                setLeadFeedback(form, 'Please enter your email or mobile number.', 'error');
                if (mobileInput) mobileInput.focus();
                return;
            }

            const originalBtnHtml = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = 'SENDING…';
                if (window.createIcons) window.createIcons(btn);
            }

            const payload = {
                name,
                email,
                mobile,
                page: LEAD_PAGE_SOURCE
            };

            let httpOk = false;
            try {
                const res = await fetch(INCHBRICK_CONTACT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    httpOk = true;
                    window.setTimeout(function () {
                        window.location.href = THANK_YOU_URL;
                    }, 400);
                    return;
                }

                if (res.status === 400) {
                    const msg = await parseInchbrickErrorMessage(res);
                    setLeadFeedback(form, msg, 'error');
                    return;
                }

                const fallback = res.status >= 500
                    ? 'Our server is busy. Please try again in a moment.'
                    : 'We could not submit your enquiry. Please try again.';
                setLeadFeedback(form, fallback, 'error');
            } catch {
                setLeadFeedback(
                    form,
                    'Network error — check your connection and try again.',
                    'error'
                );
            } finally {
                if (btn) {
                    btn.disabled = false;
                    if (!httpOk) {
                        btn.innerHTML = originalBtnHtml;
                        if (window.createIcons) window.createIcons(btn);
                    }
                }
            }
        });
    };

    attachLeadForm('hero-form');
    attachLeadForm('popup-form');

    // Creative hero spotlight + gentle parallax (disabled for reduced motion)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hero = document.querySelector('.hero');
    const orbs = document.querySelector('.hero-orbs');

    if (!prefersReducedMotion && hero) {
        let targetX = 0.5;
        let targetY = 0.4;
        let currentX = targetX;
        let currentY = targetY;
        let rafId = null;

        const onMove = (clientX, clientY) => {
            const rect = hero.getBoundingClientRect();
            const x = (clientX - rect.left) / rect.width;
            const y = (clientY - rect.top) / rect.height;
            targetX = Math.min(1, Math.max(0, x));
            targetY = Math.min(1, Math.max(0, y));
            if (!rafId) rafId = requestAnimationFrame(tick);
        };

        const tick = () => {
            rafId = null;
            currentX += (targetX - currentX) * 0.12;
            currentY += (targetY - currentY) * 0.12;

            hero.style.setProperty('--mx', `${(currentX * 100).toFixed(2)}%`);
            hero.style.setProperty('--my', `${(currentY * 100).toFixed(2)}%`);

            if (orbs) {
                const dx = (currentX - 0.5) * 18;
                const dy = (currentY - 0.5) * 18;
                orbs.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
            }

            if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
                rafId = requestAnimationFrame(tick);
            }
        };

        hero.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
        hero.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
    }

    // Smooth Scroll (skip modal / CTA links that use href="#")
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.classList.contains('nav-cta') || this.id === 'exploreResidencesBtn' || this.id === 'eliteEnquireBtn' || this.closest('.nav-cta')) return;

            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;

            e.preventDefault();
            window.scrollTo({
                top: targetElement.offsetTop - 50,
                behavior: 'smooth'
            });
        });
    });

    // Simple Gallery Scroll
    const galleryContainer = document.querySelector('.gallery-cards');
    const galleryNext = document.querySelector('.nav-btn-circle.next');
    const galleryPrev = document.querySelector('.nav-btn-circle.prev');

    if (galleryContainer && galleryNext && galleryPrev) {
        galleryNext.addEventListener('click', () => {
            galleryContainer.scrollBy({ left: 300, behavior: 'smooth' });
        });
        galleryPrev.addEventListener('click', () => {
            galleryContainer.scrollBy({ left: -300, behavior: 'smooth' });
        });
    }

    // Premium Amenities Carousel
    const premiumTrack = document.getElementById('amenities-track');
    const premiumPrev = document.getElementById('amenities-prev');
    const premiumNext = document.getElementById('amenities-next');
    const catItems = document.querySelectorAll('.premium-amenities__cat-item');

    if (premiumTrack) {
        const getSlides = () => Array.from(premiumTrack.querySelectorAll('.amenities-ref__slide, .premium-amenities__slide'));

        const getSlideStep = (slides) => {
            if (slides.length === 0) return 0;
            const gap = parseFloat(getComputedStyle(premiumTrack).columnGap || getComputedStyle(premiumTrack).gap) || 16;
            return slides[0].offsetWidth + gap;
        };

        const highlightSlide = (slides, activeIdx) => {
            slides.forEach((slide, idx) => {
                slide.classList.toggle('is-active', idx === activeIdx);
            });
        };

        const updateActiveTab = () => {
            const slides = getSlides();
            if (slides.length === 0) return;

            // Edge case: if scrolled to the very end, activate the last tab
            const atEnd = premiumTrack.scrollLeft + premiumTrack.clientWidth >= premiumTrack.scrollWidth - 10;
            if (atEnd) {
                const lastIdx = slides.length - 1;
                catItems.forEach((item, idx) => {
                    const isActive = idx === lastIdx;
                    item.classList.toggle('active', isActive);
                    item.setAttribute('aria-selected', isActive ? 'true' : 'false');
                });
                highlightSlide(slides, lastIdx);
                return;
            }

            const trackRect = premiumTrack.getBoundingClientRect();
            let minDiff = Infinity;
            let activeIdx = 0;

            slides.forEach((slide, idx) => {
                const slideRect = slide.getBoundingClientRect();
                const diff = Math.abs(slideRect.left - trackRect.left);
                if (diff < minDiff) {
                    minDiff = diff;
                    activeIdx = idx;
                }
            });

            catItems.forEach((item, idx) => {
                const isActive = idx === activeIdx;
                item.classList.toggle('active', isActive);
                item.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
            highlightSlide(slides, activeIdx);
        };

        updateActiveTab();

        // Scroll track when clicking categories
        catItems.forEach((item) => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.slideIndex, 10);
                const slides = getSlides();
                if (slides[idx]) {
                    const trackRect = premiumTrack.getBoundingClientRect();
                    const slideRect = slides[idx].getBoundingClientRect();

                    premiumTrack.scrollTo({
                        left: premiumTrack.scrollLeft + (slideRect.left - trackRect.left),
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Prev / Next button listeners
        if (premiumPrev && premiumNext) {
            premiumPrev.addEventListener('click', () => {
                const slides = getSlides();
                if (slides.length === 0) return;
                premiumTrack.scrollBy({ left: -getSlideStep(slides), behavior: 'smooth' });
            });

            premiumNext.addEventListener('click', () => {
                const slides = getSlides();
                if (slides.length === 0) return;
                premiumTrack.scrollBy({ left: getSlideStep(slides), behavior: 'smooth' });
            });
        }

        // Scroll listener to update category highlights
        let scrollTimeout;
        premiumTrack.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(updateActiveTab, 100);
        });

        // Initial run
        updateActiveTab();
    }

    // Traveling Map Interactions
    const mapNodes = document.querySelectorAll('.map-node');
    const navButtons = document.querySelectorAll('.map-nav-btn');
    const routePaths = document.querySelectorAll('.route-path');

    const updateMapState = (targetId) => {
        // Update Nodes
        mapNodes.forEach(node => {
            if (node.dataset.target === targetId) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        });

        // Update Buttons
        navButtons.forEach(btn => {
            if (btn.dataset.node === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Trigger Path Drawing (Example logic)
        routePaths.forEach(path => {
            path.classList.remove('active');
            // Force reflow
            void path.offsetWidth;
            path.classList.add('active');
        });
    };

    mapNodes.forEach(node => {
        node.addEventListener('click', () => {
            updateMapState(node.dataset.target);
        });
    });

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            updateMapState(btn.dataset.node);
        });
    });

    // Category Filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    const allPaths = document.querySelectorAll('.route-path, .route-marking');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            // Update Filter Buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter Map Nodes
            mapNodes.forEach(node => {
                if (filter === 'all' || node.dataset.category === filter || node.dataset.target === 'project') {
                    node.style.display = 'block';
                } else {
                    node.style.display = 'none';
                }
            });

            // Filter Road Paths
            allPaths.forEach(path => {
                if (filter === 'all' || path.dataset.category === filter) {
                    path.style.display = 'block';
                } else {
                    path.style.display = 'none';
                }
            });
        });
    });

    // Auto-trigger on reveal
    const travelSection = document.querySelector('.travel-map');
    if (travelSection) {
        const travelObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    travelSection.classList.add('revealed');
                    routePaths.forEach(path => path.classList.add('active'));
                    travelObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        travelObserver.observe(travelSection);
    }

    if (window.createIcons) window.createIcons();

    // Traveling Map Reveal and Filtering
    const travelSectionNew = document.querySelector('.travel-map');
    const travelNodes = document.querySelectorAll('.travel-map .map-node');
    const travelPaths = document.querySelectorAll('.travel-map .route-path');
    const travelFilters = document.querySelectorAll('.travel-map .filter-btn');

    if (travelSectionNew) {
        const travelObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    travelSectionNew.classList.add('revealed');
                    travelObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        travelObserver.observe(travelSectionNew);
    }

    if (travelFilters.length > 0) {
        travelFilters.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                travelFilters.forEach(f => f.classList.remove('active'));
                btn.classList.add('active');

                travelNodes.forEach(node => {
                    if (filter === 'all' || node.dataset.category === filter || node.dataset.target === 'project') {
                        node.style.opacity = '1';
                        node.style.visibility = 'visible';
                    } else {
                        node.style.opacity = '0.2';
                        node.style.visibility = 'visible';
                    }
                });
            });
        });
    }

    // Creative gallery reveal on scroll
    const creativeGallery = document.querySelector('.gallery-creative');
    if (creativeGallery) {
        if (prefersReducedMotion) {
            creativeGallery.classList.add('is-revealed');
        } else {
            const creativeGalleryObserver = new IntersectionObserver(
                (entries, observer) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            creativeGallery.classList.add('is-revealed');
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
            );
            creativeGalleryObserver.observe(creativeGallery);
        }
    }

    // Enquiry Popup Modal Interactions
    const enquiryModal = document.getElementById('enquiryModal');
    const modalOverlay = enquiryModal?.querySelector('.enquiry-modal__overlay');
    const mobileModalMq = window.matchMedia('(max-width: 768px)');
    let lastModalTrigger = null;

    const isModalOpen = () => enquiryModal?.classList.contains('is-active');

    const openModal = (trigger) => {
        if (!enquiryModal) return;
        lastModalTrigger = trigger && trigger.focus ? trigger : document.activeElement;
        enquiryModal.classList.add('is-active');
        enquiryModal.removeAttribute('inert');
        enquiryModal.setAttribute('aria-hidden', 'false');
        document.body.classList.remove('nav-open');
        if (header) header.classList.remove('is-menu-open');
        document.body.style.overflow = 'hidden';
        if (window.createIcons) window.createIcons(enquiryModal);
        requestAnimationFrame(() => {
            const closeBtn = enquiryModal.querySelector('.enquiry-modal__close');
            const firstField = enquiryModal.querySelector('input[name="name"]');
            if (mobileModalMq.matches) {
                /* Avoid opening the keyboard on mobile so the close control stays usable */
                if (closeBtn) closeBtn.focus({ preventScroll: true });
            } else if (firstField) {
                firstField.focus();
            } else if (closeBtn) {
                closeBtn.focus();
            }
        });
    };

    const closeModal = () => {
        if (!enquiryModal || !isModalOpen()) return;
        const active = document.activeElement;
        if (active && enquiryModal.contains(active)) {
            active.blur();
        }
        enquiryModal.classList.remove('is-active');
        enquiryModal.setAttribute('aria-hidden', 'true');
        enquiryModal.setAttribute('inert', '');
        document.body.style.overflow = '';
        const returnFocus = lastModalTrigger;
        lastModalTrigger = null;
        requestAnimationFrame(() => {
            if (returnFocus && typeof returnFocus.focus === 'function') {
                returnFocus.focus();
            }
        });
    };

    const footerEnquireBtn = document.getElementById('footerEnquireBtn');
    if (footerEnquireBtn) {
        footerEnquireBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(e.currentTarget);
        });
    }

    const exploreResidencesBtn = document.getElementById('exploreResidencesBtn');
    if (exploreResidencesBtn) {
        exploreResidencesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(e.currentTarget);
        });
    }

    const eliteEnquireBtn = document.getElementById('eliteEnquireBtn');
    if (eliteEnquireBtn) {
        eliteEnquireBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(e.currentTarget);
        });
    }

    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(e.currentTarget);
        });
    }

    const navCta = document.querySelector('.nav-cta');
    if (navCta) {
        navCta.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(e.currentTarget);
        });
    }

    document.querySelectorAll('[data-enquire-open]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(e.currentTarget);
        });
    });

    if (enquiryModal) {
        enquiryModal.addEventListener('click', (e) => {
            if (!isModalOpen()) return;
            if (e.target.closest('.enquiry-modal__close')) {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
                return;
            }
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileMenu();
            if (isModalOpen()) closeModal();
        }
    });

    if (window.createIcons) window.createIcons();
});