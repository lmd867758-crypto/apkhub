// === Gride X Central — Ads System ===
// First click triggers social bar ad. Every page refresh = fresh session.

(function() {
    const AD_SCRIPT_URL = "https://pl31217748.profitableratecpmnetwork.com/96/b0/29/96b02941538258617c0f54d31bc8f0ea.js";
    const SMART_LINK = "https://www.profitableratecpmnetwork.com/y615n2y2qh?key=6b5b1a87751690bf0f9f0c59ba5e24c5";
    let adLoaded = false;

    function loadAdScript() {
        if (adLoaded) return;
        adLoaded = true;
        try {
            var s = document.createElement('script');
            s.src = AD_SCRIPT_URL;
            s.async = true;
            document.head.appendChild(s);
        } catch(e) {}
    }

    // === First click anywhere → load ad script (social bar appears) ===
    document.addEventListener('click', function firstClick(e) {
        if (adLoaded) return;
        document.removeEventListener('click', firstClick, true);
        if (e.target.closest && e.target.closest('.ad-overlay, .ad-modal, .ad-banner')) return;
        loadAdScript();
    }, true);

    // === Download button → smart link + download ===
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.download-btn-sm, .download-btn');
        if (!btn) return;
        var downloadUrl = btn.tagName === 'A' ? btn.href : (btn.querySelector('a[href]')?.href || '');
        if (!downloadUrl || downloadUrl.includes('profitableratecpmnetwork')) return;
        e.preventDefault();
        e.stopPropagation();
        loadAdScript();
        try { window.open(SMART_LINK, '_blank'); } catch(e) {}
        setTimeout(function() { window.open(downloadUrl, '_blank'); }, 500);
    }, true);
})();