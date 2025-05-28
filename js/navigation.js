document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-item a'); // Select all navigation links
  const currentPage = window.location.pathname.split('/').pop(); // Get the current page's filename

  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active'); // Add the active class to the matching link
      link.setAttribute('aria-current', 'page'); // Set aria-current for accessibility
    } else {
      link.classList.remove('active'); // Ensure other links don't have the active class
      link.removeAttribute('aria-current');
    }
  });
});