// === Gride X Central — Main Logic ===
(function() {
    const grid = document.getElementById('apkGrid');
    const searchInput = document.getElementById('searchInput');
    let apkData = [];

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

    function renderApps(query) {
        if (!grid || !apkData.length) return;

        let filtered = apkData;
        if (query && query.trim()) {
            const q = query.toLowerCase().trim();
            filtered = apkData.filter(a => 
                a.name.toLowerCase().includes(q) || 
                a.description.toLowerCase().includes(q) ||
                a.features.toLowerCase().includes(q)
            );
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state">' + SVG_SEARCH + '<h3>No results</h3><p>Try a different search</p></div>';
            return;
        }

        grid.innerHTML = filtered.map(app => `
            <div class="apk-card">
                <img src="${app.icon}" alt="${app.name}" class="apk-icon" loading="lazy"
                     onerror="this.src='${SVG_PKG}'">
                <div class="apk-info">
                    <div class="apk-name">${app.name}</div>
                    <div class="apk-desc">${app.description}</div>
                    <div class="apk-meta">
                        <span class="apk-version">v${app.version}</span>
                        <span class="apk-downloads">${SVG_DL} ${randomDownloads()}</span>
                        <span class="apk-category">${app.category}</span>
                    </div>
                </div>
                <div class="apk-right">
                    <a href="${app.downloadUrl}" target="_blank" rel="noopener noreferrer" class="download-btn-sm">${SVG_DL} Download</a>
                </div>
            </div>
        `).join('');
    }

    if (searchInput) {
        searchInput.addEventListener('input', e => renderApps(e.target.value));
    }

    loadData();
})();