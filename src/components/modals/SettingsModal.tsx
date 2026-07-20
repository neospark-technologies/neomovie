"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { getUserSettings, saveUserSettings, UserSettings } from "@/lib/storage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>({
    tmdbApiKey: "",
    customStreamUrl: "",
    preferredPlayer: "built-in",
    themeAccent: "violet",
  });
  const [saved, setSaved] = useState(false);
  const [testingStream, setTestingStream] = useState(false);
  const [streamTestResult, setStreamTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(getUserSettings());
      setSaved(false);
      setStreamTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveUserSettings(settings);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleTestStream = async () => {
    setTestingStream(true);
    setStreamTestResult(null);
    try {
      const headers: Record<string, string> = {};
      if (settings.customStreamUrl.trim()) {
        headers["x-custom-stream-url"] = settings.customStreamUrl.trim();
      }
      const res = await fetch("/api/streams?imdbId=tt0111161&type=movie", { headers });
      const data = await res.json();
      if (data.streams && data.streams.length > 0) {
        setStreamTestResult(`Connected: Found ${data.streams.length} stream sources.`);
      } else if (data.error) {
        setStreamTestResult(`Error: ${data.error}`);
      } else {
        setStreamTestResult("No streams returned.");
      }
    } catch (e: any) {
      setStreamTestResult(`Failed: ${e.message}`);
    } finally {
      setTestingStream(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md p-6 rounded-xl bg-[#141418] border border-zinc-800 shadow-2xl text-white">
        {/* Header: NO paragraph under heading, NO badge */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 py-4 text-sm">
          {/* TMDB Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              TMDB API Key (Optional)
            </label>
            <input
              type="password"
              placeholder="Leave blank for pre-configured catalog"
              value={settings.tmdbApiKey}
              onChange={(e) => setSettings({ ...settings, tmdbApiKey: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-zinc-500 focus:outline-none text-white placeholder-zinc-500 text-xs transition-colors"
            />
          </div>

          {/* Custom Stream URL: NO badge, NO paragraph under input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Streaming Endpoint Override (Optional)
            </label>
            <input
              type="password"
              placeholder="Configured securely on server via .env.local"
              value={settings.customStreamUrl}
              onChange={(e) => setSettings({ ...settings, customStreamUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-zinc-500 focus:outline-none text-white placeholder-zinc-500 text-xs transition-colors font-mono"
            />
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={handleTestStream}
                disabled={testingStream}
                className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              >
                {testingStream ? "Testing..." : "Test Connection"}
              </button>
            </div>
            {streamTestResult && (
              <div
                className={`p-2 rounded-md text-xs flex items-center gap-2 ${
                  streamTestResult.startsWith("Connected")
                    ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                    : "bg-red-950/40 text-red-400 border border-red-900/40"
                }`}
              >
                {streamTestResult.startsWith("Connected") ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                )}
                <span>{streamTestResult}</span>
              </div>
            )}
          </div>

          {/* Preferred Player */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Default Player
            </label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, preferredPlayer: "built-in" })}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  settings.preferredPlayer === "built-in"
                    ? "bg-zinc-800 border-zinc-500 text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="font-medium text-xs text-white">Web Player</div>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, preferredPlayer: "vlc" })}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  settings.preferredPlayer === "vlc"
                    ? "bg-zinc-800 border-zinc-500 text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="font-medium text-xs text-white">VLC / External</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors"
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
