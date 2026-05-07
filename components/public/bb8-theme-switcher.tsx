'use client';

import { useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';

export function BB8ThemeSwitcher() {
	const controlId = useId();
	const { theme, resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const actualTheme = theme === 'system' ? resolvedTheme : theme;
	const isDark = mounted && actualTheme === 'dark';
	const nextTheme = isDark ? 'light' : 'dark';

	function handleThemeChange() {
		if (!mounted || !resolvedTheme) return;

		setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
	}

	return (
		<div className="flex size-full min-h-36 items-center justify-center p-4">
			<label
				className="bb8-theme-switcher"
				data-theme-preference={theme ?? 'system'}
				htmlFor={controlId}
			>
				<input
					id={controlId}
					className="bb8-theme-switcher__checkbox sr-only"
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
