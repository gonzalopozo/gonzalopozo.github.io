import 'server-only';
import { randomUUID } from 'node:crypto';
import { MUSIC_ISSUE_MESSAGES, type MusicIssue } from '@/lib/music-status';

/** Emit only allowlisted metadata; raw errors can contain the Last.fm API key. */
export function reportMusicIssues(issues: MusicIssue[], correlationId = randomUUID()): void {
	for (const issue of issues) {
		const event = {
			event: 'music-integration-failure',
			correlationId,
			integration: issue.integration,
			operation: issue.operation,
			code: issue.code,
			message: MUSIC_ISSUE_MESSAGES[issue.code],
			...(typeof issue.httpStatus === 'number' &&
			Number.isInteger(issue.httpStatus) &&
			issue.httpStatus >= 100 &&
			issue.httpStatus <= 599
				? { httpStatus: issue.httpStatus }
				: {}),
			...(typeof issue.apiCode === 'number' &&
			Number.isInteger(issue.apiCode) &&
			issue.apiCode > 0 &&
			issue.apiCode <= 999
				? { apiCode: issue.apiCode }
				: {}),
		};
		if (issue.integration === 'lastfm' || issue.integration === 'refresh') {
			console.error(event);
		} else {
			console.warn(event);
		}
	}
}
