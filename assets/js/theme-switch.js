document.addEventListener("DOMContentLoaded", () => {
    /*
     * ==========================================================
     * KRISTĪNAS LAPAS TĒMU SISTĒMA
     * ==========================================================
     *
     * PRODUCTION:
     *   THEME_SWITCHER_ENABLED = false
     *   Publiski vienmēr tiek izmantota Dark Red tēma.
     *
     * DEVELOPMENT / TĒMU TESTĒŠANA:
     *   THEME_SWITCHER_ENABLED = true
     *   Parādās tēmu izvēles panelis un izvēlētā tēma tiek
     *   saglabāta pārlūka localStorage.
     *
     * Lai nākotnē atkal ieslēgtu tēmu pārslēgšanu,
     * vienkārši nomaini false uz true.
     * ==========================================================
     */
    const THEME_SWITCHER_ENABLED = false;
    const PRODUCTION_THEME = "darkred";
    const STORAGE_KEY = "kk-theme";
    const themes = {
        default: "assets/css/styles.css",
        darkred: "assets/css/darkred.css",
        premium: "assets/css/styles-premium.css",
        dark: "assets/css/styles-dark.css"
    };
    // ----------------------------------------------------------
    // Atrodam lapā galveno CSS failu
    // ----------------------------------------------------------
    const cssLink = document.querySelector('link[href*="styles.css"]');
    if (!cssLink) return;
    // ----------------------------------------------------------
    // Tēmas piemērošana
    // ----------------------------------------------------------
    function applyTheme(name, save = true) {
        if (!themes[name]) return;
        cssLink.href = themes[name];
        if (save) {
            localStorage.setItem(STORAGE_KEY, name);
        }
    }
    // ----------------------------------------------------------
    // PRODUCTION vai DEVELOPMENT režīms
    // ----------------------------------------------------------
    if (THEME_SWITCHER_ENABLED) {
        // Testēšanas režīmā atceramies iepriekš izvēlēto tēmu.
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && themes[saved]) {
            applyTheme(saved, false);
        } else {
            applyTheme(PRODUCTION_THEME, false);
        }
    } else {
        /*
         * Production režīmā IGNORĒJAM iepriekš localStorage
         * saglabāto tēmu.
         *
         * Tas nodrošina, ka arī pārlūki, kuros agrāk testēta
         * Default / Premium / Dark tēma, tagad redz Dark red.
         */
        applyTheme(PRODUCTION_THEME, false);
    }
    // ----------------------------------------------------------
    // Publiska tēmu API
    // Saglabājam nākotnes vajadzībām.
    // ----------------------------------------------------------
    window.KKTheme = {
        apply(name) {
            applyTheme(name);
        },
        current() {
            if (!THEME_SWITCHER_ENABLED) {
                return PRODUCTION_THEME;
            }
            return localStorage.getItem(STORAGE_KEY) || PRODUCTION_THEME;
        },
        themes
    };
    // ----------------------------------------------------------
    // TĒMU IZVĒLES PANELIS
    //
    // Panelis tiek izveidots TIKAI tad, ja augstāk:
    //
    // const THEME_SWITCHER_ENABLED = true;
    //
    // ----------------------------------------------------------
    if (THEME_SWITCHER_ENABLED) {
        const panel = document.createElement("div");
        panel.innerHTML = `
            <div id="theme-switcher" style="
                position:fixed;
                right:20px;
                bottom:20px;
                z-index:99999;
                background:#fff;
                border:1px solid #ddd;
                border-radius:12px;
                padding:12px;
                box-shadow:0 10px 30px rgba(0,0,0,.15);
                font-family:Arial,sans-serif;
                font-size:14px;
                min-width:220px;
            ">
                <div style="font-weight:bold;margin-bottom:8px;">
                    Theme:
                    <span id="theme-current">
                        ${window.KKTheme.current()}
                    </span>
                </div>
                <button data-theme="default">Default</button>
                <button data-theme="darkred">Dark Red</button>
                <button data-theme="premium">Premium</button>
                <button data-theme="dark">Dark</button>
            </div>
        `;
        document.body.appendChild(panel);
        const current = panel.querySelector("#theme-current");
        panel.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", () => {
                const theme = btn.dataset.theme;
                applyTheme(theme);
                current.textContent = theme;
            });
        });
    }
});
