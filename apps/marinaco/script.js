(() => {
  const links = window.MARINACO_LINKS || {};
  document.querySelectorAll('[data-key]').forEach(el => {
    const url = String(links[el.dataset.key] || '').trim();
    if (/^(https?:\/\/|tel:)/i.test(url)) {
      el.href = url;
    } else if (url.startsWith('/')) {
      el.href = url;
      el.removeAttribute('target');
      el.removeAttribute('rel');
    } else {
      el.classList.add('unconfigured');
      el.removeAttribute('target');
      el.setAttribute('aria-disabled','true');
      el.title = 'Link coming soon';
      el.addEventListener('click', e => e.preventDefault());
    }
  });
})();
