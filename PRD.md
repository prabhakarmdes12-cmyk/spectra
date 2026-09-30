# CHITI SPECTRA — PRODUCT REQUIREMENTS DOCUMENT (v1.0)

> **A 30-meter Environmental Disturbance Scanner**  
> *“See the invisible layers around you.”*

---

PRODUCT REQUIREMENTS DOCUMENT



## CHITI SPECTRA

A 30-meter Environmental Disturbance Scanner

“See the invisible layers around you.”

Document

Value

Version

1.0

Status

Product + engineering definition

Platforms

Android first; iOS second

Product category

Environmental sensing / exploratory science / field investigation

Core promise

Fuse available phone sensors into an honest, cinematic map of environmental disturbances

Non-promise

The product does not detect, identify, or estimate the probability of ghosts or supernatural entities

Product principle

Make invisible physical signals legible without turning uncertainty into fiction.



## 1. Executive Summary

CHITI SPECTRA is a mobile environmental-intelligence explorer. It continuously samples the sensors and radio interfaces that a phone is permitted to expose, synchronizes them on a common timeline, detects deviations from a locally learned baseline, and renders those events through radar, heat-field, AR, audio-spectrum and replay visualizations.

The 30-meter circle is a user-facing observation canvas, not a universal ranging claim. The app may know the phone’s own motion and pose with relatively high confidence, may know the distance/direction of supported cooperative devices through technologies such as UWB, may estimate regions from repeated signal observations, and may have no defensible spatial position for other events. The UI must preserve those distinctions.

The product is intentionally compatible with paranormal exploration as a cultural/use-case context, but the software vocabulary remains scientific: magnetic anomaly, acoustic transient, RF activity, motion event, light variation, pressure change, spatial feature, correlated event and unexplained correlation.



### 1.1 Product thesis

Modern phones already contain a compact set of physical, motion, optical, acoustic, positioning and radio sensors.

Most consumer apps expose these as separate utilities; SPECTRA’s differentiator is synchronized multi-sensor fusion and spatial storytelling.

A compelling investigation experience can be created without fabricating detections.

Uncertainty itself becomes a first-class visual property: point, cone, ring, region, trail, or unlocated timeline event.

The same foundation can serve paranormal hobbyists, science education, building exploration, RF curiosity, documentary fieldwork and sensor experimentation.



### 1.2 Product goals



| Goal | Definition of success |
| --- | --- |
| G1 — Sensor breadth | Detect device capability at runtime and use the maximum legitimate sensor set without breaking on lower-end phones. |
| G2 — Sensor fusion | Normalize all enabled streams onto one monotonic timeline and create explainable correlated events. |
| G3 — Spatial honesty | Never display a precise point when the data supports only a direction, radius, region or no location. |
| G4 — Cinematic clarity | Deliver a premium, legible field-instrument aesthetic rather than a novelty ghost-radar aesthetic. |
| G5 — Explainability | Every disturbance score and AI conclusion can be expanded into the measurements that produced it. |
| G6 — Privacy | Local-first processing by default; recording, location, microphone, camera and nearby-device access are explicit and revocable. |




### 1.3 Non-goals

Proving or disproving paranormal phenomena.

Claiming arbitrary objects, people or events can be precisely located at 30 m by a single phone.

Displaying invented entities, randomized radar blips or fake EVP words as sensor results.

Replacing calibrated EMF meters, spectrum analyzers, thermal cameras, sound-level meters, surveying equipment or safety instruments.

Inferring danger, health risk, electrical safety, structural safety or criminal activity from consumer-phone sensors.



## 2. Users, Jobs and Scenarios



| Persona | Job to be done | Primary value |
| --- | --- | --- |
| Explorer | Walk through a place and see unusual environmental changes. | Immersive radar + event capture |
| Paranormal hobbyist | Document sessions without fake certainty. | Evidence timeline + repeatable observations |
| Science learner | Understand magnetism, sound, light, pressure, radio and motion. | Live visualization + explanations |
| Documentary creator | Record a location and export a compelling evidence package. | Replay + annotated report |
| Technical enthusiast | Inspect raw sensor streams and correlations. | Lab mode + CSV/JSON export |
| Group investigator | Use several phones as synchronized observation nodes. | Mesh session + cross-device correlation |




### 2.1 Core user journey

Launch SPECTRA and run capability check.

Choose Quick Scan, Expedition, Lab or Group Scan.

Review permissions and sensor readiness.

Calibrate baseline for 20–60 seconds.

Walk/rotate through the environment while scan coverage builds.

Inspect live radar/heat/AR events.

Tap an event to see source sensors, magnitude, confidence and spatial status.

Mark a moment, add a voice/text note, or repeat a measurement.

End session and let the correlation engine generate a report.

Replay the walk, compare repeated passes, and export/share selected evidence.



## 3. Measurement Truth Model

Every visual element must carry two independent concepts: measurement confidence and spatial confidence. A strong magnetic spike can be highly certain as a measurement while having zero defensible information about where the source is located.



| Spatial class | UI geometry | Meaning |
| --- | --- | --- |
| Measured position | Point / small volume | Hardware or reconstructed scene supports a position within known uncertainty. |
| Measured direction | Ray / cone | Direction is available, but distance is absent or weak. |
| Measured distance | Ring / shell | Distance is available, direction is absent. |
| Estimated region | Soft probability blob | Repeated samples support a likely region; not a measured point. |
| Phone-local event | Center pulse | Sensor changed at the phone; source location is unknown. |
| Unlocated event | Timeline-only marker | A valid event occurred but cannot be mapped spatially. |




### 3.1 Mandatory language



| Avoid | Use instead |
| --- | --- |
| Ghost detected | Unexplained multi-sensor correlation |
| Entity at 7.4 m | Estimated activity region, low spatial confidence |
| Spirit voice | Voice-like acoustic segment / unclassified audio transient |
| EMF danger | Magnetic-field deviation from local baseline |
| Thermal entity | Temperature/depth/light anomaly, depending on actual sensor |
| Probability of ghost | Environmental Disturbance Index / anomaly confidence |




## 4. Device Capability Matrix

SPECTRA performs a capability handshake at first launch and before every session. Features are enabled from actual APIs, not model assumptions.



| Signal / sensor | What it can contribute | Spatial usefulness | Typical status |
| --- | --- | --- | --- |
| Accelerometer | Linear acceleration, movement, vibration proxy | Phone motion only | Common |
| Gyroscope | Rotation rate, stabilization | Phone pose/orientation | Common |
| Magnetometer | 3-axis magnetic field / compass support | Phone-local; source generally unknown | Common but not universal |
| Gravity / rotation vector | Stable orientation estimate | Transforms readings into world coordinates | Derived/common on Android |
| Barometer | Air-pressure change; relative altitude trends | Phone-local | Device dependent |
| Ambient light sensor | Illuminance changes | Phone-local | Common Android; access differs by platform |
| Proximity sensor | Near-screen obstruction | Centimeters, not room ranging | Common phones |
| Microphone | Waveform, spectrum, transients, voice activity | Source direction usually unknown on basic implementation | Permission required |
| Camera RGB | Optical flow, luminance, scene features | Visible field of view | Permission required |
| Camera depth / LiDAR | Depth map / scene geometry on supported hardware | High-value local 3D geometry | Premium subset |
| GPS/GNSS | Outdoor location / track | Poor indoor room-scale precision | Common |
| Wi-Fi observations | Visible networks / signal strength where platform permits | Region estimate only from repeated observations | OS/permission restricted |
| Bluetooth LE | Nearby advertising devices / RSSI | Coarse proximity; RSSI is noisy | Common; permission restricted |
| UWB / Nearby ranging | Distance and sometimes direction to cooperative supported peer/accessory | Precise relative ranging where supported | Limited device subset |
| NFC | Very-near tag interaction | Centimeter-scale touch/near interaction | Not a 30 m scanner |
| Pedometer / step counter | Dead-reckoning aid | Improves path estimation | Device/platform dependent |
| Network time / local peers | Clock alignment for group sessions | Correlation rather than sensing | Available with network |


Platform note: Apple documents Core Motion access to accelerometer, gyroscope, pedometer and, when available, magnetometer and barometer. Apple’s Nearby Interaction can report distance and direction for supported UWB peers, while ARKit sceneDepth provides camera-to-surface depth on supported LiDAR devices. Android documents motion, position and environmental sensor categories and exposes BLE scanning APIs. Exact permissions and background limits must be validated against the target OS release during implementation.



### 4.1 Sensor capability tiers



| Tier | Example capability | Experience |
| --- | --- | --- |
| Tier A — Universal | Motion + microphone + camera + location where granted | Radar, audio lab, optical events, path |
| Tier B — Enhanced | Magnetometer + barometer + light + BLE/Wi-Fi observations | Richer environmental layers |
| Tier C — Spatial | AR world tracking / depth / LiDAR | Scene mesh, anchored AR events, depth visualization |
| Tier D — Precision peer | UWB-capable supported peers/accessories | True peer distance/direction |
| Tier E — Mesh | 2+ SPECTRA phones | Cross-device timestamp correlation and triangulation experiments |




## 5. System Architecture



| Layer | Responsibilities |
| --- | --- |
| Capability Manager | Hardware/API detection, permission state, sampling availability, quality flags |
| Sensor Adapters | Platform-specific readers for motion, magnetic, pressure, light, audio, camera, radio and ranging |
| Timebase | Monotonic timestamps, clock-drift tracking, cross-device synchronization |
| Calibration Engine | Per-session baseline, noise floor, bias estimation, sensor health |
| Pose &amp; Path Engine | Orientation, steps, visual-inertial tracking, GPS fallback, coordinate transforms |
| Signal Processing | Filtering, FFT/STFT, transient detection, smoothing, feature extraction |
| Anomaly Engine | Per-stream normalized deviations and event segmentation |
| Correlation Engine | Temporal co-occurrence, repeatability, multi-device agreement |
| Spatial Inference | Points/cones/rings/regions with uncertainty; radio field interpolation |
| Scene Model | 30 m observation canvas, scanned cells, anchors, optional AR mesh |
| Visualization Engine | Radar, heat, AR, constellation, timeline and replay |
| AI Explanation Layer | Plain-language explanations constrained to structured evidence |
| Session Store | Local encrypted metadata, raw/derived streams according to user settings |
| Export Layer | Report PDF/JSON/CSV/media package in later builds |




### 5.1 Event data model



| Field | Example |
| --- | --- |
| event_id | EVT-20260930-00142 |
| timestamp | monotonic + wall-clock |
| type | MAGNETIC_SPIKE |
| magnitude | normalized 0–1 plus raw units |
| baseline_delta | +18.2 µT from rolling baseline |
| duration_ms | 420 |
| measurement_confidence | 0.94 |
| spatial_class | PHONE_LOCAL |
| spatial_confidence | 0.08 |
| position / region | nullable; coordinate + covariance/uncertainty |
| source_sensors | magnetometer |
| correlated_events | audio transient EVT-... |
| explanations | speaker / wiring / motor / metal object |
| user_annotation | optional note / marker |




## 6. The 30-Meter Living Map

The scan canvas is a local coordinate system centered on the session origin. Default radius is 30 m, with 5 m rings. The phone’s estimated path moves through this canvas; the user can recenter or switch to 10 m / 20 m / 30 m views.



### 6.1 Coverage model

Divide the observation area into cells (for example 0.5–1.0 m logical cells depending on tracking quality).

A cell becomes ‘observed’ only when the phone has a defensible pose/location and one or more compatible sensors were sampled.

Coverage opacity reflects observation density, not confidence in an external object.

Indoor dead reckoning drift must be visible as a growing path uncertainty band.

If tracking is lost, stop painting precise cells; record phone-local events until tracking recovers.



### 6.2 Radio-field estimation

Wi-Fi/BLE RSSI must not be converted directly into meters as if it were a ruler. SPECTRA can instead accumulate signal strength along the user’s path and fit a coarse field surface. A probable source region may be shown only after sufficient geometric diversity, repeat observations and stability checks. The region should widen when multipath/noise is high.



### 6.3 Spatial confidence inputs

Pose quality and drift

Number of observations

Geometric spread of observations

Signal variance

Line-of-sight or depth support when available

Repeat-pass consistency

Peer agreement in mesh mode

Hardware-reported confidence, where an API provides it



## 7. Sensor Processing Specifications



### 7.1 Magnetics

Capture 3-axis field and total magnitude where API permits.

Maintain short rolling median and longer session baseline.

Detect sudden delta, sustained deviation and directional rotation patterns.

Suppress/flag readings during aggressive phone rotation if calibration quality is poor.

Visualize raw µT, baseline delta, 3-axis plot and event markers.

Never label a magnetic reading as mains voltage, radiation, danger or supernatural activity.



### 7.2 Audio

User-controlled recording; visible microphone-active indicator at all times.

Waveform + STFT spectrogram + band energy + transient detector + optional on-device voice activity.

Detect impulsive knocks, repeating rhythms, sustained tones and voice-like segments.

Offer ‘environmental explanation’ classifiers only when confidence thresholds are met.

Preserve original audio separately from derived features when user chooses recording.

Do not claim ultrasonic sensing unless the actual microphone/sample path has been characterized for that device.



### 7.3 Motion and vibration

Fuse accelerometer and gyroscope for device motion state.

Separate ‘phone moved’ from possible external vibration wherever possible.

A vibration event captured while the user is walking should be down-weighted.

Stationary-mode high-pass features can expose table/floor vibration as an experimental signal.



### 7.4 Light and camera

Ambient illumination stream where available.

Camera luminance and exposure-normalized brightness changes.

Optical flow for visible movement; require persistence and exclude camera motion using pose estimates.

Optional object/scene segmentation may explain moving people, animals, curtains, fans or vehicle lights.

AR anchors should be created only for visual features with stable tracking.



### 7.5 Pressure/environment

Track barometric pressure trend and abrupt local changes.

Do not present phone battery temperature as room temperature.

Use actual ambient temperature/humidity only on rare devices that expose appropriate environmental sensors or via external accessories.



### 7.6 Radio

BLE: scan permitted advertisements; store pseudonymous identifiers by default; visualize RSSI trend and recurrence.

Wi-Fi: use only platform-permitted observations; respect location/nearby-device permission and OS scan throttling.

UWB: treat supported cooperative ranging as a distinct high-confidence layer, never as generic RF detection.

Network constellation is a visualization of discoverable radios, not all devices within 30 m.



## 8. Environmental Disturbance Index (EDI)

EDI is a session-relative measure of unusual environmental activity, not danger and not paranormal probability.

Conceptual form: D = Σ(wᵢ × zᵢ × qᵢ) + correlation_bonus − artifact_penalty, where zᵢ is normalized deviation from baseline, qᵢ is sensor-quality confidence, wᵢ is a configurable sensor weight, correlation_bonus rewards independent co-occurring signals, and artifact_penalty reduces events explained by phone motion, clipping, permission gaps or known device behavior.



| Band | UI meaning | Interpretation |
| --- | --- | --- |
| 0–24 | Quiet | Near local baseline |
| 25–49 | Active | One or more modest deviations |
| 50–74 | Elevated | Strong or repeated deviations |
| 75–100 | High disturbance | Strong multi-sensor or persistent deviation; inspect evidence |


The numeric band must always be expandable into its contributors. Avoid red=danger semantics; color encodes intensity only.



### 8.1 Correlation rules

Temporal correlation window should depend on sensor type; initial default ±500 ms for fast events, longer for environmental trends.

Correlations from independent sensors carry more weight than multiple derived features from the same raw stream.

Repeated events at the same mapped region increase repeatability confidence.

Group-session events gain confidence when multiple independently placed devices observe compatible signatures.

A correlation may remain ‘unexplained’ only after known artifacts are tested; unexplained means unclassified, not supernatural.



## 9. Information Architecture



| Primary tab | Purpose | Core components |
| --- | --- | --- |
| Radar | Live investigation | 30 m rings, sweep, phone/path, events, EDI, layer chips, coverage |
| AR | See events in scene | Camera, anchors/regions, depth mesh, compass, evidence capture |
| Heat | Accumulated field view | Layer selector, interpolated fields, confidence mask, repeat-pass compare |
| Audio | Acoustic laboratory | Waveform, spectrogram, bands, event list, playback |
| Report | Evidence and interpretation | Summary, correlations, timeline, replay, notes, export |


Network Constellation, Magnetics, Motion and raw sensor views live as secondary modes opened from Radar/Heat rather than increasing permanent tab count.



## 10. Screen-by-Screen Requirements



### 10.1 Onboarding / capability scan

Brand statement and truth promise.

Animated hardware check listing Available / Limited / Unavailable.

Permission cards explain exactly what data unlocks.

No permission wall: user can continue with a reduced sensor set.

Calibration tutorial demonstrates moving metal near the phone and making a sound so the user sees genuine responses.



### 10.2 New session



| Control | Options |
| --- | --- |
| Mode | Quick Scan / Expedition / Lab / Group |
| Radius | 10 / 20 / 30 m visualization |
| Recording | Derived data only / include audio / include video clips |
| Privacy | Local only default / optional cloud AI |
| Baseline | 20 s quick / 60 s recommended / skip with warning |




### 10.3 Radar

Full-screen circular field with 5 m rings.

Center marker shows phone heading and tracking quality.

Path trail with uncertainty halo.

Sweep animation is decorative timing feedback; it must not imply a physical radar transmitter.

Event glyph shape encodes sensor family; blur/size encodes spatial uncertainty.

Tap event opens Evidence Sheet with raw value, baseline, time, confidence, source sensors and explanations.

Top status: session timer, EDI, battery/thermal warning, recording indicator.

Bottom layer rail: All / Magnetic / Audio / RF / Motion / Light / Spatial.



### 10.4 Heat

One field layer at a time by default to prevent false visual correlation.

Optional composite disturbance layer.

Confidence mask: poorly observed areas fade to near-black.

Toggle Observations to reveal actual sample locations beneath interpolation.

Compare Pass A vs Pass B with difference view.



### 10.5 AR

Reticle + world tracking state.

Measured geometry shown distinctly from estimated regions.

Depth-supported points can attach to surfaces on capable devices.

Unlocated audio/magnetic events must not be arbitrarily pinned in the camera view.

Evidence capture saves screenshot/video with machine-readable event metadata.



### 10.6 Audio Lab

Live waveform and waterfall spectrogram.

Frequency cursor, event markers and playback loop.

Noise-floor calibration.

Labels: impulse, tonal, broadband, voice-like, clipping, wind/handling artifact, unclassified.

AI explanation appears only after recording or on explicit request to control compute/battery.



### 10.7 Network Constellation

Each discoverable radio becomes a node; visual scale reflects recent signal strength, not physical size.

Known local devices may be named only with user consent / OS-provided safe metadata.

Randomized MAC addresses and changing identifiers must be treated as unstable identities.

Constellation layout can be artistic unless spatially supported; label it ‘signal view’ rather than map.



### 10.8 Report

Session overview: place label, duration, distance walked, coverage, sensors active.

EDI over time.

Top events ranked by evidence strength, not sensationalism.

Correlation clusters with expandable sensor evidence.

Map replay synchronized with waveform/timeline.

Most likely ordinary explanations.

Unexplained correlations, explicitly defined as not classified by current evidence.

User notes and bookmarked moments.

Export controls.



## 11. Expedition and Game Layer

Gamification rewards measurement quality rather than scary outcomes.



| Mission | Requirement | Why it matters |
| --- | --- | --- |
| Map the Room | Reach 90–95% observable coverage | Improves field density |
| Silent Observer | Remain stationary and quiet for 60 s | Creates audio baseline |
| Magnetic Sweep | Slow 360° rotation with stable speed | Characterizes heading-related variation |
| Return Path | Repeat a previous route | Tests repeatability |
| Three-Point Check | Observe an anomaly from three positions | Improves spatial inference |
| Control Test | Move away from anomaly and return | Tests persistence |


Badges should celebrate methodology: Calibrated, Repeatable, Full Coverage, Multi-Node, Clean Baseline.

Do not reward ‘high ghost score’ or encourage trespassing, unsafe buildings, dangerous electrical inspection or risky nighttime behavior.



## 12. Group / Mesh Investigation

Two or more phones can join a local session. One becomes coordinator, but each node retains its raw measurements locally unless sharing is enabled.



### 12.1 Mesh functions

QR/invite code pairing.

Clock offset estimation and periodic resynchronization.

Node position estimation using AR/GPS/manual placement; UWB where supported.

Cross-node acoustic event matching.

Cross-node magnetic trend comparison.

Shared map of observation coverage.

Confidence boost only when observations are independent and timestamps align.

Graceful degradation when a node disconnects.



### 12.2 Experimental acoustic localization

With multiple stationary, synchronized microphones and known node positions, later versions may estimate direction/source regions from time-difference-of-arrival. This must be marked Experimental because commodity-phone microphone latency, clock synchronization and reflections can produce large errors.



## 13. AI Investigator



### 13.1 AI contract

The model receives structured session evidence, not an instruction to invent a story. It should explain observations, propose ordinary hypotheses, state uncertainty and identify what additional measurement would discriminate between hypotheses.



#### Required output schema



| Field | Example |
| --- | --- |
| Observation | Magnetic magnitude rose 18 µT above baseline for 4.2 s. |
| Correlations | Two audio impulses occurred within 0.4 s. |
| Likely explanations | Nearby speaker/motor, concealed wiring, moved metal object. |
| Confidence | Moderate |
| Why | Repeatable at the same region; phone motion was low. |
| Next test | Repeat from 3 positions with Wi-Fi/BLE layer disabled and phone held stationary. |
| Unexplained | Classification unresolved with available sensors. |




### 13.2 Guardrails

Never assert supernatural causation.

Never transform missing data into evidence.

Never describe a visualization artifact as a physical object.

Never infer a person is present from Wi-Fi/BLE alone.

Never diagnose health/safety conditions.

Quote raw measurements and confidence when making a claim.

Prefer ‘insufficient evidence’ over a dramatic explanation.



## 14. Privacy, Safety and Trust

Local-first by default. Cloud upload is opt-in and scoped to a session or selected evidence.

Microphone and camera indicators remain visible while active.

Location can be disabled; indoor local coordinates still work where pose tracking is available.

Nearby radio identifiers should be hashed/pseudonymized and aged out unless the user explicitly saves a device.

Audio/video retention is user-controlled with clear delete/export controls.

Do not continuously scan in the background unless the platform permits it and the user explicitly enables a supported mode.

Display a safety note for abandoned/industrial sites: do not trespass; do not use SPECTRA to judge electrical, structural, air-quality or radiation safety.

Children/education mode disables social/location sharing by default.



## 15. Performance and Reliability Requirements



| Area | Target |
| --- | --- |
| Live UI | Perceived 30–60 fps depending on device; sensor acquisition must not block rendering |
| Event latency | &lt;250 ms for fast local visual event indication where hardware/API permits |
| Timestamping | Monotonic local timestamps for all sensor samples |
| Crash resilience | Session journal checkpoints so an interrupted scan can be recovered |
| Battery | Adaptive sampling; thermal/battery state can reduce camera/radio sampling |
| Storage | Derived-data mode lightweight; warn before high-volume audio/video recording |
| Offline | Core scan, anomaly detection and replay function without internet |
| Accessibility | Non-color encodings for event type/confidence; scalable text; haptic/audio alternatives |




## 16. MVP Definition — Android First

The fastest credible MVP should prove sensor fusion and visualization before attempting ambitious 3D localization.



| MVP feature | Priority | Acceptance condition |
| --- | --- | --- |
| Capability detection | P0 | App lists supported sensors/permissions accurately on test devices |
| Motion/orientation | P0 | Stable heading/pose indicators and motion artifact flags |
| Magnetometer | P0 | Live magnitude + baseline + anomaly events |
| Microphone lab | P0 | Waveform, spectrogram, transient events, record/playback |
| Ambient light / pressure when available | P1 | Streams appear only on supported devices |
| BLE discovery | P1 | Nearby permitted advertisements + RSSI trends |
| Wi-Fi observations | P1 | Use only OS-permitted scans; clearly disclose limitations |
| 30 m radar canvas | P0 | Phone-local events are centered; no fake coordinates |
| Walking/path estimate | P1 | Experimental indoor path with visible uncertainty |
| Heat map | P1 | Paint only when location confidence meets threshold |
| Correlation timeline | P0 | Events from all sensors aligned and filterable |
| EDI | P0 | Every score decomposes into evidence |
| Session report | P0 | Local summary with events, charts and explanations |
| AI report | P1 | Structured, evidence-grounded explanation; local/rules fallback |
| AR overlays | P2 | After stable core; no arbitrary event pinning |
| Mesh mode | P2 | Post-MVP |
| UWB/LiDAR specialization | P2 | Platform/device-specific enhancement |




### 16.1 MVP acceptance scenario

User places phone on a table and calibrates for 30 seconds.

Moving a magnet/speaker near the phone creates a magnetic event with correct raw delta and no invented distance.

A clap creates an audio transient and appears on the same timeline.

Moving the phone marks motion contamination.

If the clap and magnetic event overlap, correlation UI shows co-occurrence but does not infer common cause without evidence.

User walks a short path; supported mapped readings create a heat trail with uncertainty.

Ending the session generates an evidence report and replay.



## 17. Roadmap



| Phase | Scope | Exit criterion |
| --- | --- | --- |
| 0 — Feasibility | Sensor spike app, sampling rates, permissions, battery tests | Capability matrix verified on representative phones |
| 1 — Core MVP | Magnetic + motion + audio + radar + timeline + report | End-to-end local session works reliably |
| 2 — Environmental layers | Light, pressure, BLE/Wi-Fi, richer heat maps | Multi-layer field visualization credible |
| 3 — Spatial | AR tracking, depth/LiDAR where supported | Measured geometry distinct from inferred regions |
| 4 — Mesh | Multi-phone synchronization and correlation | Cross-device event agreement demonstrated |
| 5 — Investigator AI | Evidence-grounded explanations and next-test suggestions | Hallucination/claim guardrails pass evaluation |
| 6 — Accessory ecosystem | Optional BLE/UWB external nodes | Calibrated external sensors integrate with same event model |




## 18. Visual Design System

Direction: NASA field instrument × restrained cyberpunk × documentary science. Dark does not mean horror.



| Element | Direction |
| --- | --- |
| Base | Near-black graphite, not pure black everywhere |
| Accent | Restrained violet/cyan for system/space; event families get distinct accessible encodings |
| Glass | Sparse translucent panels; avoid decorative blur over critical graphs |
| Typography | Technical but highly legible; tabular numerals for measurements |
| Motion | Slow radar sweep, field breathing, trace persistence, confidence fade |
| Haptics | Subtle event tick; stronger only for user-bookmarked thresholds |
| Sound | Optional minimal sonar-like UI feedback, off by default during audio investigation |
| Data density | Progressive disclosure: beautiful overview, rigorous evidence sheet underneath |




### 18.1 Event glyph grammar



| Event family | Glyph concept | Spatial rendering |
| --- | --- | --- |
| Magnetic | 3-axis / field-loop mark | Center pulse or estimated region |
| Audio | Wave/ripple | Timeline or region only if localized |
| RF | Concentric signal arcs | Constellation / probability field |
| Motion | Vector chevron | Phone/path anchored |
| Light/visual | Aperture/star | Camera/scene anchored when supported |
| Pressure | Contour ring | Phone-local |
| Correlation | Linked nodes | Cluster connecting underlying events |




## 19. Product Analytics

Capability distribution by device model, collected only with consent and privacy-preserving telemetry.

Session completion rate.

Calibration completion/skips.

Average sensors active per session.

Event-detail open rate.

Repeat-pass usage.

Report/replay completion.

False-positive/artifact feedback.

Battery/thermal termination rate.

Mesh pairing success in later phases.

Do not optimize for the number of ‘anomalies’ detected; that would create a perverse incentive to increase false positives.



## 20. Validation and QA Plan



### 20.1 Controlled tests



| Test | Setup | Expected result |
| --- | --- | --- |
| Magnet | Move known magnet at controlled distances | Magnitude changes; no fabricated location |
| Speaker/motor | Operate near phone | Repeatable magnetic/audio signatures |
| Clap | Impulse at known times | Audio event timing accuracy |
| Phone shake | Shake during magnetic/audio sampling | Motion contamination flag |
| Light switch | Controlled illumination change | Light/camera event |
| Elevator/stairs | Pressure + motion | Relative pressure/altitude trend if barometer exists |
| BLE beacon | Known transmitter | RSSI trend; noisy distance claims avoided |
| Repeated route | Two passes through same space | Difference/consistency view |
| Sensor absent | Low-end device | Feature disabled gracefully |
| Permission denied | Deny mic/camera/location | App remains usable with reduced capability |




### 20.2 Trust tests

No random event appears without a source measurement or explicit demo mode.

Every mapped point can explain why it has that geometry and confidence.

AI cannot claim ‘entity’, ‘spirit’, ‘ghost’, ‘haunting’ or danger as a factual detection.

Demo/simulation mode is visually watermarked SIMULATION.

Exports preserve raw units and distinguish raw, derived and AI-generated interpretation.



## 21. Key Risks and Mitigations



| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| 30 m expectation | Users may assume true radar ranging | Call it observation radius; confidence geometry everywhere |
| Indoor localization drift | Heat maps can look more precise than reality | Uncertainty halo; stop precise painting on tracking loss |
| RSSI multipath | Walls/reflections distort signal strength | Region estimates, repeated observations, no direct meter conversion |
| Sensor diversity | Different phones expose different hardware | Runtime capability graph + tiered experience |
| Battery/thermal load | Camera + audio + radio + motion is expensive | Adaptive sampling and power modes |
| Privacy | Mic/camera/radio/location are sensitive | Local-first, explicit permissions, visible indicators, retention controls |
| Novelty perception | Could be dismissed as fake ghost app | Raw data, reproducibility, scientific vocabulary, exports |
| Overclaim by AI | Destroys product credibility | Structured evidence input + forbidden claims + confidence schema |




## 22. Engineering Backlog / Epics



| Epic | Representative stories |
| --- | --- |
| E1 Capability | Enumerate sensors; permission state; quality badge; fallback graph |
| E2 Acquisition | Adapters; sampling lifecycle; buffering; monotonic timestamps |
| E3 Calibration | Baseline wizard; noise floor; device-motion artifact model |
| E4 Events | Feature extraction; anomaly segmentation; event persistence |
| E5 Spatial | Pose/path; coordinate system; uncertainty; field cells |
| E6 Visualization | Radar; heat; raw graphs; event sheet; replay |
| E7 Audio | Recorder; STFT; transient detector; playback markers |
| E8 Radio | BLE/Wi-Fi adapters; privacy hashing; constellation |
| E9 Reports | Timeline; correlation clusters; summaries; exports |
| E10 AI | Evidence schema; explanation prompts; safety/evaluation suite |
| E11 Mesh | Pairing; sync; node placement; cross-node matching |
| E12 QA | Device lab; synthetic fixtures; battery/thermal benchmarks |




## 23. Session Storage Model

Session: id, start/end, mode, radius, app/OS/device capability snapshot, permission snapshot.

Calibration: baseline statistics, noise floors, sensor quality.

Pose samples: timestamp, local xyz, quaternion/heading, uncertainty.

Sensor samples: timestamp, sensor type, raw values, units, quality.

Events: derived features, magnitude, confidence, spatial class, region.

Correlations: event IDs, temporal/spatial relation, score, explanation state.

Media: optional audio/video files plus timestamps and user consent state.

Annotations: bookmarks, notes, labels, user explanation.

Report: deterministic metrics plus optional AI narrative stored separately.



## 24. Launch Definition

A public beta is ready when a user can understand within one minute that SPECTRA measures environmental signals rather than ghosts; complete a stable 5-minute scan on a representative mid-range Android phone; reproduce controlled magnetic and acoustic events; inspect the evidence behind every alert; and finish with a coherent local report without network access.



### 24.1 Store positioning

CHITI SPECTRA — Environmental Intelligence Explorer

Turn your phone into a field laboratory. Visualize magnetic changes, sound, motion, light, pressure and nearby radio activity; map repeatable disturbances; replay investigations; and understand what your sensors actually observed.

Suggested category framing: Education / Tools / Exploration rather than supernatural detection.



## 25. Future Hardware Extension

The software event model should be designed so optional external nodes can later add measurements unavailable or unreliable on phones: calibrated temperature/humidity, dedicated magnetometers, air quality, vibration, UWB anchors or other lawful consumer sensors. External measurements must identify their hardware source and calibration status.

ESP32/BLE sensor node for environmental readings.

Fixed room nodes for repeatability and mesh localization.

UWB anchors for known geometry.

Accessory SDK with timestamp, unit, calibration and quality contracts.

No accessory should be marketed as a supernatural detector; it extends measurable physical channels.



## 26. Technical References

Android Developers — Sensors and locationhttps://developer.android.com/develop/sensors-and-location

Android Developers — BluetoothLeScannerhttps://developer.android.com/reference/android/bluetooth/le/BluetoothLeScanner

Apple Developer — Core Motionhttps://developer.apple.com/documentation/coremotion/

Apple Developer — Nearby Interactionhttps://developer.apple.com/documentation/NearbyInteraction

Apple Developer — ARKit sceneDepthhttps://developer.apple.com/documentation/arkit/arframe/scenedepth

Apple Developer — Reconstructed scene / LiDARhttps://developer.apple.com/documentation/arkit/visualizing-and-interacting-with-a-reconstructed-scene



## 27. Product North Star

SPECTRA should make uncertainty beautiful.

A user should leave a session knowing more about the physical environment than when they entered it — even when the final answer is simply: ‘something changed here, we measured it, and we do not yet know why.’

