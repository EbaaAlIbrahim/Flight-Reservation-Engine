# Apex Reservation Engine (Smart Disruption Engine)

Apex Reservation Engine is an immersive, real-time airspace monitoring, flight booking, and predictive analytics dashboard. Built inside a microservices architecture (`smart-disruption-engine`), this platform merges consumer-facing airline travel workflows with a high-utility aviation operations console that actively simulates disruption risks using machine learning models.

## Key Features

* **Live Orbital Canvas Engine:** Replicates industry-grade systems (like AviationStack) using a low-overhead HTML5 canvas to track real-time aircraft vector orbits. Dynamically rotates active transponder logs (altitude, latitude, longitude) every 3 seconds.
* **Predictive AI Disruption Radar:** Integrates a Python Data Science analytical microservice running Random Forest models. Operations managers can evaluate any flight (e.g., `EK507`) to compute predictive delay durations (in minutes) and real-time cancellation risk factors.
* **Automated Telemetry Broadcasts:** Automatically checks incoming flight risk indices. If a flight exhibits a $\ge 70\%$ risk footprint, an urgent warning banner is pushed onto the global state and fed instantly to affected passengers' notification trays.
* **Interactive Seating Matrix & Billing:** Includes an explicit coordinate seat locker system tied to automated invoice summary builders, complete with an auto-dismissing (3-second) semi-transparent feedback alert banner layer.
* **Full-Bleed Desktop Experience:** Finished with an edge-to-edge deep space aviation theme (`#0c101d`) built specifically for desktop monitors, ensuring seamless, single-line horizontal navbar performance.

## Tech Stack
* **Frontend:** React, TypeScript (Strict `verbatimModuleSyntax` configuration), Lucide Icons
* **Backend Utilities:** Fetch API, Microservices Router Shell
* **Analytics Backend (Port 8000):** Python Data Science Cluster (ML Forest Model)
