export const PANEL_COLOR_OPTIONS = [
  {
    value: 'accent',
    label: 'Default theme',
    cardClass: 'bg-accent text-accent-foreground hover:bg-accent/90',
    previewClass: 'bg-accent',
    mutedTextClass: 'text-accent-foreground/70',
    borderClass: 'border-accent-foreground/30',
  },
  {
    value: 'emerald',
    label: 'Emerald',
    cardClass: 'bg-emerald-600 text-white hover:bg-emerald-500',
    previewClass: 'bg-emerald-600',
    mutedTextClass: 'text-white/80',
    borderClass: 'border-white/50',
  },
  {
    value: 'sky',
    label: 'Sky',
    cardClass: 'bg-sky-600 text-white hover:bg-sky-500',
    previewClass: 'bg-sky-600',
    mutedTextClass: 'text-white/80',
    borderClass: 'border-white/60',
  },
  {
    value: 'violet',
    label: 'Violet',
    cardClass: 'bg-violet-600 text-white hover:bg-violet-500',
    previewClass: 'bg-violet-600',
    mutedTextClass: 'text-white/80',
    borderClass: 'border-white/60',
  },
  {
    value: 'amber',
    label: 'Amber',
    cardClass: 'bg-amber-500 text-slate-900 hover:bg-amber-400',
    previewClass: 'bg-amber-500',
    mutedTextClass: 'text-slate-900/70',
    borderClass: 'border-slate-900/20',
  },
  {
    value: 'slate',
    label: 'Slate',
    cardClass: 'bg-slate-700 text-white hover:bg-slate-600',
    previewClass: 'bg-slate-700',
    mutedTextClass: 'text-white/80',
    borderClass: 'border-white/40',
  },
] as const;

export type PanelColorOption = (typeof PANEL_COLOR_OPTIONS)[number];
export type PanelColorValue = PanelColorOption['value'];

export const PANEL_COLOR_VALUES = PANEL_COLOR_OPTIONS.map((option) => option.value) as readonly PanelColorValue[];

export const PANEL_COLOR_VALUE_SET = new Set<PanelColorValue>(PANEL_COLOR_VALUES);

export const PANEL_COLOR_DEFAULT_VALUE: PanelColorValue = PANEL_COLOR_OPTIONS[0].value;

export function getPanelColorOption(value?: string | null): PanelColorOption {
  if (!value) {
    return PANEL_COLOR_OPTIONS[0];
  }

  const match = PANEL_COLOR_OPTIONS.find((option) => option.value === value);
  return match ?? PANEL_COLOR_OPTIONS[0];
}
