// === Gride X Central — Invisible Click Layer Ad System ===
// Page load → invisible layer on top → click → ad opens → layer gone → normal site

(function() {
    var SMART_LINK = "https://www.profitableratecpmnetwork.com/y615n2y2qh?key=6b5b1a87751690bf0f9f0c59ba5e24c5";
    var layer = document.getElementById('clickLayer');

    // Show invisible layer immediately
    if (layer) {
        layer.style.display = 'block';
    }

    // On first click anywhere → open ad + hide layer
    document.addEventListener('click', function firstClick(e) {
        if (!layer || layer.style.display === 'none') return;
        
        // Open ad in new window
        try {
            window.open(SMART_LINK, '_blank');
        } catch(ex) {}

        // Hide layer (allow normal interaction)
        layer.style.display = 'none';

        // Remove listener after first use
        document.removeEventListener('click', firstClick, true);
    }, true);

    // === Download button → smart link + download ===
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.download-btn-sm, .download-btn');
        if (!btn) return;
        var downloadUrl = btn.tagName === 'A' ? btn.href : (btn.querySelector('a[href]')?.href || '');
        if (!downloadUrl || downloadUrl.includes('profitableratecpmnetwork')) return;
        e.preventDefault();
        e.stopPropagation();
        try { window.open(SMART_LINK, '_blank'); } catch(e) {}
        setTimeout(function() { window.open(downloadUrl, '_blank'); }, 500);
    }, true);
})();