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
    const LEAD_BROCHURE_SOURCE = 'Godrej Samaris Website - Brochure Download';
    const BROCHURE_PDF_URL = 'godrej-samaris-brochure.pdf';
    const THANK_YOU_URL = 'thank-you.html?lead=1';

    const triggerBrochureDownload = () => {
        const link = document.createElement('a');
        link.href = BROCHURE_PDF_URL;
        link.download = 'Godrej-Samaris-Brochure.pdf';
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

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

            const isBrochureLead = form.dataset.leadIntent === 'brochure';
            const payload = {
                name,
                email,
                mobile,
                page: isBrochureLead ? LEAD_BROCHURE_SOURCE : LEAD_PAGE_SOURCE
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
                    if (isBrochureLead) {
                        triggerBrochureDownload();
                    }
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

    const initContinuousMarquee = ({
        track,
        prevBtn,
        nextBtn,
        progressEl,
        counterEl,
        sectionEl,
        speed = 0.45,
        slidesPerView = 2
    }) => {
        if (!track || track.dataset.marqueeReady === 'true') return;

        const originals = Array.from(track.children).filter((child) => !child.classList.contains('marquee-clone'));
        const total = originals.length;
        if (total < 2) return;

        originals.forEach((slide) => {
            const clone = slide.cloneNode(true);
            clone.classList.add('marquee-clone');
            clone.setAttribute('aria-hidden', 'true');
            clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
            track.appendChild(clone);
        });

        track.dataset.marqueeReady = 'true';
        track.classList.add('is-marquee-active');

        let loopWidth = 0;
        let slideStep = 0;
        let offset = 0;
        let paused = false;
        let running = true;
        let resumeTimer = null;
        let reducedMotionTimer = null;
        let lastCounterIndex = -1;

        const applyOffset = () => {
            track.style.transform = `translate3d(-${offset}px, 0, 0)`;
        };

        const outer = track.parentElement;

        const measure = () => {
            const gap = parseFloat(getComputedStyle(track).gap) || 0;
            if (outer && outer.clientWidth > 0) {
                const slideWidth = (outer.clientWidth - gap * (slidesPerView - 1)) / slidesPerView;
                track.querySelectorAll(':scope > *').forEach((el) => {
                    el.style.width = `${slideWidth}px`;
                    el.style.flex = `0 0 ${slideWidth}px`;
                });
            }
            slideStep = originals[0].offsetWidth + gap;
            loopWidth = (slideStep * total) - gap;
            if (loopWidth <= 0) loopWidth = track.scrollWidth / 2;
        };

        const normalizeOffset = () => {
            if (loopWidth <= 0) return;
            while (offset >= loopWidth) offset -= loopWidth;
            while (offset < 0) offset += loopWidth;
            applyOffset();
        };

        const getActiveIndex = () => {
            if (slideStep <= 0 || loopWidth <= 0) return 0;
            const idx = Math.floor((offset + slideStep * 0.35) / slideStep);
            return ((idx % total) + total) % total;
        };

        const updateUI = () => {
            if (progressEl && loopWidth > 0) {
                progressEl.style.width = `${(offset / loopWidth) * 100}%`;
            }
            const activeIndex = getActiveIndex();
            if (counterEl && activeIndex !== lastCounterIndex) {
                lastCounterIndex = activeIndex;
                counterEl.textContent = `${activeIndex + 1} / ${total}`;
            }
        };

        const pauseBriefly = (ms = 2200) => {
            paused = true;
            clearTimeout(resumeTimer);
            resumeTimer = setTimeout(() => {
                paused = false;
            }, ms);
        };

        const pageStep = () => slideStep * slidesPerView;

        const tick = () => {
            if (running && !paused && !prefersReducedMotion && loopWidth > 0) {
                offset += speed;
                normalizeOffset();
                updateUI();
            }
            requestAnimationFrame(tick);
        };

        if (sectionEl) {
            const visibilityObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    running = entry.isIntersecting;
                });
            }, { threshold: 0.05, rootMargin: '80px 0px' });
            visibilityObserver.observe(sectionEl);
        }

        const hoverTarget = track.closest('.amenities-ref__slider-outer, .gallery-creative__slider-outer') || track;
        hoverTarget.addEventListener('mouseenter', () => { paused = true; });
        hoverTarget.addEventListener('mouseleave', () => { paused = false; });

        prevBtn?.addEventListener('click', () => {
            offset -= pageStep();
            normalizeOffset();
            updateUI();
            pauseBriefly();
        });

        nextBtn?.addEventListener('click', () => {
            offset += pageStep();
            normalizeOffset();
            updateUI();
            pauseBriefly();
        });

        const refresh = () => {
            measure();
            normalizeOffset();
            updateUI();
        };

        track.querySelectorAll('img').forEach((img) => {
            if (!img.complete) {
                img.addEventListener('load', refresh, { once: true });
            }
        });

        refresh();
        requestAnimationFrame(tick);

        if (prefersReducedMotion) {
            reducedMotionTimer = window.setInterval(() => {
                if (!running || paused || loopWidth <= 0) return;
                offset += pageStep();
                normalizeOffset();
                updateUI();
            }, 4200);
        }

        window.addEventListener('resize', refresh);
        window.addEventListener('load', refresh);

        return () => {
            running = false;
            clearTimeout(resumeTimer);
            if (reducedMotionTimer) clearInterval(reducedMotionTimer);
        };
    };

    initContinuousMarquee({
        track: document.getElementById('amenities-track'),
        prevBtn: document.getElementById('amenities-prev'),
        nextBtn: document.getElementById('amenities-next'),
        progressEl: document.getElementById('amenities-progress'),
        counterEl: document.getElementById('amenities-counter'),
        sectionEl: document.getElementById('amenities'),
        speed: 0.5,
        slidesPerView: 2
    });

    initContinuousMarquee({
        track: document.getElementById('gallery-track'),
        prevBtn: document.getElementById('gallery-prev'),
        nextBtn: document.getElementById('gallery-next'),
        progressEl: document.getElementById('gallery-progress'),
        counterEl: document.getElementById('gallery-counter'),
        sectionEl: document.getElementById('gallery'),
        speed: 0.5,
        slidesPerView: 2
    });

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

    // Gallery lightbox
    const galleryLightbox = document.getElementById('galleryLightbox');
    const galleryOpenButtons = document.querySelectorAll('.gallery-creative__track .gc-card__open');
    const galleryLightboxImg = galleryLightbox?.querySelector('.gc-lightbox__img');
    const galleryLightboxCaption = galleryLightbox?.querySelector('.gc-lightbox__caption');
    const galleryLightboxCounter = galleryLightbox?.querySelector('.gc-lightbox__counter');
    let galleryItems = [];
    let galleryIndex = 0;
    let galleryLastTrigger = null;

    if (galleryOpenButtons.length > 0 && galleryLightbox && galleryLightboxImg) {
        galleryItems = Array.from(galleryOpenButtons).map((btn) => {
            const img = btn.querySelector('img');
            return {
                src: img?.currentSrc || img?.src || '',
                alt: img?.alt || 'Gallery image'
            };
        });

        const isGalleryLightboxOpen = () => galleryLightbox.classList.contains('is-active');

        const renderGalleryLightbox = () => {
            const item = galleryItems[galleryIndex];
            if (!item) return;
            galleryLightboxImg.src = item.src;
            galleryLightboxImg.alt = item.alt;
            if (galleryLightboxCaption) {
                galleryLightboxCaption.textContent = item.alt;
            }
            if (galleryLightboxCounter) {
                galleryLightboxCounter.textContent = `${galleryIndex + 1} / ${galleryItems.length}`;
            }
        };

        const openGalleryLightbox = (index, trigger) => {
            galleryIndex = index;
            galleryLastTrigger = trigger || null;
            renderGalleryLightbox();
            galleryLightbox.classList.add('is-active');
            galleryLightbox.removeAttribute('inert');
            galleryLightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            if (window.createIcons) window.createIcons(galleryLightbox);
            const closeBtn = galleryLightbox.querySelector('.gc-lightbox__close');
            if (closeBtn) closeBtn.focus({ preventScroll: true });
        };

        const closeGalleryLightbox = () => {
            if (!isGalleryLightboxOpen()) return;
            galleryLightbox.classList.remove('is-active');
            galleryLightbox.setAttribute('aria-hidden', 'true');
            galleryLightbox.setAttribute('inert', '');
            const enquiryOpen = document.getElementById('enquiryModal')?.classList.contains('is-active');
            if (!enquiryOpen) {
                document.body.style.overflow = '';
            }
            galleryLightboxImg.removeAttribute('src');
            const returnFocus = galleryLastTrigger;
            galleryLastTrigger = null;
            requestAnimationFrame(() => {
                if (returnFocus && typeof returnFocus.focus === 'function') {
                    returnFocus.focus();
                }
            });
        };

        const stepGalleryLightbox = (delta) => {
            galleryIndex = (galleryIndex + delta + galleryItems.length) % galleryItems.length;
            renderGalleryLightbox();
        };

        galleryOpenButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => openGalleryLightbox(index, btn));
        });

        galleryLightbox.querySelectorAll('[data-gallery-close]').forEach((el) => {
            el.addEventListener('click', closeGalleryLightbox);
        });

        galleryLightbox.querySelector('[data-gallery-prev]')?.addEventListener('click', () => stepGalleryLightbox(-1));
        galleryLightbox.querySelector('[data-gallery-next]')?.addEventListener('click', () => stepGalleryLightbox(1));

        galleryLightbox.addEventListener('click', (e) => {
            if (e.target === galleryLightbox.querySelector('.gc-lightbox__overlay')) {
                closeGalleryLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!isGalleryLightboxOpen()) return;
            if (e.key === 'Escape') {
                closeGalleryLightbox();
            } else if (e.key === 'ArrowLeft') {
                stepGalleryLightbox(-1);
            } else if (e.key === 'ArrowRight') {
                stepGalleryLightbox(1);
            }
        });
    }

    // Enquiry Popup Modal Interactions
    const enquiryModal = document.getElementById('enquiryModal');
    const modalOverlay = enquiryModal?.querySelector('.enquiry-modal__overlay');
    const mobileModalMq = window.matchMedia('(max-width: 768px)');
    let lastModalTrigger = null;

    const isModalOpen = () => enquiryModal?.classList.contains('is-active');
    const popupForm = document.getElementById('popup-form');

    const setPopupLeadIntent = (trigger) => {
        if (!popupForm) return;
        if (trigger && trigger.dataset.leadSource === 'brochure') {
            popupForm.dataset.leadIntent = 'brochure';
        } else {
            delete popupForm.dataset.leadIntent;
        }
    };

    const openModal = (trigger) => {
        if (!enquiryModal) return;
        setPopupLeadIntent(trigger);
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
        if (popupForm) delete popupForm.dataset.leadIntent;
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

    const brochureFab = document.querySelector('.brochure-fab');
    if (brochureFab) {
        const toggleBrochureFab = () => {
            brochureFab.classList.toggle('is-visible', window.scrollY > 320);
        };
        toggleBrochureFab();
        window.addEventListener('scroll', toggleBrochureFab, { passive: true });
    }

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