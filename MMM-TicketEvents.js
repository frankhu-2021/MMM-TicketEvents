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
    displayCount: 10,
    scrollCount: 5,
    showImage: true,
    maxWidth: "300px",
    rotateInterval: 15 * 1000,
    animationSpeed: 1000,
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

    if (this.events.length <= this.config.displayCount) {
      return this.buildStaticList(wrapper);
    }

    return this.buildTickerList(wrapper);
  },

  buildStaticList(wrapper) {
    const list = document.createElement("div");
    list.className = "ticket-event-list";
    for (let i = 0; i < this.events.length; i++) {
      list.appendChild(this.createEventCard(this.events[i]));
    }
    wrapper.appendChild(list);
    return wrapper;
  },

  buildTickerList(wrapper) {
    const outer = document.createElement("div");
    outer.className = "ticket-events-ticker-outer";

    const inner = document.createElement("div");
    inner.className = "ticket-events-ticker-inner";

    for (let i = 0; i < this.events.length; i++) {
      inner.appendChild(this.createEventCard(this.events[i]));
    }
    for (let i = 0; i < this.events.length; i++) {
      inner.appendChild(this.createEventCard(this.events[i]));
    }

    outer.appendChild(inner);
    wrapper.appendChild(outer);

    const rowHeight = 56;
    outer.style.height = (rowHeight * this.config.displayCount) + "px";

    const totalSteps = Math.ceil(this.events.length / this.config.scrollCount);
    const duration = totalSteps * this.config.rotateInterval;

    this._animName = "ticket-scroll-" + this.identifier;
    const style = document.createElement("style");
    style.textContent = "@keyframes " + this._animName + " { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }";
    wrapper.appendChild(style);

    inner.style.animation = this._animName + " " + duration + "ms linear infinite";
    inner.style.willChange = "transform";

    return wrapper;
  },

  createEventCard(event) {
    const card = document.createElement("div");
    card.className = "ticket-event-card";

    if (this.config.showImage) {
      const thumb = document.createElement("div");
      thumb.className = "ticket-event-thumb";
      if (event.image) {
        const img = document.createElement("img");
        img.src = event.image;
        img.alt = event.name;
        img.loading = "lazy";
        thumb.appendChild(img);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "ticket-event-thumb-placeholder";
        placeholder.style.background = this.getPlaceholderColor(event.segment);
        placeholder.innerHTML = this.getInitials(event.name);
        thumb.appendChild(placeholder);
      }
      card.appendChild(thumb);
    }

    const info = document.createElement("div");
    info.className = "ticket-event-info";

    const name = document.createElement("div");
    name.className = "ticket-event-name";
    name.innerHTML = event.name;
    info.appendChild(name);

    const details = document.createElement("div");
    details.className = "ticket-event-details";

    if (event.localDate) {
      const date = document.createElement("span");
      date.className = "ticket-event-date";
      date.innerHTML = this.formatDate(event.localDate);
      details.appendChild(date);
    }

    if (event.venueName) {
      const venue = document.createElement("span");
      venue.className = "ticket-event-venue";
      const location = [event.venueCity, event.venueState].filter(Boolean).join(", ");
      venue.innerHTML = " &middot; " + event.venueName + (location ? " (" + location + ")" : "");
      details.appendChild(venue);
    }

    info.appendChild(details);

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
        price.innerHTML = symbol + event.priceMin + " - " + symbol + event.priceMax;
      } else {
        price.innerHTML = "From " + symbol + event.priceMin;
      }
      meta.appendChild(price);
    }

    if (event.url) {
      const link = document.createElement("a");
      link.className = "ticket-event-link";
      link.href = event.url;
      link.target = "_blank";
      link.innerHTML = "Tickets";
      meta.appendChild(link);
    }

    info.appendChild(meta);
    card.appendChild(info);
    return card;
  },

  formatDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const options = { weekday: "short", month: "short", day: "numeric" };
    return date.toLocaleDateString(this.config.locale || "en-US", options);
  },

  getInitials(name) {
    if (!name) return "?";
    return name.split(" ").slice(0, 2).map(function(w) { return w[0]; }).join("").toUpperCase();
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
    setTimeout(function() {
      self.sendSocketNotification("FETCH_EVENTS", self.config);
    }, this.config.initialLoadDelay);

    setInterval(function() {
      self.sendSocketNotification("FETCH_EVENTS", self.config);
    }, this.config.updateInterval);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "EVENTS_RESULT") {
      if (payload.success && payload.events) {
        this.events = payload.events;
        this.loaded = true;
        this.hasError = false;
        this.activeIndex = 0;
      } else if (!payload.success) {
        this.hasError = true;
        this.errorMessage = payload.error || "Failed to load events";
        this.loaded = true;
      }
      this.updateDom(this.config.animationSpeed);
    }
  }
});
