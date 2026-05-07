'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

const THEME_WRITE_DELAY_MS = 460;
type ResolvedTheme = 'light' | 'dark';

export function BB8ThemeSwitcher() {
	const controlId = useId();
	const { theme, resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [visualTheme, setVisualTheme] = useState<ResolvedTheme>('light');
	const themeWriteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
		};
	}, []);

	const isDark = mounted && visualTheme === 'dark';
	const nextTheme = isDark ? 'light' : 'dark';

	function handleThemeChange() {
		if (!mounted || !resolvedTheme) return;

		setVisualTheme((currentTheme) => {
			const nextResolvedTheme = currentTheme === 'dark' ? 'light' : 'dark';

			if (themeWriteTimeoutRef.current) {
				clearTimeout(themeWriteTimeoutRef.current);
			}

			themeWriteTimeoutRef.current = setTimeout(() => {
				setTheme(nextResolvedTheme);
				themeWriteTimeoutRef.current = null;
			}, THEME_WRITE_DELAY_MS);

			return nextResolvedTheme;
		});
	}

	return (
		<div className="flex size-full min-h-36 items-center justify-center px-4 pt-4 pb-6 sm:pb-8 lg:pb-10">
			<label
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
		</div>
	);
}
