// Unsaid Documentation Interactive Script
document.addEventListener('DOMContentLoaded', () => {
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
