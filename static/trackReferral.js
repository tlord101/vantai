(function () {
  // Run early on landing page
  try {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (!refCode) return;

    // Avoid double tracking in same browser
    const key = `ref_tracked_${refCode}`;
    if (localStorage.getItem(key)) {
      // clean URL but do nothing
      params.delete('ref');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
      history.replaceState({}, document.title, newUrl);
      return;
    }

    // POST to server endpoint (same origin). Adjust path if your server is different.
    fetch('/api/track-referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refCode, dest: '/' })
    }).then(resp => resp.json()).then(data => {
      // mark tracked
      localStorage.setItem(key, '1');
      // remove ref param from URL
      params.delete('ref');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
      history.replaceState({}, document.title, newUrl);
      console.log('Referral tracked', data);
    }).catch(err => {
      console.warn('Failed to track referral', err);
      // still remove param to avoid repeated tries
      params.delete('ref');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
      history.replaceState({}, document.title, newUrl);
    });
  } catch (e) {
    console.warn('trackReferral error', e);
  }
})();
