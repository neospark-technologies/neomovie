import { MediaItem, WatchHistoryItem } from "@/types/movie";

export type { WatchHistoryItem };

const WATCHLIST_KEY = "neomovie_watchlist";
const HISTORY_KEY = "neomovie_watch_history";
const SETTINGS_KEY = "neomovie_user_settings";

export interface UserSettings {
  tmdbApiKey: string;
  customStreamUrl: string;
  preferredPlayer: "built-in" | "vlc" | "external";
  themeAccent: "violet" | "cyan" | "neon";
}

const DEFAULT_SETTINGS: UserSettings = {
  tmdbApiKey: "",
  customStreamUrl: "",
  preferredPlayer: "built-in",
  themeAccent: "violet",
};

// --- Watchlist ---

export function getWatchlist(): MediaItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load watchlist", e);
    return [];
  }
}

export function addToWatchlist(item: MediaItem): void {
  if (typeof window === "undefined") return;
  try {
    const list = getWatchlist();
    if (!list.some((i) => String(i.id) === String(item.id))) {
      list.unshift(item);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event("neomovie-watchlist-updated"));
    }
  } catch (e) {
    console.error("Failed to save to watchlist", e);
  }
}

export function removeFromWatchlist(id: string | number): void {
  if (typeof window === "undefined") return;
  try {
    const list = getWatchlist().filter((i) => String(i.id) !== String(id));
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("neomovie-watchlist-updated"));
  } catch (e) {
    console.error("Failed to remove from watchlist", e);
  }
}

export function isInWatchlist(id: string | number): boolean {
  if (typeof window === "undefined") return false;
  const list = getWatchlist();
  return list.some((i) => String(i.id) === String(id));
}

// --- Watch History ---

export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load watch history", e);
    return [];
  }
}

export function saveWatchProgress(item: Omit<WatchHistoryItem, "watchedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const history = getWatchHistory().filter((h) => String(h.id) !== String(item.id));
    const newEntry: WatchHistoryItem = {
      ...item,
      watchedAt: Date.now(),
    };
    history.unshift(newEntry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30))); // Keep last 30
    window.dispatchEvent(new Event("neomovie-history-updated"));
  } catch (e) {
    console.error("Failed to save watch progress", e);
  }
}

export function removeFromWatchHistory(id: string | number, season?: number, episode?: number): void {
  if (typeof window === "undefined") return;
  try {
    const history = getWatchHistory().filter((h) => {
      if (String(h.id) !== String(id)) return true;
      if (season !== undefined && h.season !== season) return true;
      if (episode !== undefined && h.episode !== episode) return true;
      return false;
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event("neomovie-history-updated"));
  } catch (e) {
    console.error("Failed to remove from watch history", e);
  }
}

export function clearWatchHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
  window.dispatchEvent(new Event("neomovie-history-updated"));
}

// --- User Settings ---

export function getUserSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(settings: Partial<UserSettings>): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const current = getUserSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("neomovie-settings-updated"));
    return updated;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
