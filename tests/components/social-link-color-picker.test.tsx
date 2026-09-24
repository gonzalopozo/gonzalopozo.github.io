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
		const hexInput = screen.getByRole('textbox', { name: 'Hex' }) as HTMLInputElement;
		const preview = screen.getByRole('img', {
			name: 'Vista previa del color #ff0000',
		}) as HTMLElement;
		expect(preview.style.backgroundColor).toBe('rgb(255, 0, 0)');
		expect(hueSlider.parentElement?.parentElement?.style.backgroundImage).toContain('gradient');
		fireEvent.keyDown(hueSlider, { key: 'ArrowRight' });

		expect(colorInput?.value).not.toBe('#ff0000');
		expect(colorInput?.value).toMatch(/^#[0-9a-f]{6}$/);
		expect(hexInput.value).toBe(colorInput?.value);
		expect(
			screen.getByRole('img', { name: `Vista previa del color ${colorInput?.value}` }),
		).toBeTruthy();
		expect(preview.style.backgroundColor).not.toBe('rgb(255, 0, 0)');
	});

	it('updates the preview and submitted color when a complete hex code is typed', () => {
		const { container } = render(
			<form>
				<SocialLinkColorPicker defaultValue="#ff0000" fallbackValue="#66696d" />
			</form>,
		);

		fireEvent.click(screen.getByRole('button', { name: /seleccionar color del enlace/i }));
		const hexInput = screen.getByRole('textbox', { name: 'Hex' }) as HTMLInputElement;
		const savedColor = container.querySelector<HTMLInputElement>('input[name="color"]');

		fireEvent.change(hexInput, { target: { value: '#123' } });
		expect(hexInput.value).toBe('#123');
		expect(savedColor?.value).toBe('#ff0000');

		fireEvent.change(hexInput, { target: { value: '#12AbCd' } });
		expect(hexInput.value).toBe('#12abcd');
		expect(savedColor?.value).toBe('#12abcd');
		const preview = screen.getByRole('img', {
			name: 'Vista previa del color #12abcd',
		}) as HTMLElement;
		expect(preview.style.backgroundColor).toBe('rgb(18, 171, 205)');
	});

	it('keeps the hash and restores the last valid color after incomplete entry', () => {
		const { container } = render(
			<form>
				<SocialLinkColorPicker defaultValue="#ff0000" fallbackValue="#66696d" />
			</form>,
		);

		fireEvent.click(screen.getByRole('button', { name: /seleccionar color del enlace/i }));
		const hexInput = screen.getByRole('textbox', { name: 'Hex' }) as HTMLInputElement;
		const savedColor = container.querySelector<HTMLInputElement>('input[name="color"]');

		fireEvent.change(hexInput, { target: { value: 'ff0000' } });
		expect(hexInput.value).toBe('#ff0000');
		fireEvent.change(hexInput, { target: { value: '' } });
		expect(hexInput.value).toBe('#');
		fireEvent.blur(hexInput);
		expect(hexInput.value).toBe('#ff0000');
		expect(savedColor?.value).toBe('#ff0000');
	});

	it.each(['abcdef', '#abcdef'])('pastes %s with exactly one hash', (pastedColor) => {
		const { container } = render(
			<form>
				<SocialLinkColorPicker defaultValue="#ff0000" fallbackValue="#66696d" />
			</form>,
		);

		fireEvent.click(screen.getByRole('button', { name: /seleccionar color del enlace/i }));
		const hexInput = screen.getByRole('textbox', { name: 'Hex' }) as HTMLInputElement;
		fireEvent.paste(hexInput, { clipboardData: { getData: () => pastedColor } });

		expect(hexInput.value).toBe('#abcdef');
		expect(container.querySelector<HTMLInputElement>('input[name="color"]')?.value).toBe(
			'#abcdef',
		);
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
