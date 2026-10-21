import type { App } from "obsidian";
import type { DashboardWidgetDefinition } from "./types";
export interface DashboardModuleDefinition { id: string; name: string; command: string; icon?: string; description?: string; order?: number; }
type Host = { registerModule?: (definition: DashboardModuleDefinition) => (() => void); registerWidget?: (definition: DashboardWidgetDefinition) => (() => void); };
function register<T>(app: App, method: "registerModule" | "registerWidget", definition: T): () => void { let dispose: () => void = () => undefined; let timer: number | undefined; let tries = 0; const attempt = () => { const host = (app as App & { plugins?: { getPlugin?: (id: string) => unknown } }).plugins?.getPlugin?.("red-beard-dashboard") as Host | undefined; const fn = host?.[method] as ((d: T) => (() => void)) | undefined; if (fn && host) { dispose = fn.call(host, definition) ?? (() => undefined); return; } if (tries++ < 120) timer = window.setTimeout(attempt, 250); }; attempt(); return () => { if (timer !== undefined) window.clearTimeout(timer); dispose(); }; }
export const registerDashboardModule = (app: App, definition: DashboardModuleDefinition) => register(app, "registerModule", definition);
export const registerDashboardWidget = (app: App, definition: DashboardWidgetDefinition) => register(app, "registerWidget", definition);
