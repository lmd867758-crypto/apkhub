// === sessionStorage Ad System ===
// Controls ad frequency using sessionStorage (resets per browser session)

(function() {
    const AD_CONFIG = {
        // Ad network URLs - REPLACE with your actual ad links
        overlayUrl: "https://example.com/vpn-offer",       // CHANGE THIS
        bannerUrl: "https://example.com/best-mod-apk",     // CHANGE THIS
        // Ad frequency (session-based, resets when browser closes)
        overlayInterval: 3,      // Show overlay every N page views
        bannerDelay: 30,         // Show banner after N seconds on site
        overlayTimer: 10,        // Seconds before user can close overlay
        // Google AdSense (optional - add your publisher ID)
        adsensePublisherId: ""   // e.g. "ca-pub-XXXXXXXXXXXXXXXX"
    };

    // Get or init session counters
    function getSession(key, defaultValue = 0) {
        try {
            const val = sessionStorage.getItem(key);
            return val ? parseInt(val, 10) : defaultValue;
        } catch(e) { return defaultValue; }
    }

    function setSession(key, value) {
        try { sessionStorage.setItem(key, value.toString()); } catch(e) {}
    }

    function incrementSession(key) {
        const val = getSession(key) + 1;
        setSession(key, val);
        return val;
    }

    // === Overlay Ad ===
    const overlay = document.getElementById('adOverlay');
    const closeBtn = document.getElementById('adClose');
    const skipBtn = document.getElementById('adSkip');
    const timerSpan = document.getElementById('adTimer');
    const ctaBtn = document.getElementById('adCta');
    const adBody = document.getElementById('adBody');

    let overlayTimerInterval = null;
    let overlayCountdown = AD_CONFIG.overlayTimer;

    function showOverlay() {
        if (!overlay) return;
        overlay.classList.add('active');
        overlayCountdown = AD_CONFIG.overlayTimer;
        if (timerSpan) timerSpan.textContent = overlayCountdown;
        if (closeBtn) closeBtn.style.display = 'none';

        if (skipBtn) skipBtn.style.display = 'none';

        // Countdown timer
        overlayTimerInterval = setInterval(() => {
            overlayCountdown--;
            if (timerSpan) timerSpan.textContent = overlayCountdown;
            if (overlayCountdown <= 0) {
                clearInterval(overlayTimerInterval);
                if (closeBtn) closeBtn.style.display = 'block';
                if (skipBtn) skipBtn.style.display = 'block';
            }
        }, 1000);
    }

    function closeOverlay() {
        if (!overlay) return;
        overlay.classList.remove('active');
        if (overlayTimerInterval) clearInterval(overlayTimerInterval);
    }

    // Event listeners
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
    if (skipBtn) skipBtn.addEventListener('click', closeOverlay);

    // Close on backdrop click
    if (overlay) overlay.addEventListener('click', function(e) {
        if (e.target === overlay && overlayCountdown <= 0) closeOverlay();
    });

    // Set CTA link
    if (ctaBtn) ctaBtn.href = AD_CONFIG.overlayUrl;

    // === Banner Ad ===
    const banner = document.getElementById('adBanner');
    const bannerClose = document.getElementById('adBannerClose');
    const bannerLink = document.getElementById('adBannerLink');

    function showBanner() {
        if (!banner) return;
        banner.classList.add('active');
    }

    function closeBanner() {
        if (!banner) return;
        banner.classList.remove('active');
    }

    if (bannerClose) bannerClose.addEventListener('click', closeBanner);
    if (bannerLink) bannerLink.href = AD_CONFIG.bannerUrl;

    // === Page View Tracking ===
    function trackPageView() {
        const views = incrementSession('apkhub_page_views');
        const overlayShown = getSession('apkhub_overlay_shown');

        // Show overlay every N page views
        if (views % AD_CONFIG.overlayInterval === 0 && views > 0 && overlayShown < views) {
            setTimeout(showOverlay, 1500);
            setSession('apkhub_overlay_shown', views);
        }
    }

    // Show banner after delay
    let bannerTimer = setTimeout(showBanner, AD_CONFIG.bannerDelay * 1000);

    // Track clicks on download buttons (for analytics)
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.download-btn, .apk-card');
        if (btn) {
            incrementSession('apkhub_download_clicks');
            // Show overlay on download attempt (if not shown recently)
            const lastOverlay = getSession('apkhub_overlay_shown');
            const pageViews = getSession('apkhub_page_views');
            if (pageViews - lastOverlay >= 2) {
                setTimeout(showOverlay, 500);
                setSession('apkhub_overlay_shown', pageViews);
            }
        }
    });

    // Init tracking
    trackPageView();

    // Expose for debugging
    window.ads = { AD_CONFIG, showOverlay, closeOverlay, showBanner, closeBanner };
})();