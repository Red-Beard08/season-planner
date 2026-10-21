import type { App, TFile } from "obsidian";

export type PeriodView = "week" | "month" | "quarter" | "year" | "season";
export type LoadBand = "low" | "medium" | "high";
export type PatternFrequency = "weekly" | "biweekly" | "monthly" | "quarterly";

export interface PlannerSettings {
  settingsVersion: number; rootFolder: string; seasonsFolder: string; eventsFolder: string; patternsFolder: string; peopleFolder: string; reportsFolder: string; categoriesFolder: string; indexFile: string;
  idPrefix: string; filenameTemplate: string; weekStartsOn: number; defaultView: PeriodView; defaultDurationMinutes: number; showOptionalTimes: boolean; compact: boolean; startup: boolean; autoRefreshSeconds: number; familyIntegration: boolean; journalIntegration: boolean; studyIntegration: boolean; showEmptySections: boolean;
}
export const DEFAULT_SETTINGS: PlannerSettings = { settingsVersion: 1, rootFolder: "Collections/Season Planner", seasonsFolder: "Collections/Season Planner/Seasons", eventsFolder: "Collections/Season Planner/Events", patternsFolder: "Collections/Season Planner/Patterns", peopleFolder: "Collections/Season Planner/People", reportsFolder: "Collections/Season Planner/Reports", categoriesFolder: "Collections/Season Planner/Categories", indexFile: "Collections/Season Planner/Season Planner Index.md", idPrefix: "SPL", filenameTemplate: "YYYY-MM-DD - {title}", weekStartsOn: 1, defaultView: "week", defaultDurationMinutes: 60, showOptionalTimes: false, compact: false, startup: false, autoRefreshSeconds: 0, familyIntegration: true, journalIntegration: true, studyIntegration: true, showEmptySections: false };

export interface SeasonRecord { id: string; name: string; status: "active" | "planned" | "completed" | "archived"; startDate: string; endDate: string; description: string; path: string; }
export interface PersonRecord { id: string; name: string; role: string; source?: string; path?: string; }
export interface PlannerEvent { id: string; title: string; date: string; endDate?: string; durationMinutes: number; people: string[]; locations: string[]; seasons: string[]; categories: string[]; status: "planned" | "completed" | "cancelled"; notes: string; path: string; source: string; }
export interface PatternRecord { id: string; title: string; frequency: PatternFrequency; weekday?: number; dayOfMonth?: number; startDate: string; endDate?: string; durationMinutes: number; people: string[]; locations: string[]; seasons: string[]; categories: string[]; path: string; }
export interface LoadSummary { from: string; to: string; eventCount: number; totalMinutes: number; occupiedDays: number; byPerson: Record<string, { count: number; minutes: number }>; byWeekday: Record<string, number>; byLocation: Record<string, number>; bySeason: Record<string, number>; band: LoadBand; }
export interface PlannerRange { from: string; to: string; view: PeriodView; seasonId?: string; }
export interface PlannerFilters { personId?: string; seasonId?: string; location?: string; category?: string; }
export interface SeasonPlannerBridge { getLoadSummary(range: PlannerRange, people?: string[]): Promise<LoadSummary>; getEvents(range: PlannerRange, filters?: PlannerFilters): Promise<PlannerEvent[]>; getActiveSeasons(date?: string): Promise<SeasonRecord[]>; openEvent(id: string): void; openSeason(id: string): void; }
export interface DashboardWidgetDefinition { id: string; name: string; description?: string; icon?: string; defaultLayout: { w: number; mobileW: number; h: number; order?: number }; mobile?: "stack" | "responsive" | "hidden"; render: (ctx: unknown, container: HTMLElement) => void | Promise<void>; cleanup?: () => void; }
export type FileLike = TFile;
export type PluginApp = App;
