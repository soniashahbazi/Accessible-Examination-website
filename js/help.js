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

      // 🔧 Hide the skip-to-results link too
      const skipLink = document.getElementById('skip-to-results');
      if (skipLink) {
        skipLink.classList.add('sr-only');
        skipLink.setAttribute('aria-hidden', 'true');
        skipLink.setAttribute('tabindex', '-1');
      }
    });

  }

  const items = Array.from(
    document.querySelectorAll('#main-content .column')
  );
  const resultCount = document.getElementById('help-result-count');

  const matchSummary = document.getElementById('help-match-summary');
  let debounceTimeout;

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);

    const term = searchInput.value.trim().toLowerCase();
    let visible = 0;
    const matchedItems = [];

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      const match = text.includes(term);
      item.hidden = !match;
      if (match) {
        visible++;
        matchedItems.push(item);
      }
    });

    resultCount.textContent = term === ''
      ? ''
      : `${visible} section${visible === 1 ? '' : 's'} found.`;

    const noResultsMessage = document.getElementById('no-results-message');

    if (noResultsMessage) {
      if (term !== '' && visible === 0) {
        noResultsMessage.textContent = 'No help section found.';
      } else {
        noResultsMessage.textContent = '';
      }
    }


    // Debounced update to avoid chatty output while typing
    debounceTimeout = setTimeout(() => {
      if (!matchSummary) return;

      if (term === '' || visible === 0) {
        matchSummary.textContent = '';
        return;
      }

      const summaries = matchedItems.map(item => {
        const h3 = item.querySelector('h3');
        return h3 ? h3.textContent.trim() : item.textContent.trim().slice(0, 80);
      });

      if (visible === 1) {
        matchSummary.textContent = `One match: ${summaries[0]}`;
      } else {
        matchSummary.textContent = `${visible} matches: ${summaries.join('; ')}`;
      }
    }, 600);
  });
  searchInput.addEventListener('blur', () => {
    const skipLink = document.getElementById('skip-to-results');
    const term = searchInput.value.trim().toLowerCase();
    const hasVisible = items.some(item => !item.hidden);

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
 
  const skipToResults = document.querySelector('a[href="#help-result-target"]');

  if (skipToResults) {
    skipToResults.addEventListener('click', (e) => {
      e.preventDefault();

      // Clear any previous styling
      document.querySelectorAll('.keyboard-focused').forEach(el =>
        el.classList.remove('keyboard-focused')
      );

      // Focus the first visible help column
      const firstVisibleItem = items.find(item => !item.hidden);
      if (firstVisibleItem) {
        firstVisibleItem.classList.add('keyboard-focused');
        firstVisibleItem.focus();
      }
    });
  }


});