import 'server-only';
import { randomUUID } from 'node:crypto';
import type { OgImageError, OgImageErrorCode, OgImageStage } from '@/lib/og-image-feedback';

/** Log only allowlisted metadata: upstream exceptions can contain credentials and URLs. */
export function reportOgImageError(
	code: OgImageErrorCode,
	stage: OgImageStage,
	projectId?: number,
	httpStatus?: number,
): OgImageError {
	const error = { code, stage, reference: randomUUID() };
	const details = {
		...error,
		...(typeof projectId === 'number' && Number.isSafeInteger(projectId) && projectId > 0
			? { projectId }
			: {}),
		...(httpStatus !== undefined ? { httpStatus } : {}),
	};
	if (
		[
			'upload-failed',
			'delete-failed',
			'persist-failed',
			'project-delete-failed',
			'unexpected',
		].includes(code)
	) {
		console.error('OG image operation failed', details);
	} else {
		console.warn('OG image operation failed', details);
	}
	return error;
}
