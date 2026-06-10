/// Central place for the backend base URL.
///
/// - Web / macOS / iOS Simulator on this Mac: 'http://localhost:5050' works.
/// - Physical iPhone (or any other device): set this to your Mac's LAN IP,
///   e.g. 'http://192.168.1.23:5050' (find it with `ipconfig getifaddr en0`),
///   and make sure the backend is running and the Mac firewall allows port 5050.
/// Currently set to this Mac's LAN IP so the iPhone (same Wi-Fi) can reach the backend.
/// The Mac's own browser can use this too. If the Mac's IP changes, update it
/// (run `ipconfig getifaddr en0`), or switch back to 'http://localhost:5050' for web-only.
const String kApiBaseUrl = 'http://192.168.1.33:5050';
