'use client';

import { useState } from 'react';
import { ColorArea, ColorThumb } from 'react-aria-components/ColorArea';
import { ColorPicker, parseColor } from 'react-aria-components/ColorPicker';
import { ColorSlider, SliderTrack } from 'react-aria-components/ColorSlider';
import { ColorSwatch } from 'react-aria-components/ColorSwatch';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SocialLinkColorPickerProps {
	defaultValue: string;
	fallbackValue: string;
}

export function SocialLinkColorPicker({ defaultValue, fallbackValue }: SocialLinkColorPickerProps) {
	const [color, setColor] = useState(() =>
		parseColor(/^#[0-9a-f]{6}$/i.test(defaultValue) ? defaultValue : fallbackValue),
	);
	const hex = color.toString('hex').toLowerCase();

	return (
		<ColorPicker value={color} onChange={setColor}>
			<input type="hidden" name="color" value={hex} />
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id="color"
						type="button"
						variant="outline"
						aria-label={`Seleccionar color del enlace, actual ${hex}`}
						className="h-11 w-full justify-start gap-3 font-normal"
					>
						<ColorSwatch
							color={color}
							aria-hidden="true"
							className="size-6 shrink-0 rounded-md border border-foreground/20"
						/>
						<span className="font-mono text-sm uppercase">{hex}</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="flex w-72 flex-col gap-4 p-4">
					<ColorArea
						colorSpace="hsb"
						xChannel="saturation"
						yChannel="brightness"
						aria-label="Saturación y brillo"
						className="relative h-44 w-full touch-none rounded-md border border-border"
					>
						<ColorThumb className="size-5 rounded-full border-2 border-white shadow-sm ring-1 ring-foreground/30 data-focus-visible:ring-2 data-focus-visible:ring-ring" />
					</ColorArea>
					<ColorSlider
						channel="hue"
						colorSpace="hsb"
						aria-label="Matiz"
						className="flex flex-col gap-2"
					>
						<span className="text-xs font-medium text-muted-foreground">Matiz</span>
						<SliderTrack className="relative h-6 w-full touch-none rounded-full border border-border">
							<ColorThumb className="size-5 rounded-full border-2 border-white shadow-sm ring-1 ring-foreground/30 data-focus-visible:ring-2 data-focus-visible:ring-ring" />
						</SliderTrack>
					</ColorSlider>
				</PopoverContent>
			</Popover>
		</ColorPicker>
	);
}
