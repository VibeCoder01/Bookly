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
    label: 'Forest Emerald',
    cardClass:
      'bg-gradient-to-br from-emerald-600 to-emerald-500 text-emerald-50 hover:from-emerald-500 hover:to-emerald-400',
    previewClass: 'bg-gradient-to-br from-emerald-600 to-emerald-500',
    mutedTextClass: 'text-emerald-100/80',
    borderClass: 'border-emerald-100/50',
  },
  {
    value: 'sky',
    label: 'Coastal Sky',
    cardClass:
      'bg-gradient-to-br from-sky-600 via-cyan-500 to-sky-400 text-sky-50 hover:from-sky-500 hover:via-cyan-400 hover:to-sky-300',
    previewClass: 'bg-gradient-to-br from-sky-600 via-cyan-500 to-sky-400',
    mutedTextClass: 'text-sky-50/80',
    borderClass: 'border-cyan-100/60',
  },
  {
    value: 'violet',
    label: 'Twilight Violet',
    cardClass:
      'bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-500 text-purple-50 hover:from-violet-500 hover:via-fuchsia-500 hover:to-purple-400',
    previewClass: 'bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-500',
    mutedTextClass: 'text-purple-100/80',
    borderClass: 'border-fuchsia-100/60',
  },
  {
    value: 'amber',
    label: 'Sunset Amber',
    cardClass:
      'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-400 text-slate-900 hover:from-amber-400 hover:via-orange-400 hover:to-amber-300',
    previewClass: 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-400',
    mutedTextClass: 'text-slate-900/70',
    borderClass: 'border-amber-900/20',
  },
  {
    value: 'slate',
    label: 'Midnight Slate',
    cardClass:
      'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 text-slate-100 hover:from-slate-700 hover:via-slate-600 hover:to-slate-500',
    previewClass: 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600',
    mutedTextClass: 'text-slate-200/80',
    borderClass: 'border-slate-100/40',
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
