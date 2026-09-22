document.addEventListener("DOMContentLoaded", () => {
  const CONSENT_KEY = "izaugsmei_cookie_consent";
  const GA_MEASUREMENT_ID = "G-EGLBD1JE8S";

  const banner = document.getElementById("cookie-consent");
  const acceptButton = document.getElementById("cookie-accept");
  const rejectButton = document.getElementById("cookie-reject");
  const settingsButtons = document.querySelectorAll(".cookie-settings");

  function loadGoogleAnalytics() {
    if (window.__izaugsmeiGaLoaded) {
      return;
    }

    window.__izaugsmeiGaLoaded = true;

    window.dataLayer = window.dataLayer || [];

    function gtag() {
      window.dataLayer.push(arguments);
    }

    window.gtag = gtag;

    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://www.googletagmanager.com/gtag/js?id=" +
      encodeURIComponent(GA_MEASUREMENT_ID);

    document.head.appendChild(script);

    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID);
  }

  const savedConsent = localStorage.getItem(CONSENT_KEY);

  if (savedConsent === "accepted") {
    loadGoogleAnalytics();
  }

  if (!banner || !acceptButton || !rejectButton) {
    return;
  }

  if (!savedConsent) {
    banner.hidden = false;
  }

  acceptButton.addEventListener("click", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    banner.hidden = true;
    loadGoogleAnalytics();
  });

  rejectButton.addEventListener("click", () => {
    const wasAccepted =
      localStorage.getItem(CONSENT_KEY) === "accepted";

    localStorage.setItem(CONSENT_KEY, "rejected");
    banner.hidden = true;

    if (wasAccepted) {
      location.reload();
    }
  });

  settingsButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      banner.hidden = false;
    });
  });
});
