// 📁 js/help.js
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchHelp');
  const clearBtn = document.getElementById('clearSearchBtn');

  if (clearBtn && searchInput) {
    const toggleClearBtn = () => {
      clearBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';
    };
    toggleClearBtn(); // initial check
    searchInput.addEventListener('input', toggleClearBtn);
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.focus();
      toggleClearBtn();
    });
  }

  const items = Array.from(
    document.querySelectorAll('#main-content .column')
  );
  const resultCount = document.getElementById('help-result-count');

  if (!searchInput || !items.length) return;

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();
    let visible = 0;

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      const match = text.includes(term);
      item.hidden = !match;
      if (match) visible++;
    });

    if (resultCount) {
      resultCount.textContent =
        term === ''
          ? ''
          : `${visible} section${visible === 1 ? '' : 's'} found.`;
    }
  });
});