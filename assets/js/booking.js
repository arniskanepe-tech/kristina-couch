document.addEventListener("DOMContentLoaded", () => {
  const BOOKING_API_BASE = "http://185.219.156.43:3001";

  const modal = document.getElementById("booking-modal");
  const modalTitle = document.getElementById("booking-modal-title");
  const modalMeta = document.getElementById("booking-modal-meta");
  const modalText = document.getElementById("booking-modal-text");
  const uiRoot = document.getElementById("booking-ui-root");

  const cardDescriptions = {
    1: "Bezmaksas iepazīšanās saruna, lai saprastu Tavu situāciju, vajadzības un to, vai koučings šobrīd Tev ir piemērots.",
    2: "Individuāla koučinga sesija konkrētam jautājumam, situācijai vai lēmumam — ar fokusu uz skaidrību un konkrētiem nākamajiem soļiem.",
    3: "Padziļinātai izpētei un sarežģītākām tēmām, kur nepieciešams vairāk laika, telpas un strukturēta pieeja risinājuma atrašanai."
  };

  let services = [];
  let selectedService = null;
  let selectedDate = null;
  let selectedTime = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setActiveCard(serviceId) {
    document.querySelectorAll(".booking-card").forEach(card => {
      const id = Number(card.getAttribute("data-service-id"));
      card.classList.toggle("is-active", id === serviceId);
    });
  }

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    selectedDate = null;
    selectedTime = null;
    setActiveCard(null);
  }

  async function loadServices() {
    const response = await fetch(`${BOOKING_API_BASE}/services`, { cache: "no-store" });
    services = await response.json();
    syncCardTitles();
  }

  function syncCardTitles() {
    document.querySelectorAll(".booking-card").forEach(card => {
      const serviceId = Number(card.getAttribute("data-service-id"));
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      const titleEl = card.querySelector("h3");
      const durationEl = card.querySelector(".consult-option-duration");

      if (titleEl) titleEl.textContent = service.name;
      if (durationEl) durationEl.textContent = `${service.duration} min`;
    });
  }

  function renderInitialStep() {
    if (!selectedService) return;

    modalTitle.textContent = selectedService.name;
    modalMeta.textContent = `${selectedService.duration} min`;
    modalText.textContent = cardDescriptions[selectedService.id] || "";

    uiRoot.innerHTML = `
      <div class="booking-ui">
        <div>
          <h3>Izvēlies datumu</h3>
          <input class="booking-date-input" type="date" id="booking-date-input">
        </div>

        <div id="booking-slots-section"></div>
        <div id="booking-form-section"></div>
      </div>
    `;

    const dateInput = document.getElementById("booking-date-input");
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;

    dateInput.addEventListener("change", async () => {
      selectedDate = dateInput.value;
      selectedTime = null;
      document.getElementById("booking-form-section").innerHTML = "";

      if (!selectedDate) return;

      await renderSlots(selectedDate);
    });
  }

  async function renderSlots(date) {
    const slotsSection = document.getElementById("booking-slots-section");

    slotsSection.innerHTML = `<div class="booking-loading">Ielādējam pieejamos laikus...</div>`;

    try {
      const response = await fetch(
        `${BOOKING_API_BASE}/slots?serviceId=${selectedService.id}&date=${date}`
      );

      const slots = await response.json();

      if (!response.ok) {
        slotsSection.innerHTML = `
          <div class="booking-error">
            Neizdevās ielādēt laikus.
          </div>
        `;
        return;
      }

      if (!slots.length) {
        slotsSection.innerHTML = `
          <div class="booking-empty-box">
            <h4>Pieejamie laiki</h4>
            <p>Šajā datumā pieejamu laiku nav.</p>
          </div>
        `;
        return;
      }

      const slotsHtml = slots.map(time => `
        <button type="button" class="booking-slot-btn" data-time="${time}">
          ${time}
        </button>
      `).join("");

      slotsSection.innerHTML = `
        <div>
          <h4>Pieejamie laiki</h4>
          <div class="booking-slots">${slotsHtml}</div>
        </div>
      `;

      document.querySelectorAll(".booking-slot-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".booking-slot-btn").forEach(x => x.classList.remove("is-selected"));
          btn.classList.add("is-selected");

          selectedTime = btn.getAttribute("data-time");
          renderBookingForm();
        });
      });
    } catch (error) {
      slotsSection.innerHTML = `
        <div class="booking-error">
          Neizdevās ielādēt laikus.
        </div>
      `;
    }
  }

  function renderBookingForm() {
    const formSection = document.getElementById("booking-form-section");

    formSection.innerHTML = `
      <div class="booking-summary">
        <h4>Rezervācijas kopsavilkums</h4>
        <p><strong>Pakalpojums:</strong> ${escapeHtml(selectedService.name)}</p>
        <p><strong>Datums:</strong> ${escapeHtml(selectedDate)}</p>
        <p><strong>Laiks:</strong> ${escapeHtml(selectedTime)}</p>
      </div>

      <div class="booking-form-box">
        <h4>Ievadi savus datus</h4>

        <div class="booking-form-grid">
          <input type="text" id="booking-client-name" placeholder="Vārds">
          <input type="email" id="booking-client-email" placeholder="E-pasts">
          <input type="tel" id="booking-client-phone" placeholder="Telefons">

          <button type="button" class="booking-primary-btn" id="booking-submit-btn">
            Apstiprināt rezervāciju
          </button>
        </div>
      </div>
    `;

    document.getElementById("booking-submit-btn").addEventListener("click", submitBooking);
  }

  async function submitBooking() {
    const name = document.getElementById("booking-client-name").value.trim();
    const email = document.getElementById("booking-client-email").value.trim();
    const phone = document.getElementById("booking-client-phone").value.trim();

    if (!name || !email) {
      alert("Lūdzu aizpildi vismaz vārdu un e-pastu.");
      return;
    }

    const formSection = document.getElementById("booking-form-section");

    formSection.innerHTML = `
      <div class="booking-loading">Saglabājam rezervāciju...</div>
    `;

    try {
      const response = await fetch(`${BOOKING_API_BASE}/booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          service: selectedService.name,
          date: selectedDate,
          time: selectedTime,
          name,
          email,
          phone
        })
      });

      const result = await response.json();

      if (!response.ok) {
        formSection.innerHTML = `
          <div class="booking-error">
            ${escapeHtml(result.message || "Neizdevās saglabāt rezervāciju.")}
          </div>
        `;
        return;
      }

      formSection.innerHTML = `
        <div class="booking-success-box">
          <h4>Paldies!</h4>
          <p>Rezervācija ir veiksmīgi pieteikta.</p>
          <p><strong>Pakalpojums:</strong> ${escapeHtml(selectedService.name)}</p>
          <p><strong>Datums:</strong> ${escapeHtml(selectedDate)}</p>
          <p><strong>Laiks:</strong> ${escapeHtml(selectedTime)}</p>
          <button type="button" class="booking-secondary-btn" id="booking-close-success">
            Aizvērt
          </button>
        </div>
      `;

      const slotsSection = document.getElementById("booking-slots-section");
      if (slotsSection && selectedDate) {
        await renderSlots(selectedDate);
      }

      document.getElementById("booking-close-success").addEventListener("click", closeModal);
    } catch (error) {
      formSection.innerHTML = `
        <div class="booking-error">
          Neizdevās saglabāt rezervāciju.
        </div>
      `;
    }
  }

  function bindCardEvents() {
    document.querySelectorAll(".booking-card").forEach(card => {
      const open = () => {
        const serviceId = Number(card.getAttribute("data-service-id"));
        selectedService = services.find(s => s.id === serviceId);

        if (!selectedService) return;

        selectedDate = null;
        selectedTime = null;

        setActiveCard(serviceId);
        renderInitialStep();
        openModal();
      };

      card.addEventListener("click", (event) => {
        if (event.target.closest(".booking-open-btn") || event.currentTarget === event.target || event.target.closest(".consult-option-card")) {
          open();
        }
      });

      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });
  }

  function bindModalEvents() {
    document.querySelectorAll("[data-booking-close]").forEach(el => {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  async function initBooking() {
    if (!modal || !uiRoot) return;

    await loadServices();
    bindCardEvents();
    bindModalEvents();
  }

  initBooking();
});