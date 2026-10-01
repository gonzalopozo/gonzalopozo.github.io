import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HobbiesGridItemContent } from '@/components/public/hobbies-grid-item-content';

afterEach(cleanup);

function setup() {
	const onUrlUpdate = vi.fn();
	render(
		<NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
			<HobbiesGridItemContent />
		</NuqsTestingAdapter>,
	);
	return onUrlUpdate;
}

describe('HobbiesGridItemContent', () => {
	it('previews a hobby without navigating', () => {
		const onUrlUpdate = setup();
		const preview = screen.getByRole('button', { name: 'Preview NBA' });

		fireEvent.click(preview);
		expect(preview.getAttribute('aria-pressed')).toBe('true');
		expect(onUrlUpdate).not.toHaveBeenCalled();

		fireEvent.click(preview);
		expect(preview.getAttribute('aria-pressed')).toBe('false');
	});

	it('opens the About me section from an arrow control', async () => {
		const onUrlUpdate = setup();
		const arrow = screen.getByRole('button', {
			name: 'Show About me section from Cars',
		});

		fireEvent.click(arrow);

		await waitFor(() =>
			expect(onUrlUpdate).toHaveBeenCalledWith(
				expect.objectContaining({
					queryString: '?section=About+me',
					options: expect.objectContaining({ history: 'push', scroll: false }),
				}),
			),
		);
	});
});
