// === Main Site Logic ===
(function() {
    const grid = document.getElementById('apkGrid');
    const searchInput = document.getElementById('searchInput');
    const searchToggle = document.getElementById('searchToggle');
    const searchBar = document.getElementById('searchBar');
    const categoryTabs = document.getElementById('categoryTabs');
    const appCountEl = document.getElementById('appCount');
    
    let currentCategory = 'all';
    let currentSearch = '';

    // === Render APK Cards ===
    function renderApps() {
        if (!grid) return;

        let filtered = apkData;

        // Filter by category
        if (currentCategory !== 'all') {
            filtered = filtered.filter(app => 
                app.category && app.category.toLowerCase() === currentCategory.toLowerCase()
            );
        }

        // Filter by search
        if (currentSearch.trim()) {
            const q = currentSearch.toLowerCase().trim();
            filtered = filtered.filter(app => 
                app.name.toLowerCase().includes(q) ||
                app.description.toLowerCase().includes(q) ||
                app.features.toLowerCase().includes(q)
            );
        }

        // Update count
        if (appCountEl) appCountEl.textContent = filtered.length;

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                    <p style="font-size:48px;margin-bottom:16px;">🔍</p>
                    <h3 style="margin-bottom:8px;">No APKs found</h3>
                    <p style="color:var(--text-muted);">Try a different search or category</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(app => {
            const featuresArr = app.features.split(',').map(f => f.trim()).filter(Boolean);
            const firstFeature = featuresArr[0] || 'Modded';
            
            return `
                <a href="/app/${app.slug}/" class="apk-card">
                    <img src="${app.icon}" alt="${app.name}" class="apk-icon" loading="lazy" 
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%231a1a2e%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2240%22>📦</text></svg>'">
                    <div class="apk-info">
                        <div class="apk-name">${app.name}</div>
                        <div class="apk-desc">${app.description}</div>
                        <div class="apk-meta">
                            <span class="apk-version">v${app.version}</span>
                            <span class="apk-features">${firstFeature}</span>
                            ${app.category ? `<span class="apk-category">${app.category}</span>` : ''}
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }

    // === Search ===
    if (searchToggle && searchBar) {
        searchToggle.addEventListener('click', () => {
            searchBar.classList.toggle('open');
            if (searchBar.classList.contains('open')) {
                setTimeout(() => searchInput?.focus(), 100);
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            renderApps();
        });
    }

    // === Category Tabs ===
    if (categoryTabs) {
        categoryTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.cat-btn');
            if (!btn) return;
            
            // Update active state
            categoryTabs.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentCategory = btn.dataset.cat;
            renderApps();
        });
    }

    // === Initial Render ===
    renderApps();

    // === Smooth page transitions for app detail pages ===
    // This runs on individual app pages
    if (window.renderAppDetail && typeof renderAppDetail === 'function') {
        renderAppDetail();
    }
})();