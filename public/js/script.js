// Theme toggle functionality
const themeToggle = document.querySelector('.theme-toggle');
if (themeToggle) {
  // Set dark theme as default if no theme is set
  if (!document.body.hasAttribute('data-theme')) {
    document.body.setAttribute('data-theme', 'dark');
  }
  
  themeToggle.addEventListener('click', function() {
    if (document.body.getAttribute('data-theme') === 'light') {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.setAttribute('data-theme', 'light');
    }
  });
} 