// === Gride X Central — Ads System ===
// Every click opens ad popup. Fresh every page load.

(function() {
    const SMART_LINK = "https://www.profitableratecpmnetwork.com/y615n2y2qh?key=6b5b1a87751690bf0f9f0c59ba5e24c5";
    var clicked = false;

    // === Every single click → open ad popup ===
    document.addEventListener('click', function(e) {
        if (e.target.closest && e.target.closest('.ad-overlay, .ad-modal, .ad-banner')) return;
        
        // Open ad in new window
        try {
            var w = window.open(SMART_LINK, '_blank');
        } catch(ex) {}
        
        // If it's a download button, also open download link
        var btn = e.target.closest('.download-btn-sm, .download-btn');
        if (btn) {
            var downloadUrl = btn.tagName === 'A' ? btn.href : (btn.querySelector('a[href]')?.href || '');
            if (downloadUrl && !downloadUrl.includes('profitableratecpmnetwork')) {
                e.preventDefault();
                e.stopPropagation();
                setTimeout(function() { window.open(downloadUrl, '_blank'); }, 500);
            }
        }
    }, true);
})();