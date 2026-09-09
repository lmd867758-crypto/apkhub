#!/usr/bin/env python3
"""Generate Gride X Central site from Google Sheet data.

Usage: python scripts/generate-site.py [path/to/raw_sheet.csv]

Reads the sheet dump (CSV, or legacy TSV .txt), filters valid apps,
writes data.json, regenerates all /app/*/index.html pages,
category pages, and sitemap.xml.
"""

import csv
import html
import json
import os
import re
import sys
from datetime import datetime, timezone

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_URL = "https://gridexcentral.pages.dev"
OG_IMAGE = SITE_URL + "/assets/banner.jpg"


def slugify(name):
    s = name.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s[:80].rstrip('-')


def clean_name(name):
    """Fix broken names from the sheet, e.g. 'Dr. Driving (MOD'."""
    n = name.strip()
    # Balance an unclosed parenthesis using nothing fake: just drop the stub
    if n.count("(") > n.count(")"):
        n = re.sub(r'\s*\([^)]*$', '', n).strip()
    # Collapse trailing separators
    n = n.rstrip(" ,:-")
    return n


def clean_category(cat):
    c = re.sub(r'[^A-Za-z]', '', cat or '')
    c = c.lower()
    if c.startswith("game"):
        return "Games"
    if c.startswith("app"):
        return "Apps"
    if c.startswith("tool"):
        return "Tools"
    return "Apps"


def version_key(v):
    parts = re.findall(r'\d+', v or "")
    return tuple(int(p) for p in parts) or (0,)


def esc(s):
    return html.escape(s or "", quote=True)


def seo_title(app):
    """<=60 chars where possible."""
    base = app["base"]
    feats = app["features"]
    mod_label = ""
    for f in feats.split(","):
        f = f.strip()
        if f.lower().startswith(("unlimited", "no ads", "no damage", "mod", "vip", "unlocked", "premium")):
            mod_label = f
            break
    t = f"{base} Mod APK {mod_label} | GXC" if mod_label else f"{base} Mod APK v{app['version']} | GXC"
    if len(t) > 60:
        t = f"{base} Mod APK | Gride X Central"
    return t[:60]


def is_valid(app):
    name, desc, icon, version, plat, dl_url, features, category = app
    if "example.com" in dl_url: return False
    if not dl_url.startswith("http"): return False
    if not icon.startswith("http"): return False
    if "Gemini-Generated" in icon and ("test" in name.lower() or "test" in desc.lower()): return False
    if clean_category(category) == "Apps" and (category or "").strip().lower() in ("wallpaper", "exe", "video", "tools"): return False
    if not version: return False
    if len(name) < 3 or "test" in name.lower().split(): return False
    return True


def read_sheet(path):
    """Parse the sheet dump. Handles CSV (preferred) and legacy TSV."""
    if path.endswith(".txt"):
        with open(path, "r", encoding="utf-8") as f:
            rows = [line.rstrip("\n").split("\t") for line in f]
    else:
        with open(path, "r", encoding="utf-8", newline="") as f:
            rows = list(csv.reader(f))

    apps = []
    seen = {}  # slug -> index in apps, keep highest version
    for parts in rows:
        if len(parts) < 8: continue
        if not parts[0].strip() or parts[0].strip().lower().startswith("name"): continue

        name = parts[0].strip()
        desc = parts[1].strip()
        icon = parts[2].strip()
        version = parts[3].strip()
        plat = parts[4].strip()
        dl_url = parts[5].strip()
        # Sheet layout varies: features/category live in cols 6-8. Whichever
        # short cell normalizes to a known category word is the category;
        # the longest remaining cell is the features list.
        cand = [parts[i].strip() if i < len(parts) else "" for i in (6, 7, 8)]
        cat_idx = None
        for i, c in enumerate(cand):
            cc = c.strip("]").strip().lower()
            if len(cc) <= 8 and cc.startswith(("game", "app", "tool")):
                cat_idx = i
                break
        if cat_idx is not None:
            category = cand[cat_idx]
            rest = [c for i, c in enumerate(cand) if i != cat_idx and c]
            features = max(rest, key=len) if rest else ""
        else:
            features = max([c for c in cand if c], key=len) if any(cand) else ""
            category = "Apps"

        app_tuple = (name, desc, icon, version, plat, dl_url, features, category)
        if not is_valid(app_tuple): continue

        display = clean_name(name)
        slug = slugify(name)  # keep historical slug so URLs stay stable
        cat = clean_category(category)
        base = re.sub(r'\s*\((MOD|mod)[^)]*\)\s*', '', display).replace(" mod apk", "").replace(" Mod Apk", "").strip()

        obj = {
            "name": display,
            "base": base or display,
            "description": desc or f"Download {display} for Android from Gride X Central.",
            "icon": icon,
            "version": version,
            "platform": plat.lower() if plat else "android",
            "downloadUrl": dl_url,
            "features": features or "Unlocked features, Free download",
            "category": cat,
            "slug": slug,
        }
        if slug in seen:
            prev = apps[seen[slug]]
            if version_key(version) >= version_key(prev["version"]):
                apps[seen[slug]] = obj
        else:
            seen[slug] = len(apps)
            apps.append(obj)
    return apps


def card_html(app):
    slug = esc(app["slug"])
    name = esc(app["name"])
    desc = esc(app["description"])
    icon = esc(app["icon"])
    return f'''<div class="apk-card">
                <a href="/app/{slug}/"><img src="{icon}" alt="{name}" class="apk-icon" loading="lazy"></a>
                <div class="apk-info">
                    <a href="/app/{slug}/" class="apk-name">{name}</a>
                    <div class="apk-desc">{desc}</div>
                    <div class="apk-meta">
                        <span class="apk-version">v{esc(app["version"])}</span>
                        <span class="apk-category">{esc(app["category"])}</span>
                    </div>
                </div>
                <div class="apk-right">
                    <a href="{esc(app["downloadUrl"])}" target="_blank" rel="noopener noreferrer" class="download-btn-sm">Download</a>
                </div>
            </div>'''


def related_card(a):
    return (f'<a class="related-card" href="/app/{esc(a["slug"])}/">'
            f'<img src="{esc(a["icon"])}" alt="{esc(a["name"])}" loading="lazy">'
            f'<div><div class="rel-name">{esc(a["name"])}</div>'
            f'<div class="rel-ver">v{esc(a["version"])}</div></div></a>')


def build_related(app, apps):
    rel = [a for a in apps if a["category"] == app["category"] and a["slug"] != app["slug"]][:3]
    if len(rel) < 3:
        rel += [a for a in apps if a["slug"] != app["slug"] and a not in rel][:3 - len(rel)]
    return "".join(related_card(a) for a in rel) or '<p class="body-text">More mods coming soon.</p>'

def write_data_json(apps):
    path = os.path.join(BASE, "data.json")
    slim = []
    for a in apps:
        b = dict(a)
        b.pop("base", None)
        slim.append(b)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(slim, f, indent=2, ensure_ascii=False)
    print(f"OK data.json ({len(slim)} apps)")


def generate_app_pages(apps):
    app_dir = os.path.join(BASE, "app")
    for app in apps:
        slug = esc(app["slug"])
        adir = os.path.join(app_dir, app["slug"])
        os.makedirs(adir, exist_ok=True)
        feat_tags = "".join(
            f'<span class="feature-tag">{esc(f.strip())}</span>'
            for f in app["features"].split(",") if f.strip()
        )
        html_out = PAGE_TEMPLATE.format(
            **{k: esc(v) if isinstance(v, str) else v for k, v in app.items()},
            category_l=app["category"].lower(),
            related_html=build_related(app, apps),
            feat_tags=feat_tags,
            title=esc(seo_title(app)),
            site_url=SITE_URL,
            og_image=OG_IMAGE,
            today=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        )
        with open(os.path.join(adir, "index.html"), "w", encoding="utf-8") as f:
            f.write(html_out)
        print(f"  app/{app['slug']}/")


def generate_category_pages(apps):
    cats_dir = os.path.join(BASE, "categories")
    os.makedirs(cats_dir, exist_ok=True)
    meta = {
        "Games": ("Mod Games", "Download the latest MOD games for Android free — unlimited money, unlocked levels and premium features. Safe direct APK downloads from Gride X Central."),
        "Apps": ("Mod Apps", "Download MOD apps for Android free — unlocked premium features, no ads, VIP access. Tested and fast downloads from Gride X Central."),
        "Tools": ("Android Tools", "Free Android utility and tool apps, direct APK downloads from Gride X Central."),
    }
    for cat, (heading, desc) in meta.items():
        subset = [a for a in apps if a["category"] == cat]
        cards = "\n            ".join(card_html(a) for a in subset)
        slug = cat.lower()
        out = CATEGORY_TEMPLATE.format(
            heading=heading, desc=esc(desc), cat=cat,
            count=len(subset), cards=cards,
            canonical=f"{SITE_URL}/categories/{slug}",
        )
        with open(os.path.join(cats_dir, f"{slug}.html"), "w", encoding="utf-8") as f:
            f.write(out)
        print(f"  categories/{slug}.html ({len(subset)} apps)")


def update_homepage_links(apps):
    """Regenerate the static 'Latest mods' crawl-path block in index.html
    between SEO markers so link equity + crawlability never depend on JS."""
    path = os.path.join(BASE, "index.html")
    with open(path, "r", encoding="utf-8") as f:
        page = f.read()
    lines = "\n".join(
        f'                <li><a href="/app/{esc(a["slug"])}/">{esc(a["name"])} v{esc(a["version"])}</a></li>'
        for a in apps
    )
    block = (
        '<!-- SEO-STATIC-LIST -->\n'
        '        <section class="container" style="margin:16px 0 32px">\n'
        '            <h2 style="font-size:1.1rem">Latest Mods on Gride X Central</h2>\n'
        '            <ul style="line-height:2">\n'
        + lines +
        '\n            </ul>\n'
        '        </section>\n'
        '        <!-- /SEO-STATIC-LIST -->'
    )
    page = re.sub(r"<!-- SEO-STATIC-LIST -->.*?<!-- /SEO-STATIC-LIST -->", block, page, flags=re.S)
    with open(path, "w", encoding="utf-8") as f:
        f.write(page)
    print("OK index.html static link block")


def update_sitemap(apps):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    urls = [f"{SITE_URL}/"]
    urls += [f"{SITE_URL}/app/{a['slug']}/" for a in apps]
    urls.append(f"{SITE_URL}/categories/games")
    urls.append(f"{SITE_URL}/categories/apps")
    if any(a["category"] == "Tools" for a in apps):
        urls.append(f"{SITE_URL}/categories/tools")
    urls += [f"{SITE_URL}/privacy.html", f"{SITE_URL}/contact.html"]

    # dedupe, preserve order
    seen, ordered = set(), []
    for u in urls:
        if u not in seen:
            seen.add(u)
            ordered.append(u)

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for url in ordered:
        xml += f'  <url>\n    <loc>{url}</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>{"1.0" if url == SITE_URL + "/" else "0.8"}</priority>\n  </url>\n'
    xml += '</urlset>'
    with open(os.path.join(BASE, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(xml)
    print(f"OK sitemap.xml ({len(ordered)} URLs)")


PAGE_TEMPLATE = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="Download {name} {version} for Android from Gride X Central. {description} Features: {features}.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{site_url}/app/{slug}/">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:url" content="{site_url}/app/{slug}/">
    <meta property="og:image" content="{og_image}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" type="image/jpg" href="/assets/logo-simple.jpg">
    <script type="application/ld+json">{{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "{name}",
        "operatingSystem": "Android",
        "applicationCategory": "{category}",
        "description": "{description}",
        "version": "{version}",
        "image": "{icon}",
        "datePublished": "{today}",
        "offers": {{"@type": "Offer", "price": "0", "priceCurrency": "USD"}},
        "downloadUrl": "{downloadUrl}"
    }}</script>
    <script type="application/ld+json">{{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {{"@type": "ListItem", "position": 1, "name": "Home", "item": "{site_url}/"}},
            {{"@type": "ListItem", "position": 2, "name": "{category}", "item": "{site_url}/categories/{category_l}/"}},
            {{"@type": "ListItem", "position": 3, "name": "{name}", "item": "{site_url}/app/{slug}/"}}
        ]
    }}</script>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body class="detail-page">
    <header class="header"><div class="container"><div class="header-top">
        <a href="/" class="logo-link header-logo-link"><video class="header-logo-video" src="/assets/header-logo.mp4" autoplay muted loop playsinline preload="metadata" aria-label="Gride X Central"></video></a>
    </div></div></header>

    <main class="detail-wrap">
        <div class="container">
            <nav class="crumbs"><a href="/">Home</a> <span>/</span> <a href="/categories/{category_l}">{category}</a> <span>/</span> <b>{base}</b></nav>

            <section class="detail-hero">
                <div class="detail-icon-frame"><img src="{icon}" alt="{name}" class="detail-icon"></div>
                <h1 class="detail-title">{name}</h1>
                <p class="detail-sub">{description}</p>
                <div class="detail-meta-chips">
                    <span class="chip chip-purple">v{version}</span>
                    <span class="chip">Android</span>
                    <span class="chip chip-green">Free</span>
                </div>
                <a href="{downloadUrl}" target="_blank" rel="noopener noreferrer" class="download-btn detail-dl">Download APK</a>
                <p class="detail-note">Direct mirror &middot; No account needed</p>
            </section>

            <section class="info-grid">
                <div class="info-card"><span class="info-label">Version</span><span class="info-val">{version}</span></div>
                <div class="info-card"><span class="info-label">Category</span><span class="info-val">{category}</span></div>
                <div class="info-card"><span class="info-label">Platform</span><span class="info-val">Android</span></div>
                <div class="info-card"><span class="info-label">Price</span><span class="info-val">Free</span></div>
            </section>

            <section class="detail-section">
                <h2 class="sec-title">Mod Features</h2>
                <div class="feature-tags">{feat_tags}</div>
            </section>

            <section class="detail-section">
                <h2 class="sec-title">About {base}</h2>
                <p class="body-text">{description}</p>
                <p class="body-text">This modified version of {base} {version} unlocks {features}. Download the APK directly from Gride X Central &mdash; tested on real Android devices before publishing.</p>
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
                <details class="faq"><summary>Will it update automatically?</summary><p>MOD versions don't update through the Play Store. Bookmark this page &mdash; we refresh the build whenever a newer stable mod drops.</p></details>
                <details class="faq"><summary>"App not installed" error &mdash; what now?</summary><p>Uninstall the Play Store version first (signature conflict), make sure you have free storage, then retry the install.</p></details>
            </section>

            <section class="detail-section">
                <h2 class="sec-title">More {category}</h2>
                <div class="related-grid">{related_html}</div>
            </section>
        </div>
    </main>

    <div class="sticky-dl">
        <div class="sticky-dl-name">{base} <span>v{version}</span></div>
        <a href="{downloadUrl}" target="_blank" rel="noopener noreferrer" class="download-btn sticky-dl-btn">Get APK</a>
    </div>

    <footer class="footer"><div class="container">
        <div class="footer-inner">
            <div><h3>Gride X Central</h3><p>Your trusted source for modded Android games &amp; apps. Powered by Gride X Echo.</p></div>
            <div><h4>Links</h4><a href="/">Home</a><a href="/categories/games">Games</a><a href="/categories/apps">Apps</a></div>
            <div><h4>Legal</h4><a href="/privacy.html">Privacy</a><a href="/contact.html">Contact</a></div>
        </div>
        <div class="footer-bottom"><p>&copy; 2026 Gride X Central. All trademarks belong to their respective owners. Powered by Gride X Echo.</p></div>
    </div></footer>
    <script src="/js/ads.js"></script>
    <script src="/js/main.js"></script>
</body>
</html>'''

CATEGORY_TEMPLATE = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{heading} - Mod APK Download | Gride X Central</title>
    <meta name="description" content="{desc}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{canonical}">
    <meta property="og:title" content="{heading} - Gride X Central">
    <meta property="og:description" content="{desc}">
    <meta property="og:url" content="{canonical}">
    <meta property="og:image" content="''' + OG_IMAGE + '''">
    <link rel="icon" type="image/jpg" href="/assets/logo-simple.jpg">
    <link rel="stylesheet" href="/css/style.css">
</head>
<body data-category="{cat}">
    <header class="header"><div class="container"><div class="header-top">
        <a href="/" class="logo-link header-logo-link"><video class="header-logo-video" src="/assets/header-logo.mp4" autoplay muted loop playsinline preload="metadata" aria-label="Gride X Central"></video></a>
    </div></div></header>
    <main class="main-content"><div class="container">
        <h1>{heading} <span style="font-size:.6em;color:var(--text-muted)">({count} available)</span></h1>
        <p style="color:var(--text-muted);margin:8px 0 24px">{desc}</p>
        <div class="search-box"><input type="text" id="searchInput" placeholder="Search {cat}..." autocomplete="off"></div>
        <div class="apk-list" id="apkGrid" style="margin-top:24px">
            {cards}
        </div>
    </div></main>
    <nav class="bottom-nav"><a href="/" class="nav-item">Home</a><a href="/categories/games" class="nav-item">Games</a><a href="/categories/apps" class="nav-item">Apps</a></nav>
    <script src="/js/ads.js"></script>
    <script src="/js/main.js"></script>
</body>
</html>'''


if __name__ == "__main__":
    sheet_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE, "raw_sheet.csv")
    apps = read_sheet(sheet_path)
    write_data_json(apps)
    generate_app_pages(apps)
    generate_category_pages(apps)
    update_homepage_links(apps)
    update_sitemap(apps)
    print(f"\nAll done! ({len(apps)} apps)")
