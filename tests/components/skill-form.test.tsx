import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillForm } from '@/components/admin/skill-form';

vi.mock('next/dynamic', () => ({ default: () => () => null }));

beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

const action = async () => ({ error: null });

describe('SkillForm color control', () => {
	it('reveals the picker with its default HEX when switched on', () => {
		const { container } = render(<SkillForm action={action} />);
		expect(container.querySelector('[name="customColor"]')).toBeNull();

		fireEvent.click(screen.getByRole('switch', { name: 'Usar color personalizado' }));
		expect(container.querySelector<HTMLInputElement>('[name="customColor"]')?.value).toBe(
			'#66696d',
		);
		const enabledData = new FormData(container.querySelector('form')!);
		expect(enabledData.get('useColor')).toBe('on');
		expect(enabledData.get('customColor')).toBe('#66696d');

		fireEvent.click(screen.getByRole('switch', { name: 'Usar color personalizado' }));
		expect(container.querySelector('[name="customColor"]')).toBeNull();
		expect(new FormData(container.querySelector('form')!).get('useColor')).toBeNull();
	});

	it('initializes editing from the saved color', () => {
		const { container } = render(
			<SkillForm
				action={action}
				initialValues={{
					name: 'React',
					type: 'frontend',
					icon: 'SiReact|si',
					url: null,
					useColor: true,
					customColor: '#A1B2C3',
				}}
			/>,
		);

		expect(container.querySelector<HTMLInputElement>('[name="customColor"]')?.value).toBe(
			'#a1b2c3',
		);
		expect(
			screen
				.getByRole('switch', { name: 'Usar color personalizado' })
				.getAttribute('aria-checked'),
		).toBe('true');
	});
});
