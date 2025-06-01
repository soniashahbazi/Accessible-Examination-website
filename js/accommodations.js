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

    // Also hide the skip-to-results link
    const skipLink = document.querySelector('a[href="#accommodation-list"]');
    if (skipLink) {
      skipLink.classList.add('sr-only');
      skipLink.setAttribute('aria-hidden', 'true');
      skipLink.setAttribute('tabindex', '-1');
    }
  });

}

const listItems = Array.from(
  document.querySelectorAll('.accommodation-list li')
);

const resultCount = document.getElementById('accommodation-result-count');

const articles = Array.from(document.querySelectorAll('.accommodation-group'));

searchInput.addEventListener('input', () => {
  const term = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;

  articles.forEach(article => {
    const listItems = Array.from(article.querySelectorAll('li'));
    const heading = article.querySelector('h2');
    const headingText = heading ? heading.textContent.toLowerCase() : '';
    let localVisible = 0;

    const headingMatch = headingText.includes(term);

    listItems.forEach(li => {
      // If heading matches, show all items
      const match = li.textContent.toLowerCase().includes(term);
      li.hidden = headingMatch ? false : !match;
      if (!li.hidden) localVisible++;
    });

    article.hidden = localVisible === 0 && !headingMatch;

    if (localVisible > 0 || headingMatch) visibleCount++;
  });


  if (resultCount) {
    resultCount.textContent =
      term === ''
        ? ''
        : `${visibleCount} accommodation${visibleCount === 1 ? '' : 's'} found.`;
  }

  const matchSummary = document.getElementById('accommodation-match-summary');
  if (matchSummary) {
    if (term === '' || visibleCount === 0) {
      matchSummary.textContent = '';
    } else {
      // Get first visible match
      const firstMatch = document.querySelector('.accommodation-group:not([hidden]) li:not([hidden])');
      if (firstMatch) {
        matchSummary.textContent = `First match: ${firstMatch.textContent.trim()}`;
      }
    }
  }
  const noResults = document.getElementById('no-results-message');

  if (term !== '' && visibleCount === 0) {
    noResults.textContent = 'No accommodations found.';
  } else {
    noResults.textContent = '';
  }


});

searchInput.addEventListener('blur', () => {
  const skipLink = document.querySelector('a[href="#accommodation-list"]');
  const term = searchInput.value.trim().toLowerCase();
  const hasVisible = articles.some(article => !article.hidden);

  if (skipLink) {
    if (term !== '' && hasVisible) {
      skipLink.classList.remove('sr-only');
      skipLink.removeAttribute('aria-hidden');
      skipLink.setAttribute('tabindex', '0');
    } else {
      skipLink.classList.add('sr-only');
      skipLink.setAttribute('aria-hidden', 'true');
      skipLink.setAttribute('tabindex', '-1');
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const skipLink = document.querySelector('a[href="#accommodation-list"]');

  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();

      document.querySelectorAll('.keyboard-focused').forEach(el =>
        el.classList.remove('keyboard-focused')
      );

      const currentFirstVisible = document.querySelector('.accommodation-group:not([hidden])');
      if (currentFirstVisible) {
        currentFirstVisible.classList.add('keyboard-focused');
        currentFirstVisible.focus();
      }
    });
  }

});

