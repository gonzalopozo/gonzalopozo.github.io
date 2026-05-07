'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';

const THEME_WRITE_DELAY_MS = 360;
const THEME_REVEAL_DURATION_MS = 1120;
type ResolvedTheme = 'light' | 'dark';
const THEME_REVEAL_COLORS: Record<ResolvedTheme, string> = {
	dark: 'oklch(0.12 0.025 275)',
	light: 'oklch(0.975 0.008 270)',
};
type ThemeReveal = {
	id: number;
	theme: ResolvedTheme;
	x: number;
	y: number;
	radius: number;
};

export function BB8ThemeSwitcher() {
	const controlId = useId();
	const { theme, resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [visualTheme, setVisualTheme] = useState<ResolvedTheme>('light');
	const [themeReveal, setThemeReveal] = useState<ThemeReveal | null>(null);
	const themeWriteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const themeRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const switcherRef = useRef<HTMLLabelElement>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted || !resolvedTheme) return;

		setVisualTheme(resolvedTheme === 'dark' ? 'dark' : 'light');
	}, [mounted, resolvedTheme]);

	useEffect(() => {
		return () => {
			if (themeWriteTimeoutRef.current) {
				clearTimeout(themeWriteTimeoutRef.current);
			}
			if (themeRevealTimeoutRef.current) {
				clearTimeout(themeRevealTimeoutRef.current);
			}
		};
	}, []);

	const isDark = mounted && visualTheme === 'dark';
	const nextTheme = isDark ? 'light' : 'dark';

	function handleThemeChange() {
		if (!mounted || !resolvedTheme) return;

		setVisualTheme((currentTheme) => {
			const nextResolvedTheme = currentTheme === 'dark' ? 'light' : 'dark';
			const switcherRect = switcherRef.current?.getBoundingClientRect();
			const revealX = switcherRect ? switcherRect.left + switcherRect.width / 2 : window.innerWidth / 2;
			const revealY = switcherRect ? switcherRect.top + switcherRect.height / 2 : window.innerHeight / 2;
			const revealRadius =
				Math.hypot(Math.max(revealX, window.innerWidth - revealX), Math.max(revealY, window.innerHeight - revealY)) +
				24;

			if (themeWriteTimeoutRef.current) {
				clearTimeout(themeWriteTimeoutRef.current);
			}
			if (themeRevealTimeoutRef.current) {
				clearTimeout(themeRevealTimeoutRef.current);
			}

			setThemeReveal({
				id: Date.now(),
				theme: nextResolvedTheme,
				x: revealX,
				y: revealY,
				radius: revealRadius,
			});

			themeWriteTimeoutRef.current = setTimeout(() => {
				setTheme(nextResolvedTheme);
				themeWriteTimeoutRef.current = null;
			}, THEME_WRITE_DELAY_MS);

			themeRevealTimeoutRef.current = setTimeout(() => {
				setThemeReveal(null);
				themeRevealTimeoutRef.current = null;
			}, THEME_REVEAL_DURATION_MS);

			return nextResolvedTheme;
		});
	}

	return (
		<div className="flex size-full min-h-36 items-center justify-center px-4 pt-4 pb-6 sm:pb-8 lg:pb-10">
			<label
				ref={switcherRef}
				className="bb8-theme-switcher"
				data-theme-preference={theme ?? 'system'}
				htmlFor={controlId}
			>
				<input
					id={controlId}
					className="bb8-theme-switcher__checkbox"
					type="checkbox"
					role="switch"
					checked={isDark}
					disabled={!mounted}
					aria-checked={isDark}
					aria-label={`Switch to ${nextTheme} theme`}
					onChange={handleThemeChange}
				/>
				<span className="bb8-toggle__container" aria-hidden="true">
					<span className="bb8-toggle__scenery">
						<span className="bb8-toggle__star" />
						<span className="bb8-toggle__star" />
						<span className="bb8-toggle__star" />
						<span className="bb8-toggle__star" />
						<span className="bb8-toggle__star" />
						<span className="bb8-toggle__star" />
						<span className="bb8-toggle__star" />
						<span className="tatto-1" />
						<span className="tatto-2" />
						<span className="gomrassen" />
						<span className="hermes" />
						<span className="chenini" />
						<span className="bb8-toggle__cloud" />
						<span className="bb8-toggle__cloud" />
						<span className="bb8-toggle__cloud" />
					</span>
					<span className="bb8">
						<span className="bb8__head-container">
							<span className="bb8__antenna" />
							<span className="bb8__antenna" />
							<span className="bb8__head" />
						</span>
						<span className="bb8__body" />
					</span>
					<span className="artificial__hidden">
						<span className="bb8__shadow" />
					</span>
				</span>
			</label>
			{themeReveal && (
				createPortal(
					<span
						key={themeReveal.id}
						className="theme-change-reveal"
						aria-hidden="true"
						style={
							{
								'--theme-reveal-x': `${themeReveal.x}px`,
								'--theme-reveal-y': `${themeReveal.y}px`,
								'--theme-reveal-radius': `${themeReveal.radius}px`,
								'--theme-reveal-color': THEME_REVEAL_COLORS[themeReveal.theme],
							} as CSSProperties
						}
					/>,
					document.body,
				)
			)}
		</div>
	);
}
