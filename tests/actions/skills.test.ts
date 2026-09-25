import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getServerSession: vi.fn(),
	insert: vi.fn(),
	update: vi.fn(),
	updateTag: vi.fn(),
	redirect: vi.fn(),
}));

vi.mock('@/db', () => ({ db: mocks }));
vi.mock('@/lib/server-session', () => ({ getServerSession: mocks.getServerSession }));
vi.mock('next/cache', () => ({ updateTag: mocks.updateTag, revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

import { createSkill, updateSkill } from '@/lib/actions/skills';
import { PUBLIC_EXPERIENCES_CACHE_TAG, PUBLIC_PROJECTS_CACHE_TAG } from '@/lib/cache-tags';

function skillFormData(useColor: boolean, customColor?: string) {
	const formData = new FormData();
	formData.set('name', 'React');
	formData.set('type', 'frontend');
	formData.set('icon', 'SiReact|si');
	formData.set('url', '');
	if (useColor) formData.set('useColor', 'on');
	if (customColor) formData.set('customColor', customColor);
	return formData;
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getServerSession.mockResolvedValue({ user: { id: 'admin' } });
	mocks.redirect.mockImplementation(() => {
		throw new Error('redirect');
	});
});

describe('skill color persistence', () => {
	it('rejects an enabled color without a valid HEX before writing', async () => {
		const result = await createSkill({ error: null }, skillFormData(true, 'red'));
		expect(result.error).toMatch(/color/);
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it('saves the selected color and invalidates both public caches', async () => {
		const values = vi.fn().mockResolvedValue(undefined);
		mocks.insert.mockReturnValue({ values });

		await expect(createSkill({ error: null }, skillFormData(true, '#A1B2C3'))).rejects.toThrow(
			'redirect',
		);
		expect(values).toHaveBeenCalledWith(
			expect.objectContaining({ useColor: true, customColor: '#a1b2c3' }),
		);
		expect(mocks.updateTag).toHaveBeenCalledWith(PUBLIC_PROJECTS_CACHE_TAG);
		expect(mocks.updateTag).toHaveBeenCalledWith(PUBLIC_EXPERIENCES_CACHE_TAG);
	});

	it('disables color without replacing an existing saved HEX', async () => {
		const where = vi.fn().mockResolvedValue(undefined);
		const set = vi.fn().mockReturnValue({ where });
		mocks.update.mockReturnValue({ set });

		await expect(updateSkill(7, { error: null }, skillFormData(false))).rejects.toThrow(
			'redirect',
		);
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({ useColor: false, customColor: undefined }),
		);
	});
});
