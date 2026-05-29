Module.register("MMM-TicketEvents", {
  defaults: {
    apiKey: "",
    city: "",
    stateCode: "",
    countryCode: "US",
    lat: null,
    lon: null,
    radius: 50,
    unit: "miles",
    classificationName: "",
    keyword: "",
    maxEvents: 25,
    showImage: true,
    maxWidth: "300px",
    rotateInterval: 60 * 1000,
    animationSpeed: 2000,
    showHeader: true,
    header: "Upcoming Events",
    updateInterval: 60 * 60 * 1000,
    initialLoadDelay: 3000,
    retryDelay: 2500
  },

  start() {
    this.events = [];
    this.activeIndex = 0;
    this.loaded = false;
    this.hasError = false;
    this.errorMessage = "";
    this.rotateTimer = null;
    this.sendSocketNotification("FETCH_EVENTS", this.config);
    this.scheduleUpdate();
  },

  getStyles() {
    return ["MMM-TicketEvents.css"];
  },

  getScripts() {
    return [];
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "ticket-events-wrapper";
    wrapper.style.maxWidth = this.config.maxWidth;

    if (this.config.showHeader && this.config.header) {
      const header = document.createElement("div");
      header.className = "ticket-events-header xsmall bright";
      header.innerHTML = this.config.header;
      wrapper.appendChild(header);
    }

    if (!this.loaded && !this.hasError) {
      const loading = document.createElement("div");
      loading.className = "ticket-events-loading";
      loading.innerHTML = "Loading events...";
      wrapper.appendChild(loading);
      return wrapper;
    }

    if (this.hasError) {
      const error = document.createElement("div");
      error.className = "ticket-events-error";
      error.innerHTML = this.errorMessage;
      wrapper.appendChild(error);
      return wrapper;
    }

    if (this.events.length === 0) {
      const empty = document.createElement("div");
      empty.className = "ticket-events-empty";
      empty.innerHTML = "No upcoming events found.";
      wrapper.appendChild(empty);
      return wrapper;
    }

    const event = this.events[this.activeIndex];
    if (!event) return wrapper;

    const card = document.createElement("div");
    card.className = "ticket-event-card";

    if (this.config.showImage) {
      const imageDiv = document.createElement("div");
      imageDiv.className = "ticket-event-image";
      if (event.image) {
        const img = document.createElement("img");
        img.src = event.image;
        img.alt = event.name;
        img.loading = "lazy";
        imageDiv.appendChild(img);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "ticket-event-image-placeholder";
        const seg = event.segment || "Event";
        placeholder.style.background = this.getPlaceholderColor(event.segment);
        placeholder.innerHTML = this.getInitials(event.name);
        imageDiv.appendChild(placeholder);
      }
      card.appendChild(imageDiv);
    }

    const name = document.createElement("div");
    name.className = "ticket-event-name bright";
    name.innerHTML = event.name;
    card.appendChild(name);

    if (event.localDate) {
      const date = document.createElement("div");
      date.className = "ticket-event-date";
      date.innerHTML = this.formatDate(event.localDate, event.localTime);
      card.appendChild(date);
    }

    if (event.venueName) {
      const venue = document.createElement("div");
      venue.className = "ticket-event-venue";
      const location = [event.venueCity, event.venueState].filter(Boolean).join(", ");
      venue.innerHTML = event.venueName + (location ? ` &middot; ${location}` : "");
      card.appendChild(venue);
    }

    const meta = document.createElement("div");
    meta.className = "ticket-event-meta";

    if (event.segment) {
      const genre = document.createElement("span");
      genre.className = "ticket-event-genre";
      genre.innerHTML = event.segment;
      meta.appendChild(genre);
    }

    if (event.priceMin != null) {
      const price = document.createElement("span");
      price.className = "ticket-event-price";
      const currency = event.currency || "USD";
      const symbol = this.getCurrencySymbol(currency);
      if (event.priceMax != null) {
        price.innerHTML = `${symbol}${event.priceMin} - ${symbol}${event.priceMax}`;
      } else {
        price.innerHTML = `From ${symbol}${event.priceMin}`;
      }
      meta.appendChild(price);
    }

    card.appendChild(meta);

    if (event.url) {
      const link = document.createElement("div");
      link.className = "ticket-event-link";
      link.innerHTML = "Get tickets";
      link.onclick = () => { window.open(event.url, "_blank"); };
      card.appendChild(link);
    }

    wrapper.appendChild(card);
    return wrapper;
  },

  formatDate(dateStr, timeStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const options = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
    let formatted = date.toLocaleDateString(this.config.locale || "en-US", options);
    if (timeStr) {
      const timeParts = timeStr.split(":");
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? "PM" : "AM";
        const h = hours % 12 || 12;
        formatted += ` &middot; ${h}:${minutes} ${ampm}`;
      }
    }
    return formatted;
  },

  getInitials(name) {
    if (!name) return "?";
    return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  },

  getPlaceholderColor(segment) {
    const colors = {
      Music: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      Sports: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      Arts: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      Theatre: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      Film: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
      Family: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
    };
    return colors[segment] || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
  },

  getCurrencySymbol(code) {
    const symbols = { USD: "$", EUR: "€", GBP: "£", CAD: "$", AUD: "$", MXN: "$" };
    return symbols[code] || (code ? code + " " : "$");
  },

  scheduleUpdate() {
    const self = this;
    setTimeout(() => {
      self.sendSocketNotification("FETCH_EVENTS", self.config);
    }, this.config.initialLoadDelay);

    setInterval(() => {
      self.sendSocketNotification("FETCH_EVENTS", self.config);
    }, this.config.updateInterval);
  },

  startRotation() {
    if (this.rotateTimer) clearInterval(this.rotateTimer);
    if (this.events.length <= 1) return;
    const self = this;
    this.rotateTimer = setInterval(() => {
      self.activeIndex = (self.activeIndex + 1) % self.events.length;
      self.updateDom(self.config.animationSpeed);
    }, this.config.rotateInterval);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "EVENTS_RESULT") {
      if (payload.success && payload.events) {
        this.events = payload.events;
        this.loaded = true;
        this.hasError = false;
        this.activeIndex = 0;
        if (this.rotateTimer) clearInterval(this.rotateTimer);
        this.startRotation();
      } else if (!payload.success) {
        this.hasError = true;
        this.errorMessage = payload.error || "Failed to load events";
        this.loaded = true;
      }
      this.updateDom(this.config.animationSpeed);
    }
  }
});
