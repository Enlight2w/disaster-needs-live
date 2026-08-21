# Disaster Map Data Boundary

The initial product interface will be delivered as a **clearly labeled interactive prototype**, using local, illustrative incident records rather than claiming emergency-grade real-time verification. This keeps the map usable for demonstrating flows while avoiding unsafe representation of emergency data.

NASA’s EONET Version 3 documentation confirms that it exposes catalogued natural-event categories and event-linked imagery layers through web-service references, including WMS and WMTS services. This is a potential future source for an environmental-event layer, but it does not replace a local responder verification workflow. [NASA EONET API Documentation](https://eonet.gsfc.nasa.gov/docs/v3)

The Global Disaster Alert and Coordination System exposes an official API documentation endpoint. Its interactive documentation did not expose a usable schema in the current browser session, so the production integration should verify its current event and geometry contract directly before implementation. [GDACS API Documentation](https://www.gdacs.org/gdacsapi/swagger/index.html)

For a production launch, incident status should be backed by verified reports, service-level agreements, clear update timestamps, source attribution, and an escalation process. Satellite-derived or environmental signals should be described as **supporting context**, never as a substitute for field validation.

## Preview Map Fallback

The browser preview may intermittently block Google Maps' connectivity check, which can leave external map tiles unavailable. The homepage therefore includes a first-party location-signal canvas with a graticule, route traces, coordinate labels, and incident signal points beneath the interactive map layer. This preserves spatial orientation and board readability while external imagery is unavailable. The incident queue, selected-location card, filters, amber-alert demonstration, and reporting flow remain usable without external map tiles.
