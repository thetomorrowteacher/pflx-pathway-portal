/* ═══════════════════════════════════════════════════════════════════
   PFLX Core Pathways — PORTAL VIEW
   Toggle between the immersive (game) view and a course dashboard.
   • pathway.html  → course dashboard: overview, learning map (stages,
     branches, prerequisites) and a course catalog.
   • preview.html  → pathway catalog (the title screen as a portal).
   READ-ONLY over the existing data: it never saves pathway edits.
   Courses open through the existing briefing (showDetail), so entry
   fees, entry gates, enrolment pings and the course launcher are
   exactly the same as in the immersive view.
   Choice persists in localStorage 'pflx_cp_view' ('portal'|'immersive');
   ?view=portal / ?view=immersive overrides it for that visit.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var KEY = 'pflx_cp_view';
  var qs = new URLSearchParams(location.search);
  var IS_PATH = typeof PATHWAYS !== 'undefined' && typeof pathway !== 'undefined' && typeof showDetail === 'function';
  var IS_CAT = !IS_PATH && !!document.getElementById('pathwayMap');
  if (!IS_PATH && !IS_CAT) return;

  function getMode() {
    var q = qs.get('view');
    if (q === 'portal' || q === 'immersive') return q;
    try { return localStorage.getItem(KEY) === 'portal' ? 'portal' : 'immersive'; } catch (e) { return 'immersive'; }
  }
  function setStored(m) { try { localStorage.setItem(KEY, m); } catch (e) {} }

  // fonts (Exo 2 headings, Inter body)
  if (!document.querySelector('link[data-cpx-font]')) {
    var lf = document.createElement('link'); lf.rel = 'stylesheet'; lf.setAttribute('data-cpx-font', '1');
    lf.href = 'https://fonts.googleapis.com/css2?family=Exo+2:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(lf);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  var ICON = {
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    orbit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-25 12 12)"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7 7l4 9M17 7l-4 9M7.2 6h9.6"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>'
  };
  var ST_LABEL = { completed: 'Completed', in_progress: 'In progress', unlocked: 'Available', locked: 'Locked', soon: 'Coming soon' };
  var TYPE_LABEL = { course: 'Course', project: 'Project', program: 'Program', quest: 'Quest', challenge: 'Challenge' };
  var STAGE_NAMES = ['Foundations', 'Core Skills', 'Applied Practice', 'Advanced', 'Specialisation', 'Mastery'];

  // ── learner (read from the existing player card / session; nothing is written) ──
  function learner() {
    var u = {};
    try { u = JSON.parse(localStorage.getItem('pflx_pathway_user') || localStorage.getItem('pflx_user') || localStorage.getItem('pflxUser') || '{}') || {}; } catch (e) {}
    var t = function (id) { var el = $(id); return el ? (el.textContent || '').trim() : ''; };
    var brand = t('pcBrand') || u.brand || u.name || 'Guest';
    var avImg = (function () { var a = $('pcAvatar'); var i = a && a.querySelector('img'); return i ? i.src : (u.avatar || u.image || ''); })();
    return { brand: brand, rank: t('pcRankName') || 'Player', xc: t('pcXC') || (u.xc != null ? String(u.xc) : '0'), level: t('pcLevel') || '1', av: avImg };
  }

  // ── shell ──
  var root = document.createElement('div'); root.id = 'cpx'; root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Pathway portal');
  document.body.appendChild(root);
  var btn = document.createElement('button'); btn.id = 'cpxViewBtn'; btn.type = 'button';
  btn.innerHTML = ICON.grid + '<span>Portal view</span>'; btn.title = 'Switch to the Portal (course dashboard) view';
  btn.onclick = function () { setMode('portal'); };
  document.body.appendChild(btn);

  function headHTML(title, sub, icon) {
    var L = learner();
    var ini = (L.brand || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?';
    return '<header class="cpx-head">' +
      '<a class="cpx-back" href="' + (IS_PATH ? 'preview.html' : 'javascript:void(0)') + '"' + (IS_CAT ? ' style="display:none"' : '') + '>' + ICON.back + 'All pathways</a>' +
      '<div class="cpx-brand">' + (icon ? '<img src="' + esc(icon) + '" alt="">' : '') + '<div><h1>' + esc(title) + '</h1><div class="cpx-cap">' + esc(sub) + '</div></div></div>' +
      '<div class="cpx-spacer"></div>' +
      '<div class="cpx-switch" role="group" aria-label="View">' +
        '<button type="button" data-v="immersive">' + ICON.orbit + 'Immersive</button>' +
        '<button type="button" data-v="portal" class="on" aria-pressed="true">' + ICON.grid + 'Portal</button></div>' +
      '<div class="cpx-who"><div class="av">' + (L.av ? '<img src="' + esc(L.av) + '" alt="">' : esc(ini)) + '</div><div><b>' + esc(L.brand) + '</b><small>' + esc(L.rank) + ' · ' + esc(L.xc) + ' XC</small></div></div>' +
    '</header>';
  }
  function wireHead() {
    root.querySelectorAll('.cpx-switch button').forEach(function (b) { b.onclick = function () { setMode(b.dataset.v); }; });
  }

  // ═════════════════ PATHWAY PAGE: course dashboard ═════════════════
  function stOf(n) { return n.comingSoon ? 'soon' : (ST_LABEL[n.status] ? n.status : 'locked'); }
  function visibleNodes() {
    // same rule as the map: players only see nodes that are connected (or pitched)
    var all = (pathway.nodes || []).slice();
    if (typeof editMode !== 'undefined' && editMode) return all;
    var con = {};
    all.forEach(function (n) { if (n.requires && n.requires.length) { con[n.id] = 1; n.requires.forEach(function (r) { con[r] = 1; }); } });
    return all.filter(function (n) { return con[n.id] || n.isPitchedNode === true; });
  }
  function progressOf(n) { try { return typeof pflxNodePlayerProgress === 'function' ? pflxNodePlayerProgress(n.id) : null; } catch (e) { return null; } }
  function icoHTML(n) {
    var st = stOf(n);
    var inner = n.image ? '<img src="' + esc(n.image) + '" alt="">' : esc(n.emoji || '◆');
    return '<div class="cpx-ico">' + inner + (st === 'completed' ? '<span class="tick">✓</span>' : '') + '</div>';
  }
  function actionFor(n) {
    var st = stOf(n);
    if (st === 'soon') return { t: 'Coming soon', dis: true };
    if (st === 'locked') return { t: 'Details', ghost: true };
    if (st === 'completed') return { t: 'Review', ghost: true };
    if (st === 'in_progress') return { t: 'Continue' };
    return { t: 'Start' };
  }
  function open(id) {
    var n = (pathway.nodes || []).filter(function (x) { return x.id === id; })[0];
    if (n) { try { showDetail(n); } catch (e) { console.error('[cpx] showDetail', e); } }
  }

  // stages = longest prerequisite chain (so branches fork into the next column)
  function layer(nodes) {
    var by = {}; nodes.forEach(function (n) { by[n.id] = n; });
    var depth = {}, seen = {};
    function d(n) {
      if (depth[n.id] != null) return depth[n.id];
      if (seen[n.id]) return 0; seen[n.id] = 1; // cycle guard
      var reqs = (n.requires || []).filter(function (r) { return by[r]; });
      var v = reqs.length ? 1 + Math.max.apply(null, reqs.map(function (r) { return d(by[r]); })) : 0;
      depth[n.id] = v; return v;
    }
    nodes.forEach(d);
    var cols = [];
    nodes.forEach(function (n) { (cols[depth[n.id]] = cols[depth[n.id]] || []).push(n); });
    // order: barycentre of parents' rows, then the author's vertical position
    var row = {};
    cols.forEach(function (col, ci) {
      col.forEach(function (n) {
        var ps = (n.requires || []).filter(function (r) { return row[r] != null; });
        n.__bc = ps.length ? ps.reduce(function (s, r) { return s + row[r]; }, 0) / ps.length : (100 - (n.y || 50)) / 10;
      });
      col.sort(function (a, b) { return a.__bc - b.__bc || (b.y || 0) - (a.y || 0) || (a.x || 0) - (b.x || 0); });
      col.forEach(function (n, i) { row[n.id] = i; });
    });
    nodes.forEach(function (n) { delete n.__bc; });
    return { cols: cols.filter(Boolean), by: by };
  }

  function renderPath() {
    var nodes = visibleNodes();
    var counts = { completed: 0, in_progress: 0, unlocked: 0, locked: 0, soon: 0 };
    nodes.forEach(function (n) { counts[stOf(n)]++; });
    var active = nodes.filter(function (n) { return stOf(n) !== 'soon'; });
    var pct = active.length ? Math.round(100 * counts.completed / active.length) : 0;
    var next = nodes.filter(function (n) { return stOf(n) === 'in_progress'; })[0] || nodes.filter(function (n) { return stOf(n) === 'unlocked'; })[0];
    var L = learner();
    var circ = 2 * Math.PI * 24;

    root.className = '';
    root.innerHTML = headHTML(pathway.title || 'Pathway', 'Core Pathway · Course dashboard', pathway.icon) +
      '<aside class="cpx-side"><div class="cpx-cap">Pathway</div>' +
        '<button class="cpx-nav on" data-go="cpxOverview">' + ICON.home + 'Overview</button>' +
        '<button class="cpx-nav" data-go="cpxMapSec">' + ICON.map + 'Learning map<span class="n">' + nodes.length + '</span></button>' +
        '<button class="cpx-nav" data-go="cpxCatSec">' + ICON.list + 'Course catalog<span class="n">' + active.length + '</span></button>' +
        '<div class="cpx-ring"><svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="24" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="5"/><circle cx="29" cy="29" r="24" fill="none" stroke="var(--cpx-acc)" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + (circ * (1 - pct / 100)).toFixed(1) + '"/></svg><div><b>' + pct + '%</b><small>' + counts.completed + ' of ' + active.length + ' complete</small></div></div>' +
        '<div class="cpx-side-foot">Portal view shows the same pathway, progress and requirements as the immersive map. Switch any time from the top bar.</div>' +
      '</aside>' +
      '<main class="cpx-main" id="cpxMain">' +
        // overview
        '<section class="cpx-sec" id="cpxOverview"><div class="cpx-hello">' +
          '<div class="cpx-card cpx-welcome"><div class="cpx-cap">Welcome back</div><h2>' + esc(L.brand) + '</h2><p>' + esc(pathway.subtitle || '') + '. Follow the learning map from foundations to advanced work; each course unlocks the next.</p>' +
            '<div style="margin-top:18px;max-width:440px"><div class="cpx-cap" style="display:flex;justify-content:space-between"><span>Pathway progress</span><span>' + pct + '%</span></div><div class="cpx-bar" style="margin-top:8px"><u style="width:' + pct + '%"></u></div></div></div>' +
          '<div class="cpx-card cpx-next">' + (next ?
            '<div class="cpx-cap">' + (stOf(next) === 'in_progress' ? 'Continue where you left off' : 'Recommended next') + '</div>' +
            '<div class="row" data-st="' + stOf(next) + '">' + icoHTML(next) + '<div><div class="cpx-type">' + esc(TYPE_LABEL[next.nodeType] || 'Course') + '</div><h3>' + esc(next.title) + '</h3></div></div>' +
            '<p>' + esc(next.desc || '') + '</p><div><button class="cpx-btn" data-open="' + esc(next.id) + '">' + (stOf(next) === 'in_progress' ? 'Continue' : 'Start') + ' →</button></div>'
            : '<div class="cpx-cap">Up next</div><h3>' + (counts.completed && counts.completed === active.length ? 'Pathway complete' : 'Nothing open yet') + '</h3><p>' + (counts.completed && counts.completed === active.length ? 'Every course on this pathway is complete.' : 'Your host opens courses as the season moves on. Locked courses show what they need below.') + '</p>') +
          '</div></div>' +
          '<div class="cpx-stats">' +
            [['Courses', active.length, 'var(--cpx-acc)'], ['Completed', counts.completed, 'var(--cpx-ok)'], ['In progress', counts.in_progress, 'var(--cpx-prog)'], ['Available', counts.unlocked, 'var(--cpx-acc)'], ['Locked', counts.locked, '#64748b']].map(function (s) {
              return '<div class="cpx-card cpx-stat"><div class="cpx-cap">' + s[0] + '</div><b>' + s[1] + '</b><i style="background:' + s[2] + '"></i></div>';
            }).join('') +
          '</div></section>' +
        // learning map
        '<section class="cpx-sec" id="cpxMapSec"><div class="cpx-sec-h"><div><h2>Learning map</h2><p>Stages run left to right. Lines show prerequisites; branches split where one course opens several.</p></div>' +
          '<div class="cpx-legend"><span><i style="border-color:var(--cpx-ok)"></i>Completed</span><span><i style="border-top-style:dotted;border-color:var(--cpx-acc)"></i>Open</span><span><i style="border-top-style:dotted;border-color:#475569"></i>Locked</span></div></div>' +
          '<div class="cpx-card cpx-map-wrap"><div class="cpx-map" id="cpxMap"></div></div></section>' +
        // catalog
        '<section class="cpx-sec" id="cpxCatSec"><div class="cpx-sec-h"><div><h2>Course catalog</h2><p>Every course on this pathway, its prerequisites and rewards.</p></div>' +
          '<div class="cpx-tools">' + ['all', 'unlocked', 'in_progress', 'completed', 'locked'].map(function (f) { return '<button class="cpx-filter' + (f === catFilter ? ' on' : '') + '" data-f="' + f + '">' + (f === 'all' ? 'All' : ST_LABEL[f]) + '</button>'; }).join('') +
          '<input class="cpx-search" id="cpxQ" type="search" placeholder="Search courses" value="' + esc(catQuery) + '" aria-label="Search courses"></div></div>' +
          '<div class="cpx-card cpx-table" id="cpxTable"></div></section>' +
      '</main>';

    wireHead();
    root.querySelectorAll('.cpx-nav').forEach(function (b) { b.onclick = function () { root.querySelectorAll('.cpx-nav').forEach(function (x) { x.classList.toggle('on', x === b); }); var t = $(b.dataset.go); if (t) t.scrollIntoView({ block: 'start' }); }; });
    root.querySelectorAll('.cpx-filter').forEach(function (b) { b.onclick = function () { catFilter = b.dataset.f; root.querySelectorAll('.cpx-filter').forEach(function (x) { x.classList.toggle('on', x === b); }); renderTable(nodes); }; });
    $('cpxQ').oninput = function () { catQuery = this.value; renderTable(nodes); };
    root.addEventListener('click', onOpenClick);
    renderMap(nodes);
    renderTable(nodes);
    var main = $('cpxMain');
    main.onscroll = function () { var ids = ['cpxOverview', 'cpxMapSec', 'cpxCatSec'], cur = ids[0]; ids.forEach(function (id) { var el = $(id); if (el && el.offsetTop - 90 <= main.scrollTop) cur = id; }); root.querySelectorAll('.cpx-nav').forEach(function (x) { x.classList.toggle('on', x.dataset.go === cur); }); };
    if (scrollKeep) main.scrollTop = scrollKeep;
  }
  var catFilter = 'all', catQuery = '', scrollKeep = 0;
  function onOpenClick(e) { var t = e.target.closest('[data-open]'); if (t && root.contains(t)) { e.preventDefault(); open(t.getAttribute('data-open')); } }

  function renderMap(nodes) {
    var host = $('cpxMap'); if (!host) return;
    if (!nodes.length) { host.innerHTML = '<div class="cpx-empty">No courses are published on this pathway yet.</div>'; return; }
    var lay = layer(nodes), H = 68, GX = 44, GY = 18, TOP = 46, nC = lay.cols.length;
    var avail = Math.max(320, (host.parentElement ? host.parentElement.clientWidth : 1100) - 42);
    var W = Math.max(168, Math.min(250, Math.floor((avail - (nC - 1) * GX) / nC)));
    var pos = {}, maxRows = 0;
    lay.cols.forEach(function (col, ci) { maxRows = Math.max(maxRows, col.length); });
    lay.cols.forEach(function (col, ci) {
      var off = (maxRows - col.length) * (H + GY) / 2; // centre each stage vertically
      col.forEach(function (n, ri) { pos[n.id] = { x: ci * (W + GX), y: TOP + off + ri * (H + GY) }; });
    });
    var w = lay.cols.length * (W + GX) - GX, h = TOP + maxRows * (H + GY) - GY;
    var html = '<svg class="cpx-links" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">';
    nodes.forEach(function (n) {
      (n.requires || []).forEach(function (r) {
        if (!pos[r] || !pos[n.id]) return;
        var a = pos[r], b = pos[n.id], x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2, mx = (x1 + x2) / 2;
        var src = lay.by[r], cls = stOf(src) === 'completed' && stOf(n) !== 'locked' && stOf(n) !== 'soon' ? 'lk-done' : (stOf(n) === 'locked' || stOf(n) === 'soon' ? 'lk-lock' : 'lk-open');
        var col = cls === 'lk-done' ? 'var(--cpx-ok)' : cls === 'lk-open' ? 'var(--cpx-acc)' : '#475569';
        html += '<path class="' + cls + '" data-a="' + esc(r) + '" data-b="' + esc(n.id) + '" d="M' + x1 + ',' + y1 + ' C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2 + '"/>' +
          '<circle cx="' + x1 + '" cy="' + y1 + '" r="2.6" fill="' + col + '"/><circle cx="' + x2 + '" cy="' + y2 + '" r="2.6" fill="' + col + '"/>';
      });
    });
    html += '</svg>';
    lay.cols.forEach(function (col, ci) {
      html += '<div class="cpx-stage" style="left:' + ci * (W + GX) + 'px;width:' + W + 'px"><div class="cpx-cap">Stage ' + (ci + 1) + '</div><b>' + esc(STAGE_NAMES[ci] || 'Stage ' + (ci + 1)) + '</b></div>';
    });
    nodes.forEach(function (n) {
      var p = pos[n.id], st = stOf(n);
      var reqDone = (n.requires || []).filter(function (r) { return lay.by[r] && stOf(lay.by[r]) === 'completed'; }).length, reqN = (n.requires || []).filter(function (r) { return lay.by[r]; }).length;
      var sub = '<em>' + ST_LABEL[st] + '</em> · ' + esc(TYPE_LABEL[n.nodeType] || 'Course') + (reqN && st === 'locked' ? ' · ' + reqDone + '/' + reqN + ' prereqs' : '');
      html += '<div class="cpx-mnode" tabindex="0" role="button" data-open="' + esc(n.id) + '" data-id="' + esc(n.id) + '" data-st="' + st + '" style="left:' + p.x + 'px;top:' + p.y + 'px;width:' + W + 'px;height:' + H + 'px" aria-label="' + esc(n.title + ', ' + ST_LABEL[st]) + '">' +
        icoHTML(n) + '<div class="t"><b>' + esc(n.title) + '</b><small>' + sub + '</small></div></div>';
    });
    host.style.width = w + 'px'; host.style.height = h + 'px';
    host.innerHTML = html;
    // highlight a course's prerequisite chain and what it unlocks
    var kids = {}; nodes.forEach(function (n) { (n.requires || []).forEach(function (r) { (kids[r] = kids[r] || []).push(n.id); }); });
    function chain(id) {
      var hot = {}; hot[id] = 1;
      (function up(i) { (lay.by[i] && lay.by[i].requires || []).forEach(function (r) { if (!hot[r] && lay.by[r]) { hot[r] = 1; up(r); } }); })(id);
      (function down(i) { (kids[i] || []).forEach(function (k) { if (!hot[k]) { hot[k] = 1; down(k); } }); })(id);
      return hot;
    }
    host.querySelectorAll('.cpx-mnode').forEach(function (el) {
      el.addEventListener('mouseenter', function () { var hot = chain(el.dataset.id); host.classList.add('hl'); host.querySelectorAll('.cpx-mnode').forEach(function (m) { m.classList.toggle('hot', !!hot[m.dataset.id]); }); host.querySelectorAll('path').forEach(function (p) { p.classList.toggle('hot', !!(hot[p.dataset.a] && hot[p.dataset.b])); }); });
      el.addEventListener('mouseleave', function () { host.classList.remove('hl'); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el.dataset.id); } });
    });
  }

  function renderTable(nodes) {
    var host = $('cpxTable'); if (!host) return;
    var by = {}; nodes.forEach(function (n) { by[n.id] = n; });
    var q = catQuery.trim().toLowerCase();
    var list = nodes.filter(function (n) { return stOf(n) !== 'soon' || catFilter === 'all'; }).filter(function (n) {
      var st = stOf(n);
      if (catFilter !== 'all' && st !== catFilter) return false;
      return !q || (n.title + ' ' + (n.desc || '')).toLowerCase().indexOf(q) >= 0;
    });
    var order = { in_progress: 0, unlocked: 1, completed: 2, locked: 3, soon: 4 };
    var lay = layer(nodes), stage = {}; lay.cols.forEach(function (c, i) { c.forEach(function (n) { stage[n.id] = i; }); });
    list.sort(function (a, b) { return (stage[a.id] - stage[b.id]) || (order[stOf(a)] - order[stOf(b)]) || String(a.title).localeCompare(b.title); });
    var html = '<div class="cpx-row hd"><div class="cpx-cap">Course</div><div class="cpx-cap">Prerequisites</div><div class="cpx-cap">Reward</div><div class="cpx-cap">Status</div><div class="cpx-cap cpx-pg">Progress</div><div></div></div>';
    if (!list.length) html += '<div class="cpx-empty">No courses match.</div>';
    list.forEach(function (n) {
      var st = stOf(n), a = actionFor(n), pg = progressOf(n);
      var reqs = (n.requires || []).filter(function (r) { return by[r]; });
      var reqHTML = reqs.length ? reqs.map(function (r) { var ok = stOf(by[r]) === 'completed'; return '<span class="' + (ok ? 'ok' : '') + '" title="' + esc(by[r].title) + '">' + (ok ? '✓ ' : '○ ') + esc(by[r].title) + '</span>'; }).join('') : '<span class="none">None</span>';
      var xc = n.isPitchedNode ? (n.xcValue || 0) : (n.xcReward || 0), fee = n.isPitchedNode ? (n.entryFeeXC || 0) : (n.xcCost || 0);
      var pgv = st === 'completed' ? 100 : (pg != null ? pg : (st === 'in_progress' ? null : (st === 'locked' ? -1 : 0)));
      html += '<div class="cpx-row" data-st="' + st + '">' +
        '<div class="cpx-course">' + icoHTML(n) + '<div style="min-width:0"><div class="cpx-type">Stage ' + (stage[n.id] + 1) + ' · ' + esc(TYPE_LABEL[n.nodeType] || 'Course') + '</div><b>' + esc(n.title) + '</b><p>' + esc(n.desc || '') + '</p></div></div>' +
        '<div class="cpx-req">' + reqHTML + '</div>' +
        '<div class="cpx-xc">' + (xc ? xc + ' <small>XC</small>' : '<small>—</small>') + (fee ? '<div><small>Fee ' + fee + ' XC</small></div>' : '') + '</div>' +
        '<div><span class="cpx-chip ' + st + '">' + ST_LABEL[st] + '</span></div>' +
        '<div class="cpx-pg">' + (pgv === -1 ? '<span style="color:var(--cpx-dim)">Not started</span>' : (pgv == null ? 'In progress' : pgv + '%') + '<div class="cpx-bar"><u style="width:' + (pgv == null ? 30 : pgv) + '%"></u></div>') + '</div>' +
        '<div style="text-align:right"><button class="cpx-btn' + (a.ghost ? ' ghost' : '') + '"' + (a.dis ? ' disabled' : ' data-open="' + esc(n.id) + '"') + '>' + a.t + '</button></div>' +
      '</div>';
    });
    host.innerHTML = html;
  }

  // ═════════════════ TITLE SCREEN: pathway catalog ═════════════════
  var PW_DESC = {
    'professional-entrepreneur': 'Branding, pitching, team building and a professional portfolio.',
    'content-creator': 'Media production, storyboarding, scripting and capture.',
    'digital-artist': 'Graphic design, illustration, animation and UI/UX.',
    '3d-modeler': 'Modelling, environments and digital prototypes.',
    'cs-ai-specialist': 'Programming, AI tools and system design.',
    'sound-designer': 'Audio production, sound effects and music for media.',
    'game-designer': 'Game mechanics, level design and interactive experiences.',
    'industrial-designer': 'Product design, fabrication and prototyping.'
  };
  function renderCat() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('#pathwayMap .pathway-node')).map(function (el) {
      var img = el.querySelector('.node-icon-img'), t = el.querySelector('.node-title');
      var title = t ? t.textContent.trim() : 'Pathway';
      var slug = title.toLowerCase().replace(/\//g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return { el: el, title: title, icon: img ? img.getAttribute('src') : '', accent: el.style.getPropertyValue('--accent') || '#00d4ff', slug: slug };
    });
    root.className = 'cpx-cat';
    root.innerHTML = headHTML('Core Pathway Development', 'Choose your major and minor pathways', 'public/icons/core-pathway-logo.png') +
      '<main class="cpx-main"><section class="cpx-sec"><div class="cpx-sec-h"><div><h2>Pathways</h2><p>Each pathway is a sequence of courses, projects and challenges with prerequisites. Open one to see its course dashboard.</p></div></div>' +
      '<div class="cpx-grid">' + cards.map(function (c, i) {
        return '<div class="cpx-card cpx-pw" tabindex="0" role="button" data-i="' + i + '" style="--pw:' + esc(c.accent) + '"><div class="top"><div class="cpx-ico">' + (c.icon ? '<img src="' + esc(c.icon) + '" alt="">' : '◆') + '</div><div><div class="cpx-type">Core pathway</div><h3>' + esc(c.title) + '</h3></div></div>' +
          '<p>' + esc(PW_DESC[c.slug] || 'A custom pathway created by your host.') + '</p><div class="foot"><span>Course dashboard</span><span>Open →</span></div></div>';
      }).join('') + '</div></section></main>';
    wireHead();
    root.querySelectorAll('.cpx-pw').forEach(function (el) {
      var go = function () { var c = cards[+el.dataset.i]; if (c && c.el) c.el.click(); };
      el.onclick = go; el.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    });
  }

  // ═════════════════ mode switching ═════════════════
  var on = false;
  function render() { if (!on) return; if (IS_PATH) { var m = $('cpxMain'); scrollKeep = m ? m.scrollTop : 0; renderPath(); } else renderCat(); }
  function setMode(m, quiet) {
    on = m === 'portal';
    if (!quiet) setStored(m);
    document.body.classList.toggle('cpx-on', on);
    window.pflxGLPaused = on; // the open-space renderer idles while the portal is up
    if (on) {
      if (IS_PATH) {
        try { if (typeof pflxCamera !== 'undefined' && pflxCamera.mode !== 'birdseye' && typeof pflxSetCamera === 'function') pflxSetCamera('birdseye'); } catch (e) {}
        try { if (typeof pflxTour !== 'undefined' && document.getElementById('pflxTourTip')) pflxTour.end(); } catch (e) {}
      }
      render();
    } else {
      root.innerHTML = '';
      try { if (IS_PATH && typeof applyTransform === 'function') applyTransform(); } catch (e) {}
    }
    try { window.dispatchEvent(new CustomEvent('pflx-cp-view', { detail: { mode: m } })); } catch (e) {}
  }

  // keep the dashboard in sync with every map rebuild (load, realtime, edits)
  if (IS_PATH && typeof rebuildNodes === 'function') {
    var _rb = rebuildNodes;
    rebuildNodes = function () { var r = _rb.apply(this, arguments); try { render(); } catch (e) { console.error('[cpx]', e); } return r; };
    // the player card fills in asynchronously; refresh the header once it has
    var tries = 0, iv = setInterval(function () { tries++; if (on && $('pcBrand') && $('pcBrand').textContent.trim()) { render(); clearInterval(iv); } if (tries > 20) clearInterval(iv); }, 600);
  }
  document.addEventListener('keydown', function (e) {
    if (!on) return;
    // while the portal is up, map/ship hotkeys must not steer the hidden game
    var tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if ($('detailOverlay') && getComputedStyle($('detailOverlay')).display !== 'none') return;
    if (/^(w|a|s|d|q|e|arrowup|arrowdown|arrowleft|arrowright| |\+|-|=)$/i.test(e.key)) e.stopPropagation();
  }, true);

  var rzT; window.addEventListener('resize', function () { if (!on || !IS_PATH) return; clearTimeout(rzT); rzT = setTimeout(render, 180); });
  window.pflxCpView = { set: setMode, get: function () { return on ? 'portal' : 'immersive'; }, render: render };
  setMode(getMode(), !qs.get('view'));
})();
