/**
 * PFLX Pathway AI Assistant — Gemini 2.0 Flash powered chat widget
 * Automatically detects Host vs Player from localStorage and adapts.
 * Include at bottom of any Portal HTML page: <script src="pflx-ai-chat.js"></script>
 */
(function () {
  "use strict";

  const GEMINI_API = "https://pflx-xcoin-app.vercel.app/api/gemini";

  // ─── Detect user role ─────────────────────────────────────────────────
  function getUser() {
    try {
      const raw = localStorage.getItem("pflx_pathway_user");
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }

  function isHost(u) { return u && (u.role === "admin" || u.isHost === true); }

  const user = getUser();
  const hostMode = isHost(user);

  // Theme per role
  const ACCENT = hostMode ? "#00d4ff" : "#a855f7";
  const ACCENT2 = hostMode ? "#a78bfa" : "#f5c842";
  const ICON = hostMode ? "🛠️" : "🧭";
  const TITLE = hostMode ? "PFLX Host Guide" : "PFLX Pathway Guide";
  const WELCOME = hostMode
    ? `Hey${user ? " " + (user.brandName || user.name || "").split(" ")[0] : ""}! 🛠️ I'm your PFLX Host Guide for the Pathway Portal.\n\nI can help you manage pathways, understand how courses work, advise on which pathways to assign players to, and explain how Signature Badges + residual income connect to the X-Coin economy.\n\nAsk me anything or tap a quick action below!`
    : `Hey${user ? " " + (user.brandName || user.name || "").split(" ")[0] : ""}! 👋 I'm your PFLX Pathway Guide.\n\nI can help you explore the 7 skill pathways, figure out which one fits your goals, understand what courses to complete, and guide you through earning Signature Badges.\n\nAsk me anything!`;

  const CHIPS = hostMode
    ? [
        { label: "Pathway overview", q: "Give me an overview of all 7 pathways and what skills they develop" },
        { label: "Assign players", q: "How should I decide which pathways to assign to my students?" },
        { label: "Badge strategy", q: "How do Signature Badges and residual income work for course creators?" },
        { label: "Help", q: "What can you help me with?" },
      ]
    : [
        { label: "Which pathway?", q: "Which pathway is right for me? I'm not sure where to start." },
        { label: "What will I learn?", q: "What will I learn on this pathway?" },
        { label: "Earn badges", q: "How do I earn Signature Badges by completing courses?" },
        { label: "Help", q: "What can you help me with?" },
      ];

  // ─── Gather context ───────────────────────────────────────────────────
  function gatherContext() {
    const ctx = {
      currentPage: location.pathname.replace(/^\//, "") || "home",
      userRole: hostMode ? "host" : "player",
      userName: user ? (user.brandName || user.name || "Unknown") : "Guest",
      currentPathway: "none",
    };
    try {
      const params = new URLSearchParams(location.search);
      const pw = params.get("pathway") || params.get("p");
      if (pw) ctx.currentPathway = pw;
    } catch (_) {}
    // Detect pathway from page content
    const title = document.title || "";
    if (title.includes("Digital Artist")) ctx.currentPathway = "digital-artist";
    else if (title.includes("Music")) ctx.currentPathway = "music-producer";
    else if (title.includes("Video")) ctx.currentPathway = "videographer";
    else if (title.includes("Entrepreneur")) ctx.currentPathway = "professional-entrepreneur";
    else if (title.includes("Graphic")) ctx.currentPathway = "graphic-designer";
    else if (title.includes("Web Dev")) ctx.currentPathway = "web-developer";
    else if (title.includes("Content")) ctx.currentPathway = "content-creator";
    return ctx;
  }

  // ─── State ────────────────────────────────────────────────────────────
  let open = false;
  let messages = [];
  let thinking = false;

  // ─── DOM ──────────────────────────────────────────────────────────────
  const container = document.createElement("div");
  container.id = "pflx-ai-chat-root";
  document.body.appendChild(container);

  const style = document.createElement("style");
  style.textContent = `
    #pflx-ai-fab {
      position:fixed;bottom:24px;right:24px;z-index:99990;
      width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;
      background:linear-gradient(135deg,${ACCENT},${ACCENT2});
      box-shadow:0 4px 24px ${ACCENT}55;
      color:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;
      transition:transform 0.2s,box-shadow 0.2s;
    }
    #pflx-ai-fab:hover{transform:scale(1.08);box-shadow:0 6px 32px ${ACCENT}77;}
    #pflx-ai-panel {
      position:fixed;bottom:88px;right:24px;z-index:99989;
      width:370px;max-height:520px;border-radius:20px;
      background:linear-gradient(145deg,#0a0e1a,#0f0a1e);
      border:1px solid ${ACCENT}33;
      box-shadow:0 20px 60px rgba(0,0,0,0.7);
      display:none;flex-direction:column;overflow:hidden;
      font-family:'Rajdhani','Inter','Segoe UI',sans-serif;
    }
    #pflx-ai-panel.open{display:flex;}
    .pflx-hdr{padding:14px 16px;display:flex;align-items:center;gap:10px;
      background:linear-gradient(135deg,${ACCENT}14,${ACCENT2}14);
      border-bottom:1px solid ${ACCENT}1a;}
    .pflx-hdr .ic{width:34px;height:34px;border-radius:10px;
      background:linear-gradient(135deg,${ACCENT},${ACCENT2});
      display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
    .pflx-hdr .ti{font-weight:800;font-size:14px;color:#e0f0ff;letter-spacing:0.03em;}
    .pflx-hdr .su{font-size:10px;color:${ACCENT};display:flex;align-items:center;gap:5px;}
    .pflx-hdr .dt{width:6px;height:6px;border-radius:50%;background:#22c55e;}
    #pflx-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;}
    .pm{display:flex;max-width:82%;gap:8px;}
    .pm.u{align-self:flex-end;flex-direction:row-reverse;}
    .pm .bb{padding:9px 13px;border-radius:14px;font-size:12.5px;line-height:1.55;
      color:#e0f0ff;white-space:pre-wrap;word-break:break-word;}
    .pm.a .bb{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:14px 14px 14px 4px;}
    .pm.u .bb{background:linear-gradient(135deg,${ACCENT},${ACCENT2});border-radius:14px 14px 4px 14px;}
    .pm .av{width:24px;height:24px;border-radius:8px;flex-shrink:0;align-self:flex-end;
      background:linear-gradient(135deg,${ACCENT},${ACCENT2});
      display:flex;align-items:center;justify-content:center;font-size:11px;}
    .pm .tm{font-size:9px;color:rgba(255,255,255,0.2);margin-top:4px;}
    #pflx-chips{padding:0 12px 8px;display:flex;gap:6px;flex-wrap:wrap;}
    #pflx-chips button{padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;
      background:${ACCENT}1a;border:1px solid ${ACCENT}40;color:${ACCENT};cursor:pointer;white-space:nowrap;font-family:inherit;}
    #pflx-chips button:hover{background:${ACCENT}33;}
    #pflx-irow{padding:10px 12px 14px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:8px;align-items:center;}
    #pflx-inp{flex:1;padding:9px 12px;border-radius:12px;font-size:12px;
      background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
      color:#e0f0ff;outline:none;font-family:inherit;}
    #pflx-inp:focus{border-color:${ACCENT}66;}
    #pflx-snd{width:36px;height:36px;border-radius:10px;border:none;cursor:pointer;flex-shrink:0;
      background:linear-gradient(135deg,${ACCENT},${ACCENT2});color:#fff;font-size:15px;
      display:flex;align-items:center;justify-content:center;font-family:inherit;}
    #pflx-snd:disabled{opacity:0.3;cursor:not-allowed;}
    .pflx-tp{display:flex;align-items:center;gap:8px;}
    .pflx-tp .ds{display:flex;gap:3px;padding:10px 14px;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);}
    .pflx-tp .ds span{width:6px;height:6px;border-radius:50%;background:${ACCENT};animation:pdot 1.4s infinite;}
    .pflx-tp .ds span:nth-child(2){animation-delay:0.2s;}
    .pflx-tp .ds span:nth-child(3){animation-delay:0.4s;}
    @keyframes pdot{0%,80%,100%{opacity:.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}
  `;
  document.head.appendChild(style);

  // ─── Render ───────────────────────────────────────────────────────────
  function render() {
    const now = ts();
    container.innerHTML = `
      <button id="pflx-ai-fab" title="${TITLE}">${open ? "✕" : ICON}</button>
      <div id="pflx-ai-panel" class="${open ? "open" : ""}">
        <div class="pflx-hdr">
          <div class="ic">${ICON}</div>
          <div>
            <div class="ti">${TITLE}</div>
            <div class="su"><span class="dt"></span> Online · AI-powered</div>
          </div>
        </div>
        <div id="pflx-msgs">
          ${messages.map(m => `
            <div class="pm ${m.role === "user" ? "u" : "a"}">
              ${m.role === "assistant" ? `<div class="av">${ICON}</div>` : ""}
              <div>
                <div class="bb">${esc(m.text)}</div>
                <div class="tm" style="text-align:${m.role === "user" ? "right" : "left"}">${m.time}</div>
              </div>
            </div>
          `).join("")}
          ${thinking ? `<div class="pflx-tp"><div class="av" style="width:24px;height:24px;border-radius:8px;background:linear-gradient(135deg,${ACCENT},${ACCENT2});display:flex;align-items:center;justify-content:center;font-size:11px;">${ICON}</div><div class="ds"><span></span><span></span><span></span></div></div>` : ""}
          <div id="pflx-btm"></div>
        </div>
        <div id="pflx-chips">
          ${CHIPS.map(c => `<button data-q="${esc(c.q)}">${c.label}</button>`).join("")}
        </div>
        <div id="pflx-irow">
          <input id="pflx-inp" placeholder="Ask me anything..." />
          <button id="pflx-snd" disabled>➤</button>
        </div>
      </div>
    `;
    bind();
    scroll();
  }

  function esc(t) { const d = document.createElement("div"); d.textContent = t; return d.innerHTML.replace(/\n/g, "<br>"); }
  function ts() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  function scroll() { const b = document.getElementById("pflx-btm"); if (b) b.scrollIntoView({ behavior: "smooth" }); }

  function bind() {
    document.getElementById("pflx-ai-fab").onclick = () => {
      open = !open;
      if (open && messages.length === 0) messages.push({ role: "assistant", text: WELCOME, time: ts() });
      render();
      if (open) setTimeout(() => { scroll(); const i = document.getElementById("pflx-inp"); if (i) i.focus(); }, 100);
    };
    container.querySelectorAll("#pflx-chips button").forEach(b => {
      b.onclick = () => send(b.dataset.q);
    });
    const inp = document.getElementById("pflx-inp");
    const snd = document.getElementById("pflx-snd");
    if (inp) {
      inp.oninput = () => { snd.disabled = !inp.value.trim(); };
      inp.onkeydown = (e) => { if (e.key === "Enter" && inp.value.trim()) send(inp.value); };
    }
    if (snd) snd.onclick = () => { if (inp && inp.value.trim()) send(inp.value); };
  }

  // ─── Send ─────────────────────────────────────────────────────────────
  async function send(text) {
    messages.push({ role: "user", text: text.trim(), time: ts() });
    thinking = true;
    render();

    try {
      const ctx = gatherContext();
      const res = await fetch(GEMINI_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, role: "pathway", context: ctx }),
      });
      if (res.ok) {
        const data = await res.json();
        thinking = false;
        messages.push({ role: "assistant", text: data.reply, time: ts() });
      } else { throw new Error("API " + res.status); }
    } catch (err) {
      console.error("[PFLX AI]", err);
      thinking = false;
      messages.push({ role: "assistant", text: "Sorry, I'm having trouble connecting right now. Try again in a moment!", time: ts() });
    }
    render();
  }

  // ─── Init (only show after login — skip on login.html) ───────────────
  if (location.pathname.includes("login")) {
    // Don't show chat on login page
    return;
  }
  render();
})();
