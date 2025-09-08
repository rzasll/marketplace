// Script yang lebih rapi: toggle nav, smooth scroll, modals, copy IP, keyboard support
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navClose = document.getElementById('nav-close');
  const navLinks = document.querySelectorAll('.nav-link');
  const moreButtons = document.querySelectorAll('.more-btn');
  const tutorialDetails = document.querySelectorAll('.tutorial-detail');
  const closeTutorials = document.querySelectorAll('.close-tutorial');
  const copyIpBtn = document.getElementById('copy-ip');
  const serverIp = document.getElementById('server-ip');
  const yearEl = document.getElementById('year');

  // Set tahun footer
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Helper: open/close overlay nav
  function openNav() {
    navMenu.setAttribute('aria-hidden', 'false');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // blok scroll saat nav terbuka
  }
  function closeNav() {
    navMenu.setAttribute('aria-hidden', 'true');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = ''; // restore scroll
  }

  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    if (expanded) closeNav(); else openNav();
  });

  if (navClose) navClose.addEventListener('click', closeNav);

  // Smooth scroll for nav links + close nav on mobile
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#')) {
        e.preventDefault();
        const id = href.slice(1);
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // tutup nav overlay jika terbuka
        if (navMenu.getAttribute('aria-hidden') === 'false') closeNav();
      }
    });
  });

  // Modal (tutorial) handling
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    // disable page scroll ketika modal aktif
    document.body.style.overflow = 'hidden';
    // fokus ke modal agar keyboard accessibility
    const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }
  function closeModal(modal) {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  moreButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (target) openModal(target);
    });
  });

  closeTutorials.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = btn.closest('.tutorial-detail');
      closeModal(modal);
    });
  });

  // Tutup modal jika klik di luar card
  tutorialDetails.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // ESC to close modals / nav
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // close any open modal
      tutorialDetails.forEach(modal => {
        if (modal.getAttribute('aria-hidden') === 'false') closeModal(modal);
      });
      // close nav if open
      if (navMenu.getAttribute('aria-hidden') === 'false') closeNav();
    }
  });

  // Copy IP to clipboard
  if (copyIpBtn && serverIp) {
    copyIpBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(serverIp.textContent.trim());
        copyIpBtn.textContent = 'Tersalin ✓';
        setTimeout(() => { copyIpBtn.textContent = 'Salin IP'; }, 2200);
      } catch (err) {
        // fallback: select & prompt
        window.prompt('Salin IP server ini:', serverIp.textContent.trim());
      }
    });
  }

  // Improve focus outlines for keyboard users (optional)
  function handleFirstTab(e) {
    if (e.key === 'Tab') {
      document.documentElement.classList.add('show-focus');
      window.removeEventListener('keydown', handleFirstTab);
    }
  }
  window.addEventListener('keydown', handleFirstTab);

  // IntersectionObserver untuk animasi gambar testimoni
  const testimoniImages = document.querySelectorAll('.testimoni-gallery img');
  if (testimoniImages.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    testimoniImages.forEach(img => observer.observe(img));
  }

});