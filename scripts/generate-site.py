#!/usr/bin/env python3
"""Generate Gride X Central site from Google Sheet data.

Usage: python scripts/generate-site.py

Reads raw_sheet.txt (maton output), filters valid apps,
writes data.json, regenerates all /app/*/index.html pages,
and updates sitemap.xml.
"""

import json, os, re, sys
from datetime import datetime

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def slugify(name):
    s = name.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s[:80].rstrip('-')

def is_valid(app):
    """Skip test rows and invalid entries."""
    name, desc, icon, version, plat, dl_url, features, category = app
    if "example.com" in dl_url: return False
    if not dl_url.startswith("http"): return False
    if not icon.startswith("http"): return False
    if "Gemini-Generated" in icon and ("test" in name.lower() or "test" in desc.lower()): return False
    if category.lower() in ["wallpaper", "exe", "video"]: return False
    if not version: return False
    if len(name) < 3: return False
    return True

def read_sheet(path="/tmp/raw_sheet.txt"):
    """Parse maton tab-separated output."""
    apps = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split("\t")
            if len(parts) < 8: continue
            if parts[0] in ("", "name"): continue
            
            app = (
                parts[0].strip(),   # name
                parts[1].strip(),   # desc
                parts[2].strip(),   # icon
                parts[3].strip(),   # version
                parts[4].strip(),   # platform
                parts[5].strip(),   # downloadUrl
                parts[7].strip(),   # features
                parts[8].strip() if len(parts) > 8 else "Apps"  # category
            )
            if is_valid(app):
                apps.append({
                    "name": app[0], "description": app[1], "icon": app[2],
                    "version": app[3], "platform": app[4].lower() if app[4] else "android",
                    "downloadUrl": app[5], "features": app[6], "category": app[7] if app[7] else "Apps",
                    "slug": slugify(app[0])
                })
    return apps

def write_data_json(apps):
    path = os.path.join(BASE, "data.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(apps, f, indent=2, ensure_ascii=False)
    print(f"✅ data.json ({len(apps)} apps)")

def generate_app_pages(apps):
    """Generate individual /app/*/index.html for each app."""
    app_dir = os.path.join(BASE, "app")
    
    for app in apps:
        slug = app["slug"]
        adir = os.path.join(app_dir, slug)
        os.makedirs(adir, exist_ok=True)
        
        feat_tags = "".join(
            f'<span class="feature-tag">{f.strip()}</span>' 
            for f in app["features"].split(",") if f.strip()
        )
        
        html = PAGE_TEMPLATE.format(**app, feat_tags=feat_tags)
        
        with open(os.path.join(adir, "index.html"), "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  ✅ app/{slug}/")

def update_sitemap(apps):
    today = datetime.now().strftime("%Y-%m-%d")
    urls = ["https://apkhub-cxv.pages.dev/"]
    for app in apps:
        urls.append(f"https://apkhub-cxv.pages.dev/app/{app['slug']}/")
    urls += [
        "https://apkhub-cxv.pages.dev/categories/games.html",
        "https://apkhub-cxv.pages.dev/categories/apps.html",
        "https://apkhub-cxv.pages.dev/privacy.html",
        "https://apkhub-cxv.pages.dev/contact.html",
    ]
    
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for url in urls:
        xml += f'  <url>\n    <loc>{url}</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n'
    xml += '</urlset>'
    
    with open(os.path.join(BASE, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(xml)
    print(f"✅ sitemap.xml ({len(urls)} URLs)")

PAGE_TEMPLATE = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name} Free Download | Gride X Central</title>
    <meta name="description" content="Download {name} for Android from Gride X Central. {description} MOD features: {features}. Fast and safe download.">
    <meta name="keywords" content="{name}, mod apk, android mod, {category} mod, free download">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://apkhub-cxv.pages.dev/app/{slug}/">
    <meta property="og:title" content="{name} Free Download | Gride X Central">
    <meta property="og:description" content="{description}">
    <meta property="og:url" content="https://apkhub-cxv.pages.dev/app/{slug}/">
    <meta property="og:type" content="website">
    <script type="application/ld+json">{{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "{name}",
        "operatingSystem": "Android",
        "applicationCategory": "{category}",
        "description": "{description}",
        "version": "{version}",
        "offers": {{"@type": "Offer", "price": "0", "priceCurrency": "USD"}}
    }}</script>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <header class="header"><div class="container"><div class="header-inner">
        <a href="/" class="logo"><span class="logo-icon"></span>Gride X <span class="logo-highlight">Central</span></a>
        <nav class="nav"><a href="/" class="nav-link">Home</a><a href="/categories/games.html" class="nav-link">Games</a><a href="/categories/apps.html" class="nav-link">Apps</a></nav>
    </div></div></header>

    <div class="app-detail">
        <div class="container">
            <div class="app-header">
                <img src="{icon}" alt="{name}" class="app-icon-large">
                <div>
                    <h1 class="app-title">{name}</h1>
                    <p class="app-subtitle">{description}</p>
                    <a href="{downloadUrl}" target="_blank" rel="noopener noreferrer" class="download-btn">⬇️ Download APK</a>
                </div>
            </div>
            <div class="app-features"><h3>✨ Mod Features</h3><div class="feature-tags">{feat_tags}</div></div>
            <div style="margin-top:24px"><p><strong>Version:</strong> {version} | <strong>Category:</strong> {category} | <strong>Platform:</strong> Android</p></div>
            <div style="margin-top:32px"><h3>📋 Description</h3>
                <p style="color:var(--text-muted);line-height:1.8">{description}</p>
                <p style="color:var(--text-muted);margin-top:8px;line-height:1.8">This modified version gives you premium features without spending money. Download now and enjoy unlimited gameplay!</p>
            </div>
        </div>
    </div>

    <footer class="footer"><div class="container">
        <div class="footer-inner">
            <div><h3>🎮 Gride X Central</h3><p>Your trusted source for modded Android games & apps. Powered by Gride X Echo.</p></div>
            <div><h4>Links</h4><a href="/">Home</a><a href="/categories/games.html">Games</a><a href="/categories/apps.html">Apps</a></div>
            <div><h4>Legal</h4><a href="/privacy.html">Privacy</a><a href="/contact.html">Contact</a></div>
        </div>
        <div class="footer-bottom"><p>&copy; 2026 Gride X Central. All trademarks belong to their respective owners. Powered by Gride X Echo.</p></div>
    </div></footer>
    <div class="ad-overlay" id="adOverlay">...</div>
    <script src="/js/ads.js"></script>
    <script src="/js/main.js"></script>
</body>
</html>'''

if __name__ == "__main__":
    sheet_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/raw_sheet.txt"
    apps = read_sheet(sheet_path)
    write_data_json(apps)
    generate_app_pages(apps)
    update_sitemap(apps)
    print(f"\n🎮 All done! ({len(apps)} apps)")