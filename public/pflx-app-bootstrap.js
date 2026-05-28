/*!
 * PFLX Sub-App Bootstrap
 * ----------------------
 * Drop-in script for every PFLX sub-app (X-Coin, Battle Arena, DarkCampus,
 * Portfolio, AI Center, Mission Control iframe, etc.) to participate in the
 * platform-wide tier model and cohort access gating.
 *
 * Usage:
 *   1. In the sub-app's HTML <head>, declare which app this is:
 *        <script>window.PFLX_APP_KEY = 'xcoin';</script>
 *   2. Include this script:
 *        <script src="https://pflx-pathway-portal.vercel.app/pflx-app-bootstrap.js"></script>
 *
 * What it does:
 *   - Reads tier + allowedApps + cohort from the SSO URL params set by
 *     buildAppURL in preview.html.
 *   - Persists them in localStorage so subsequent loads work offline.
 *   - Exposes window.PFLX_BOOT.tier, .allowedApps, .cohort, .role.
 *   - If PFLX_APP_KEY is NOT in allowedApps, replaces the whole page with a
 *     full-screen ACCESS DENIED panel — exact spec from the user:
 *         headline: "ACCESS DENIED"
 *         subtext: "contact your Instructional Coach, Cohort Lead, or
 *                   PFLX Host for support!"
 *   - Listens for pflx_access_change postMessage from the parent so a
 *     host toggling access off mid-session boots the player immediately.
 *   - Fires window event 'pflx-boot-ready' when boot is complete so the
 *     sub-app can read the resolved values via the event detail.
 */
(function () {
  if (window.PFLX_BOOT && window.PFLX_BOOT._loaded) return;

  var APP_KEY = (window.PFLX_APP_KEY || '').toLowerCase();
  var ALLOWED_TIERS = ['starter', 'novice', 'pro'];

  function readParams() {
    try {
      var qp = new URLSearchParams(window.location.search);
      return {
        tier:        qp.get('tier'),
        allowedApps: qp.get('allowedApps'),
        cohort:      qp.get('cohort'),
        role:        qp.get('role')
      };
    } catch (e) { return {}; }
  }

  function readStored() {
    var out = {};
    try {
      out.tier        = localStorage.getItem('pflx_player_tier');
      out.allowedApps = localStorage.getItem('pflx_allowed_apps');
      out.cohort      = localStorage.getItem('pflx_player_cohort');
      out.role        = localStorage.getItem('pflx_player_role');
    } catch (e) {}
    return out;
  }

  function persist(state) {
    try {
      if (state.tier) localStorage.setItem('pflx_player_tier', state.tier);
      if (state.allowedApps) localStorage.setItem('pflx_allowed_apps', state.allowedApps);
      if (state.cohort) localStorage.setItem('pflx_player_cohort', state.cohort);
      if (state.role) localStorage.setItem('pflx_player_role', state.role);
    } catch (e) {}
  }

  // Resolve: URL wins, then localStorage, then sensible defaults.
  var params = readParams();
  var stored = readStored();
  var state = {
    tier:        params.tier || stored.tier || 'novice',
    allowedApps: params.allowedApps || stored.allowedApps || '',
    cohort:      params.cohort || stored.cohort || '',
    role:        params.role || stored.role || ''
  };
  if (ALLOWED_TIERS.indexOf(state.tier) === -1) state.tier = 'novice';

  // Hosts always pass — never block staff role.
  var isHost = /admin|host|teacher|instructor|master/i.test(state.role || '');

  // Persist resolved values for next boot.
  persist(state);

  var allowedList = state.allowedApps ? state.allowedApps.split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean) : null;

  function blockAccess(reasonLabel) {
    var label = reasonLabel || APP_KEY || 'this app';
    var existing = document.getElementById('pflx-app-bootstrap-denied');
    if (existing) return;
    var overlay = document.createElement('div');
    overlay.id = 'pflx-app-bootstrap-denied';
    overlay.style.cssText = [
      'position:fixed','inset:0','z-index:2147483647',
      'background:linear-gradient(180deg,#070710,#0a0a1a)',
      'display:flex','align-items:center','justify-content:center',
      'font-family:"Jura",sans-serif','color:#e0e6ff','padding:24px'
    ].join(';');
    overlay.innerHTML =
      '<div style="background:linear-gradient(180deg,#12121c,#0a0a14);border:1px solid rgba(239,68,68,0.45);border-radius:18px;padding:36px 30px;max-width:480px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,0.65), 0 0 60px rgba(239,68,68,0.15);">' +
        '<div style="font-size:54px;line-height:1;margin-bottom:10px;">🔒</div>' +
        '<h2 style="color:#ef4444;margin:0 0 8px;font-size:24px;font-family:\'Orbitron\',sans-serif;letter-spacing:0.08em;text-shadow:0 0 18px rgba(239,68,68,0.5);">ACCESS DENIED</h2>' +
        '<p style="color:rgba(255,255,255,0.78);font-size:14px;line-height:1.65;margin:0 0 8px;font-weight:500;">contact your Instructional Coach, Cohort Lead, or PFLX Host for support!</p>' +
        '<div style="margin:18px 0 16px;padding:10px 14px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.18);border-radius:10px;font-size:11px;color:rgba(255,255,255,0.55);font-family:monospace;letter-spacing:0.06em;">' +
          '<div style="margin-bottom:4px;color:rgba(239,68,68,0.85);font-weight:700;">RESTRICTED APP</div>' +
          String(label).replace(/[<>&]/g, '') +
        '</div>' +
        '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 12px;font-size:10px;color:rgba(255,255,255,0.4);font-family:monospace;letter-spacing:0.05em;">' +
          'Cohort: ' + String(state.cohort || 'unknown').replace(/[<>&]/g, '') +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  // Initial gate — only run if PFLX_APP_KEY is set, an allowedApps list was
  // passed via SSO, and the player is not staff. Otherwise we silently
  // continue (sub-app is responsible for handling no-SSO entry).
  if (APP_KEY && allowedList && !isHost) {
    if (allowedList.indexOf(APP_KEY) === -1) {
      // Defer block until DOM is ready so the overlay can attach to body.
      if (document.body) blockAccess(APP_KEY);
      else document.addEventListener('DOMContentLoaded', function () { blockAccess(APP_KEY); });
    }
  }

  // Live revocation — parent posts pflx_access_change when a host flips a
  // toggle. If THIS app gets revoked, block immediately. If it gets granted
  // back, remove the overlay if it's currently showing.
  window.addEventListener('message', function (ev) {
    try {
      var msg = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
      if (!msg || msg.type !== 'pflx_access_change') return;
      if (!APP_KEY || isHost) return;
      if (msg.app === APP_KEY) {
        if (msg.allowed) {
          var existing = document.getElementById('pflx-app-bootstrap-denied');
          if (existing) existing.remove();
        } else {
          blockAccess(APP_KEY);
        }
      }
    } catch (e) {}
  });

  // Public boot object
  window.PFLX_BOOT = {
    _loaded: true,
    tier: state.tier,
    allowedApps: allowedList,
    cohort: state.cohort,
    role: state.role,
    isHost: isHost,
    appKey: APP_KEY,
    canAccess: function (appKey) {
      if (isHost) return true;
      if (!allowedList) return true;
      return allowedList.indexOf((appKey || '').toLowerCase()) !== -1;
    },
    blockAccess: blockAccess
  };

  // Dispatch ready event so apps can read PFLX_BOOT.* synchronously.
  try {
    var evt;
    try { evt = new CustomEvent('pflx-boot-ready', { detail: window.PFLX_BOOT }); }
    catch (e) { evt = document.createEvent('CustomEvent'); evt.initCustomEvent('pflx-boot-ready', false, false, window.PFLX_BOOT); }
    window.dispatchEvent(evt);
  } catch (e) {}
})();
