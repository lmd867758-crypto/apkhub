(function() {
    const SMART_LINK = "https://www.profitableratecpmnetwork.com/y615n2y2qh?key=6b5b1a87751690bf0f9f0c59ba5e24c5";
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.download-btn-sm, .download-btn');
        if (!btn) return;
        let downloadUrl = btn.tagName === 'A' ? btn.href : (btn.querySelector('a[href]')?.href || '');
        if (!downloadUrl || downloadUrl.includes('profitableratecpmnetwork')) return;
        e.preventDefault();
        e.stopPropagation();
        try { window.open(SMART_LINK, '_blank'); } catch(ex) {}
        setTimeout(() => { window.open(downloadUrl, '_blank'); }, 500);
    }, true);
})();
