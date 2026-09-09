// === Gride X Central — Click-Layer Ad System (once per session) ===
// First click of a SESSION → smart-link opens once → layer gone.
// Tab close/reopen = new session = fires again.
// NOTE: previously this fired on every page load; sessionStorage throttle
// keeps revenue while reducing deindex risk.

(function() {
    var SMART_LINK = "https://www.profitableratecpmnetwork.com/y615n2y2qh?key=6b5b1a87751690bf0f9f0c59ba5e24c5";
    var layer = document.getElementById('clickLayer');
    var alreadyFired = false;
    try { alreadyFired = sessionStorage.getItem('gxc_click_ad') === '1'; } catch(e) {}

    // Only show invisible layer if this session hasn't fired the ad yet
    if (layer && !alreadyFired) {
        layer.style.display = 'block';
    }

    // On first click anywhere (once per session) → open ad + hide layer
    document.addEventListener('click', function firstClick(e) {
        if (!layer || layer.style.display === 'none') return;

        try {
            window.open(SMART_LINK, '_blank');
            sessionStorage.setItem('gxc_click_ad', '1');
        } catch(ex) {}

        layer.style.display = 'none';
        document.removeEventListener('click', firstClick, true);
    }, true);

    // === Download button → smart link + download (also once per session) ===
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.download-btn-sm, .download-btn');
        if (!btn) return;
        var downloadUrl = btn.tagName === 'A' ? btn.href : (btn.querySelector('a[href]') && btn.querySelector('a[href]').href || '');
        if (!downloadUrl || downloadUrl.indexOf('profitableratecpmnetwork') !== -1) return;
        e.preventDefault();
        e.stopPropagation();
        var fired = false;
        try {
            window.open(SMART_LINK, '_blank');
            fired = true;
            sessionStorage.setItem('gxc_dl_ad', '1');
        } catch(ex) {}
        setTimeout(function() {
            if (fired) window.open(downloadUrl, '_blank');
            else window.location.href = downloadUrl;
        }, 500);
    }, true);
})();
