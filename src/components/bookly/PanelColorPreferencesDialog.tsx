'use client';

import { useState } from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PANEL_COLOR_OPTIONS, type PanelColorValue } from '@/lib/panel-colors';
import { usePanelColor } from '@/context/PanelColorContext';

export function PanelColorPreferencesDialog() {
  const {
    panelColorOverrideEnabled,
    panelColorOverrideOption,
    panelColorMessage,
    userPanelColor,
    selectPanelColor,
    hasLoadedPanelColor,
  } = usePanelColor();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Panel style</span>
          <span className="sm:hidden">Style</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">Panel style</DialogTitle>
          <DialogDescription>{panelColorMessage}</DialogDescription>
        </DialogHeader>
        {panelColorOverrideEnabled ? (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-10 w-10 rounded-md border border-border shadow-sm',
                panelColorOverrideOption.previewClass
              )}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{panelColorOverrideOption.label}</p>
              <p className="text-xs text-muted-foreground">Managed by your administrator</p>
            </div>
          </div>
        ) : (
          <RadioGroup
            value={userPanelColor}
            onValueChange={(value) => selectPanelColor(value as PanelColorValue)}
            className="grid gap-4 sm:grid-cols-2"
          >
            {PANEL_COLOR_OPTIONS.map((option) => (
              <Label
                key={option.value}
                htmlFor={`panel-color-${option.value}`}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm shadow-sm transition-colors',
                  option.value === userPanelColor ? 'border-ring bg-accent/20 text-foreground' : 'border-border'
                )}
              >
                <RadioGroupItem
                  value={option.value}
                  id={`panel-color-${option.value}`}
                  disabled={!hasLoadedPanelColor}
                  className="sr-only"
                />
                <span
                  className={cn(
                    'h-8 w-8 shrink-0 rounded-md border border-border shadow-sm',
                    option.previewClass,
                    option.value === userPanelColor && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">Click to apply</span>
                </div>
              </Label>
            ))}
          </RadioGroup>
        )}
      </DialogContent>
    </Dialog>
  );
}
