const NodeHelper = require("node_helper");
const axios = require("axios");

module.exports = NodeHelper.create({
  start() {
    this.config = {};
  },

  async fetchEvents(config) {
    const params = {
      apikey: config.apiKey,
      size: config.maxEvents || 25,
      sort: "date,asc"
    };

    if (config.keyword) params.keyword = config.keyword;
    if (config.classificationName) params.classificationName = config.classificationName;
    if (config.countryCode) params.countryCode = config.countryCode;
    if (config.stateCode) params.stateCode = config.stateCode;

    if (config.lat && config.lon) {
      params.geoPoint = this.latLonToGeoHash(config.lat, config.lon);
      if (config.radius) params.radius = config.radius;
      if (config.unit) params.unit = config.unit;
    } else if (config.city) {
      params.city = config.city;
      if (config.radius) params.radius = config.radius;
      if (config.unit) params.unit = config.unit;
    }

    try {
      const response = await axios.get("https://app.ticketmaster.com/discovery/v2/events.json", {
        params,
        timeout: 10000
      });

      const events = this.parseEvents(response.data);
      this.sendSocketNotification("EVENTS_RESULT", { events, success: true });
    } catch (error) {
      let message = "Unknown error";
      if (error.response) {
        const status = error.response.status;
        if (status === 401) message = "Invalid API key. Register at https://developer.ticketmaster.com";
        else if (status === 429) message = "Rate limited. Try again later.";
        else message = `API error (${status})`;
      } else if (error.code === "ECONNABORTED") {
        message = "Request timed out";
      } else if (error.code === "ENOTFOUND") {
        message = "Network error — check internet connection";
      } else {
        message = error.message;
      }
      console.error(`[MMM-TicketEvents] ${message}`);
      this.sendSocketNotification("EVENTS_RESULT", { events: [], success: false, error: message });
    }
  },

  parseEvents(data) {
    if (!data || !data._embedded || !data._embedded.events) return [];

    return data._embedded.events.map((event) => {
      const venue = event._embedded?.venues?.[0] || {};
      const attraction = event._embedded?.attractions?.[0] || {};
      const classification = event.classifications?.[0] || {};
      const image = this.bestImage(event.images);
      const startDate = event.dates?.start || {};

      return {
        id: event.id,
        name: event.name || "Untitled Event",
        url: event.url || "",
        image: image || null,
        localDate: startDate.localDate || "",
        localTime: startDate.localTime || "",
        dateTime: startDate.dateTime || "",
        timezone: event.dates?.timezone || "",
        status: event.dates?.status?.code || "",
        venueName: venue.name || "",
        venueCity: venue.city?.name || "",
        venueState: venue.state?.name || "",
        venueCountry: venue.country?.countryCode || "",
        attractionName: attraction.name || "",
        segment: classification.segment?.name || "",
        genre: classification.genre?.name || "",
        priceMin: event.priceRanges?.[0]?.min || null,
        priceMax: event.priceRanges?.[0]?.max || null,
        currency: event.priceRanges?.[0]?.currency || ""
      };
    });
  },

  bestImage(images) {
    if (!images || images.length === 0) return null;
    const preferred = images.find((img) => img.ratio === "3_2" && !img.fallback) ||
                       images.find((img) => img.ratio === "16_9" && !img.fallback) ||
                       images.find((img) => !img.fallback) ||
                       images[0];
    return preferred ? preferred.url : null;
  },

  latLonToGeoHash(lat, lon, precision = 5) {
    if (typeof lat !== "number" || typeof lon !== "number") return "";
    const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
    let minLat = -90, maxLat = 90;
    let minLon = -180, maxLon = 180;
    let hash = "", bit = 0, ch = 0;
    let even = true;

    while (hash.length < precision) {
      if (even) {
        const mid = (minLon + maxLon) / 2;
        if (lon > mid) { ch |= (1 << (4 - bit)); minLon = mid; }
        else { maxLon = mid; }
      } else {
        const mid = (minLat + maxLat) / 2;
        if (lat > mid) { ch |= (1 << (4 - bit)); minLat = mid; }
        else { maxLat = mid; }
      }
      even = !even;
      if (bit < 4) { bit++; }
      else { hash += BASE32[ch]; bit = 0; ch = 0; }
    }
    return hash;
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "FETCH_EVENTS") {
      this.config = payload;
      this.fetchEvents(payload);
    }
  }
});
