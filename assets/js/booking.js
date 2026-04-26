document.addEventListener("DOMContentLoaded", () => {
  const BOOKING_API_BASE = "/kristina";

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
  <div class="booking-ui-grid">

    <div class="booking-left">
      <div class="booking-head">
        <h3>Izvēlies datumu</h3>
      </div>
      <div id="custom-datepicker"></div>
    </div>

    <div class="booking-right">
      <div id="slots-inline"></div>

      <div id="booking-slots-section"></div>
      <div id="booking-form-section"></div>
    </div>

  </div>
`;

renderCustomDatepicker();

  }

  async function renderSlots(date) {

const slotsSection =
  document.getElementById("slots-inline") ||
  document.getElementById("booking-slots-section");


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
  <div class="booking-slots">${slotsHtml}</div>
`;

document.querySelectorAll(".booking-slot-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".booking-slot-btn").forEach(x => x.classList.remove("is-selected"));
    btn.classList.add("is-selected");

    selectedTime = btn.getAttribute("data-time");
    renderBookingForm();

    if (window.innerWidth < 768) {
      setTimeout(() => {
        const formSection = document.getElementById("booking-form-section");
        if (formSection) {
          formSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      }, 150);
    }
  });
});

 }
catch (error) {
      slotsSection.innerHTML = `
        <div class="booking-error">
          Neizdevās ielādēt laikus.
        </div>
      `;
    }
  }


function renderCustomDatepicker() {
  const container = document.getElementById("custom-datepicker");

  const today = new Date();
  let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
   return `${year}-${month}-${day}`;
  }

function getMonthName(month) {
  const months = [
    "Janvāris", "Februāris", "Marts", "Aprīlis", "Maijs", "Jūnijs",
    "Jūlijs", "Augusts", "Septembris", "Oktobris", "Novembris", "Decembris"
  ];
  return months[month];
}


  function render() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

let html = `
  <div class="dp-layout">

    <div class="dp-left">
      <div class="dp-header">
        <button id="dp-prev">←</button>
	<div>${getMonthName(month)} ${year}</div>
        <button id="dp-next">→</button>
      </div>

<div class="dp-weekdays">
        <div>Pr</div>
        <div>Ot</div>
        <div>Tr</div>
        <div>Ce</div>
        <div>Pk</div>
        <div>Se</div>
        <div>Sv</div>
      </div>

      <div class="dp-grid">
`;

    for (let i = 0; i < firstDay; i++) {
      html += `<div></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const iso = formatDate(date);

      const isPast = date < new Date().setHours(0,0,0,0);

      html += `
        <button class="dp-day ${isPast ? 'is-disabled' : ''}" data-date="${iso}" ${isPast ? 'disabled' : ''}>
          ${d}
        </button>
      `;
    }

html += `
      </div>
    </div>

    <div class="dp-right">
      <div id="slots-inline"></div>
    </div>

  </div>
`;

    container.innerHTML = html;

    document.getElementById("dp-prev").onclick = () => {
      currentMonth.setMonth(currentMonth.getMonth() - 1);
      render();
    };

    document.getElementById("dp-next").onclick = () => {
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      render();
    };

    container.querySelectorAll(".dp-day").forEach(btn => {
      btn.onclick = async () => {
        container.querySelectorAll(".dp-day").forEach(x => x.classList.remove("is-selected"));
        btn.classList.add("is-selected");

        selectedDate = btn.dataset.date;
        selectedTime = null;

        document.getElementById("booking-form-section").innerHTML = "";

        await renderSlots(selectedDate);

if (window.innerWidth < 768) {
  setTimeout(() => {
    const el = document.querySelector(".booking-slots");
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, 150);
}

 };
    });
  }

  render();
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

<div class="form-field">
  <input type="text" id="booking-client-name" placeholder="Vārds">
  <div class="form-error" id="error-name"></div>
</div>

<div class="form-field">
  <input type="email" id="booking-client-email" placeholder="E-pasts">
  <div class="form-error" id="error-email"></div>
</div>

<div class="form-field">
  <input type="tel" id="booking-client-phone" placeholder="Telefons">
  <div class="form-error" id="error-phone"></div>
</div>

<div class="form-field">
  <textarea id="booking-client-goal" placeholder="Sarunas mērķis"></textarea>
  <div class="form-error" id="error-goal"></div>
</div>



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
    const goal = document.getElementById("booking-client-goal").value.trim();

// reset errors
document.getElementById("error-name").textContent = "";
document.getElementById("error-email").textContent = "";
document.getElementById("error-phone").textContent = "";

document.getElementById("booking-client-name").classList.remove("input-error");
document.getElementById("booking-client-email").classList.remove("input-error");
document.getElementById("booking-client-phone").classList.remove("input-error");

let hasError = false;

// NAME
if (!name) {
  document.getElementById("error-name").textContent = "Ievadi vārdu";
  document.getElementById("booking-client-name").classList.add("input-error");
  hasError = true;
}

// EMAIL
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!email || !emailRegex.test(email)) {
  document.getElementById("error-email").textContent = "Ievadi korektu e-pastu";
  document.getElementById("booking-client-email").classList.add("input-error");
  hasError = true;
}

// PHONE
const phoneRegex = /^[0-9+()\-\s]{8,20}$/;

if (!phone || !phoneRegex.test(phone)) {
  document.getElementById("error-phone").textContent = "Ievadi korektu telefona numuru";
  document.getElementById("booking-client-phone").classList.add("input-error");
  hasError = true;
}

if (hasError) return;





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
          phone,
	  goal
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


      if (window.innerWidth < 768) {
        setTimeout(() => {
          const successBox = document.querySelector(".booking-success-box");
          if (successBox) {
            successBox.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        }, 150);
      }

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
