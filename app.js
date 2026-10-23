(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const app = $("#app-content");
  const STATUS_KEY = "classmate-completion-v1";
  const THEME_KEY = "classmate-theme-v1";
  let view = "dashboard";
  let query = "";
  let statusFilter = "all";
  let subjectFilter = "all";
  let completionOverrides = readJSON(localStorage, STATUS_KEY, {});
  let allAssignments = [];
  let allResources = [];
  let subjects = [];
  let general = [];

  const icons = {
    grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    "check-square": '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m7.5 12 3 3 6-6"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 5.5V21M8 7h8M8 11h7"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/></svg>',
    sparkles: '<svg viewBox="0 0 24 24"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5z"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>',
    external: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="m10.3 4.2-7 12.1A2 2 0 0 0 5 19.3h14a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><path d="M12 9v4m0 3h.01"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></svg>',
    bookOpen: '<svg viewBox="0 0 24 24"><path d="M3 5.5c3.2-.9 6-.3 9 1.5v14c-3-1.8-5.8-2.4-9-1.5z"/><path d="M21 5.5c-3.2-.9-6-.3-9 1.5v14c3-1.8 5.8-2.4 9-1.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="m18 6-12 12M6 6l12 12"/></svg>'
  };

  function readJSON(storage, key, fallback) {
    try { return JSON.parse(storage.getItem(key) || "null") || fallback; } catch (_) { return fallback; }
  }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);
  }
  function safeURL(value) {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_) { return ""; }
  }
  function icon(name) { return icons[name] || icons.file; }
  function renderIcons() {
    $$("[data-icon]").forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  }
  function localDate(dateString) {
    if (!dateString) return null;
    const [y, m, d] = dateString.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }
  function startOfToday() {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }
  function daysUntil(dateString) {
    const date = localDate(dateString);
    if (!date) return null;
    return Math.round((date - startOfToday()) / 86400000);
  }
  function formatDate(dateString) {
    const date = localDate(dateString);
    if (!date) return "No deadline";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
  }
  function getDone(item) {
    return Object.prototype.hasOwnProperty.call(completionOverrides, item.key)
      ? Boolean(completionOverrides[item.key]) : Boolean(item.done);
  }
  function getStatus(item) {
    if (getDone(item)) return "completed";
    if (!item.due) return "no-date";
    const left = daysUntil(item.due);
    if (left < 0) return "overdue";
    if (left <= 7) return "soon";
    return "upcoming";
  }
  function statusLabel(item) {
    const status = getStatus(item);
    if (status === "completed") return "Completed";
    if (status === "no-date") return "No deadline";
    if (status === "overdue") return "Overdue · " + formatDate(item.due);
    if (status === "soon") {
      const left = daysUntil(item.due);
      if (left === 0) return "Due today";
      if (left === 1) return "Due tomorrow";
      return "Due " + formatDate(item.due);
    }
    return "Due " + formatDate(item.due);
  }
  function getCounts() {
    const completed = allAssignments.filter(a => getDone(a)).length;
    const overdue = allAssignments.filter(a => getStatus(a) === "overdue").length;
    const dueSoon = allAssignments.filter(a => ["soon", "overdue"].includes(getStatus(a))).length;
    return { total: allAssignments.length, completed, overdue, dueSoon, pending: allAssignments.length - completed, progress: allAssignments.length ? Math.round(completed / allAssignments.length * 100) : 0 };
  }
  function shortSubject(name) {
    const clean = String(name || "General").replace(/^EDSD\s+\d+:\s*/i, "");
    return clean;
  }
  function initials(name) {
    const cleaned = shortSubject(name).replace(/[^A-Za-z0-9 ]/g, " ").trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (!words.length) return "CM";
    return words.slice(0, 2).map(w => w[0]).join("").toUpperCase();
  }
  function taskRow(item, card = false) {
    const done = getDone(item);
    const status = getStatus(item);
    const chipClass = status === "completed" ? "complete" : status === "overdue" ? "overdue" : status === "soon" ? "soon" : "";
    const url = safeURL(item.link);
    return `<article class="${card ? "assignment-card" : "task-row"}">
      <button class="task-check ${done ? "done" : ""}" data-toggle="${escapeHTML(item.key)}" aria-label="${done ? "Mark as not completed" : "Mark as completed"}" aria-pressed="${done}">${done ? icon("check") : ""}</button>
      <div class="task-main">
        <div class="task-title ${done ? "completed" : ""}">${escapeHTML(item.title)}</div>
        <div class="task-meta"><span>${escapeHTML(shortSubject(item.subject))}</span><span class="meta-sep"></span><span>Module ${escapeHTML(item.module || "—")}</span></div>
        <div class="task-meta"><span class="due-chip ${chipClass}">${escapeHTML(statusLabel(item))}</span>${item.time && item.due ? `<span>${escapeHTML(item.time)}</span>` : ""}</div>
      </div>
      ${url ? `<a class="task-open" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" aria-label="Open assignment link">${icon("external")}</a>` : ""}
    </article>`;
  }
  function subjectRow(subject) {
    const list = allAssignments.filter(a => a.subjectId === subject.id);
    const done = list.filter(a => getDone(a)).length;
    const upcoming = list.filter(a => !getDone(a) && a.due && daysUntil(a.due) >= 0).length;
    return `<button class="subject-row" data-subject-open="${escapeHTML(subject.id)}">
      <span class="subject-mark">${escapeHTML(initials(subject.name))}</span>
      <span class="subject-info"><span class="subject-name">${escapeHTML(subject.name)}</span><span class="subject-sub">${upcoming} upcoming · ${done}/${list.length} completed</span></span>
      <span class="subject-arrow">${icon("arrow")}</span>
    </button>`;
  }
  function heading(eyebrow, title, subtitle, right = "") {
    return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${right}</div>`;
  }
  function emptyState(title, text) {
    return `<div class="empty-state"><span class="empty-icon">${icon("check")}</span><strong>${escapeHTML(title)}</strong><p>${escapeHTML(text)}</p></div>`;
  }
  function setView(next) {
    view = next;
    $$(".nav-item,.mobile-nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
    const names = { dashboard: "Overview", assignments: "Assignments", subjects: "Subjects", resources: "Resources" };
    $("#breadcrumbs").innerHTML = `Workspace <span>/</span> ${names[view] || "Overview"}`;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function renderDashboard() {
    const counts = getCounts();
    const upcoming = allAssignments.filter(a => !getDone(a) && a.due && daysUntil(a.due) >= 0).sort((a,b) => (localDate(a.due) - localDate(b.due))).slice(0, 5);
    const overdue = allAssignments.filter(a => getStatus(a) === "overdue").sort((a,b) => localDate(a.due) - localDate(b.due)).slice(0, 3);
    const subjectsTop = subjects.slice(0, 5);
    const now = new Date();
    const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
    app.innerHTML = `
      ${heading("YOUR STUDY SPACE", `${greeting}.<br>Let's make progress.`, "A clear view of what’s next, so you can focus on one thing at a time.", `<div class="date-pill">${icon("calendar")} ${escapeHTML(new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric"}).format(now))}</div>`)}
      <section class="stats-grid" aria-label="Assignment summary">
        <div class="stat-card"><div class="stat-top"><span class="stat-label">Total assignments</span><span class="stat-icon">${icon("bookOpen")}</span></div><div class="stat-value">${counts.total}</div><div class="stat-note">Across ${subjects.length} subjects</div></div>
        <div class="stat-card green"><div class="stat-top"><span class="stat-label">Completed</span><span class="stat-icon">${icon("check")}</span></div><div class="stat-value">${counts.completed}</div><div class="stat-note">${counts.progress}% of your workload</div></div>
        <div class="stat-card amber"><div class="stat-top"><span class="stat-label">Due soon</span><span class="stat-icon">${icon("clock")}</span></div><div class="stat-value">${counts.dueSoon}</div><div class="stat-note">Due within the next 7 days</div></div>
        <div class="stat-card ${counts.overdue ? "red" : ""}"><div class="stat-top"><span class="stat-label">Overdue</span><span class="stat-icon">${icon("alert")}</span></div><div class="stat-value">${counts.overdue}</div><div class="stat-note">${counts.overdue ? "Needs your attention" : "You’re all caught up"}</div></div>
      </section>
      <section class="dashboard-grid">
        <div class="panel">
          <div class="panel-head"><h2>Coming up next</h2><button class="panel-link" data-go="assignments">View all →</button></div>
          <div class="panel-body"><div class="task-list">${upcoming.length ? upcoming.map(a => taskRow(a)).join("") : emptyState("Nothing due soon", "You’re clear for now. Enjoy the breathing room.")}</div></div>
        </div>
        <div class="panel">
          <div class="panel-head"><h2>Your subjects</h2><button class="panel-link" data-go="subjects">See all →</button></div>
          <div class="panel-body">
            <div class="subject-list">${subjectsTop.map(subjectRow).join("") || emptyState("No subjects found", "Check that the source data is available.")}</div>
            <div class="progress-wrap"><div class="progress-label"><span>Overall progress</span><strong>${counts.progress}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${counts.progress}%"></div></div></div>
          </div>
        </div>
      </section>
      ${overdue.length ? `<section class="panel" style="margin-top:20px"><div class="panel-head"><h2>Needs attention</h2><span class="due-chip overdue">${overdue.length} overdue</span></div><div class="panel-body"><div class="task-list">${overdue.map(a => taskRow(a)).join("")}</div></div></section>` : ""}`;
  }
  function renderAssignments() {
    const filtered = allAssignments.filter(item => {
      const matchesQuery = !query || [item.title,item.subject,item.module].join(" ").toLowerCase().includes(query.toLowerCase());
      const status = getStatus(item);
      const matchesStatus = statusFilter === "all" || (statusFilter === "pending" && !getDone(item)) || statusFilter === status;
      const matchesSubject = subjectFilter === "all" || item.subjectId === subjectFilter;
      return matchesQuery && matchesStatus && matchesSubject;
    }).sort((a,b) => {
      if (getDone(a) !== getDone(b)) return getDone(a) ? 1 : -1;
      if (!a.due) return 1; if (!b.due) return -1;
      return localDate(a.due) - localDate(b.due);
    });
    app.innerHTML = `${heading("STAY ON TOP OF IT", "Assignments", "Every task in one place. Filter the list and mark things done as you go.")}
      <div class="filter-bar"><label class="filter-search">${icon("search")}<input id="list-search" type="search" value="${escapeHTML(query)}" placeholder="Search by title or subject..." aria-label="Search assignments"></label>
        <select id="status-filter" aria-label="Filter by status"><option value="all">All statuses</option><option value="pending">Not completed</option><option value="soon">Due soon</option><option value="overdue">Overdue</option><option value="completed">Completed</option><option value="no-date">No deadline</option></select>
        <select id="subject-filter" aria-label="Filter by subject"><option value="all">All subjects</option>${subjects.map(s => `<option value="${escapeHTML(s.id)}">${escapeHTML(shortSubject(s.name))}</option>`).join("")}</select>
      </div>
      <p class="results-count">${filtered.length} ${filtered.length === 1 ? "assignment" : "assignments"} found</p>
      <div class="assignment-list">${filtered.length ? filtered.map(a => taskRow(a,true)).join("") : emptyState("No assignments match", "Try changing your search or filters.")}</div>`;
    $("#status-filter").value = statusFilter;
    $("#subject-filter").value = subjectFilter;
    $("#list-search").addEventListener("input", e => { query = e.target.value; const pos = e.target.selectionStart; renderAssignments(); const input = $("#list-search"); input.focus(); input.setSelectionRange(pos,pos); });
    $("#status-filter").addEventListener("change", e => { statusFilter = e.target.value; renderAssignments(); });
    $("#subject-filter").addEventListener("change", e => { subjectFilter = e.target.value; renderAssignments(); });
  }
  function renderSubjects() {
    const counts = getCounts();
    app.innerHTML = `${heading("YOUR CLASSES", "Subjects", "Jump into a course to see its assignments and learning resources.")}
      <div class="source-note"><strong>${subjects.length} subjects connected.</strong> ClassMate reads course information from the public Assignment Hub data file.</div>
      <div class="subject-grid">${subjects.map(s => {
        const list = allAssignments.filter(a => a.subjectId === s.id);
        const done = list.filter(a => getDone(a)).length;
        const due = list.filter(a => !getDone(a) && a.due && daysUntil(a.due) >= 0).length;
        const pct = list.length ? Math.round(done/list.length*100) : 0;
        return `<button class="subject-card" data-subject-open="${escapeHTML(s.id)}"><div class="subject-card-top"><span class="subject-mark">${escapeHTML(initials(s.name))}</span><span class="subject-arrow">${icon("arrow")}</span></div><h3>${escapeHTML(s.name)}</h3><p>${list.length} assignments</p><div class="progress-wrap"><div class="progress-label"><span>${done} of ${list.length} completed</span><strong>${pct}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div><div class="subject-card-foot"><span>${due} upcoming</span><span>View assignments ${icon("arrow")}</span></div></button>`;
      }).join("")}</div>`;
  }
  function renderResources() {
    const groups = [
      { label: "Reading list", icon: "bookOpen", items: allResources.filter(r => r.kind === "reading") },
      { label: "Lecture notes", icon: "file", items: allResources.filter(r => r.kind === "note") }
    ];
    app.innerHTML = `${heading("REFERENCE LIBRARY", "Resources", "Readings and lecture materials linked to your subjects.")}
      <div class="filter-bar"><label class="filter-search">${icon("search")}<input id="resource-search" type="search" value="${escapeHTML(query)}" placeholder="Search resources..." aria-label="Search resources"></label><select id="resource-subject" aria-label="Filter resources by subject"><option value="all">All subjects</option>${subjects.map(s => `<option value="${escapeHTML(s.id)}">${escapeHTML(shortSubject(s.name))}</option>`).join("")}</select></div>
      <div id="resource-results" class="resource-groups"></div>`;
    $("#resource-subject").value = subjectFilter;
    function drawResources() {
      const q = $("#resource-search").value.toLowerCase();
      const sid = $("#resource-subject").value;
      const filteredGroups = groups.map(group => ({...group, items:group.items.filter(r => (!q || (r.title+" "+r.subject).toLowerCase().includes(q)) && (sid === "all" || r.subjectId === sid))}));
      $("#resource-results").innerHTML = filteredGroups.map(group => `<section class="resource-group"><h2>${icon(group.icon)} ${group.label} <span class="results-count">(${group.items.length})</span></h2><div class="resource-list">${group.items.length ? group.items.map(r => {
        const url = safeURL(r.link);
        return `<article class="resource-card"><span class="resource-icon">${icon(group.icon)}</span><span class="resource-main"><span class="resource-title">${url ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(r.title)}</a>` : escapeHTML(r.title)}</span><span class="resource-meta">${escapeHTML(shortSubject(r.subject))} · Module ${escapeHTML(r.module || "—")}</span></span>${url ? `<a class="resource-open" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" aria-label="Open resource">${icon("external")}</a>` : ""}</article>`;
      }).join("") : `<div class="empty-state">${escapeHTML("No resources found.")}</div>`}</div></section>`).join("");
    }
    $("#resource-search").addEventListener("input", drawResources);
    $("#resource-subject").addEventListener("change", drawResources);
    drawResources();
  }
  function render() {
    if (view === "dashboard") renderDashboard();
    else if (view === "assignments") renderAssignments();
    else if (view === "subjects") renderSubjects();
    else if (view === "resources") renderResources();
    updateCounts();
    renderIcons();
  }
  function updateCounts() {
    const counts = getCounts();
    $("#nav-pending").textContent = counts.pending;
  }
  function loadSource() {
    if (typeof SUBJECTS === "undefined" || !Array.isArray(SUBJECTS)) {
      app.innerHTML = `<div class="error-card"><h2>Couldn’t load Assignment Hub data</h2><p>The data file did not load or its structure changed. Check your connection and try again. If this persists, open the source repository to confirm that <code>data.js</code> is public.</p><button class="primary-button" id="retry-load">Try again</button></div>`;
      $("#retry-load").addEventListener("click", () => location.reload());
      return;
    }
    subjects = SUBJECTS;
    general = typeof GENERAL !== "undefined" && Array.isArray(GENERAL) ? GENERAL : [];
    allAssignments = [];
    allResources = [];
    subjects.forEach(subject => {
      (subject.assignments || []).forEach((item, i) => allAssignments.push({...item, subject: subject.name, subjectId: subject.id, key: `${subject.id}:${item.id || "assignment"}:${i}`, module: item.module || null}));
      (subject.readings || []).forEach((item, i) => allResources.push({...item, kind: "reading", subject: subject.name, subjectId: subject.id, key: `${subject.id}:reading:${item.id || i}`}));
      (subject.notes || []).forEach((item, i) => allResources.push({...item, kind: "note", subject: subject.name, subjectId: subject.id, key: `${subject.id}:note:${item.id || i}`}));
    });
    general.forEach((item, i) => allAssignments.push({...item, subject:"General", subjectId:"general", key:`general:${item.id || "assignment"}:${i}`, module:null}));
    render();
  }
  function toggleCompletion(key) {
    const item = allAssignments.find(a => a.key === key);
    if (!item) return;
    completionOverrides[key] = !getDone(item);
    try { localStorage.setItem(STATUS_KEY, JSON.stringify(completionOverrides)); } catch (_) {}
    render();
  }
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    const dark = theme === "dark";
    $("#theme-label").textContent = dark ? "Light appearance" : "Dark appearance";
    const themeIcon = dark ? "sun" : "moon";
    $$(".theme-toggle .nav-icon, .mobile-theme span").forEach(el => { el.innerHTML = icon(themeIcon); });
  }
  function toggleTheme() { setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"); }

  document.addEventListener("click", event => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) { setView(viewButton.dataset.view); return; }
    const goButton = event.target.closest("[data-go]");
    if (goButton) { setView(goButton.dataset.go); return; }
    const toggle = event.target.closest("[data-toggle]");
    if (toggle) { toggleCompletion(toggle.dataset.toggle); return; }
    const subject = event.target.closest("[data-subject-open]");
    if (subject) {
      view = "assignments"; query = ""; statusFilter = "all"; subjectFilter = subject.dataset.subjectOpen;
      setView("assignments");
      return;
    }
  });
  $("#theme-toggle").addEventListener("click", toggleTheme);
  $("#mobile-theme-toggle").addEventListener("click", toggleTheme);
  $("#global-search").addEventListener("focus", e => { if (window.innerWidth <= 640) e.target.closest(".global-search").classList.add("expanded"); });
  $("#global-search").addEventListener("blur", e => { if (window.innerWidth <= 640 && !e.target.value) e.target.closest(".global-search").classList.remove("expanded"); });
  $("#global-search").addEventListener("input", e => {
    query = e.target.value;
    if (query) { view = "assignments"; statusFilter = "all"; subjectFilter = "all"; setView("assignments"); }
    else if (view === "assignments") render();
  });
  document.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#global-search").focus(); }
    if (e.key === "Escape") { $("#global-search").blur(); }
  });

  const storedTheme = readJSON(localStorage, THEME_KEY, "light");
  setTheme(storedTheme === "dark" ? "dark" : "light");
  renderIcons();
  loadSource();
})();
