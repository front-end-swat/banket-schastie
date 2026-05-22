document.addEventListener('DOMContentLoaded', () => {

  // Active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('nav__link--active');
    }
  });

  // Header scroll effect
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('header--scrolled', window.scrollY > 80);
  });

  // Scroll to top button
  const scrollBtn = document.getElementById('scrollTop');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 500);
    });
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Burger menu
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      nav.classList.toggle('open');
    });
    document.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        nav.classList.remove('open');
      });
    });
  }

  // Particles
  const particlesContainer = document.getElementById('particles');
  if (particlesContainer) {
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
      p.style.animationDuration = (10 + Math.random() * 20) + 's';
      p.style.animationDelay = Math.random() * 15 + 's';
      p.style.opacity = 0.2 + Math.random() * 0.4;
      particlesContainer.appendChild(p);
    }
  }

  // Reveal animation on scroll (Intersection Observer)
  const revealElements = document.querySelectorAll(
    '.section__header, .about__item, .service-card, .gallery__item, .review-card, .contact__item, .contact__form'
  );
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal', 'visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  revealElements.forEach(el => revealObserver.observe(el));

  // Gallery lightbox
  const galleryItems = document.querySelectorAll('.gallery__item');
  if (galleryItems.length) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    document.body.appendChild(lightbox);
    const lightboxImg = document.createElement('img');
    lightbox.appendChild(lightboxImg);
    galleryItems.forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (img) {
          lightboxImg.src = img.src;
          lightbox.classList.add('open');
        }
      });
    });
    lightbox.addEventListener('click', () => lightbox.classList.remove('open'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lightbox.classList.remove('open');
    });
  }

  // Gallery filters
  const filters = document.querySelectorAll('.gallery-filter');
  const grid = document.getElementById('galleryGrid');
  if (filters.length && grid) {
    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        grid.querySelectorAll('.gallery__item').forEach(item => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
        // Re-trigger masonry-like layout
        setTimeout(() => {
          grid.querySelectorAll('.gallery__item').forEach(item => {
            item.style.opacity = '';
          });
        }, 50);
      });
    });
  }

  // Counter animation on scroll
  const counters = document.querySelectorAll('.counter');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target);
          const duration = 2000;
          const start = performance.now();
          function update(now) {
            const progress = Math.min((now - start) / duration, 1);
            el.textContent = Math.floor(progress * target).toLocaleString();
            if (progress < 1) requestAnimationFrame(update);
          }
          requestAnimationFrame(update);
          counterObserver.unobserve(el);
        }
      });
    });
    counters.forEach(c => counterObserver.observe(c));
  }
});
