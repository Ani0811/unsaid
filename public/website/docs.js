// Unsaid Documentation Interactive Script
document.addEventListener('DOMContentLoaded', () => {
  // Mobile drawer navigation toggle
  const mobileToggle = document.getElementById('mobileNavToggle');
  const sidebar = document.getElementById('docsSidebar');
  const backdrop = document.getElementById('docsBackdrop');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      if (sidebar && sidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  // Close sidebar drawer on link click in mobile view
  document.querySelectorAll('.sidebar-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        closeSidebar();
      }
    });
  });

  // Copy code blocks
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const codeBlock = btn.closest('.code-container').querySelector('code');
      if (codeBlock) {
        navigator.clipboard.writeText(codeBlock.innerText).then(() => {
          const original = btn.innerText;
          btn.innerText = 'Copied!';
          btn.style.color = '#34d399';
          setTimeout(() => {
            btn.innerText = original;
            btn.style.color = '';
          }, 2000);
        });
      }
    });
  });

  // Sidebar active link indicator on scroll
  const sections = document.querySelectorAll('.docs-section');
  const navLinks = document.querySelectorAll('.sidebar-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // Documentation live search
  const searchInput = document.getElementById('docsSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const sections = document.querySelectorAll('.docs-section');

      sections.forEach((sec) => {
        const text = sec.innerText.toLowerCase();
        if (!query || text.includes(query)) {
          sec.style.display = '';
        } else {
          sec.style.display = 'none';
        }
      });
    });
  }
});
