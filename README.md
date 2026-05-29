# MMM-TicketEvents

A MagicMirror² module that displays upcoming events powered by the [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/). Events scroll in a continuous smooth ticker with images, dates, venues, and pricing.

![Screenshot](screenshots/screenshot.png)

## Features

- **Global event coverage** — Music, Sports, Arts, Theatre, Family events from 25+ markets
- **Carousel display** — Events rotate automatically with smooth transitions
- **Rich content** — Event images, dates, venues, genres, and price ranges
- **Flexible location** — Search by city or lat/lon with configurable radius
- **Click to buy** — Links directly to Ticketmaster for tickets
- **Error handling** — Graceful fallbacks for missing images, network errors, etc.

## Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/<your-username>/MMM-TicketEvents
cd MMM-TicketEvents
npm install --omit=dev
```

## Configuration

### Step 1: Get a Ticketmaster API Key

1. Register at [developer.ticketmaster.com](https://developer.ticketmaster.com)
2. Create an app to get your free API key (5,000 requests/day)
3. Copy the API key

### Step 2: Add to config.js

```javascript
{
  module: "MMM-TicketEvents",
  position: "top_left",
  config: {
    apiKey: "YOUR_TICKETMASTER_API_KEY",
    city: "Seattle",
    countryCode: "US",
    radius: 50,
    unit: "miles",
    classificationName: "",
    maxEvents: 25,
    showImage: true,
    maxWidth: "300px",
    rotateInterval: 60 * 1000,
    showHeader: true,
    header: "Upcoming Events"
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | String | `""` | **Required.** Ticketmaster API key |
| `city` | String | `""` | City name for event search |
| `stateCode` | String | `""` | State/Province code (e.g. `"WA"`) |
| `countryCode` | String | `"US"` | ISO 3166 country code |
| `lat` | Number | `null` | Latitude (alternative to city) |
| `lon` | Number | `null` | Longitude (alternative to city) |
| `radius` | Number | `50` | Search radius |
| `unit` | String | `"miles"` | Radius unit: `"miles"` or `"km"` |
| `classificationName` | String | `""` | Filter by type: `"music"`, `"sports"`, `"arts"`, `"theatre"`, `"family"` |
| `keyword` | String | `""` | Free text keyword search |
| `maxEvents` | Number | `25` | Maximum events to fetch |
| `showImage` | Boolean | `true` | Show event image |
| `maxWidth` | String | `"300px"` | Module width |
| `rotateInterval` | Number | `60000` | Event rotation interval (ms) |
| `animationSpeed` | Number | `2000` | Fade animation speed (ms) |
| `showHeader` | Boolean | `true` | Show module header |
| `header` | String | `"Upcoming Events"` | Header text |
| `updateInterval` | Number | `3600000` | API fetch interval (ms, default 1 hour) |

### Location Examples

**By city:**
```javascript
config: {
  apiKey: "...",
  city: "Seattle",
  stateCode: "WA",
  countryCode: "US",
  radius: 25
}
```

**By coordinates:**
```javascript
config: {
  apiKey: "...",
  lat: 47.6062,
  lon: -122.3321,
  radius: 50,
  unit: "miles"
}
```

**International:**
```javascript
config: {
  apiKey: "...",
  city: "London",
  countryCode: "GB",
  radius: 30,
  unit: "km"
}
```

## Updating

```bash
cd ~/MagicMirror/modules/MMM-TicketEvents
git pull
npm install --omit=dev
```

## API Details

- **API:** [Ticketmaster Discovery API v2](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)
- **Free tier:** 5,000 requests/day, 2 requests/sec
- **Coverage:** 25+ markets globally, 230K+ events
- **Data sources:** Ticketmaster, Universe, Front Gate, Ticketmaster Resale

## Changelog

See [CHANGELOG.md](CHANGELOG.md)

## License

MIT
