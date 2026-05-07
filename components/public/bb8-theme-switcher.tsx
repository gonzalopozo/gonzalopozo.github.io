'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import * as MotionReact from 'motion/react';
import { useTheme } from 'next-themes';

const THEME_REVEAL_DURATION_MS = 820;
const MAP_THEME_WAIT_TIMEOUT_MS = 650;
const MAP_THEME_LOADED_EVENT = 'portfolio-map-theme-loaded';
type ResolvedTheme = 'light' | 'dark';

type ViewTransitionKeyframes = {
	clipPath?: string[];
	opacity?: number[];
};

type ViewTransitionOptions = {
	duration?: number;
	ease?: string | number[];
	interrupt?: 'wait' | 'immediate';
};

type ViewTransitionAnimation = {
	finished: Promise<unknown>;
};

type ViewTransitionBuilder = PromiseLike<ViewTransitionAnimation> & {
	new: (keyframes: ViewTransitionKeyframes, options?: ViewTransitionOptions) => ViewTransitionBuilder;
	old: (keyframes: ViewTransitionKeyframes, options?: ViewTransitionOptions) => ViewTransitionBuilder;
};

type AnimateView = (
	update: () => void | Promise<void>,
	options?: ViewTransitionOptions,
) => ViewTransitionBuilder;

const animateView = (MotionReact as unknown as { animateView?: AnimateView }).animateView;

function applyDocumentTheme(theme: ResolvedTheme) {
	const root = document.documentElement;
	root.classList.remove('light', 'dark');
	root.classList.add(theme);
	root.style.colorScheme = theme;
}

function getRevealGeometry(originElement: HTMLElement | null) {
	const originRect = originElement?.getBoundingClientRect();
	const x = originRect ? originRect.left + originRect.width / 2 : window.innerWidth / 2;
	const y = originRect ? originRect.top + originRect.height / 2 : window.innerHeight / 2;
	const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 24;

	return {
		from: `circle(0px at ${x}px ${y}px)`,
		to: `circle(${radius}px at ${x}px ${y}px)`,
	};
}

function hasMapInstance() {
	return Boolean(document.querySelector('.maplibregl-map, .maplibregl-canvas'));
}

function waitForMapTheme(theme: ResolvedTheme) {
	if (!hasMapInstance()) {
		return Promise.resolve();
	}

	return new Promise<void>((resolve) => {
		const timeoutId = window.setTimeout(done, MAP_THEME_WAIT_TIMEOUT_MS);

		function done() {
			window.clearTimeout(timeoutId);
			document.removeEventListener(MAP_THEME_LOADED_EVENT, handleMapThemeLoaded);
			resolve();
		}

		function handleMapThemeLoaded(event: Event) {
			const detail = (event as CustomEvent<{ theme?: ResolvedTheme }>).detail;

			if (detail?.theme === theme) {
				done();
			}
		}

		document.addEventListener(MAP_THEME_LOADED_EVENT, handleMapThemeLoaded);
	});
}

export function BB8ThemeSwitcher() {
	const controlId = useId();
	const { theme, resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [visualTheme, setVisualTheme] = useState<ResolvedTheme>('light');
	const [isTransitioning, setIsTransitioning] = useState(false);
	const shouldReduceMotion = MotionReact.useReducedMotion();
	const switcherRef = useRef<HTMLLabelElement>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted || !resolvedTheme) return;

		setVisualTheme(resolvedTheme === 'dark' ? 'dark' : 'light');
	}, [mounted, resolvedTheme]);

	const isDark = mounted && visualTheme === 'dark';
	const nextTheme = isDark ? 'light' : 'dark';

	function commitTheme(nextResolvedTheme: ResolvedTheme) {
		applyDocumentTheme(nextResolvedTheme);
		flushSync(() => {
			setVisualTheme(nextResolvedTheme);
			setTheme(nextResolvedTheme);
		});
	}

	async function handleThemeChange() {
		if (!mounted || !resolvedTheme || isTransitioning) return;

		const nextResolvedTheme = visualTheme === 'dark' ? 'light' : 'dark';

		if (shouldReduceMotion || !animateView || !('startViewTransition' in document)) {
			commitTheme(nextResolvedTheme);
			return;
		}

		const revealGeometry = getRevealGeometry(switcherRef.current);

		setIsTransitioning(true);

		try {
			const transition = await animateView(
				async () => {
					commitTheme(nextResolvedTheme);
					await waitForMapTheme(nextResolvedTheme);
				},
				{
					duration: THEME_REVEAL_DURATION_MS / 1000,
					ease: [0.22, 1, 0.36, 1],
					interrupt: 'immediate',
				},
			)
				.old(
					{
						opacity: [1, 1],
					},
					{
						duration: THEME_REVEAL_DURATION_MS / 1000,
					},
				)
				.new(
					{
						clipPath: [revealGeometry.from, revealGeometry.to],
						opacity: [1, 1],
					},
					{
						duration: THEME_REVEAL_DURATION_MS / 1000,
						ease: [0.22, 1, 0.36, 1],
					},
				);

			await transition.finished;
		} finally {
			setIsTransitioning(false);
		}
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
					disabled={!mounted || isTransitioning}
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
