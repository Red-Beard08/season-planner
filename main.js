/* Season Planner: Markdown-first conceptual life planning for Obsidian. */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SeasonPlannerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/dashboard.ts
var import_obsidian2 = require("obsidian");

// src/utils.ts
var isoToday = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
function safeName(value) {
  return value.trim().replace(/[\\/:*?"<>|#^[\]]/g, "-").replace(/\s+/g, " ").slice(0, 120) || "Untitled";
}
function normalizePath(path) {
  return path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}
function id(prefix, seed) {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(36).toUpperCase()}`;
}
function list(value) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : typeof value === "string" ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];
}
function yaml(value) {
  return JSON.stringify(value);
}
function dateRange(view, anchor = isoToday()) {
  const d = /* @__PURE__ */ new Date(`${anchor}T12:00:00`);
  const start = new Date(d);
  const end = new Date(d);
  if (view === "week") {
    const day = (d.getDay() + 6) % 7;
    start.setDate(d.getDate() - day);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
  } else if (view === "month") {
    start.setDate(1);
    end.setMonth(start.getMonth() + 1, 0);
  } else if (view === "quarter") {
    const q = Math.floor(d.getMonth() / 3) * 3;
    start.setMonth(q, 1);
    end.setMonth(q + 3, 0);
  } else if (view === "year") {
    start.setMonth(0, 1);
    end.setMonth(11, 31);
  }
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10), view };
}
function datesForPattern(pattern, range) {
  var _a, _b, _c;
  const out = [];
  const start = /* @__PURE__ */ new Date(`${range.from}T12:00:00`);
  const end = /* @__PURE__ */ new Date(`${range.to}T12:00:00`);
  const first = /* @__PURE__ */ new Date(`${pattern.startDate}T12:00:00`);
  const last = pattern.endDate ? /* @__PURE__ */ new Date(`${pattern.endDate}T12:00:00`) : end;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (cursor >= first && cursor <= last) {
      const day = cursor.getDay();
      const matches = pattern.frequency === "weekly" ? day === ((_a = pattern.weekday) != null ? _a : 1) : pattern.frequency === "biweekly" ? day === ((_b = pattern.weekday) != null ? _b : 1) && Math.floor((cursor.getTime() - first.getTime()) / 864e5 / 7) % 2 === 0 : pattern.frequency === "monthly" ? cursor.getDate() === ((_c = pattern.dayOfMonth) != null ? _c : first.getDate()) : pattern.frequency === "quarterly" ? cursor.getDate() === first.getDate() && cursor.getMonth() % 3 === first.getMonth() % 3 : false;
      if (matches) out.push({ id: `${pattern.id}-${cursor.toISOString().slice(0, 10)}`, title: pattern.title, date: cursor.toISOString().slice(0, 10), durationMinutes: pattern.durationMinutes, people: pattern.people, locations: pattern.locations, seasons: pattern.seasons, categories: pattern.categories, status: "planned", notes: "", path: pattern.path, source: "pattern" });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}
async function ensureFolders(vault, folders) {
  for (const folder of folders.map(normalizePath)) {
    if (!folder || vault.getAbstractFileByPath(folder)) continue;
    const parts = folder.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!vault.getAbstractFileByPath(current)) await vault.createFolder(current);
    }
  }
}
function openCommand(app, command, fallback) {
  var _a;
  const api = app.commands;
  if (!((_a = api == null ? void 0 : api.executeCommandById) == null ? void 0 : _a.call(api, command))) fallback();
}

// src/modals.ts
var import_obsidian = require("obsidian");
var PlannerModal = class extends import_obsidian.Modal {
  onOpen() {
    this.modalEl.addClass("season-planner-modal");
    this.scroll = this.contentEl.createDiv({ cls: "season-planner-modal-scroll" });
    this.build(this.scroll);
  }
  actions(root, label, save) {
    const actions = root.createDiv({ cls: "season-planner-modal-actions" });
    actions.createEl("button", { text: label, cls: "mod-cta" }).onclick = () => void save();
    actions.createEl("button", { text: "Cancel" }).onclick = () => this.close();
  }
  csv(value) {
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }
  suggest(input, values, key) {
    const id2 = `season-planner-suggestions-${key}`;
    let list2 = this.scroll.querySelector(`#${id2}`);
    if (!list2) list2 = this.scroll.createEl("datalist", { attr: { id: id2 } });
    list2.empty();
    [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)).forEach((value) => list2.createEl("option", { value }));
    input.setAttribute("list", id2);
    input.setAttribute("autocomplete", "off");
  }
  currentSuggestions(plugin, kind) {
    const values = [];
    if (kind === "people") values.push(...plugin.repository.people().map((person) => person.id), ...plugin.repository.people().map((person) => person.name));
    if (kind === "seasons") values.push(...plugin.repository.seasons().map((season) => season.name));
    const records = [...plugin.repository.events(), ...plugin.repository.patterns()];
    if (kind === "locations") values.push(...records.flatMap((record) => record.locations));
    if (kind === "categories") values.push(...records.flatMap((record) => record.categories));
    return values;
  }
};
var SeasonModal = class extends PlannerModal {
  constructor(app, plugin, existing) {
    super(app);
    this.plugin = plugin;
    this.existing = existing;
    this.name = "";
    this.start = "";
    this.end = "";
    this.description = "";
    this.status = "active";
  }
  build(root) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    this.titleEl.setText(this.existing ? "Edit season" : "New season");
    this.name = (_b = (_a = this.existing) == null ? void 0 : _a.name) != null ? _b : "";
    this.start = (_d = (_c = this.existing) == null ? void 0 : _c.startDate) != null ? _d : "";
    this.end = (_f = (_e = this.existing) == null ? void 0 : _e.endDate) != null ? _f : "";
    this.description = (_h = (_g = this.existing) == null ? void 0 : _g.description) != null ? _h : "";
    this.status = (_j = (_i = this.existing) == null ? void 0 : _i.status) != null ? _j : "active";
    new import_obsidian.Setting(root).setName("Name").addText((t) => t.setValue(this.name).onChange((v) => this.name = v));
    new import_obsidian.Setting(root).setName("Start date").addText((t) => {
      t.setValue(this.start);
      t.inputEl.type = "date";
      t.onChange((v) => this.start = v);
    });
    new import_obsidian.Setting(root).setName("End date").addText((t) => {
      t.setValue(this.end);
      t.inputEl.type = "date";
      t.onChange((v) => this.end = v);
    });
    new import_obsidian.Setting(root).setName("Status").addDropdown((d) => d.addOptions({ active: "Active", planned: "Planned", completed: "Completed", archived: "Archived" }).setValue(this.status).onChange((v) => this.status = v));
    new import_obsidian.Setting(root).setName("Description").addTextArea((t) => {
      t.setValue(this.description);
      t.inputEl.rows = 4;
      t.onChange((v) => this.description = v);
    });
    this.actions(root, this.existing ? "Save changes" : "Create season", async () => {
      if (!this.name.trim() || !this.start || !this.end) {
        new import_obsidian.Notice("Name, start date, and end date are required.");
        return;
      }
      if (this.existing) await this.plugin.repository.updateSeason(this.existing, { name: this.name.trim(), startDate: this.start, endDate: this.end, description: this.description.trim(), status: this.status });
      else await this.plugin.repository.createSeason({ name: this.name.trim(), startDate: this.start, endDate: this.end, description: this.description.trim() });
      this.close();
      await this.plugin.refresh();
    });
  }
};
var EventModal = class extends PlannerModal {
  constructor(app, plugin, existing) {
    super(app);
    this.plugin = plugin;
    this.existing = existing;
    this.title = "";
    this.date = "";
    this.endDate = "";
    this.duration = 60;
    this.people = "";
    this.locations = "";
    this.seasons = "";
    this.categories = "";
    this.notes = "";
    this.status = "planned";
  }
  build(root) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    this.titleEl.setText(this.existing ? "Edit planning event" : "New planning event");
    const e = this.existing;
    this.title = (_a = e == null ? void 0 : e.title) != null ? _a : "";
    this.date = (_b = e == null ? void 0 : e.date) != null ? _b : "";
    this.endDate = (_c = e == null ? void 0 : e.endDate) != null ? _c : "";
    this.duration = (_d = e == null ? void 0 : e.durationMinutes) != null ? _d : 60;
    this.people = (_e = e == null ? void 0 : e.people.join(", ")) != null ? _e : "";
    this.locations = (_f = e == null ? void 0 : e.locations.join(", ")) != null ? _f : "";
    this.seasons = (_g = e == null ? void 0 : e.seasons.join(", ")) != null ? _g : "";
    this.categories = (_h = e == null ? void 0 : e.categories.join(", ")) != null ? _h : "";
    this.notes = (_i = e == null ? void 0 : e.notes) != null ? _i : "";
    this.status = (_j = e == null ? void 0 : e.status) != null ? _j : "planned";
    new import_obsidian.Setting(root).setName("Title").addText((t) => t.setValue(this.title).onChange((v) => this.title = v));
    new import_obsidian.Setting(root).setName("Date").addText((t) => {
      t.setValue(this.date);
      t.inputEl.type = "date";
      t.onChange((v) => this.date = v);
    });
    new import_obsidian.Setting(root).setName("End date (optional)").addText((t) => {
      t.setValue(this.endDate);
      t.inputEl.type = "date";
      t.onChange((v) => this.endDate = v);
    });
    new import_obsidian.Setting(root).setName("Estimated duration (minutes)").addText((t) => t.setValue(String(this.duration)).onChange((v) => this.duration = Number(v) || 60));
    new import_obsidian.Setting(root).setName("Status").addDropdown((d) => d.addOptions({ planned: "Planned", completed: "Completed", cancelled: "Cancelled" }).setValue(this.status).onChange((v) => this.status = v));
    new import_obsidian.Setting(root).setName("People").setDesc("Comma-separated names or stable IDs; type to see current options").addText((t) => {
      t.setValue(this.people).onChange((v) => this.people = v);
      this.suggest(t.inputEl, this.currentSuggestions(this.plugin, "people"), "people");
    });
    new import_obsidian.Setting(root).setName("Locations").setDesc("Comma-separated locations; type to see current options").addText((t) => {
      t.setValue(this.locations).onChange((v) => this.locations = v);
      this.suggest(t.inputEl, this.currentSuggestions(this.plugin, "locations"), "locations");
    });
    new import_obsidian.Setting(root).setName("Seasons").setDesc("Comma-separated season names; type to see current options").addText((t) => {
      t.setValue(this.seasons).onChange((v) => this.seasons = v);
      this.suggest(t.inputEl, this.currentSuggestions(this.plugin, "seasons"), "seasons");
    });
    new import_obsidian.Setting(root).setName("Categories").setDesc("Comma-separated categories; type to see current options").addText((t) => {
      t.setValue(this.categories).onChange((v) => this.categories = v);
      this.suggest(t.inputEl, this.currentSuggestions(this.plugin, "categories"), "categories");
    });
    new import_obsidian.Setting(root).setName("Notes").addTextArea((t) => {
      t.setValue(this.notes);
      t.inputEl.rows = 4;
      t.onChange((v) => this.notes = v);
    });
    this.actions(root, this.existing ? "Save changes" : "Save event", async () => {
      if (!this.title.trim() || !this.date) {
        new import_obsidian.Notice("Title and date are required.");
        return;
      }
      const input = { title: this.title.trim(), date: this.date, endDate: this.endDate || void 0, durationMinutes: this.duration, people: this.csv(this.people), locations: this.csv(this.locations), seasons: this.csv(this.seasons), categories: this.csv(this.categories), notes: this.notes, status: this.status };
      if (this.existing) await this.plugin.repository.updateEvent(this.existing, input);
      else await this.plugin.repository.createEvent(input);
      this.close();
      await this.plugin.refresh();
    });
  }
};
var PatternModal = class extends PlannerModal {
  constructor(app, plugin, existing) {
    super(app);
    this.plugin = plugin;
    this.existing = existing;
    this.title = "";
    this.frequency = "weekly";
    this.weekday = 1;
    this.day = 1;
    this.start = "";
    this.end = "";
    this.duration = 60;
    this.people = "";
    this.locations = "";
    this.seasons = "";
    this.categories = "";
  }
  build(root) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    this.titleEl.setText(this.existing ? "Edit recurring pattern" : "New recurring pattern");
    const e = this.existing;
    this.title = (_a = e == null ? void 0 : e.title) != null ? _a : "";
    this.frequency = (_b = e == null ? void 0 : e.frequency) != null ? _b : "weekly";
    this.weekday = (_c = e == null ? void 0 : e.weekday) != null ? _c : 1;
    this.day = (_d = e == null ? void 0 : e.dayOfMonth) != null ? _d : 1;
    this.start = (_e = e == null ? void 0 : e.startDate) != null ? _e : "";
    this.end = (_f = e == null ? void 0 : e.endDate) != null ? _f : "";
    this.duration = (_g = e == null ? void 0 : e.durationMinutes) != null ? _g : 60;
    this.people = (_h = e == null ? void 0 : e.people.join(", ")) != null ? _h : "";
    this.locations = (_i = e == null ? void 0 : e.locations.join(", ")) != null ? _i : "";
    this.seasons = (_j = e == null ? void 0 : e.seasons.join(", ")) != null ? _j : "";
    this.categories = (_k = e == null ? void 0 : e.categories.join(", ")) != null ? _k : "";
    new import_obsidian.Setting(root).setName("Title").addText((t) => t.setValue(this.title).onChange((v) => this.title = v));
    new import_obsidian.Setting(root).setName("Frequency").addDropdown((d) => d.addOptions({ weekly: "Weekly", biweekly: "Every other week", monthly: "Monthly", quarterly: "Quarterly" }).setValue(this.frequency).onChange((v) => this.frequency = v));
    new import_obsidian.Setting(root).setName("Weekday").addDropdown((d) => d.addOptions({ "0": "Sunday", "1": "Monday", "2": "Tuesday", "3": "Wednesday", "4": "Thursday", "5": "Friday", "6": "Saturday" }).setValue(String(this.weekday)).onChange((v) => this.weekday = Number(v)));
    new import_obsidian.Setting(root).setName("Day of month").addText((t) => t.setValue(String(this.day)).onChange((v) => this.day = Number(v) || 1));
    new import_obsidian.Setting(root).setName("Starts").addText((t) => {
      t.setValue(this.start);
      t.inputEl.type = "date";
      t.onChange((v) => this.start = v);
    });
    new import_obsidian.Setting(root).setName("Ends (optional)").addText((t) => {
      t.setValue(this.end);
      t.inputEl.type = "date";
      t.onChange((v) => this.end = v);
    });
    new import_obsidian.Setting(root).setName("Duration (minutes)").addText((t) => t.setValue(String(this.duration)).onChange((v) => this.duration = Number(v) || 60));
    new import_obsidian.Setting(root).setName("People").setDesc("Comma-separated names or stable IDs; type to see current options").addText((t) => {
      t.setValue(this.people).onChange((v) => this.people = v);
      this.suggest(t.inputEl, this.currentSuggestions(this.plugin, "people"), "people-pattern");
    });
    new import_obsidian.Setting(root).setName("Locations").setDesc("Comma-separated locations; type to see current options").addText((t) => {
      t.setValue(this.locations).onChange((v) => this.locations = v);
      this.suggest(t.inputEl, this.currentSuggestions(this.plugin, "locations"), "locations-pattern");
    });
    new import_obsidian.Setting(root).setName("Seasons").setDesc("Comma-separated season names; type to see current options").addText((t) => {
      t.setValue(this.seasons).onChange((v) => this.seasons = v);
      this.suggest(t.inputEl, this.currentSuggestions(this.plugin, "seasons"), "seasons-pattern");
    });
    new import_obsidian.Setting(root).setName("Categories").setDesc("Comma-separated categories; type to see current options").addText((t) => {
      t.setValue(this.categories).onChange((v) => this.categories = v);
      this.suggest(t.inputEl, this.currentSuggestions(this.plugin, "categories"), "categories-pattern");
    });
    this.actions(root, this.existing ? "Save changes" : "Save pattern", async () => {
      if (!this.title.trim() || !this.start) {
        new import_obsidian.Notice("Title and start date are required.");
        return;
      }
      const input = { title: this.title.trim(), frequency: this.frequency, weekday: this.weekday, dayOfMonth: this.day, startDate: this.start, endDate: this.end || void 0, durationMinutes: this.duration, people: this.csv(this.people), locations: this.csv(this.locations), seasons: this.csv(this.seasons), categories: this.csv(this.categories) };
      if (this.existing) await this.plugin.repository.updatePattern(this.existing, input);
      else await this.plugin.repository.createPattern(input);
      this.close();
      await this.plugin.refresh();
    });
  }
};
var ManagerModal = class extends PlannerModal {
  confirmDelete(label) {
    return window.confirm(`Delete ${label}? This removes the Markdown record.`);
  }
  row(root, title, detail, edit, remove) {
    const row = root.createDiv({ cls: "season-planner-manager-row" });
    const copy = row.createDiv({ cls: "season-planner-manager-copy" });
    copy.createEl("strong", { text: title });
    copy.createEl("small", { text: detail });
    const actions = row.createDiv({ cls: "season-planner-manager-actions" });
    actions.createEl("button", { text: "Edit" }).onclick = edit;
    actions.createEl("button", { text: "Delete", cls: "mod-warning" }).onclick = () => {
      if (this.confirmDelete(title)) void remove();
    };
  }
};
var SeasonManagerModal = class extends ManagerModal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  build(root) {
    this.titleEl.setText("Manage seasons");
    root.createEl("p", { cls: "season-planner-muted", text: "Edit dates and status without changing the note body." });
    const records = this.plugin.repository.seasons();
    if (!records.length) root.createEl("p", { text: "No seasons yet." });
    records.forEach((record) => this.row(root, record.name, `${record.status} \xB7 ${record.startDate} \u2192 ${record.endDate}`, () => {
      this.close();
      new SeasonModal(this.app, this.plugin, record).open();
    }, async () => {
      await this.plugin.repository.deleteRecord(record.path);
      this.close();
      await this.plugin.refresh();
    }));
  }
};
var EventManagerModal = class extends ManagerModal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  build(root) {
    this.titleEl.setText("Manage events");
    root.createEl("p", { cls: "season-planner-muted", text: "Explicit events are stored as individual Markdown notes." });
    const records = this.plugin.repository.events().filter((e) => e.source === "event");
    if (!records.length) root.createEl("p", { text: "No explicit events yet." });
    records.forEach((record) => this.row(root, record.title, `${record.date} \xB7 ${record.durationMinutes} min \xB7 ${record.status}`, () => {
      this.close();
      new EventModal(this.app, this.plugin, record).open();
    }, async () => {
      await this.plugin.repository.deleteRecord(record.path);
      this.close();
      await this.plugin.refresh();
    }));
  }
};
var PatternManagerModal = class extends ManagerModal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  build(root) {
    this.titleEl.setText("Manage recurring patterns");
    root.createEl("p", { cls: "season-planner-muted", text: "Patterns generate virtual occurrences in reports and heat maps." });
    const records = this.plugin.repository.patterns();
    if (!records.length) root.createEl("p", { text: "No recurring patterns yet." });
    records.forEach((record) => this.row(root, record.title, `${record.frequency} \xB7 from ${record.startDate} \xB7 ${record.durationMinutes} min`, () => {
      this.close();
      new PatternModal(this.app, this.plugin, record).open();
    }, async () => {
      await this.plugin.repository.deleteRecord(record.path);
      this.close();
      await this.plugin.refresh();
    }));
  }
};

// src/dashboard.ts
var VIEW_ID = "season-planner-dashboard";
var SeasonPlannerView = class extends import_obsidian2.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_ID;
  }
  getDisplayText() {
    return "Season Planner";
  }
  getIcon() {
    return "calendar-range";
  }
  async onOpen() {
    await this.render();
  }
  async render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("season-planner-view");
    const activeSeason = this.plugin.repository.seasons().find((season) => season.status === "active" && season.startDate <= this.plugin.selectedAnchor && (!season.endDate || season.endDate >= this.plugin.selectedAnchor));
    const period = this.plugin.settings.defaultView === "season" && activeSeason ? { from: activeSeason.startDate, to: activeSeason.endDate || this.plugin.selectedAnchor, view: "season", seasonId: activeSeason.id } : dateRange(this.plugin.settings.defaultView, this.plugin.selectedAnchor);
    const summary = await this.plugin.repository.getLoadSummary(period);
    const events = await this.plugin.repository.getEvents(period, period.seasonId ? { seasonId: period.seasonId } : void 0);
    const hero = root.createDiv({ cls: "season-planner-hero" });
    hero.createEl("div", { cls: "season-planner-kicker", text: "RED-BEARD \xB7 SEASON PLANNER" });
    hero.createEl("h1", { text: "Plan the shape of life." });
    hero.createEl("p", { text: "See load, cadence, and seasons before the details become overwhelming." });
    const actions = hero.createDiv({ cls: "season-planner-actions" });
    this.button(actions, "New event", () => this.plugin.newEvent());
    this.button(actions, "New pattern", () => this.plugin.newPattern());
    this.button(actions, "New season", () => this.plugin.newSeason());
    this.button(actions, "Refresh", () => void this.plugin.refresh());
    const manage = hero.createDiv({ cls: "season-planner-manage-actions" });
    this.button(manage, "Manage events", () => new EventManagerModal(this.app, this.plugin).open());
    this.button(manage, "Manage patterns", () => new PatternManagerModal(this.app, this.plugin).open());
    this.button(manage, "Manage seasons", () => new SeasonManagerModal(this.app, this.plugin).open());
    const nav = root.createDiv({ cls: "season-planner-period-nav" });
    const select = nav.createEl("select");
    ["week", "month", "quarter", "year", "season"].forEach((view) => select.createEl("option", { value: view, text: view[0].toUpperCase() + view.slice(1) }));
    select.value = this.plugin.settings.defaultView;
    select.onchange = () => {
      this.plugin.settings.defaultView = select.value;
      void this.plugin.saveSettingsAndRender();
    };
    const date = nav.createEl("input", { type: "date" });
    date.value = this.plugin.selectedAnchor;
    date.onchange = () => {
      this.plugin.selectedAnchor = date.value || this.plugin.selectedAnchor;
      void this.render();
    };
    nav.createSpan({ cls: "season-planner-range-label", text: `${period.from} \u2192 ${period.to}${period.seasonId && activeSeason ? ` \xB7 ${activeSeason.name}` : ""}` });
    const metrics = root.createDiv({ cls: "season-planner-metrics" });
    [[String(summary.eventCount), "planned blocks"], [`${Math.round(summary.totalMinutes / 60)}h`, "estimated load"], [String(summary.occupiedDays), "occupied days"], [summary.band, "load band"]].forEach(([value, label]) => {
      const card = metrics.createDiv({ cls: `season-planner-metric is-${value === summary.band ? summary.band : ""}` });
      card.createEl("strong", { text: value });
      card.createEl("span", { text: label });
    });
    this.heatmap(root, period, events);
    const grid = root.createDiv({ cls: "season-planner-grid" });
    this.summaryCard(grid, "Load at a glance", `This ${period.view} has ${summary.eventCount} planned blocks across ${summary.occupiedDays} days.`, summary);
    this.breakdownCard(grid, "By person", summary.byPerson, "minutes");
    this.breakdownCard(grid, "By weekday", summary.byWeekday, "blocks");
    this.breakdownCard(grid, "By location", summary.byLocation, "blocks");
    this.breakdownCard(grid, "By season", summary.bySeason, "blocks");
    const list2 = root.createDiv({ cls: "season-planner-card season-planner-event-list" });
    list2.createEl("h2", { text: "Planned blocks" });
    list2.createEl("p", { cls: "season-planner-muted", text: "Patterns are shown virtually; only explicit events are stored as notes." });
    if (!events.length) list2.createEl("p", { cls: "season-planner-empty", text: "Nothing planned in this range yet." });
    for (const event of events.slice(0, 30)) {
      const row = list2.createDiv({ cls: "season-planner-event-row" });
      const detail = row.createDiv();
      detail.createEl("strong", { text: event.title });
      detail.createEl("small", { text: `${event.date} \xB7 ${event.durationMinutes} min \xB7 ${event.people.join(", ") || "family"}` });
      row.createEl("button", { text: "Open" }).onclick = () => {
        if (event.source === "event") void this.plugin.openFile(event.path);
        else new import_obsidian2.Notice("This is a virtual recurring occurrence. Open its pattern to edit it.");
      };
    }
    const footer = root.createDiv({ cls: "season-planner-footer-actions" });
    this.button(footer, "Open index", () => void this.plugin.openIndex());
    this.button(footer, "Settings", () => this.plugin.openSettings());
  }
  heatmap(root, period, events) {
    const card = root.createDiv({ cls: "season-planner-card season-planner-heatmap" });
    card.createEl("h2", { text: period.view === "month" ? "Monthly intensity" : period.view === "week" ? "Weekly intensity" : "Period intensity" });
    card.createEl("p", { cls: "season-planner-muted", text: "Darker cells represent more planned minutes and overlapping blocks." });
    const start = /* @__PURE__ */ new Date(`${period.from}T12:00:00`);
    const end = /* @__PURE__ */ new Date(`${period.to}T12:00:00`);
    const days = [];
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const date = cursor.toISOString().slice(0, 10);
      days.push({ date, minutes: 0, count: 0 });
    }
    for (const event of events) {
      const first = days.find((d) => d.date === event.date);
      if (first) {
        first.minutes += event.durationMinutes;
        first.count++;
      }
      if (event.endDate) {
        for (const d of days) if (d.date > event.date && d.date <= event.endDate) {
          d.minutes += event.durationMinutes;
          d.count++;
        }
      }
    }
    const max = Math.max(1, ...days.map((d) => d.minutes));
    const grid = card.createDiv({ cls: `season-planner-heatmap-grid is-${period.view}` });
    days.forEach((day) => {
      const date = /* @__PURE__ */ new Date(`${day.date}T12:00:00`);
      const level = day.minutes === 0 ? 0 : Math.min(4, Math.ceil(day.minutes / max * 4));
      const cell = grid.createDiv({ cls: `season-planner-heat-cell level-${level}` });
      cell.createEl("strong", { text: period.view === "month" ? String(date.getDate()) : date.toLocaleDateString("en-US", { weekday: "short" }) });
      cell.createEl("small", { text: day.minutes ? `${Math.round(day.minutes / 60 * 10) / 10}h \xB7 ${day.count}` : "\u2014" });
      cell.setAttr("title", `${day.date}: ${day.minutes} minutes, ${day.count} blocks`);
    });
  }
  summaryCard(parent, title, text, summary) {
    const card = parent.createDiv({ cls: "season-planner-card" });
    card.createEl("h2", { text: title });
    card.createEl("p", { text });
    const bars = card.createDiv({ cls: "season-planner-bars" });
    Object.entries(summary.byWeekday).forEach(([day, count]) => {
      const row = bars.createDiv({ cls: "season-planner-bar-row" });
      row.createEl("span", { text: day });
      const track = row.createDiv({ cls: "season-planner-bar-track" });
      track.createDiv({ cls: "season-planner-bar-fill" }).style.width = `${Math.min(100, count / Math.max(1, summary.eventCount) * 100)}%`;
      row.createEl("small", { text: String(count) });
    });
  }
  breakdownCard(parent, title, values, unit) {
    const card = parent.createDiv({ cls: "season-planner-card" });
    card.createEl("h2", { text: title });
    const entries = Object.entries(values);
    if (!entries.length) card.createEl("p", { cls: "season-planner-muted", text: "No data in this range." });
    for (const [key, value] of entries.slice(0, 8)) {
      const row = card.createDiv({ cls: "season-planner-breakdown-row" });
      const amount = typeof value === "number" ? value : value.minutes;
      row.createEl("span", { text: key });
      row.createEl("strong", { text: `${amount}${typeof value === "number" ? "" : " min"}` });
      row.createEl("small", { text: typeof value === "number" ? unit : `${value.count} blocks` });
    }
  }
  button(parent, label, action) {
    parent.createEl("button", { text: label, cls: label === "New event" ? "mod-cta" : "" }).onclick = action;
  }
};

// src/dashboard-bridge.ts
function register(app, method, definition) {
  let dispose = () => void 0;
  let timer;
  let tries = 0;
  const attempt = () => {
    var _a, _b, _c;
    const host = (_b = (_a = app.plugins) == null ? void 0 : _a.getPlugin) == null ? void 0 : _b.call(_a, "red-beard-dashboard");
    const fn = host == null ? void 0 : host[method];
    if (fn && host) {
      dispose = (_c = fn.call(host, definition)) != null ? _c : (() => void 0);
      return;
    }
    if (tries++ < 120) timer = window.setTimeout(attempt, 250);
  };
  attempt();
  return () => {
    if (timer !== void 0) window.clearTimeout(timer);
    dispose();
  };
}
var registerDashboardModule = (app, definition) => register(app, "registerModule", definition);
var registerDashboardWidget = (app, definition) => register(app, "registerWidget", definition);

// src/repository.ts
var import_obsidian3 = require("obsidian");
var SeasonPlannerRepository = class {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
  }
  get root() {
    return normalizePath(this.settings.rootFolder);
  }
  updateSettings(settings) {
    this.settings = settings;
  }
  async initialize() {
    await ensureFolders(this.app.vault, [this.root, this.settings.seasonsFolder, this.settings.eventsFolder, this.settings.patternsFolder, this.settings.peopleFolder, this.settings.reportsFolder, this.settings.categoriesFolder]);
  }
  files(folder) {
    const prefix = `${normalizePath(folder).replace(/\/$/, "")}/`;
    return this.app.vault.getMarkdownFiles().filter((file) => file.path.startsWith(prefix));
  }
  fm(file) {
    var _a, _b;
    return (_b = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) != null ? _b : {};
  }
  text(fm, key, fallback = "") {
    return fm[key] === void 0 || fm[key] === null ? fallback : String(fm[key]);
  }
  seasons() {
    return this.files(this.settings.seasonsFolder).map((file) => {
      const fm = this.fm(file);
      return { id: this.text(fm, "season_id", id(this.settings.idPrefix, file.path)), name: this.text(fm, "name", file.basename), status: ["active", "planned", "completed", "archived"].includes(this.text(fm, "status")) ? this.text(fm, "status") : "active", startDate: this.text(fm, "start_date", ""), endDate: this.text(fm, "end_date", ""), description: this.text(fm, "description", ""), path: file.path };
    }).sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name));
  }
  events() {
    return this.files(this.settings.eventsFolder).map((file) => {
      var _a;
      const fm = this.fm(file);
      return { id: this.text(fm, "event_id", id(this.settings.idPrefix, file.path)), title: this.text(fm, "title", file.basename), date: this.text(fm, "date", isoToday()), endDate: this.text(fm, "end_date") || void 0, durationMinutes: Number((_a = fm.duration_minutes) != null ? _a : 60), people: list(fm.people), locations: list(fm.locations), seasons: list(fm.seasons), categories: list(fm.categories), status: ["planned", "completed", "cancelled"].includes(this.text(fm, "status")) ? this.text(fm, "status") : "planned", notes: this.text(fm, "notes"), path: file.path, source: "event" };
    }).filter((event) => event.status !== "cancelled");
  }
  patterns() {
    return this.files(this.settings.patternsFolder).map((file) => {
      var _a;
      const fm = this.fm(file);
      return { id: this.text(fm, "pattern_id", id(this.settings.idPrefix, file.path)), title: this.text(fm, "title", file.basename), frequency: ["weekly", "biweekly", "monthly", "quarterly"].includes(this.text(fm, "frequency")) ? this.text(fm, "frequency") : "weekly", weekday: fm.weekday === void 0 ? void 0 : Number(fm.weekday), dayOfMonth: fm.day_of_month === void 0 ? void 0 : Number(fm.day_of_month), startDate: this.text(fm, "start_date", isoToday()), endDate: this.text(fm, "end_date") || void 0, durationMinutes: Number((_a = fm.duration_minutes) != null ? _a : 60), people: list(fm.people), locations: list(fm.locations), seasons: list(fm.seasons), categories: list(fm.categories), path: file.path };
    });
  }
  people() {
    const result = [];
    for (const file of this.files(this.settings.peopleFolder)) {
      const fm = this.fm(file);
      result.push({ id: this.text(fm, "person_id", id(this.settings.idPrefix, file.path)), name: this.text(fm, "name", file.basename), role: this.text(fm, "role", "person"), path: file.path, source: "season-planner" });
    }
    if (this.settings.familyIntegration) {
      for (const file of this.app.vault.getMarkdownFiles().filter((f) => /(^|\/)Marriage Companion\/(Members|Children)\//.test(f.path))) {
        const fm = this.fm(file);
        const memberId = this.text(fm, "member_id", this.text(fm, "child_id"));
        if (!memberId) continue;
        if (!result.some((item) => item.id === memberId)) result.push({ id: memberId, name: this.text(fm, "name", file.basename), role: this.text(fm, "role", "family member"), path: file.path, source: "family-companion" });
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }
  async createSeason(input) {
    await this.initialize();
    const seasonId = id(this.settings.idPrefix, `${input.name}:${Date.now()}`);
    const path = normalizePath(`${this.settings.seasonsFolder}/${safeName(input.name)}.md`);
    if (this.app.vault.getAbstractFileByPath(path)) throw new Error("A season with that name already exists.");
    return this.app.vault.create(path, `---
type: season-planner-season
schema_version: 1
season_id: ${seasonId}
name: ${yaml(input.name)}
status: active
start_date: ${input.startDate}
end_date: ${input.endDate}
description: ${yaml(input.description)}
created: ${(/* @__PURE__ */ new Date()).toISOString()}
updated: ${(/* @__PURE__ */ new Date()).toISOString()}
---

# ${input.name}

## Season intent

${input.description}

<!-- season-planner:summary:start -->
Load summary will be generated here.
<!-- season-planner:summary:end -->
`);
  }
  async createEvent(input) {
    var _a;
    await this.initialize();
    await this.ensureCategoryFiles(input.categories);
    const eventId = id(this.settings.idPrefix, `${input.title}:${input.date}:${Date.now()}`);
    const base = `${input.date} - ${safeName(input.title)}`;
    let path = normalizePath(`${this.settings.eventsFolder}/${base}.md`);
    let n = 2;
    while (this.app.vault.getAbstractFileByPath(path)) path = normalizePath(`${this.settings.eventsFolder}/${base} ${n++}.md`);
    return this.app.vault.create(path, `---
type: season-planner-event
schema_version: 1
event_id: ${eventId}
title: ${yaml(input.title)}
status: ${(_a = input.status) != null ? _a : "planned"}
date: ${input.date}
end_date: ${input.endDate ? input.endDate : "null"}
duration_minutes: ${input.durationMinutes}
people: ${JSON.stringify(input.people)}
locations: ${JSON.stringify(input.locations)}
seasons: ${JSON.stringify(input.seasons)}
categories: ${JSON.stringify(input.categories)}
created: ${(/* @__PURE__ */ new Date()).toISOString()}
updated: ${(/* @__PURE__ */ new Date()).toISOString()}
---

# ${input.title}

${input.notes}
`);
  }
  async updateSeason(record, input) {
    const file = this.app.vault.getAbstractFileByPath(record.path);
    if (!(file instanceof import_obsidian3.TFile)) throw new Error("Season note not found.");
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm.name = input.name;
      fm.start_date = input.startDate;
      fm.end_date = input.endDate;
      fm.description = input.description;
      fm.status = input.status;
      fm.updated = (/* @__PURE__ */ new Date()).toISOString();
    });
  }
  async updateEvent(record, input) {
    const file = this.app.vault.getAbstractFileByPath(record.path);
    if (!(file instanceof import_obsidian3.TFile)) throw new Error("Event note not found.");
    await this.ensureCategoryFiles(input.categories);
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      var _a;
      fm.title = input.title;
      fm.date = input.date;
      fm.end_date = (_a = input.endDate) != null ? _a : null;
      fm.duration_minutes = input.durationMinutes;
      fm.people = input.people;
      fm.locations = input.locations;
      fm.seasons = input.seasons;
      fm.categories = input.categories;
      fm.status = input.status;
      fm.updated = (/* @__PURE__ */ new Date()).toISOString();
    });
    await this.app.vault.process(file, (current) => {
      const marker = current.indexOf("\n---", 3);
      if (marker < 0) return current;
      const bodyStart = current.indexOf("\n", marker + 4);
      if (bodyStart < 0) return current;
      const heading = `# ${input.title}`;
      const body = current.slice(bodyStart + 1).replace(/^# .*?(\r?\n)/, `${heading}$1`);
      return `${current.slice(0, bodyStart + 1)}${body}`;
    });
  }
  async updatePattern(record, input) {
    const file = this.app.vault.getAbstractFileByPath(record.path);
    if (!(file instanceof import_obsidian3.TFile)) throw new Error("Pattern note not found.");
    await this.ensureCategoryFiles(input.categories);
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      var _a, _b, _c;
      fm.title = input.title;
      fm.frequency = input.frequency;
      fm.weekday = (_a = input.weekday) != null ? _a : null;
      fm.day_of_month = (_b = input.dayOfMonth) != null ? _b : null;
      fm.start_date = input.startDate;
      fm.end_date = (_c = input.endDate) != null ? _c : null;
      fm.duration_minutes = input.durationMinutes;
      fm.people = input.people;
      fm.locations = input.locations;
      fm.seasons = input.seasons;
      fm.categories = input.categories;
      fm.updated = (/* @__PURE__ */ new Date()).toISOString();
    });
  }
  async deleteRecord(path) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof import_obsidian3.TFile) await this.app.vault.trash(file, true);
  }
  async createPattern(input) {
    var _a, _b;
    await this.initialize();
    await this.ensureCategoryFiles(input.categories);
    const patternId = id(this.settings.idPrefix, `${input.title}:${Date.now()}`);
    const path = normalizePath(`${this.settings.patternsFolder}/${safeName(input.title)}.md`);
    if (this.app.vault.getAbstractFileByPath(path)) throw new Error("A pattern with that name already exists.");
    return this.app.vault.create(path, `---
type: season-planner-pattern
schema_version: 1
pattern_id: ${patternId}
title: ${yaml(input.title)}
frequency: ${input.frequency}
weekday: ${(_a = input.weekday) != null ? _a : "null"}
day_of_month: ${(_b = input.dayOfMonth) != null ? _b : "null"}
start_date: ${input.startDate}
end_date: ${input.endDate ? input.endDate : "null"}
duration_minutes: ${input.durationMinutes}
people: ${JSON.stringify(input.people)}
locations: ${JSON.stringify(input.locations)}
seasons: ${JSON.stringify(input.seasons)}
categories: ${JSON.stringify(input.categories)}
created: ${(/* @__PURE__ */ new Date()).toISOString()}
updated: ${(/* @__PURE__ */ new Date()).toISOString()}
---

# ${input.title}

Recurring planning pattern.
`);
  }
  async rebuildCategoryFiles() {
    await this.initialize();
    const values = [...this.events(), ...this.patterns()].flatMap((record) => record.categories);
    await this.ensureCategoryFiles(values);
  }
  async ensureCategoryFiles(values) {
    await this.initialize();
    for (const category of [...new Set(values.map((value) => value.trim()).filter(Boolean))]) {
      const path = normalizePath(`${this.settings.categoriesFolder}/${safeName(category)}.md`);
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing) continue;
      const categoryId = id(`${this.settings.idPrefix}-CAT`, category.toLowerCase());
      await this.app.vault.create(path, `---
type: season-planner-category
schema_version: 1
category_id: ${categoryId}
name: ${yaml(category)}
status: active
created: ${(/* @__PURE__ */ new Date()).toISOString()}
updated: ${(/* @__PURE__ */ new Date()).toISOString()}
---

# ${category}

Planning category used to group events and recurring patterns.
`);
    }
  }
  async getEvents(range, filters) {
    const explicit = this.events().filter((event) => {
      var _a;
      return event.date <= range.to && ((_a = event.endDate) != null ? _a : event.date) >= range.from;
    });
    const virtual = this.patterns().flatMap((pattern) => datesForPattern(pattern, range));
    const all = [...explicit, ...virtual];
    const season = (filters == null ? void 0 : filters.seasonId) ? this.seasons().find((item) => item.id === filters.seasonId || item.name === filters.seasonId) : void 0;
    return all.filter((event) => !(filters == null ? void 0 : filters.personId) || event.people.includes(filters.personId)).filter((event) => !(filters == null ? void 0 : filters.seasonId) || event.seasons.includes(filters.seasonId) || Boolean(season && event.seasons.includes(season.name))).filter((event) => !(filters == null ? void 0 : filters.location) || event.locations.includes(filters.location)).filter((event) => !(filters == null ? void 0 : filters.category) || event.categories.includes(filters.category)).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  }
  async getLoadSummary(range, people) {
    var _a, _b, _c, _d;
    const events = await this.getEvents(range, (people == null ? void 0 : people.length) === 1 ? { personId: people[0] } : void 0);
    const byPerson = {};
    const byWeekday = {};
    const byLocation = {};
    const bySeason = {};
    const days = /* @__PURE__ */ new Set();
    let minutes = 0;
    for (const event of events) {
      minutes += event.durationMinutes;
      days.add(event.date);
      const day = (/* @__PURE__ */ new Date(`${event.date}T12:00:00`)).toLocaleDateString("en-US", { weekday: "short" });
      byWeekday[day] = ((_a = byWeekday[day]) != null ? _a : 0) + 1;
      for (const person of event.people.length ? event.people : ["family"]) {
        const row = (_b = byPerson[person]) != null ? _b : { count: 0, minutes: 0 };
        row.count += 1;
        row.minutes += event.durationMinutes;
        byPerson[person] = row;
      }
      for (const location of event.locations.length ? event.locations : ["Unspecified"]) byLocation[location] = ((_c = byLocation[location]) != null ? _c : 0) + 1;
      for (const season of event.seasons.length ? event.seasons : ["Unassigned"]) bySeason[season] = ((_d = bySeason[season]) != null ? _d : 0) + 1;
    }
    const average = days.size ? minutes / 60 / days.size : 0;
    const band = average >= 3 || minutes >= 1200 ? "high" : average >= 1.25 || minutes >= 480 ? "medium" : "low";
    return { from: range.from, to: range.to, eventCount: events.length, totalMinutes: minutes, occupiedDays: days.size, byPerson, byWeekday, byLocation, bySeason, band };
  }
  async refreshIndex() {
    await this.initialize();
    const range = { ...{ from: `${(/* @__PURE__ */ new Date()).getFullYear()}-01-01`, to: `${(/* @__PURE__ */ new Date()).getFullYear()}-12-31`, view: "year" } };
    const summary = await this.getLoadSummary(range);
    const body = [`# Season Planner Index`, ``, `<!-- season-planner:index:start -->`, `## Current year`, ``, `- Planned blocks: ${summary.eventCount}`, `- Estimated load: ${Math.round(summary.totalMinutes / 60)} hours`, `- Occupied days: ${summary.occupiedDays}`, `- Load band: ${summary.band}`, ``, `## Seasons`, ``, ...this.seasons().map((s) => `- [[${s.path.replace(/\.md$/, "")}|${s.name}]] \u2014 ${s.status} \xB7 ${s.startDate} to ${s.endDate}`) || ["No seasons yet."], ``, `<!-- season-planner:index:end -->`].join("\n");
    const existing = this.app.vault.getAbstractFileByPath(this.settings.indexFile);
    if (existing instanceof import_obsidian3.TFile) await this.app.vault.process(existing, (current) => current === body ? current : body);
    else await this.app.vault.create(this.settings.indexFile, `${body}
`);
  }
};

// src/settings.ts
var import_obsidian4 = require("obsidian");
var SeasonPlannerSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const el = this.containerEl;
    el.empty();
    el.createEl("h2", { text: "Season Planner" });
    el.createEl("h3", { text: "Storage" });
    this.path(el, "Root folder", "rootFolder");
    this.path(el, "Seasons folder", "seasonsFolder");
    this.path(el, "Events folder", "eventsFolder");
    this.path(el, "Patterns folder", "patternsFolder");
    this.path(el, "People folder", "peopleFolder");
    this.path(el, "Reports folder", "reportsFolder");
    this.path(el, "Categories folder", "categoriesFolder");
    this.path(el, "Index file", "indexFile");
    el.createEl("h3", { text: "Planning defaults" });
    new import_obsidian4.Setting(el).setName("Default view").addDropdown((d) => d.addOptions({ week: "Week", month: "Month", quarter: "Quarter", year: "Year", season: "Active season" }).setValue(this.plugin.settings.defaultView).onChange(async (v) => {
      this.plugin.settings.defaultView = v;
      await this.plugin.saveSettingsAndRender();
    }));
    new import_obsidian4.Setting(el).setName("Default duration (minutes)").addText((t) => t.setValue(String(this.plugin.settings.defaultDurationMinutes)).onChange(async (v) => {
      this.plugin.settings.defaultDurationMinutes = Number(v) || 60;
      await this.plugin.saveSettingsAndRender();
    }));
    new import_obsidian4.Setting(el).setName("Week starts on").addDropdown((d) => d.addOptions({ "0": "Sunday", "1": "Monday" }).setValue(String(this.plugin.settings.weekStartsOn)).onChange(async (v) => {
      this.plugin.settings.weekStartsOn = Number(v);
      await this.plugin.saveSettingsAndRender();
    }));
    el.createEl("h3", { text: "Integrations" });
    this.toggle(el, "Family Companion", "familyIntegration");
    this.toggle(el, "Journal Companion", "journalIntegration");
    this.toggle(el, "Study Planner", "studyIntegration");
    el.createEl("h3", { text: "Dashboard and privacy" });
    this.toggle(el, "Open dashboard at startup", "startup");
    this.toggle(el, "Compact layout", "compact");
    new import_obsidian4.Setting(el).setName("Refresh interval (seconds)").setDesc("0 disables automatic refresh.").addText((t) => t.setValue(String(this.plugin.settings.autoRefreshSeconds)).onChange(async (v) => {
      this.plugin.settings.autoRefreshSeconds = Math.max(0, Number(v) || 0);
      await this.plugin.saveSettingsAndRender();
    }));
    el.createEl("p", { cls: "season-planner-muted", text: "Season Planner stores ordinary Markdown. It does not encrypt records or sync calendars." });
  }
  path(el, name, key) {
    new import_obsidian4.Setting(el).setName(name).addText((t) => t.setValue(String(this.plugin.settings[key])).onChange(async (v) => {
      this.plugin.settings[key] = v.trim();
      await this.plugin.saveSettingsAndRender();
    }));
  }
  toggle(el, name, key) {
    new import_obsidian4.Setting(el).setName(name).addToggle((t) => t.setValue(Boolean(this.plugin.settings[key])).onChange(async (v) => {
      this.plugin.settings[key] = v;
      await this.plugin.saveSettingsAndRender();
    }));
  }
};

// src/types.ts
var DEFAULT_SETTINGS = { settingsVersion: 1, rootFolder: "Collections/Season Planner", seasonsFolder: "Collections/Season Planner/Seasons", eventsFolder: "Collections/Season Planner/Events", patternsFolder: "Collections/Season Planner/Patterns", peopleFolder: "Collections/Season Planner/People", reportsFolder: "Collections/Season Planner/Reports", categoriesFolder: "Collections/Season Planner/Categories", indexFile: "Collections/Season Planner/Season Planner Index.md", idPrefix: "SPL", filenameTemplate: "YYYY-MM-DD - {title}", weekStartsOn: 1, defaultView: "week", defaultDurationMinutes: 60, showOptionalTimes: false, compact: false, startup: false, autoRefreshSeconds: 0, familyIntegration: true, journalIntegration: true, studyIntegration: true, showEmptySections: false };

// src/main.ts
var SeasonPlannerPlugin = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
    this.selectedAnchor = isoToday();
    this.timer = null;
    this.disposals = [];
  }
  async onload() {
    var _a;
    try {
      this.settings = { ...DEFAULT_SETTINGS, ...(_a = await this.loadData()) != null ? _a : {} };
      this.repository = new SeasonPlannerRepository(this.app, this.settings);
      this.registerView(VIEW_ID, (leaf) => new SeasonPlannerView(leaf, this));
      this.addSettingTab(new SeasonPlannerSettingTab(this.app, this));
      this.addRibbonIcon("calendar-range", "Open Season Planner", () => void this.openDashboard());
      this.addCommand({ id: "open-dashboard", name: "Open dashboard", callback: () => void this.openDashboard() });
      this.addCommand({ id: "new-event", name: "New planning event", callback: () => this.newEvent() });
      this.addCommand({ id: "new-pattern", name: "New recurring pattern", callback: () => this.newPattern() });
      this.addCommand({ id: "new-season", name: "New season", callback: () => this.newSeason() });
      this.addCommand({ id: "manage-seasons", name: "Manage seasons", callback: () => this.manageSeasons() });
      this.addCommand({ id: "manage-patterns", name: "Manage recurring patterns", callback: () => this.managePatterns() });
      this.addCommand({ id: "manage-events", name: "Manage planning events", callback: () => this.manageEvents() });
      this.addCommand({ id: "rebuild-category-files", name: "Rebuild category notes", callback: () => void this.repository.rebuildCategoryFiles().then(() => new import_obsidian5.Notice("Season Planner category notes rebuilt.")) });
      this.addCommand({ id: "open-week", name: "Open week view", callback: () => void this.openPeriod("week") });
      this.addCommand({ id: "open-month", name: "Open month view", callback: () => void this.openPeriod("month") });
      this.addCommand({ id: "open-quarter", name: "Open quarter view", callback: () => void this.openPeriod("quarter") });
      this.addCommand({ id: "open-year", name: "Open year view", callback: () => void this.openPeriod("year") });
      this.addCommand({ id: "refresh", name: "Refresh summaries", callback: () => void this.refresh() });
      this.addCommand({ id: "open-index", name: "Open Season Planner index", callback: () => void this.openIndex() });
      this.registerEvent(this.app.metadataCache.on("changed", (file) => {
        if (file.path.startsWith(`${this.repository.root}/`)) this.scheduleRefresh();
      }));
      this.registerEvent(this.app.vault.on("delete", (file) => {
        if (file.path.startsWith(`${this.repository.root}/`)) this.scheduleRefresh();
      }));
      this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
        if (file.path.startsWith(`${this.repository.root}/`) || oldPath.startsWith(`${this.repository.root}/`)) this.scheduleRefresh();
      }));
      this.registerDashboardIntegrations();
      if (this.settings.startup) await this.openDashboard();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error("[Season Planner] Failed to load", error);
      new import_obsidian5.Notice(`Season Planner failed to load: ${detail}`);
    }
  }
  async onunload() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.disposals.forEach((dispose) => dispose());
    this.app.workspace.detachLeavesOfType(VIEW_ID);
  }
  async saveSettingsAndRender() {
    await this.saveData(this.settings);
    this.repository.updateSettings(this.settings);
    await this.refresh();
  }
  async openDashboard() {
    await this.repository.initialize();
    let leaf = this.app.workspace.getLeavesOfType(VIEW_ID)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_ID, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    const view = leaf.view;
    if (view instanceof SeasonPlannerView) await view.render();
  }
  newEvent() {
    new EventModal(this.app, this).open();
  }
  newPattern() {
    new PatternModal(this.app, this).open();
  }
  newSeason() {
    new SeasonModal(this.app, this).open();
  }
  manageSeasons() {
    new SeasonManagerModal(this.app, this).open();
  }
  managePatterns() {
    new PatternManagerModal(this.app, this).open();
  }
  manageEvents() {
    new EventManagerModal(this.app, this).open();
  }
  openSettings() {
    var _a;
    const setting = this.app.setting;
    setting == null ? void 0 : setting.open();
    (_a = setting == null ? void 0 : setting.openTabById) == null ? void 0 : _a.call(setting, this.manifest.id);
  }
  async openPeriod(view) {
    this.settings.defaultView = view;
    await this.openDashboard();
  }
  async refresh() {
    var _a;
    await this.repository.initialize();
    const view = (_a = this.app.workspace.getLeavesOfType(VIEW_ID)[0]) == null ? void 0 : _a.view;
    if (view instanceof SeasonPlannerView) await view.render();
  }
  async openIndex() {
    await this.repository.refreshIndex();
    const file = this.app.vault.getAbstractFileByPath(this.settings.indexFile);
    if (file instanceof import_obsidian5.TFile) await this.app.workspace.getLeaf("tab").openFile(file);
  }
  async openFile(path) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof import_obsidian5.TFile) await this.app.workspace.getLeaf("tab").openFile(file);
  }
  async getLoadSummary(range, people) {
    return this.repository.getLoadSummary(range, people);
  }
  async getEvents(range, filters) {
    return this.repository.getEvents(range, filters);
  }
  async getActiveSeasons(date = isoToday()) {
    return this.repository.seasons().filter((s) => s.status === "active" && s.startDate <= date && s.endDate >= date);
  }
  openEvent(id2) {
    var _a;
    const file = (_a = this.repository.events().find((e) => e.id === id2)) == null ? void 0 : _a.path;
    if (file) void this.openFile(file);
  }
  openSeason(id2) {
    var _a;
    const file = (_a = this.repository.seasons().find((s) => s.id === id2)) == null ? void 0 : _a.path;
    if (file) void this.openFile(file);
  }
  registerDashboardIntegrations() {
    const command = "season-planner:open-dashboard";
    this.disposals.push(registerDashboardModule(this.app, { id: "season-planner", name: "Season Planner", command, icon: "calendar-range", description: "Life load, cadence, and overlapping seasons.", order: 65 }));
    this.disposals.push(registerDashboardWidget(this.app, { id: "season-planner/load", name: "Season Planner", description: "Current period load and cadence.", icon: "calendar-range", defaultLayout: { w: 4, mobileW: 12, h: 3, order: 65 }, mobile: "responsive", render: async (_ctx, container) => {
      const summary = await this.repository.getLoadSummary(dateRange(this.settings.defaultView, this.selectedAnchor));
      container.createEl("strong", { text: `${summary.eventCount} planned blocks \xB7 ${Math.round(summary.totalMinutes / 60)}h` });
      container.createEl("p", { text: `${summary.occupiedDays} occupied days \xB7 ${summary.band} load` });
      const button = container.createEl("button", { text: "Open Season Planner" });
      button.onclick = () => openCommand(this.app, command, () => void this.openDashboard());
    } }));
  }
  scheduleRefresh() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      void this.refresh().catch((error) => {
        console.error("[Season Planner] Refresh failed", error);
        new import_obsidian5.Notice("Season Planner could not refresh.");
      });
    }, 350);
  }
};
