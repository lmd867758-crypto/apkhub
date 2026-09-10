// === Gride X Central — Main Logic (live Google Sheet fetch) ===
// Sheet is the source of truth: new rows show instantly, no build step needed.
(function() {
    const grid = document.getElementById('apkGrid');
    const searchInput = document.getElementById('searchInput');

    const SHEET_ID = '1CEHLo22Sm6TJ9ng4EphXSYf7ywgfr5PN6KQle1Dv_Mc';
    const SHEET_TAB = '%E0%A6%AA%E0%A6%A4%E0%A7%8D%E0%A6%B0%E0%A6%951'; // পত্রক1 (percent-encoded, ASCII-safe)
    const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TAB}&tqx=out:json&_=${'@CACHE@'}`;

    let apkData = [];

    function randomDownloads() {
        const nums = ['1.2M+', '2.8M+', '687K+', '1.4M+', '950K+', '3.1M+', '500K+', '2.2M+', '780K+', '1.8M+', '4.2M+', '650K+'];
        return nums[Math.floor(Math.random() * nums.length)];
    }

    const SVG_DL = '<svg class="icon icon-sm" width="12" height="12"><use href="#icon-download"/></svg>';
    const SVG_PKG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%2312122a%22 width=%22100%22 height=%22100%22/%3E%3Crect x=%2225%22 y=%2230%22 width=%2250%22 height=%2240%22 rx=%224%22 fill=%22none%22 stroke=%22%23666%22 stroke-width=%223%22/%3E%3Cpath d=%22M25 45h50%22 stroke=%22%23666%22 stroke-width=%223%22/%3E%3Cpath d=%22M50 30v40%22 stroke=%22%23666%22 stroke-width=%223%22/%3E%3C/svg%3E';
    const SVG_ALERT = '<svg class="icon icon-md" style="margin-bottom:8px"><use href="#icon-alert"/></svg>';
    const SVG_SEARCH = '<svg class="icon icon-md" style="margin-bottom:8px"><use href="#icon-search"/></svg>';

    function esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function cellText(c) {
        if (!c || c.v === null || c.v === undefined) return '';
        if (typeof c.v === 'object') return String(c.v.f !== undefined ? c.v.f : '');
        return String(c.v);
    }

    function isValid(app) {
        if (!app.name || app.name.length < 3) return false;
        if (!/^https?:\/\//.test(app.downloadUrl)) return false;
        if (!/^https?:\/\//.test(app.icon)) return false;
        if (/example\.com/.test(app.downloadUrl)) return false;
        if (/Gemini-Generated/.test(app.icon) && /test/i.test(app.name + app.description)) return false;
        if (/^(wallpaper|exe|video)$/i.test(app.category)) return false;
        if (!app.version) return false;
        return true;
    }

    function parseGviz(text) {
        const m = text.match(/setResponse\((\{[\s\S]*\})\)\s*;?\s*$/);
        if (!m) throw new Error('bad gviz payload');
        return JSON.parse(m[1]);
    }

    async function fetchSheet() {
        const res = await fetch(SHEET_URL.replace('@CACHE@', String(Date.now())), { cache: 'no-store' });
        const text = await res.text();
        const json = parseGviz(text);
        const rows = json.table.rows || [];
        return rows.slice(1) // skip header row
            .map((r, i) => {
                const c = r.c || [];
                return {
                    id: i + 2, // sheet row number (row 1 = header)
                    name:        cellText(c[0]).trim(),
                    description: cellText(c[1]).trim(),
                    icon:        cellText(c[2]).trim(),
                    version:     cellText(c[3]).trim(),
                    platform:    (cellText(c[4]).trim() || 'Android'),
                    downloadUrl: cellText(c[5]).trim(),
                    features:    cellText(c[7]).trim(),
                    category:    (cellText(c[8]).trim().replace(/][\s\]]*$/g,'') || 'Apps')
                };
            })
            .filter(isValid);
    }

    function categoryFromPath() {
        const p = location.pathname;
        if (/games/.test(p)) return ['games'];
        if (/apps/.test(p)) return ['apps', 'app'];
        if (/tools/.test(p)) return ['tools'];
        return null; // home: show all
    }

    async function loadData() {
        try {
            apkData = await fetchSheet();
            if (!apkData.length) throw new Error('sheet returned no valid apps');
        } catch (e) {
            console.warn('Live sheet fetch failed, falling back to data.json:', e);
            try {
                const res = await fetch('/data.json?_=' + Date.now(), { cache: 'no-store' });
                apkData = await res.json();
            } catch (e2) {
                console.error('Fallback data.json failed too:', e2);
                if (grid) grid.innerHTML = '<div class="empty-state">' + SVG_ALERT + '<h3>Failed to load apps</h3><p>Try again later.</p></div>';
                return;
            }
        }
        renderApps();
    }

    function renderApps(query) {
        if (!grid) return;
        let filtered = apkData;

        const cats = categoryFromPath();
        if (cats) filtered = filtered.filter(a => cats.indexOf(a.category.toLowerCase()) !== -1);

        if (query && query.trim()) {
            const q = query.toLowerCase().trim();
            filtered = filtered.filter(a =>
                a.name.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q) ||
                (a.features || '').toLowerCase().includes(q)
            );
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state">' + SVG_SEARCH + '<h3>No results</h3><p>Try a different search</p></div>';
            return;
        }

        grid.innerHTML = filtered.map(app => `
            <div class="apk-card">
                <img src="${esc(app.icon)}" alt="${esc(app.name)}" class="apk-icon" loading="lazy"
                     onerror="this.src='${SVG_PKG}'">
                <div class="apk-info">
                    <a class="apk-name" href="/dl.html?id=${app.id}">${esc(app.name)}</a>
                    <div class="apk-desc">${esc(app.description)}</div>
                    <div class="apk-meta">
                        <span class="apk-version">v${esc(app.version)}</span>
                        <span class="apk-downloads">${SVG_DL} ${randomDownloads()}</span>
                        <span class="apk-category">${esc(app.category)}</span>
                    </div>
                </div>
                <div class="apk-right">
                    <a href="${esc(app.downloadUrl)}" target="_blank" rel="noopener noreferrer" class="download-btn-sm">${SVG_DL} Download</a>
                </div>
            </div>
        `).join('');
    }

    if (searchInput) {
        searchInput.addEventListener('input', e => renderApps(e.target.value));
    }

    loadData();
})();
