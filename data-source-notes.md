# Disaster Map Data Boundary

The initial product interface will be delivered as a **clearly labeled interactive prototype**, using local, illustrative incident records rather than claiming emergency-grade real-time verification. This keeps the map usable for demonstrating flows while avoiding unsafe representation of emergency data.

NASA’s EONET Version 3 documentation confirms that it exposes catalogued natural-event categories and event-linked imagery layers through web-service references, including WMS and WMTS services. This is a potential future source for an environmental-event layer, but it does not replace a local responder verification workflow. [NASA EONET API Documentation](https://eonet.gsfc.nasa.gov/docs/v3)

The Global Disaster Alert and Coordination System exposes an official API documentation endpoint. Its interactive documentation did not expose a usable schema in the current browser session, so the production integration should verify its current event and geometry contract directly before implementation. [GDACS API Documentation](https://www.gdacs.org/gdacsapi/swagger/index.html)

For a production launch, incident status should be backed by verified reports, service-level agreements, clear update timestamps, source attribution, and an escalation process. Satellite-derived or environmental signals should be described as **supporting context**, never as a substitute for field validation.

## Preview Map Fallback

The browser preview may intermittently block Google Maps' connectivity check, which can leave external map tiles unavailable. The homepage therefore includes a first-party location-signal canvas with a graticule, route traces, coordinate labels, and incident signal points beneath the interactive map layer. This preserves spatial orientation and board readability while external imagery is unavailable. The incident queue, selected-location card, filters, amber-alert demonstration, and reporting flow remain usable without external map tiles.

## Humanitarian Contact Pathways (Verified 22 August 2026)

The user interface may link to the **IFRC contact page and National Societies Directory**, rather than claiming that a global office phone line is an emergency dispatch service. The IFRC’s official contact page points people to its National Societies Directory for country-level routing. Source: <https://www.ifrc.org/contact>.

The St John International contact page states that it supports St John establishments internationally and directs first-aid or service inquiries to the relevant local establishment. Its published International Office number is **+44 20 4583 0202** and email is **info@orderofstjohn.org**. Source: <https://www.stjohninternational.org/contact-us/>.

These links are included only as institutional routing pathways. They do not represent real-time rescue dispatch, operational availability, or a substitute for official local emergency services.

The official **INSARAG USAR Directory** provides an overview of member countries and their Urban Search and Rescue teams, with team views by country, regional group, and emergency. It may be linked as a coordination and discovery resource only—not as a statement that a team is available, deployed, or reachable for direct dispatch. Source: <https://insarag.org/directory/usar-directory/>.

The requested name **“ARMEF”** could not be confidently matched to an official global humanitarian or rescue organization during source review. It is therefore not included in the product contact directory until the organization’s full name or official website is confirmed.

## Supporting Video (Verified 22 August 2026)

The selected supporting video is **“How The Red Cross Responds To Disasters”** from the official American Red Cross YouTube channel. The video is 1 minute 58 seconds long and presents a general explanation of disaster response rather than coverage of a current, unverified incident. It is embedded as optional supporting context, with a clear source link and no autoplay. Source: <https://www.youtube.com/watch?v=fAugbZEew2s>.

An OCHA video, **“This Is OCHA,”** from the official UN Humanitarian YouTube channel, was also verified as a credible general coordination explainer. The Red Cross video was selected because its disaster-response framing aligns more closely with the board’s responder and donor matching purpose. Source: <https://www.youtube.com/watch?v=6n_veh46IiM>.
