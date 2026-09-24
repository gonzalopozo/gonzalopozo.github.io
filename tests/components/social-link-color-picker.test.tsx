import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SocialLinkColorPicker } from '@/components/admin/social-link-color-picker';

afterEach(cleanup);

describe('SocialLinkColorPicker', () => {
	it('submits the initial color and updates it from the hue slider', () => {
		const { container } = render(
			<form>
				<SocialLinkColorPicker defaultValue="#ff0000" fallbackValue="#66696d" />
			</form>,
		);

		const colorInput = container.querySelector<HTMLInputElement>('input[name="color"]');
		expect(colorInput?.value).toBe('#ff0000');

		fireEvent.click(screen.getByRole('button', { name: /seleccionar color del enlace/i }));
		const hueSlider = screen.getByRole('slider', { name: 'Matiz' });
		expect(hueSlider.parentElement?.parentElement?.style.backgroundImage).toContain('gradient');
		fireEvent.keyDown(hueSlider, { key: 'ArrowRight' });

		expect(colorInput?.value).not.toBe('#ff0000');
		expect(colorInput?.value).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('uses the default color for malformed stored values', () => {
		const { container } = render(
			<form>
				<SocialLinkColorPicker defaultValue="color" fallbackValue="#66696d" />
			</form>,
		);

		expect(container.querySelector<HTMLInputElement>('input[name="color"]')?.value).toBe(
			'#66696d',
		);
	});
});
