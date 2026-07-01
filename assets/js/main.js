/* ==============================================
   Strzelec Wrocław – Główny plik JavaScript
   ============================================== */

(function () {
  'use strict';

  /* --- Hamburger menu --- */
  function initHamburger() {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener('click', function () {
      const isOpen = mobileNav.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
      hamburger.setAttribute('aria-label', isOpen ? 'Zamknij menu' : 'Otwórz menu');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Zamknij menu po kliknięciu linku
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Otwórz menu');
        document.body.style.overflow = '';
      });
    });

    // Zamknij po kliknięciu poza menu
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Otwórz menu');
        document.body.style.overflow = '';
      }
    });

    // Zamknij przy Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        mobileNav.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Otwórz menu');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }

  /* --- Aktywny link w nawigacji --- */
  function markActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-nav a, .mobile-nav a').forEach(function (link) {
      const href = link.getAttribute('href');
      if (href === currentPath || (currentPath === '' && href === 'index.html')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* --- Galeria: filtrowanie kategorii --- */
  function initGalleryFilter() {
    const filterBtns = document.querySelectorAll('.gallery-filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (!filterBtns.length) return;

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const category = btn.dataset.filter;

        // Update active button
        filterBtns.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        // Show/hide items
        galleryItems.forEach(function (item) {
          if (category === 'all' || item.dataset.category === category) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });

        // Rebuild lightbox index
        buildLightboxIndex();
      });
    });
  }

  /* --- Lightbox --- */
  var lightboxItems = [];
  var currentLightboxIndex = 0;

  function buildLightboxIndex() {
    lightboxItems = [];
    document.querySelectorAll('.gallery-item:not(.hidden)').forEach(function (item) {
      var img = item.querySelector('img');
      if (img) {
        lightboxItems.push({ src: img.src, alt: img.alt });
      }
    });
  }

  function openLightbox(index) {
    var lightbox = document.querySelector('.lightbox');
    var lbImg = document.querySelector('.lightbox-img');
    if (!lightbox || !lbImg || !lightboxItems.length) return;

    currentLightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
    lbImg.src = lightboxItems[currentLightboxIndex].src;
    lbImg.alt = lightboxItems[currentLightboxIndex].alt;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    var closeBtn = lightbox.querySelector('.lightbox-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    var lightbox = document.querySelector('.lightbox');
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function initLightbox() {
    // Inject lightbox HTML if not present
    if (!document.querySelector('.lightbox')) return;

    buildLightboxIndex();

    // Open on gallery item click
    document.querySelectorAll('.gallery-item').forEach(function (item, idx) {
      item.addEventListener('click', function () {
        // Calculate index among visible items
        var visibleItems = Array.from(document.querySelectorAll('.gallery-item:not(.hidden)'));
        var visibleIdx = visibleItems.indexOf(item);
        buildLightboxIndex();
        openLightbox(visibleIdx);
      });
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
      });
    });

    // Close button
    var closeBtn = document.querySelector('.lightbox-close');
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

    // Prev/Next
    var prevBtn = document.querySelector('.lightbox-prev');
    var nextBtn = document.querySelector('.lightbox-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { openLightbox(currentLightboxIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { openLightbox(currentLightboxIndex + 1); });

    // Close on overlay click
    document.querySelector('.lightbox').addEventListener('click', function (e) {
      if (e.target === this) closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      var lb = document.querySelector('.lightbox');
      if (!lb || !lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') openLightbox(currentLightboxIndex - 1);
      if (e.key === 'ArrowRight') openLightbox(currentLightboxIndex + 1);
    });
  }

  /* --- Aktualizacja roku copyright --- */
  function updateCopyrightYear() {
    document.querySelectorAll('.copyright-year').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* --- Init --- */
  document.addEventListener('DOMContentLoaded', function () {
    initHamburger();
    markActiveNavLink();
    initGalleryFilter();
    initLightbox();
    updateCopyrightYear();
  });

})();
