"use client";

import { useState } from "react";

interface BadgeFormProps {
  onCreated: () => void;
}

const CONDITION_TYPES = [
  { value: "total_score",      label: "Lifetime score" },
  { value: "streak_days",      label: "Streak days" },
  { value: "total_games",      label: "Games played" },
  { value: "perfect_games",    label: "Perfect games" },
  { value: "hat_trick",        label: "Hat trick (exact guesses in one game)" },
  { value: "dead_reckoning",   label: "Dead reckoning (score ≥ N, no exact guesses)" },
  { value: "category_played",  label: "Category played" },
  { value: "completionist",    label: "Completionist (all categories same day)" },
  { value: "group_joined",     label: "Group joined" },
];

const NEEDS_VALUE  = new Set(["total_score", "streak_days", "total_games", "perfect_games", "hat_trick", "dead_reckoning"]);
const NEEDS_CATEGORY = new Set(["category_played"]);

export default function BadgeForm({ onCreated }: BadgeFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("");
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [conditionType, setConditionType] = useState("total_score");
  const [conditionValue, setConditionValue] = useState("");
  const [category, setCategory] = useState("sports");
  const [sortOrder, setSortOrder] = useState("999");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/badges/upload-icon", {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Failed to upload icon.");
      return;
    }

    const { iconUrl: url } = await res.json();
    setIconUrl(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim(),
      emoji: emoji.trim(),
      icon_url: iconUrl,
      condition_type: conditionType,
      sort_order: parseInt(sortOrder) || 999,
    };

    if (NEEDS_VALUE.has(conditionType)) {
      body.condition_value = parseInt(conditionValue) || 0;
    }
    if (NEEDS_CATEGORY.has(conditionType)) {
      body.condition_meta = { category };
    }

    const res = await fetch("/api/admin/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Failed to create badge.");
      return;
    }

    setName(""); setDescription(""); setEmoji(""); setIconUrl(null);
    setConditionType("total_score"); setConditionValue(""); setSortOrder("999");
    setOpen(false);
    onCreated();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-gold/50 px-4 py-2 text-sm text-gold hover:bg-gold/5 transition-colors"
      >
        + New Badge
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-ink/15 bg-surface/60 p-6 space-y-4"
    >
      <h3 className="font-semibold text-ink text-sm">New Badge</h3>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-ink/60">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-ink/20 bg-parchment px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gold"
            placeholder="Everest"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-ink/60">Emoji (fallback)</label>
          <input
            required
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-full rounded-lg border border-ink/20 bg-parchment px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gold"
            placeholder="⛰️"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-ink/60">Custom icon (optional, overrides emoji)</label>
        <div className="flex items-center gap-3">
          {iconUrl ? (
            <img src={iconUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-gold/40" />
          ) : (
            <span className="w-10 h-10 rounded-full border border-dashed border-ink/20 flex items-center justify-center text-lg">
              {emoji || "?"}
            </span>
          )}
          <label className="text-xs text-gold underline cursor-pointer">
            {uploading ? "Uploading…" : iconUrl ? "Replace" : "Upload icon"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleIconUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          {iconUrl && (
            <button
              type="button"
              onClick={() => setIconUrl(null)}
              className="text-xs text-ink/50 hover:text-ink underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-ink/60">Description</label>
        <input
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-ink/20 bg-parchment px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gold"
          placeholder="8,848 meters — the height of Mt. Everest"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-ink/60">Condition type</label>
          <select
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value)}
            className="w-full rounded-lg border border-ink/20 bg-parchment px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gold"
          >
            {CONDITION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {NEEDS_VALUE.has(conditionType) && (
          <div className="space-y-1">
            <label className="text-xs text-ink/60">Threshold value</label>
            <input
              type="number"
              required
              value={conditionValue}
              onChange={(e) => setConditionValue(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-parchment px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gold"
              placeholder="8848"
            />
          </div>
        )}

        {NEEDS_CATEGORY.has(conditionType) && (
          <div className="space-y-1">
            <label className="text-xs text-ink/60">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-parchment px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gold"
              placeholder="sports"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-ink/60">Sort order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full rounded-lg border border-ink/20 bg-parchment px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gold"
            placeholder="999"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create Badge"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-5 py-2 rounded-lg border border-ink/20 text-sm text-ink/60 hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
