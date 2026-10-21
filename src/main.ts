import { Notice, Plugin, TFile } from "obsidian";
import { SeasonPlannerView, VIEW_ID } from "./dashboard";
import { registerDashboardModule, registerDashboardWidget } from "./dashboard-bridge";
import { EventManagerModal, EventModal, PatternManagerModal, PatternModal, SeasonManagerModal, SeasonModal } from "./modals";
import { SeasonPlannerRepository } from "./repository";
import { SeasonPlannerSettingTab } from "./settings";
import { DEFAULT_SETTINGS, type PlannerRange, type PlannerSettings, type SeasonPlannerBridge } from "./types";
import { dateRange, isoToday, openCommand } from "./utils";

export default class SeasonPlannerPlugin extends Plugin implements SeasonPlannerBridge {
  settings: PlannerSettings = { ...DEFAULT_SETTINGS };
  repository!: SeasonPlannerRepository;
  selectedAnchor = isoToday();
  private timer: number | null = null;
  private disposals: Array<() => void> = [];
  async onload(): Promise<void> {
    try {
      this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData() as Partial<PlannerSettings> | null ?? {}) };
    this.repository = new SeasonPlannerRepository(this.app, this.settings);
    this.registerView(VIEW_ID, leaf => new SeasonPlannerView(leaf, this));
    this.addSettingTab(new SeasonPlannerSettingTab(this.app, this));
    this.addRibbonIcon("calendar-range", "Open Season Planner", () => void this.openDashboard());
    this.addCommand({ id: "open-dashboard", name: "Open dashboard", callback: () => void this.openDashboard() });
    this.addCommand({ id: "new-event", name: "New planning event", callback: () => this.newEvent() });
    this.addCommand({ id: "new-pattern", name: "New recurring pattern", callback: () => this.newPattern() });
    this.addCommand({ id: "new-season", name: "New season", callback: () => this.newSeason() });
    this.addCommand({ id: "manage-seasons", name: "Manage seasons", callback: () => this.manageSeasons() });
    this.addCommand({ id: "manage-patterns", name: "Manage recurring patterns", callback: () => this.managePatterns() });
    this.addCommand({ id: "manage-events", name: "Manage planning events", callback: () => this.manageEvents() });
    this.addCommand({ id: "rebuild-category-files", name: "Rebuild category notes", callback: () => void this.repository.rebuildCategoryFiles().then(() => new Notice("Season Planner category notes rebuilt.")) });
    this.addCommand({ id: "open-week", name: "Open week view", callback: () => void this.openPeriod("week") });
    this.addCommand({ id: "open-month", name: "Open month view", callback: () => void this.openPeriod("month") });
    this.addCommand({ id: "open-quarter", name: "Open quarter view", callback: () => void this.openPeriod("quarter") });
    this.addCommand({ id: "open-year", name: "Open year view", callback: () => void this.openPeriod("year") });
    this.addCommand({ id: "refresh", name: "Refresh summaries", callback: () => void this.refresh() });
    this.addCommand({ id: "open-index", name: "Open Season Planner index", callback: () => void this.openIndex() });
    this.registerEvent(this.app.metadataCache.on("changed", file => { if (file.path.startsWith(`${this.repository.root}/`)) this.scheduleRefresh(); }));
    this.registerEvent(this.app.vault.on("delete", file => { if (file.path.startsWith(`${this.repository.root}/`)) this.scheduleRefresh(); }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => { if (file.path.startsWith(`${this.repository.root}/`) || oldPath.startsWith(`${this.repository.root}/`)) this.scheduleRefresh(); }));
    this.registerDashboardIntegrations();
      if (this.settings.startup) await this.openDashboard();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error("[Season Planner] Failed to load", error);
      new Notice(`Season Planner failed to load: ${detail}`);
    }
  }
  async onunload(): Promise<void> { if (this.timer !== null) window.clearTimeout(this.timer); this.disposals.forEach(dispose => dispose()); this.app.workspace.detachLeavesOfType(VIEW_ID); }
  async saveSettingsAndRender(): Promise<void> { await this.saveData(this.settings); this.repository.updateSettings(this.settings); await this.refresh(); }
  async openDashboard(): Promise<void> { await this.repository.initialize(); let leaf = this.app.workspace.getLeavesOfType(VIEW_ID)[0]; if (!leaf) { leaf = this.app.workspace.getLeaf("tab"); await leaf.setViewState({ type: VIEW_ID, active: true }); } await this.app.workspace.revealLeaf(leaf); const view = leaf.view; if (view instanceof SeasonPlannerView) await view.render(); }
  newEvent(): void { new EventModal(this.app, this).open(); }
  newPattern(): void { new PatternModal(this.app, this).open(); }
  newSeason(): void { new SeasonModal(this.app, this).open(); }
  manageSeasons(): void { new SeasonManagerModal(this.app, this).open(); }
  managePatterns(): void { new PatternManagerModal(this.app, this).open(); }
  manageEvents(): void { new EventManagerModal(this.app, this).open(); }
  openSettings(): void { const setting = (this.app as typeof this.app & { setting?: { open(): void; openTabById?: (id: string) => void } }).setting; setting?.open(); setting?.openTabById?.(this.manifest.id); }
  async openPeriod(view: PlannerSettings["defaultView"]): Promise<void> { this.settings.defaultView = view; await this.openDashboard(); }
  async refresh(): Promise<void> { await this.repository.initialize(); const view = this.app.workspace.getLeavesOfType(VIEW_ID)[0]?.view; if (view instanceof SeasonPlannerView) await view.render(); }
  async openIndex(): Promise<void> { await this.repository.refreshIndex(); const file = this.app.vault.getAbstractFileByPath(this.settings.indexFile); if (file instanceof TFile) await this.app.workspace.getLeaf("tab").openFile(file); }
  async openFile(path: string): Promise<void> { const file = this.app.vault.getAbstractFileByPath(path); if (file instanceof TFile) await this.app.workspace.getLeaf("tab").openFile(file); }
  async getLoadSummary(range: PlannerRange, people?: string[]) { return this.repository.getLoadSummary(range, people); }
  async getEvents(range: PlannerRange, filters?: Parameters<SeasonPlannerRepository["getEvents"]>[1]) { return this.repository.getEvents(range, filters); }
  async getActiveSeasons(date = isoToday()) { return this.repository.seasons().filter(s => s.status === "active" && s.startDate <= date && s.endDate >= date); }
  openEvent(id: string): void { const file = this.repository.events().find(e => e.id === id)?.path; if (file) void this.openFile(file); }
  openSeason(id: string): void { const file = this.repository.seasons().find(s => s.id === id)?.path; if (file) void this.openFile(file); }
  private registerDashboardIntegrations(): void {
    const command = "season-planner:open-dashboard";
    this.disposals.push(registerDashboardModule(this.app, { id: "season-planner", name: "Season Planner", command, icon: "calendar-range", description: "Life load, cadence, and overlapping seasons.", order: 65 }));
    this.disposals.push(registerDashboardWidget(this.app, { id: "season-planner/load", name: "Season Planner", description: "Current period load and cadence.", icon: "calendar-range", defaultLayout: { w: 4, mobileW: 12, h: 3, order: 65 }, mobile: "responsive", render: async (_ctx, container) => { const summary = await this.repository.getLoadSummary(dateRange(this.settings.defaultView, this.selectedAnchor)); container.createEl("strong", { text: `${summary.eventCount} planned blocks · ${Math.round(summary.totalMinutes / 60)}h` }); container.createEl("p", { text: `${summary.occupiedDays} occupied days · ${summary.band} load` }); const button = container.createEl("button", { text: "Open Season Planner" }); button.onclick = () => openCommand(this.app, command, () => void this.openDashboard()); } }));
  }
  private scheduleRefresh(): void { if (this.timer !== null) window.clearTimeout(this.timer); this.timer = window.setTimeout(() => { this.timer = null; void this.refresh().catch(error => { console.error("[Season Planner] Refresh failed", error); new Notice("Season Planner could not refresh."); }); }, 350); }
}
