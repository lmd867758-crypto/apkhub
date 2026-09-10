// === Gride X Central — Dynamic Detail Page (modvault-style) ===
// /dl.html?id=N  (N = Google Sheet row number). Reads the live sheet, renders
// the full app detail page client-side. New rows are instantly viewable.
(function() {
    const SHEET_ID = '1CEHLo22Sm6TJ9ng4EphXSYf7ywgfr5PN6KQle1Dv_Mc';
    const SHEET_TAB = '%E0%A6%AA%E0%A6%A4%E0%A7%8D%E0%A6%B0%E0%A6%951';
    const root = document.getElementById('detailRoot');

    function esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function cellText(c) {
        if (!c || c.v === null || c.v === undefined) return '';
        if (typeof c.v === 'object') return String(c.v.f !== undefined ? c.v.f : '');
        return String(c.v);
    }
    function slugify(name) {
        return name.toLowerCase().replace(/[^\w\s-]/g,'').replace(/[\s_]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,80);
    }
    function parseGviz(text) {
        const m = text.match(/setResponse\((\{[\s\S]*\})\)\s*;?\s*$/);
        if (!m) throw new Error('bad gviz payload');
        return JSON.parse(m[1]);
    }

    async function fetchSheet() {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TAB}&tqx=out:json&_=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });
        const text = await res.text();
        const json = parseGviz(text);
        const rows = json.table.rows || [];
        return rows.slice(1).map((r, i) => {
            const c = r.c || [];
            return {
                id: i + 2,
                name:        cellText(c[0]).trim(),
                description: cellText(c[1]).trim(),
                icon:        cellText(c[2]).trim(),
                version:     cellText(c[3]).trim(),
                platform:    cellText(c[4]).trim() || 'Android',
                downloadUrl: cellText(c[5]).trim(),
                features:    cellText(c[7]).trim(),
                category:    cellText(c[8]).trim().replace(/][\s\]]*$/g,'') || 'Apps'
            };
        }).filter(a => a.name && /^https?:\/\//.test(a.downloadUrl) && !/example\.com/.test(a.downloadUrl));
    }

    function setMeta(nameOrProp, attr, content) {
        let el = document.head.querySelector(`meta[${nameOrProp}="${attr}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(nameOrProp, attr);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    }

    function setCanonical(url) {
        let el = document.head.querySelector('link[rel="canonical"]');
        if (!el) {
            el = document.createElement('link');
            el.rel = 'canonical';
            document.head.appendChild(el);
        }
        el.href = url;
    }

    function render(app, all) {
        const site = 'https://gridexcentral.pages.dev';
        const pageUrl = `${site}/dl.html?id=${app.id}`;
        const shortName = app.name.replace(/\(.*?\)/g,'').trim();
        const pageTitle = `${shortName} Mod APK ${app.version} | Gride X Central`;

        document.title = pageTitle;
        setMeta('name','description', `${app.description} Download ${shortName} ${app.version} MOD APK for Android — ${app.features || 'unlocked features'}.`);
        setCanonical(pageUrl);
        setMeta('property','og:title', pageTitle);
        setMeta('property','og:description', app.description);
        setMeta('property','og:url', pageUrl);
        setMeta('property','og:image', app.icon);
        setMeta('property','og:type', 'website');

        // JSON-LD structured data
        let ld = document.getElementById('ld-json');
        if (!ld) {
            ld = document.createElement('script');
            ld.type = 'application/ld+json';
            ld.id = 'ld-json';
            document.head.appendChild(ld);
        }
        ld.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: app.name,
            operatingSystem: 'Android',
            applicationCategory: app.category,
            description: app.description,
            version: app.version,
            image: app.icon,
            offers: {'@type':'Offer', price:'0', priceCurrency:'USD'},
            downloadUrl: app.downloadUrl
        });

        const cats = app.category.toLowerCase();
        const catHref = /game/.test(cats) ? '/categories/games' : /tool/.test(cats) ? '/categories/tools' : '/categories/apps';
        const featureTags = (app.features || '').split(',').map(f => f.trim()).filter(Boolean)
            .map(f => `<span class="feature-tag">${esc(f)}</span>`).join('');

        const related = all.filter(a => a.id !== app.id && a.category.toLowerCase() === cats).slice(0, 3);
        const relatedHtml = related.length ? `
            <section class="detail-section">
                <h2 class="sec-title">More ${esc(app.category)}</h2>
                <div class="related-grid">${related.map(r => `
                    <a class="related-card" href="/dl.html?id=${r.id}">
                        <img src="${esc(r.icon)}" alt="${esc(r.name)}" loading="lazy">
                        <div><div class="rel-name">${esc(r.name)}</div><div class="rel-ver">v${esc(r.version)}</div></div>
                    </a>`).join('')}
                </div>
            </section>` : '';

        const plainName = esc(shortName);
        root.innerHTML = `
            <nav class="crumbs"><a href="/">Home</a> <span>/</span> <a href="${catHref}">${esc(app.category)}</a> <span>/</span> <b>${plainName}</b></nav>

            <section class="detail-hero">
                <div class="detail-icon-frame"><img src="${esc(app.icon)}" alt="${esc(app.name)}" class="detail-icon"></div>
                <h1 class="detail-title">${esc(app.name)}</h1>
                <p class="detail-sub">${esc(app.description)}</p>
                <div class="detail-meta-chips">
                    <span class="chip chip-purple">v${esc(app.version)}</span>
                    <span class="chip">${esc(app.platform)}</span>
                    <span class="chip chip-green">Free</span>
                </div>
                <a href="${esc(app.downloadUrl)}" target="_blank" rel="noopener noreferrer" class="download-btn detail-dl">Download APK</a>
                <p class="detail-note">Direct mirror &middot; No account needed</p>
            </section>

            <section class="info-grid">
                <div class="info-card"><span class="info-label">Version</span><span class="info-val">${esc(app.version)}</span></div>
                <div class="info-card"><span class="info-label">Category</span><span class="info-val">${esc(app.category)}</span></div>
                <div class="info-card"><span class="info-label">Platform</span><span class="info-val">${esc(app.platform)}</span></div>
                <div class="info-card"><span class="info-label">Price</span><span class="info-val">Free</span></div>
            </section>

            ${featureTags ? `
            <section class="detail-section">
                <h2 class="sec-title">Mod Features</h2>
                <div class="feature-tags">${featureTags}</div>
            </section>` : ''}

            <section class="detail-section">
                <h2 class="sec-title">About ${plainName}</h2>
                <p class="body-text">${esc(app.description)}</p>
                <p class="body-text">Download ${plainName} ${esc(app.version)} MOD APK for Android directly from Gride X Central — tested before publishing, no account needed.</p>
            </section>

            <section class="detail-section">
                <h2 class="sec-title">How to Install</h2>
                <ol class="steps">
                    <li><span class="step-num">1</span><div>Tap <strong>Download APK</strong> and wait for the file to finish downloading.</div></li>
                    <li><span class="step-num">2</span><div>Allow <strong>Install unknown apps</strong> for your browser in Settings &rarr; Security.</div></li>
                    <li><span class="step-num">3</span><div>Open the APK and tap <strong>Install</strong>. If the game needs OBB data, place it in <code>Android/obb/</code> before first launch.</div></li>
                    <li><span class="step-num">4</span><div>Launch and enjoy the unlocked features.</div></li>
                </ol>
            </section>

            <section class="detail-section">
                <h2 class="sec-title">FAQ</h2>
                <details class="faq"><summary>Do I need to root my phone?</summary><p>No. This build runs on stock Android without root. Just allow unknown-source installs when prompted.</p></details>
                <details class="faq"><summary>Will it update automatically?</summary><p>MOD versions don't update through the Play Store. Bookmark this page — we refresh the build whenever a newer stable mod drops.</p></details>
                <details class="faq"><summary>"App not installed" error — what now?</summary><p>Uninstall the Play Store version first (signature conflict), make sure you have free storage, then retry the install.</p></details>
            </section>

            ${relatedHtml}`;

        // sticky bar
        const sticky = document.getElementById('stickyDl');
        const sName = document.getElementById('stickyName');
        const sBtn = document.getElementById('stickyBtn');
        if (sticky && sName && sBtn) {
            sName.innerHTML = `${plainName} <span>v${esc(app.version)}</span>`;
            sBtn.href = app.downloadUrl;
            sticky.style.display = '';
        }
    }

    function notFound(msg) {
        root.innerHTML = '<div class="empty-state" style="padding:60px 0;text-align:center"><svg class="icon icon-md" width="28" height="28"><use href="#icon-alert"/></svg><h3>' + (msg || 'App not found') + '</h3><p><a href="/">Back to all apps</a></p></div>';
        document.title = 'App not found | Gride X Central';
    }

    async function init() {
        const id = parseInt(new URLSearchParams(location.search).get('id'), 10);
        if (!id) return notFound('No app selected');
        try {
            const apps = await fetchSheet();
            const app = apps.find(a => a.id === id);
            if (!app) return notFound('App not found (row ' + id + ')');
            render(app, apps);
        } catch (e) {
            console.error('detail load failed:', e);
            notFound('Failed to load app');
        }
    }

    init();
})();
