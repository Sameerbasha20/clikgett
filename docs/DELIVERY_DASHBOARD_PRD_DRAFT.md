# Product Requirements Document (PRD): ClikGett Quick-Commerce Delivery Operations Platform

**Document Version:** 1.0.0  
**Status:** DRAFT (Analysis & Architectural Specification)  
**Target Systems:** ClikGett Android Delivery App (Java/Native), ClikGett Admin Web (React), ClikGett API Backend (Node.js/Express), ClikGett User App (Flutter)  
**Author:** AI Systems Architecture & Audit Team  
**Date:** October 2026  

---

## 1. Executive Summary & Vision

### 1.1 Vision Statement
Transform the ClikGett delivery logistics workflow from an e-commerce, next-day batch dispatch model into a high-cadence, real-time Quick-Commerce Delivery Operations Platform. The system will enable hyper-local fulfillment with sub-second order dispatch, continuous GPS telematics, transparent dynamic ETAs, bidirectional delay reporting, geofenced status transitions, and a live dispatcher operations console.

### 1.2 Strategic Objectives
1. **Zero-Latency Dispatch & Operations Visibility:** Provide operations dispatchers with a real-time command dashboard displaying rider locations, SLA adherence, active batch routes, and at-risk orders.
2. **Dynamic, Transparent ETAs:** Replace hardcoded static ETAs with live distance- and traffic-adjusted estimates, supporting rider-reported operational delays (+5, +10, +15, +30 min) with admin approval workflows.
3. **Resilient Field Execution:** Equip delivery partners with battery-efficient background GPS tracking, native in-app turn-by-turn navigation, one-tap issue reporting, and strict geofenced door-arrival validation.
4. **Trust & Security:** Protect customer PII, prevent location spoofing, and guarantee cryptographically signed delivery completion via 4-digit SMS/push OTP verification.

---

## 2. Target Personas & User Journeys

### 2.1 Delivery Partner ("Rider" / "Delivery Boy")
* **Profile:** Field delivery executive riding a two-wheeler, operating in high-density urban environments, managing multiple rapid pickups and drop-offs.
* **Key Needs:**
  * One-tap Shift On/Off toggle.
  * Clear pickup and delivery addresses with direct navigation triggers.
  * Fast, frictionless delivery completion (swipe gestures, OTP verification).
  * Quick-tap delay reporting when stuck in traffic, rain, or restaurant pickup bottlenecks.
  * Accurate real-time earnings breakdown (per-order payout + incentives vs. order merchandise total).

### 2.2 Operations Dispatcher / Admin ("Ops Admin")
* **Profile:** Central or hub manager monitoring order flow, fulfillment times, SLA breaches, and delivery partner capacity.
* **Key Needs:**
  * Live map view showing all active delivery partners and pending orders.
  * Real-time alerts for delayed pickups, stuck riders, or customer unreachable reports.
  * Operational levers to adjust ETAs (+5, +10, +15 min), reassign abandoned orders, or broadcast weather surge warnings.

### 2.3 End Customer ("Buyer")
* **Profile:** Mobile app user who placed an order expecting rapid delivery.
* **Key Needs:**
  * Real-time order milestone tracking (Packed -> Picked Up -> Arriving -> Delivered).
  * Accurate, dynamic ETA countdown that adjusts when delays occur.
  * Live rider location pin when the order is "Out for Delivery".
  * Secure OTP presentation upon driver arrival.

---

## 3. High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FIELD CLIENTS & USERS                           │
│                                                                        │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │ Native Android Rider App  │      │ Flutter Customer Mobile App │   │
│   │ (Foreground GPS, Nav, OTP)│      │ (Live Tracking, Dynamic ETA)│   │
│   └─────────────┬─────────────┘      └──────────────▲──────────────┘   │
└─────────────────┼───────────────────────────────────┼──────────────────┘
                  │ HTTPS / WSS                       │ HTTPS / WSS
┌─────────────────▼───────────────────────────────────┴──────────────────┐
│                   CLIKGETT BACKEND SERVICES (Node.js)                  │
│                                                                        │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │ REST API & Auth Gateway   │      │ Socket.io Live Pub/Sub      │   │
│   │ - Shift & Availability    │      │ - Rider Location Broadcast  │   │
│   │ - Status Transitions      │      │ - Dynamic ETA Updates       │   │
│   │ - Delay Review Workflow   │      │ - Incident Push Dispatch    │   │
│   └─────────────┬─────────────┘      └──────────────┬──────────────┘   │
│                 │                                   │                  │
│   ┌─────────────▼───────────────────────────────────▼──────────────┐   │
│   │ Telematics & ETA Engine (Haversine/OSRM/Google Distance Matrix)│   │
│   └─────────────────────────────┬──────────────────────────────────┘   │
└─────────────────────────────────┼──────────────────────────────────────┘
                                  │ MySQL Pool
┌─────────────────────────────────▼──────────────────────────────────────┐
│                    PERSISTENCE LAYER (MySQL 8.0)                       │
│                                                                        │
│   - DeliveryBoyLocations (Live GPS coords, battery, speed, bearing)    │
│   - DeliveryBoyLocationLogs (Historical breadcrumbs)                   │
│   - DeliveryBoyShifts (Shift punches, duty status)                     │
│   - OrderETAAdjustments (Audit trail of ETA changes)                   │
│   - OrderDelays (Driver-reported delay requests)                       │
│   - OrderIssues (Driver exceptions: vehicle breakdown, weather, etc.)  │
│   - Orders (Core lifecycle status, coordinates, EstimateDateTime)      │
└─────────────────────────────────▲──────────────────────────────────────┘
                                  │ HTTPS
┌─────────────────────────────────┴──────────────────────────────────────┐
│                       OPERATIONS DISPATCH CONSOLE                      │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ ClikGett Admin Web (React 18 + Leaflet/Google Maps)            │   │
│   │ - Live Operations Radar (Active, At-Risk, Delayed Orders)      │   │
│   │ - Delay Approval Desk & ETA Override Controls                  │   │
│   │ - Rider Shift & Fleet Capacity Monitor                         │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Functional Requirements & Feature Specifications

### 4.1 Driver Shift & Availability Management
* **FR-1.1 Duty Toggle:** Delivery partner shall have an explicit "Online / Offline / On Break" toggle on the main dashboard.
* **FR-1.2 Background Telematics Trigger:** Toggling "Online" starts the persistent Android `ForegroundService` with notification channel `LocationServiceChannel`. Toggling "Offline" gracefully stops the service.
* **FR-1.3 Shift Logging:** Backend records every shift change in `DeliveryBoyShifts` with timestamp, battery level, and initial GPS location.
* **FR-1.4 Auto-Offline Timeout:** If no GPS ping is received from an active driver for >10 minutes, the backend automatically flags the rider as `INACTIVE_TIMEOUT` and alerts the dispatcher.

### 4.2 Real-Time Geolocation & Telematics
* **FR-2.1 Tracking Modes:**
  * **Idle / Waiting for Order:** Poll location every 30 seconds; transmit if displacement > 25 meters.
  * **En Route to Store / Picked Up:** Poll location every 10 seconds; transmit if displacement > 10 meters.
  * **Stationary / Geofence Arrived:** Drop frequency to 45 seconds to conserve battery.
* **FR-2.2 Payload Schema:**
  * `delivery_boy_id`, `latitude`, `longitude`, `accuracy`, `speed_mps`, `bearing_degrees`, `battery_pct`, `is_charging`, `active_order_id`, `timestamp`.
* **FR-2.3 Offline Queueing:** If network connectivity is lost (`HttpURLConnection / Retrofit` fails), points are cached in SQLite/Room on Android and bulk-flushed once online (capped at last 50 points).
* **FR-2.4 Admin & Customer Real-Time Delivery Stream:** Backend broadcasts sanitized coordinates over Socket.io channel `order:location:{order_id}` and `admin:fleet:locations`.

### 4.3 Multi-Stop Order Lifecycle & Geofencing
* **FR-3.1 Status Transitions:**
  1. `Status 8: Received` (Order placed by customer)
  2. `Status 2: Packed / Assigned` (Assigned to delivery boy; rider receives notification)
  3. `Status 10: En Route to Store` (Driver acknowledges and begins traveling to store)
  4. `Status 11: Arrived at Store` (Auto-triggered when driver within 100m of store coordinates or manual swipe)
  5. `Status 5: Picked Up` (Driver verifies physical item count and swipes to confirm pickup)
  6. `Status 12: Out for Delivery` (Active leg to customer door; live map visible to customer)
  7. `Status 7: Arrived at Door` (Driver swipes arrived; system validates driver is within 250m geofence of customer location)
  8. `Status 1: Delivered` (Customer shares 4-digit OTP; driver submits OTP; backend cryptographically seals order)
* **FR-3.2 Geofence Override:** If GPS accuracy is poor (>50m) or customer location pin is flawed, driver can request "Manual Arrival Override" which logs an audit exception.

### 4.4 In-App & External Navigation
* **FR-4.1 Destination Resolving:** Customer `Latitude` and `Longitude` must be stored on `Orders` at checkout. If coordinates are null, fallback to geocoding the address string.
* **FR-4.2 One-Tap Navigation Intent:** Primary CTA triggers Google Maps Turn-by-Turn navigation: `google.navigation:q=Lat,Long&mode=d`.
* **FR-4.3 Fallback View:** If Google Maps app is unavailable, launch browser intent with `https://www.google.com/maps/dir/?api=1&destination=Lat,Long`.

### 4.5 Dynamic ETA & Delay Management Workflow
* **FR-5.1 Base ETA Calculation:** Calculated upon order assignment using:
  $$\text{ETA} = \text{PrepTimeRemaining} + \text{TransitTime}(Rider \to Store) + \text{TransitTime}(Store \to Customer) + \text{Buffer}(5\text{ min})$$
* **FR-5.2 Rider Delay Reporting:** Delivery boy can submit a delay request from `OrderDetailsActivity` with:
  * **Reasons:** Heavy Traffic, Heavy Rain, Vehicle/Bike Issue, Restaurant Wait, Customer Location Unclear, Road Block, Other.
  * **Suggested Additional Time:** `+5 min`, `+10 min`, `+15 min`, `+30 min`.
  * **Optional Remarks / Photo Upload:** Optional proof attachment.
* **FR-5.3 Approval Modes:**
  * **Configurable Auto-Approve:** For verified rain or traffic incidents, small delays (+5 min) auto-approve immediately.
  * **Admin Review Desk:** Larger delays appear as high-priority toast alerts on Admin console with [Approve (+10m)], [Adjust (+5m)], or [Reject] actions.
* **FR-5.4 Synchronized Broadcast:** Upon approval, backend updates `Orders.EstimateDateTime`, inserts record into `OrderETAAdjustments` and `OrderStatusTimeline`, and triggers push notifications to the User App.

### 4.6 Incident & Issue Reporting
* **FR-6.1 Issue Categories:**
  * `VEHICLE_BREAKDOWN`: Rider bike puncture/engine failure. Prompts admin for instant order reassignment.
  * `CUSTOMER_UNREACHABLE`: Driver at door, calling customer. Starts 5-minute timer before dispatch authorizes return.
  * `WRONG_ADDRESS`: Customer pin >500m away from text address.
  * `RESTAURANT_CLOSED / STOCK_ISSUE`: Store unable to fulfill.
* **FR-6.2 Action Triggers:** Submitting an emergency issue immediately alerts the Admin Dispatcher and pauses the order SLA timer.

### 4.7 Dispatcher Operations Command Center (Admin)
* **FR-7.1 Ops Radar Grid:** Real-time table featuring:
  * Order ID, Assigned Rider, Current Leg, Distance to Destination, Dynamic ETA, SLA Status (Green/Yellow/Red), Delay State, Quick Action Drawer.
* **FR-7.2 Live Fleet Map:** Interactive map showing all delivery partner pins (Green = Idle, Blue = En Route, Orange = Delayed, Gray = Offline).
* **FR-7.3 Manual Reassignment:** Ops admin can reassign an active order to an alternate nearby rider with a single click if the current rider reports a breakdown.

### 4.8 Transparent Earnings & Reconciliation
* **FR-8.1 Proper Commission Model:** Replace `sum(GrandTotal)` with actual rider earnings schema:
  $$\text{Rider Payout} = \text{Base Delivery Fee} + (\text{Distance km} \times \text{Rate/km}) + \text{Surge / Weather Bonus} + \text{Tips}$$
* **FR-8.2 Daily & Weekly Ledger:** Driver app displays itemized payouts per completed order ID, total distance traveled, and pending settlement balance.

---

## 5. Non-Functional Requirements (NFRs)

| Category | Requirement | Target Metric / Constraint |
| :--- | :--- | :--- |
| **Battery Consumption** | Driver app background GPS tracking must not deplete device battery excessively during an 8-hour shift. | < 6% battery drain per hour with active foreground service and adaptive location polling. |
| **Offline Resilience** | Mobile app must gracefully handle connectivity dropouts in underground parking, basements, or spotty cellular towers. | Local SQLite queue preserves up to 100 telemetry pings and retry status mutations with exponential backoff. |
| **API Latency** | Location ingestion and status mutation endpoints must respond rapidly under concurrent fleet load. | P95 latency < 150ms for location ingestion; P95 < 250ms for order status mutations. |
| **Location Precision** | Customer delivery geofencing accuracy. | Threshold of 250 meters for arrival validation, with fallback for GPS horizontal accuracy > 50m. |
| **Push Notification SLA** | Delivery assignment and delay alert transmission to mobile devices. | Delivery via Firebase Cloud Messaging within 3 seconds of database event. |
| **Security & Privacy** | Protect rider credentials and customer contact details. | JWT bearer authentication; customer phone number masking/virtual bridging; HTTPS TLS 1.3 encryption. |

---

## 6. Data Models & Database Requirements

*(Refer to `DELIVERY_DASHBOARD_DATABASE_AUDIT.md` for full schema specifications).*

### 6.1 New Tables Required
1. `DeliveryBoyLocations`: Stores the single latest known GPS coordinate, battery, and speed per rider.
2. `DeliveryBoyLocationLogs`: Append-only historical breadcrumbs table (partitioned monthly).
3. `DeliveryBoyShifts`: Audit log of rider shift punch-ins, punch-outs, and active duty statuses.
4. `OrderDelays`: Stores driver delay requests, reasons, proposed durations, admin approvals/rejections, and reviewer IDs.
5. `OrderIssues`: Stores operational incidents, cancellations, and escalations.
6. `DeliveryBoyEarningsLedger`: Replaces merchandise value sum with actual delivery commissions, distance pay, and tips.

### 6.2 Schema Extensions for `Orders` Table
* `DeliveryLatitude`: `DECIMAL(10, 8) NULL` (Customer drop-off latitude)
* `DeliveryLongitude`: `DECIMAL(11, 8) NULL` (Customer drop-off longitude)
* `StoreLatitude`: `DECIMAL(10, 8) NULL` (Hub/Store pickup latitude)
* `StoreLongitude`: `DECIMAL(11, 8) NULL` (Hub/Store pickup longitude)
* `CurrentLeg`: `ENUM('TO_STORE', 'AT_STORE', 'OUT_FOR_DELIVERY', 'ARRIVED_DOOR')`
* `DelayMinutes`: `INT DEFAULT 0`
* `DelayReason`: `VARCHAR(100) NULL`

---

## 7. API Specifications & Interfaces

*(Refer to `DELIVERY_DASHBOARD_API_AUDIT.md` for complete endpoint contracts).*

### 7.1 Driver Operations Endpoints
* `POST /api/deliveryboy/shift/status`: Set Online, Offline, or On Break status.
* `POST /api/deliveryboy/location/update`: Transmit batch GPS coordinates, speed, and battery.
* `POST /api/deliveryboy/orders/:id/report-delay`: Submit delay reason and proposed minutes.
* `POST /api/deliveryboy/orders/:id/report-issue`: Submit operational failure (breakdown, customer missing).
* `POST /api/deliveryboy/orders/:id/transition`: Advance order micro-status with current GPS geofence validation.

### 7.2 Admin Dispatch Endpoints
* `GET /api/admin/delivery/live-operations`: Fetch unified active delivery dashboard data.
* `GET /api/admin/delivery/fleet-map`: Fetch current coordinates and states of all online riders.
* `POST /api/admin/delivery/delays/:id/review`: Approve, modify, or reject a rider-submitted delay request.
* `POST /api/admin/delivery/orders/:id/reassign`: Hot-reassign order to another active nearby rider.

---

## 8. User Interface & Experience Guidelines

### 8.1 Delivery Boy Android App
* **Design Philosophy:** High contrast, glanceable cards, massive tap targets (minimum 48dp), haptic feedback on swipe actions.
* **Top App Bar:** Rider Avatar, Online/Offline Switch (Green/Red indicator), Active Badge.
* **Active Order Card:**
  * Bold Order ID & Customer Name.
  * Destination address with single-tap "Navigate (Google Maps)" button.
  * ETA Countdown chip (Green = On Time, Yellow = At Risk, Red = Delayed).
  * Secondary CTAs: "Call Customer" (masked), "Report Delay / Issue".
  * Primary Action: Large thumb-friendly "Swipe to Pick Up" / "Swipe Arrived at Door" / "Enter OTP to Deliver".

### 8.2 Admin Live Operations Dashboard
* **Layout:** Dual-pane layout.
  * **Left Pane (60%):** Operations KPI ribbon + Sortable Live Delivery Table (Order, Rider, Dynamic ETA, Delay Reason, Action).
  * **Right Pane (40%):** Live Leaflet/Mapbox fleet radar showing rider pins moving in real time.
* **Alert Tray:** Floating drawer flashing unreviewed delay requests and high-priority breakdown reports with audible notification chime.

---

## 9. Phased Rollout & Success Metrics

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASED ROLLOUT ROADMAP                          │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│    Phase 1      │     Phase 2      │     Phase 3     │     Phase 4     │
│ Foundation &    │ Live Telematics  │ Delay & ETA     │ Automated Intel │
│ Security (Wk 1-2│ & Nav (Wk 3-4)   │ Engine (Wk 5-6) │ & SLA (Wk 7-8)  │
├─────────────────┼──────────────────┼─────────────────┼─────────────────┤
│ • Auth & Tokens │ • Android GPS Svc│ • Driver Delay  │ • Auto-Dispatch │
│ • Geocoding Drop│ • WebSockets live│   reporting UI  │ • Dynamic Route │
│ • OTP Geofence  │ • Admin Live Map │ • Admin Approval│   Batching      │
│ • Earnings Fix  │ • Google Nav CTA │ • Dynamic ETA   │ • Weather Surge │
└─────────────────┴──────────────────┴─────────────────┴─────────────────┘
```

### 9.1 Key Performance Indicators (KPIs)
1. **On-Time Delivery SLA:** Increase from baseline to > 94% on-time fulfillment within promised ETA.
2. **Customer Support Enquiries ("Where is my order?"):** Reduce inbound delivery status tickets by > 65% via dynamic ETA and live map tracking.
3. **Dispatcher Response Time:** Sub-30-second turnaround on rider delay approvals and breakdown reassignments.
4. **Telematics Reliability:** > 98% of active delivery legs have continuous location breadcrumbs (<30s ping intervals).

---

## 10. Operational Risk Mitigation

| Risk | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Driver GPS spoofing / fake arrival** | Medium | High | Validate GPS mock location flags on Android; enforce 250m geofence server-side before allowing "Arrived" swipe. |
| **Aggressive battery killing by Android OS** | High | High | Run `ForegroundService` with persistent ongoing notification; prompt user to disable battery optimizations (Doze mode white-listing). |
| **Rider over-reporting delays to relax SLA** | Medium | Medium | Require admin review for delays > 5 minutes; log delay frequencies to rider performance analytics; flag chronic delay reporters. |
| **Network dead zones during delivery** | High | Medium | Support local offline queueing in Android app; allow SMS fallback OTP entry. |

---
*End of PRD Draft. Prepared for ClikGett Engineering and Operations Teams.*
