const searchInput = document.getElementById('searchAccommodations');
const clearBtn = document.getElementById('clearSearchBtn');

if (clearBtn && searchInput) {
  const toggleClearBtn = () => {
    clearBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';
  };
  toggleClearBtn(); // On load
  searchInput.addEventListener('input', toggleClearBtn);
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    searchInput.focus();
    toggleClearBtn();
  });
}

const listItems = Array.from(
  document.querySelectorAll('.accommodation-list li')
);

const resultCount = document.getElementById('accommodation-result-count');

searchInput.addEventListener('input', () => {
  const term = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;

  listItems.forEach(li => {
    const text = li.textContent.toLowerCase();
    const match = text.includes(term);
    li.hidden = !match;            // hide non-matches
    if (match) visibleCount++;
  });

  // Announce how many results are shown:
  if (resultCount) {
    if (term === '') {
      resultCount.textContent = '';
    } else {
      resultCount.textContent = `${visibleCount} accommodation${visibleCount === 1 ? '' : 's'} found.`;
    }
  }
});