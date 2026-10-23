(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const app = $("#app-content");
  const STATUS_KEY = "classmate-completion-v1";
  const THEME_KEY = "classmate-theme-v1";
  const PERSONAL_KEY = "classmate-personal-items-v1";
  const HUB_CACHE_KEY = "classmate-hub-cache-v1";
  const BACKUP_VERSION = 1;
  let view = "dashboard";
  let query = "";
  let statusFilter = "all";
  let subjectFilter = "all";
  let moduleFilter = "all";
  let completionOverrides = readJSON(localStorage, STATUS_KEY, {});
  let personalItems = readJSON(localStorage, PERSONAL_KEY, []);
  let hubOffline = false;
  let editingPersonalId = null;
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
    const stop = new Set(["and", "of", "the", "for", "in", "to", "a", "an"]);
    const words = cleaned.split(/\s+/).filter(Boolean).filter(w => !stop.has(w.toLowerCase()));
    if (!words.length) return "CM";
    return words.map(w => w[0]).join("").toUpperCase();
  }
  function persistPersonal() {
    try { localStorage.setItem(PERSONAL_KEY, JSON.stringify(personalItems)); } catch (_) {}
  }
  function addPersonalToAssignments() {
    const subjectById = new Map(subjects.map(s => [String(s.id), s]));
    const mine = personalItems.map(item => {
      const subject = subjectById.get(String(item.subjectId));
      return {
        ...item,
        key: `mine:${item.id}`,
        mine: true,
        subject: subject ? subject.name : (item.subjectName || "General"),
        subjectId: subject ? subject.id : (item.subjectId || "general"),
        module: item.module || null,
        due: item.due || "",
        link: item.link || ""
      };
    });
    allAssignments = allAssignments.filter(a => !a.mine).concat(mine);
  }
  function allDoneItems() { return allAssignments.filter(a => getDone(a)); }
  function openModal(title, body) {
    const existing = $(".modal-backdrop"); if (existing) existing.remove();
    document.body.insertAdjacentHTML("beforeend", `<div class="modal-backdrop" role="presentation"><section class="modal-card" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}"><div class="modal-head"><h2>${escapeHTML(title)}</h2><button class="modal-close" type="button" data-modal-close aria-label="Close">×</button></div>${body}</section></div>`);
  }
  function closeModal() { const modal = $(".modal-backdrop"); if (modal) modal.remove(); }
  function taskRow(item, card = false) {
    const done = getDone(item);
    const status = getStatus(item);
    const chipClass = status === "completed" ? "complete" : status === "overdue" ? "overdue" : status === "soon" ? "soon" : "";
    const url = safeURL(item.link);
    return `<article class="${card ? "assignment-card" : "task-row"}">
      <button class="task-check ${done ? "done" : ""}" data-toggle="${escapeHTML(item.key)}" aria-label="${done ? "Mark as not completed" : "Mark as completed"}" aria-pressed="${done}">${done ? icon("check") : ""}</button>
      <div class="task-main">
        <div class="task-title ${done ? "completed" : ""}">${escapeHTML(item.title)}${item.mine ? `<span class="mine-tag">Mine · ${escapeHTML(item.type || "assignment")}</span>` : ""}</div>
        <div class="task-meta"><span>${escapeHTML(shortSubject(item.subject))}</span><span class="meta-sep"></span><span>Module ${escapeHTML(item.module || "—")}</span></div>
        <div class="task-meta"><span class="due-chip ${chipClass}">${escapeHTML(statusLabel(item))}</span>${item.time && item.due ? `<span>${escapeHTML(item.time)}</span>` : ""}</div>
      </div>
      ${url ? `<a class="task-open" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" aria-label="Open assignment link">${icon("external")}</a>` : ""}
      ${item.mine ? `<div class="task-actions"><button class="task-edit" data-edit-mine="${escapeHTML(item.id)}" aria-label="Edit personal item">✎</button><button class="task-delete" data-delete-mine="${escapeHTML(item.id)}" aria-label="Delete personal item">Delete</button></div>` : ""}
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
    const names = { dashboard: "Overview", assignments: "Assignments", subjects: "Subjects", resources: "Resources", done: "Done" };
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
      ${heading("YOUR STUDY SPACE", `${greeting}.<br>Let's make progress.`, "A clear view of what’s next, so you can focus on one thing at a time.", `<div class="page-actions"><button class="primary-button" data-add-mine>+ Add</button><div class="date-pill">${icon("calendar")} ${escapeHTML(new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric"}).format(now))}</div></div>`)}
      ${hubOffline ? `<div class="hub-notice">Assignment Hub couldn’t be reached. Showing the last saved copy of its course data.</div>` : ""}
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
      ${overdue.length ? `<section class="panel" style="margin-top:20px"><div class="panel-head"><h2>Needs attention</h2><span class="due-chip overdue">${overdue.length} overdue</span></div><div class="panel-body"><div class="task-list">${overdue.map(a => taskRow(a)).join("")}</div></div></section>` : ""}
      ${backupPanel()}`;
  }
  function renderAssignments() {
    const filtered = allAssignments.filter(item => {
      const matchesQuery = !query || [item.title,item.subject,item.module].join(" ").toLowerCase().includes(query.toLowerCase());
      const status = getStatus(item);
      const matchesStatus = statusFilter === "all" || (statusFilter === "pending" && !getDone(item)) || statusFilter === status;
      const matchesSubject = subjectFilter === "all" || String(item.subjectId) === String(subjectFilter);
      const matchesModule = moduleFilter === "all" || String(item.module || "") === String(moduleFilter);
      return matchesQuery && matchesStatus && matchesSubject && matchesModule;
    }).sort((a,b) => {
      if (getDone(a) !== getDone(b)) return getDone(a) ? 1 : -1;
      if (!a.due) return 1; if (!b.due) return -1;
      return localDate(a.due) - localDate(b.due);
    });
    app.innerHTML = `${heading("STAY ON TOP OF IT", "Assignments", "Every task in one place. Filter the list and mark things done as you go.", `<button class="primary-button" data-add-mine>+ Add</button>`)}
      ${hubOffline ? `<div class="hub-notice">Assignment Hub couldn’t be reached. Showing the last saved copy of its course data.</div>` : ""}
      <div class="filter-bar"><label class="filter-search">${icon("search")}<input id="list-search" type="search" value="${escapeHTML(query)}" placeholder="Search by title or subject..." aria-label="Search assignments"></label>
        <select id="status-filter" aria-label="Filter by status"><option value="all">All statuses</option><option value="pending">Not completed</option><option value="soon">Due soon</option><option value="overdue">Overdue</option><option value="completed">Completed</option><option value="no-date">No deadline</option></select>
        <select id="subject-filter" aria-label="Filter by subject"><option value="all">All subjects</option>${subjects.map(s => `<option value="${escapeHTML(s.id)}">${escapeHTML(shortSubject(s.name))}</option>`).join("")}</select>
        <select id="module-filter" aria-label="Filter by module"><option value="all">All modules</option>${[...new Set(allAssignments.filter(a => a.module && (subjectFilter === "all" || String(a.subjectId)===String(subjectFilter))).map(a => String(a.module)))].map(m => `<option value="${escapeHTML(m)}">Module ${escapeHTML(m)}</option>`).join("")}</select>
      </div>
      <p class="results-count">${filtered.length} ${filtered.length === 1 ? "assignment" : "assignments"} found</p>
      <div class="assignment-list">${filtered.length ? filtered.map(a => taskRow(a,true)).join("") : emptyState("No assignments match", "Try changing your search or filters.")}</div>${backupPanel()}`;
    $("#status-filter").value = statusFilter;
    $("#subject-filter").value = subjectFilter;
    $("#module-filter").value = moduleFilter;
    $("#list-search").addEventListener("input", e => { query = e.target.value; const pos = e.target.selectionStart; renderAssignments(); const input = $("#list-search"); input.focus(); input.setSelectionRange(pos,pos); });
    $("#status-filter").addEventListener("change", e => { statusFilter = e.target.value; renderAssignments(); });
    $("#subject-filter").addEventListener("change", e => { subjectFilter = e.target.value; moduleFilter = "all"; renderAssignments(); });
    $("#module-filter").addEventListener("change", e => { moduleFilter = e.target.value; renderAssignments(); });
  }
  function renderSubjects() {
    const counts = getCounts();
    app.innerHTML = `${heading("YOUR CLASSES", "Subjects", "Jump into a course to see its assignments and learning resources.", `<button class="primary-button" data-add-mine>+ Add</button>`)}
      ${hubOffline ? `<div class="hub-notice">Assignment Hub couldn’t be reached. Showing the last saved copy of its course data.</div>` : ""}
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
    app.innerHTML = `${heading("REFERENCE LIBRARY", "Resources", "Readings and lecture materials linked to your subjects.", `<button class="primary-button" data-add-mine>+ Add</button>`)}
      ${hubOffline ? `<div class="hub-notice">Assignment Hub couldn’t be reached. Showing the last saved copy of its course data.</div>` : ""}
      <div class="filter-bar"><label class="filter-search">${icon("search")}<input id="resource-search" type="search" value="${escapeHTML(query)}" placeholder="Search resources..." aria-label="Search resources"></label><select id="resource-subject" aria-label="Filter resources by subject"><option value="all">All subjects</option>${subjects.map(s => `<option value="${escapeHTML(s.id)}">${escapeHTML(shortSubject(s.name))}</option>`).join("")}</select></div>
      <div id="resource-results" class="resource-groups"></div>${backupPanel()}`;
    $("#resource-subject").value = subjectFilter;
    function drawResources() {
      const q = $("#resource-search").value.toLowerCase();
      const sid = $("#resource-subject").value;
      const filteredGroups = groups.map(group => ({...group, items:group.items.filter(r => (!q || (r.title+" "+r.subject).toLowerCase().includes(q)) && (sid === "all" || r.subjectId === sid))}));
      $("#resource-results").innerHTML = filteredGroups.map(group => `<section class="resource-group"><h2>${icon(group.icon)} ${group.label} <span class="results-count">(${group.items.length})</span></h2><div class="resource-list">${group.items.length ? group.items.map(r => {
        const url = safeURL(r.link);
        return `<article class="resource-card"><span class="resource-icon">${icon(group.icon)}</span><span class="resource-main"><span class="resource-title">${url ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(r.title)}</a>` : escapeHTML(r.title)}</span><span class="resource-meta">· ${escapeHTML(shortSubject(r.subject))} · Module ${escapeHTML(r.module || "—")}</span></span>${url ? `<a class="resource-open" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" aria-label="Open resource">${icon("external")}</a>` : ""}</article>`;
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
    else if (view === "done") renderDone();
    updateCounts();
    renderIcons();
  }
  function updateCounts() {
    const counts = getCounts();
    $("#nav-pending").textContent = counts.pending;
    const doneNav = $("#nav-done"); if (doneNav) doneNav.textContent = counts.completed;
  }
  function loadSource() {
    let sourceSubjects = typeof SUBJECTS !== "undefined" && Array.isArray(SUBJECTS) ? SUBJECTS : null;
    let sourceGeneral = typeof GENERAL !== "undefined" && Array.isArray(GENERAL) ? GENERAL : [];
    if (sourceSubjects) {
      try { localStorage.setItem(HUB_CACHE_KEY, JSON.stringify({ subjects: sourceSubjects, general: sourceGeneral, savedAt: new Date().toISOString() })); } catch (_) {}
    } else {
      const cached = readJSON(localStorage, HUB_CACHE_KEY, null);
      if (cached && Array.isArray(cached.subjects)) {
        sourceSubjects = cached.subjects; sourceGeneral = Array.isArray(cached.general) ? cached.general : []; hubOffline = true;
      }
    }
    if (!sourceSubjects) {
      app.innerHTML = `<div class="error-card"><h2>Couldn’t load Assignment Hub data</h2><p>The live data and saved copy are unavailable. Check your connection and try again.</p><button class="primary-button" id="retry-load">Try again</button></div>`;
      $("#retry-load").addEventListener("click", () => location.reload());
      return;
    }
    subjects = sourceSubjects;
    general = sourceGeneral;
    allAssignments = [];
    allResources = [];
    subjects.forEach(subject => {
      (subject.assignments || []).forEach((item, i) => allAssignments.push({...item, subject: subject.name, subjectId: subject.id, key: `${subject.id}:${item.id || "assignment"}:${i}`, module: item.module || null}));
      (subject.readings || []).forEach((item, i) => allResources.push({...item, kind: "reading", subject: subject.name, subjectId: subject.id, key: `${subject.id}:reading:${item.id || i}`}));
      (subject.notes || []).forEach((item, i) => allResources.push({...item, kind: "note", subject: subject.name, subjectId: subject.id, key: `${subject.id}:note:${item.id || i}`}));
    });
    general.forEach((item, i) => allAssignments.push({...item, subject:"General", subjectId:"general", key:`general:${item.id || "assignment"}:${i}`, module:null}));
    addPersonalToAssignments();
    render();
  }
  function toggleCompletion(key) {
    const item = allAssignments.find(a => a.key === key);
    if (!item) return;
    if (getDone(item)) { setCompletion(item, false); return; }
    openModal("Mark as done?", `<p>Mark <strong>${escapeHTML(item.title)}</strong> as completed? You can find it in the Done folder and restore it any time.</p><div class="confirm-actions"><button class="secondary-button" data-modal-close>Cancel</button><button class="primary-button" data-confirm-done="${escapeHTML(key)}">Yes, mark done</button></div>`);
  }
  function setCompletion(item, value) {
    completionOverrides[item.key] = Boolean(value);
    try { localStorage.setItem(STATUS_KEY, JSON.stringify(completionOverrides)); } catch (_) {}
    closeModal(); render();
  }
  function renderDone() {
    const done = allDoneItems().sort((a,b) => (a.title || "").localeCompare(b.title || ""));
    app.innerHTML = `${heading("YOUR WINS", "Done", "Completed work stays here. Untick any item to bring it back.", `<button class="primary-button" data-add-mine>+ Add</button>`)}
      <div class="assignment-list">${done.length ? done.map(a => taskRow(a,true)).join("") : emptyState("Nothing completed yet", "When you finish something, confirm it and it will be saved here.")}</div>
      ${backupPanel()}`;
  }
  function backupPanel() {
    return `<section class="backup-panel"><h2>Your data, your device</h2><p>Personal items and completion states stay in this browser. Copy a backup to move them to another device. Assignment Hub course data is not included because it can be reloaded from the hub.</p><div class="backup-actions"><button class="secondary-button" data-copy-backup>Copy backup</button><button class="secondary-button" data-restore-backup>Restore backup</button><input id="backup-file" type="file" accept="application/json,.json" hidden></div></section>`;
  }
  function subjectModuleOptions(selectedSubject = "", selectedModule = "") {
    const subjectOptions = subjects.map(s => `<option value="${escapeHTML(s.id)}" ${String(s.id)===String(selectedSubject)?"selected":""}>${escapeHTML(s.name)}</option>`).join("");
    const modules = [...new Set(allAssignments.filter(a => String(a.subjectId)===String(selectedSubject) && a.module).map(a => String(a.module)))];
    return { subjectOptions, moduleOptions: modules.map(m => `<option value="${escapeHTML(m)}" ${m===String(selectedModule)?"selected":""}>${escapeHTML(m)}</option>`).join("") };
  }
  function showPersonalForm(id = null) {
    const item = id ? personalItems.find(x => String(x.id)===String(id)) : null;
    editingPersonalId = id;
    const opts = subjectModuleOptions(item?.subjectId || "", item?.module || "");
    openModal(item ? "Edit your item" : "Add to ClassMate", `<form id="personal-form" class="item-form">
      <label class="full">Title *<input name="title" required maxlength="180" value="${escapeHTML(item?.title || "")}" placeholder="e.g. Finish the reflection note"></label>
      <label>Type<select name="type"><option value="assignment" ${item?.type==="assignment"?"selected":""}>Assignment</option><option value="reading" ${item?.type==="reading"?"selected":""}>Reading</option><option value="reminder" ${item?.type==="reminder"?"selected":""}>Reminder</option></select></label>
      <label>Due date<input name="due" type="date" value="${escapeHTML(item?.due || "")}"></label>
      <label>Optional time<input name="time" type="time" value="${escapeHTML(item?.time || "")}"></label>
      <label>Subject (optional)<select name="subjectId"><option value="">No subject</option>${opts.subjectOptions}</select></label>
      <label>Module (optional)<select name="module" id="mine-module"><option value="">No module</option>${opts.moduleOptions}</select></label>
      <label class="full">Link (optional)<input name="link" type="url" value="${escapeHTML(item?.link || "")}" placeholder="https://..."></label>
      <div class="form-actions"><button type="button" class="secondary-button" data-modal-close>Cancel</button><button type="submit" class="primary-button">${item ? "Save changes" : "Add item"}</button></div>
    </form>`);
    const form = $("#personal-form");
    form.elements.subjectId.addEventListener("change", () => {
      const next = subjectModuleOptions(form.elements.subjectId.value, "");
      $("#mine-module").innerHTML = `<option value="">No module</option>${next.moduleOptions}`;
    });
    form.addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(form);
      const subject = subjects.find(s => String(s.id)===String(data.get("subjectId")));
      const next = { id: item?.id || `mine-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, title: String(data.get("title")||"").trim(), type: String(data.get("type")||"assignment"), due: String(data.get("due")||""), time: String(data.get("time")||""), subjectId: String(data.get("subjectId")||""), subjectName: subject?.name || "General", module: String(data.get("module")||""), link: safeURL(String(data.get("link")||"")) };
      if (!next.title) return;
      if (item) personalItems = personalItems.map(old => String(old.id)===String(item.id) ? next : old); else personalItems.push(next);
      persistPersonal();
      allAssignments = allAssignments.filter(a => !a.mine);
      addPersonalToAssignments(); closeModal(); render();
    });
  }
  async function copyBackup() {
    const payload = JSON.stringify({ app: "ClassMate", version: BACKUP_VERSION, exportedAt: new Date().toISOString(), personalItems, completionOverrides }, null, 2);
    try { await navigator.clipboard.writeText(payload); openModal("Backup copied", `<p>Your ClassMate backup is on the clipboard. Paste it into a file or note so you can restore it on another device.</p><div class="confirm-actions"><button class="primary-button" data-modal-close>Done</button></div>`); }
    catch (_) { openModal("Copy backup", `<p>Clipboard access was blocked. Copy the JSON below and save it as a backup file.</p><textarea style="width:100%;min-height:220px" readonly>${escapeHTML(payload)}</textarea><div class="confirm-actions"><button class="primary-button" data-modal-close>Close</button></div>`); const ta = $(".modal-card textarea"); ta.focus(); ta.select(); }
  }
  function restoreBackupText(text) {
    try {
      const data = JSON.parse(text);
      if (data?.app !== "ClassMate" || data.version !== BACKUP_VERSION || !Array.isArray(data.personalItems) || !data.completionOverrides || typeof data.completionOverrides !== "object") throw new Error("This file does not look like a supported ClassMate backup.");
      if (!confirm("Restore this backup? It will replace personal items and completion states currently saved in this browser.")) return;
      personalItems = data.personalItems.filter(x => x && typeof x.title === "string" && x.id).map(x => ({...x, title:x.title.slice(0,180), link:safeURL(x.link || "")}));
      completionOverrides = data.completionOverrides;
      persistPersonal();
      try { localStorage.setItem(STATUS_KEY, JSON.stringify(completionOverrides)); } catch (_) {}
      allAssignments = allAssignments.filter(a => !a.mine); addPersonalToAssignments(); closeModal(); render();
      openModal("Backup restored", `<p>Your personal items and completion states have been restored on this browser.</p><div class="confirm-actions"><button class="primary-button" data-modal-close>Done</button></div>`);
    } catch (error) { openModal("Couldn’t restore backup", `<p>${escapeHTML(error.message || "The backup file could not be read.")}</p><div class="confirm-actions"><button class="primary-button" data-modal-close>Close</button></div>`); }
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
    if (event.target.closest("[data-add-mine]")) { showPersonalForm(); return; }
    const confirmDone = event.target.closest("[data-confirm-done]");
    if (confirmDone) { const item = allAssignments.find(a => a.key === confirmDone.dataset.confirmDone); if (item) setCompletion(item, true); return; }
    if (event.target.closest("[data-modal-close]")) { closeModal(); return; }
    const editMine = event.target.closest("[data-edit-mine]");
    if (editMine) { showPersonalForm(editMine.dataset.editMine); return; }
    const deleteMine = event.target.closest("[data-delete-mine]");
    if (deleteMine) {
      const item = personalItems.find(x => String(x.id)===String(deleteMine.dataset.deleteMine));
      if (item && confirm(`Delete “${item.title}” from your personal items?`)) { personalItems = personalItems.filter(x => String(x.id)!==String(item.id)); delete completionOverrides[`mine:${item.id}`]; persistPersonal(); try { localStorage.setItem(STATUS_KEY, JSON.stringify(completionOverrides)); } catch (_) {} allAssignments = allAssignments.filter(a => !a.mine); addPersonalToAssignments(); render(); }
      return;
    }
    if (event.target.closest("[data-copy-backup]")) { copyBackup(); return; }
    if (event.target.closest("[data-restore-backup]")) { const file = $("#backup-file"); if (file) file.click(); return; }
    const subject = event.target.closest("[data-subject-open]");
    if (subject) {
      view = "assignments"; query = ""; statusFilter = "all"; subjectFilter = subject.dataset.subjectOpen; moduleFilter = "all";
      setView("assignments");
      return;
    }
  });
  document.addEventListener("change", event => {
    if (event.target.id === "backup-file" && event.target.files?.[0]) {
      const file = event.target.files[0]; const reader = new FileReader();
      reader.onload = () => restoreBackupText(String(reader.result || "")); reader.onerror = () => openModal("Couldn’t read backup", `<p>Please choose a valid ClassMate JSON backup.</p>`); reader.readAsText(file); event.target.value = "";
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
