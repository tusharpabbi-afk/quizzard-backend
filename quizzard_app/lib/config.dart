/// Central place for the backend base URL.
///
/// Production: the backend is deployed on Render (Node) backed by MongoDB Atlas,
/// reachable over HTTPS from anywhere — no LAN / same-Wi-Fi requirement.
///
/// Local dev alternative: run the backend on this Mac and use
///   'http://localhost:5050'        (web / macOS / iOS Simulator on this Mac), or
///   'http://YOUR-MAC-LAN-IP:5050' (physical iPhone on the same Wi-Fi;
///   find it with `ipconfig getifaddr en0`).
const String kApiBaseUrl = 'https://quizzard-backend-1.onrender.com';
