// APK Data from Google Sheet
const apkData = [
    {
        id: "arrow-puzzle",
        name: "Arrow Puzzle: Tap Puzzle Games (MOD, No Ads + Pro Unlocked)",
        description: "Relaxing logic puzzle game. Tap arrows in the right order to clear the board. MOD: Ads removed, paid features unlocked.",
        icon: "https://appteka.store/icon/7862cf205be5238022fb08dbe4d99e857a513df0.png",
        version: "1.8.0",
        category: "Games",
        downloadUrl: "https://1024terabox.com/s/1I_kEWsewPebV6z_wZ7tliA",
        features: "No Ads, Pro Unlocked, Premium Features, Unlimited Hints",
        slug: "arrow-puzzle-tap-puzzle-games-mod"
    },
    {
        id: "hill-climb-racing-1",
        name: "Hill Climb Racing (MOD, Unlimited Money)",
        description: "Physics-based racing game with endless fuel, unlimited gems, and all vehicles unlocked.",
        icon: "https://an1.com/uploads/posts/2023-03/1680100711_hill-climb-racing.png",
        version: "1.71.1",
        category: "Games",
        downloadUrl: "https://1024terabox.com/s/1u9wpxAj3MjXLIfkndO62uQ",
        features: "Unlimited Money, Unlimited Fuel, Unlimited Gems, All Vehicles Unlocked, No Ads",
        slug: "hill-climb-racing-mod-unlimited-money"
    },
    {
        id: "hill-climb-racing-2",
        name: "Hill Climb Racing (MOD, Unlimited Money)",
        description: "Arcade racing game with vehicle upgrades, coin rewards, and physics-based hill driving.",
        icon: "https://an1.com/uploads/posts/2023-03/1680100711_hill-climb-racing.png",
        version: "1.69.0",
        category: "Games",
        downloadUrl: "https://1024terabox.com/s/1-u99xU2EO_Y9wSySXOqVCg",
        features: "Physics-based racing, upgrades, customization, tournaments.",
        slug: "hill-climb-racing-mod-v169"
    },
    {
        id: "clash-of-clans",
        name: "Clash of Clans (MOD, Unlimited Money)",
        description: "Build and defend your village in this strategy game while attacking rivals with a powerful army.",
        icon: "https://an1.com/uploads/posts/2022-10/1665831715_clash-of-clans.png",
        version: "18.350.2",
        category: "Games",
        downloadUrl: "https://1024terabox.com/s/1XJXX57vcoTGEPUntzR5FFg",
        features: "Village building, clan wars, troop upgrades, strategic battles.",
        slug: "clash-of-clans-mod-unlimited-money"
    },
    {
        id: "rayman-adventures",
        name: "Rayman Adventures (MOD, Unlimited Gems)",
        description: "Adventure platformer where Rayman rescues the Incrediballs across colorful fantasy worlds.",
        icon: "https://an1.com/uploads/posts/2025-09/1758025100_rayman-adventures.png",
        version: "3.9.95",
        category: "Games",
        downloadUrl: "https://1024terabox.com/s/14CLn9BNC2IPBgQ_ekqOoLw",
        features: "Unlimited Gems, side-scrolling adventure, collectible companions, colorful levels",
        slug: "rayman-adventures-mod-unlimited-gems"
    },
    {
        id: "bus-simulator-indonesia",
        name: "Bus Simulator Indonesia (MOD, Unlimited Fuel)",
        description: "Realistic Indonesian bus driving experience with authentic local routes, detailed cities, and lively terminals.",
        icon: "https://liteapks.com/wp-content/uploads/2022/08/bus-simulator-indonesia-150x150.jpg",
        version: "4.5.2",
        category: "Games",
        downloadUrl: "https://1024terabox.com/s/18dwyc5InmgCilxjpeJ9y2w",
        features: "Unlimited Fuel, Realistic Driving, Authentic Routes, Dynamic Traffic, 3D Graphics",
        slug: "bus-simulator-indonesia-mod"
    },
    {
        id: "spaceflight-simulator",
        name: "Spaceflight Simulator (MOD, Unlocked)",
        description: "Build rockets and explore space in a realistic physics-based simulator.",
        icon: "https://an1.com/uploads/posts/2025-05/1747678733_spaceflight-simulator.png",
        version: "1.5.10.5",
        category: "Games",
        downloadUrl: "https://1024terabox.com/s/1nLyCYRQStFgOZEJYqUeM3A",
        features: "Custom rocket building, realistic orbital physics, Moon/Mars missions.",
        slug: "spaceflight-simulator-mod-unlocked"
    },
    {
        id: "mob-control",
        name: "Mob Control (MOD, Unlimited Money)",
        description: "Casual strategy game where you grow your crowd, raid enemy bases, and expand your empire.",
        icon: "https://an1.com/uploads/posts/2026-04/1775404672_mob-control.png",
        version: "3.16.0",
        category: "Games",
        downloadUrl: "https://1024terabox.com/s/files.an1.net/mob-control-mod_3.16.0-an1.com.apk",
        features: "Unlimited Money, crowd battles, base raids, upgrades, empire expansion.",
        slug: "mob-control-mod-unlimited-money"
    },
    {
        id: "dramabox",
        name: "DramaBox Mod APK",
        description: "Premium drama streaming app with unlocked features. Watch unlimited short dramas and shows.",
        icon: "https://i.supaimg.com/54d8e9e6-f692-4495-b004-8f283590aaaa/1d703df8-8d32-4df3-9e02-89e61e83ec1e.jpg",
        version: "Latest",
        category: "Apps",
        downloadUrl: "https://1024terabox.com/s/1CcjR3zLJ17HENLO5GUp_Eg",
        features: "Premium Unlocked, No Ads",
        slug: "dramabox-mod-apk"
    },
    {
        id: "dr-driving-1",
        name: "Dr. Driving (MOD, Unlimited Money)",
        description: "Burn up the street with the fastest and most visually stunning driving game.",
        icon: "https://cdn.topmongo.com/packages/com.ansangha.drdriving/icon_051d83.png",
        version: "1.73",
        category: "Games",
        downloadUrl: "https://1024terabox.com/s/1WxKIrVi0UgIFUA4WoXh2Jg",
        features: "Unlimited Money",
        slug: "dr-driving-mod-unlimited-money"
    },
    {
        id: "dr-driving-2",
        name: "Dr. Driving (MOD, Unlimited Money)",
        description: "Dr. Driving drives you crazy! Burn up the street with the fastest driving game.",
        icon: "https://cdn.topmongo.com/packages/com.ansangha.drdriving/icon_051d83.png",
        version: "1.73",
        category: "Games",
        downloadUrl: "https://1024terabox.com/s/14J9TnoN4UBuLgGXITF-wRw",
        features: "Unlimited Money",
        slug: "dr-driving-mod-173"
    },
    {
        id: "jurassic-world",
        name: "Jurassic World: The Game (MOD)",
        description: "Build and manage your own dinosaur park on Nublar Island. 150+ dinosaur species.",
        icon: "https://an1.com/uploads/posts/2026-08/1788186535_jurassic-world-the-game.png",
        version: "1.92.14",
        category: "Games",
        downloadUrl: "https://1024terabox.com/s/1K88icPIX3e52IJuxVs__Zw",
        features: "Park building, Strategy, Simulation",
        slug: "jurassic-world-the-game-mod"
    }
];