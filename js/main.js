// === Gride X Central — Main Logic ===
(function() {
    const grid = document.getElementById('apkGrid');
    const searchInput = document.getElementById('searchInput');
    const category = document.body.dataset.category || null;
    let apkData = [];

    // sentinel element for infinite scroll (hoisted, used by observers below)
    var sentinel = makeSentinel();
    function makeSentinel() {
        var el = document.createElement('div');
        el.className = 'load-sentinel';
        el.style.display = 'none';
        el.innerHTML = '<span class="load-dot"></span><span class="load-dot"></span><span class="load-dot"></span>';
        return el;
    }

    function randomDownloads() {
        const nums = ['1.2M+', '2.8M+', '687K+', '1.4M+', '950K+', '3.1M+', '500K+', '2.2M+', '780K+', '1.8M+', '4.2M+', '650K+'];
        return nums[Math.floor(Math.random() * nums.length)];
    }

    const SVG_DL = '<svg class="icon icon-sm" width="12" height="12"><use href="#icon-download"/></svg>';
    const SVG_PKG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%2312122a%22 width=%22100%22 height=%22100%22/%3E%3Crect x=%2225%22 y=%2230%22 width=%2250%22 height=%2240%22 rx=%224%22 fill=%22none%22 stroke=%22%23666%22 stroke-width=%223%22/%3E%3Cpath d=%22M25 45h50%22 stroke=%22%23666%22 stroke-width=%223%22/%3E%3Cpath d=%22M50 30v40%22 stroke=%22%23666%22 stroke-width=%223%22/%3E%3C/svg%3E';

    const SVG_ALERT = '<svg class="icon icon-md" style="margin-bottom:8px"><use href="#icon-alert"/></svg>';
    const SVG_SEARCH = '<svg class="icon icon-md" style="margin-bottom:8px"><use href="#icon-search"/></svg>';

    async function loadData() {
        try {
            const res = await fetch('/data.json');
            apkData = await res.json();
            renderApps();
        } catch(e) {
            console.error('Failed to load data:', e);
            if (grid) grid.innerHTML = '<div class="empty-state">' + SVG_ALERT + '<h3>Failed to load apps</h3><p>Try again later.</p></div>';
        }
    }

    let shown = 0;
    const BATCH = 7;
    let currentList = [];

    function cardHTML(app) {
        return `
            <div class="apk-card">
                <a href="/app/${app.slug}/" class="card-icon-frame"><img src="${app.icon}" alt="${app.name}" class="apk-icon" loading="lazy"
                     onerror="this.src='${SVG_PKG}'"></a>
                <div class="apk-info">
                    <a href="/app/${app.slug}/" class="apk-name">${app.name}</a>
                    <div class="apk-desc">${app.description}</div>
                    <div class="apk-meta">
                        <span class="chip chip-purple">v${app.version}</span>
                        <span class="chip chip-green">${app.category}</span>
                    </div>
                </div>
                <div class="apk-right">
                    <a href="/app/${app.slug}/" class="download-btn-sm">Open</a>
                </div>
            </div>
        `;
    }

    function appendBatch() {
        if (!grid) return;
        const batch = currentList.slice(shown, shown + BATCH);
        batch.forEach(app => grid.insertAdjacentHTML('beforeend', cardHTML(app)));
        shown += batch.length;
        if (shown < currentList.length) {
            sentinel.style.display = 'block';
        } else {
            sentinel.style.display = 'none';
        }
    }

    function renderApps(query) {
        if (!grid || !apkData.length) return;

        currentList = apkData;
        if (category) {
            currentList = currentList.filter(a => (a.category || '').toLowerCase() === category.toLowerCase());
        }
        if (query && query.trim()) {
            const q = query.toLowerCase().trim();
            currentList = apkData.filter(a =>
                a.name.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q) ||
                a.features.toLowerCase().includes(q)
            );
        }

        grid.innerHTML = '';
        shown = 0;

        if (currentList.length === 0) {
            grid.innerHTML = '<div class="empty-state">' + SVG_SEARCH + '<h3>No results</h3><p>Try a different search</p></div>';
            sentinel.style.display = 'none';
            return;
        }
        appendBatch();
    }

    // infinite scroll: sentinel visible -> load next batch
    const io = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && shown < currentList.length) appendBatch();
    }, { rootMargin: '300px' });
    io.observe(sentinel);

    if (grid) grid.parentNode.insertBefore(sentinel, grid.nextSibling);

    if (searchInput) {
        searchInput.addEventListener('input', e => renderApps(e.target.value));
    }

    loadData();
})();
