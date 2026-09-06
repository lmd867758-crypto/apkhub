// === Gride X Central — Main Logic ===
(function() {
    const grid = document.getElementById('apkGrid');
    const searchInput = document.getElementById('searchInput');
    let apkData = [];

    // Random download counts for display
    function randomDownloads() {
        const nums = ['1.2M+', '2.8M+', '687K+', '1.4M+', '950K+', '3.1M+', '500K+', '2.2M+', '780K+', '1.8M+', '4.2M+', '650K+'];
        return nums[Math.floor(Math.random() * nums.length)];
    }

    async function loadData() {
        try {
            const res = await fetch('/data.json');
            apkData = await res.json();
            renderApps();
        } catch(e) {
            console.error('Failed to load data:', e);
            if (grid) grid.innerHTML = '<div class="empty-state"><h3>⚠️ Failed to load apps</h3><p>Try again later.</p></div>';
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
            grid.innerHTML = '<div class="empty-state"><h3>🔍 No results</h3><p>Try a different search</p></div>';
            return;
        }

        grid.innerHTML = filtered.map(app => `
            <div class="apk-card">
                <img src="${app.icon}" alt="${app.name}" class="apk-icon" loading="lazy"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%2312122a%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2236%22>📦</text></svg>'">
                <div class="apk-info">
                    <div class="apk-name">${app.name}</div>
                    <div class="apk-desc">${app.description}</div>
                    <div class="apk-meta">
                        <span class="apk-version">v${app.version}</span>
                        <span class="apk-downloads">⬇ ${randomDownloads()}</span>
                        <span class="apk-category">${app.category}</span>
                    </div>
                </div>
                <div class="apk-right">
                                    <a href="${app.downloadUrl}" target="_blank" rel="noopener noreferrer" class="download-btn-sm">⬇ Download</a>
                                </div>
            </div>
        `).join('');
    }

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', e => renderApps(e.target.value));
    }

    loadData();
})();