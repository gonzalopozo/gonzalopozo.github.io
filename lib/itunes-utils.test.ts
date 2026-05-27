import { describe, expect, it } from 'vitest';
import {
	buildITunesSongSearchTerm,
	selectBestITunesArtwork,
	type ITunesSongSearchResult,
} from '@/lib/itunes-utils';

const baseResult: ITunesSongSearchResult = {
	kind: 'song',
	trackId: 671129680,
	trackName: 'Cuando Calienta El Sol',
	artistName: 'Luis Miguel',
	collectionName: 'Soy Como Quiero Ser',
	artworkUrl100:
		'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d9/58/af/example.jpg/100x100bb.jpg',
	trackViewUrl: 'https://music.apple.com/es/album/cuando-calienta-el-sol/671129332',
};

describe('buildITunesSongSearchTerm', () => {
	it('builds a compact song search term from track, artist, and album', () => {
		expect(
			buildITunesSongSearchTerm({
				trackName: ' Cuando   Calienta El Sol ',
				artistName: ' Luis Miguel ',
				albumName: ' Soy Como Quiero Ser ',
			}),
		).toBe('Cuando Calienta El Sol Luis Miguel Soy Como Quiero Ser');
	});

	it('returns null when the artist is missing', () => {
		expect(
			buildITunesSongSearchTerm({
				trackName: 'Cuando Calienta El Sol',
				artistName: null,
				albumName: 'Soy Como Quiero Ser',
			}),
		).toBeNull();
	});
});

describe('selectBestITunesArtwork', () => {
	it('selects exact track and artist matches using album as a tie-breaker', () => {
		const match = selectBestITunesArtwork(
			{
				trackName: 'Cuando Calienta El Sol',
				artistName: 'Luis Miguel',
				albumName: 'Soy Como Quiero Ser',
			},
			[
				{
					...baseResult,
					collectionName: 'Romances',
					artworkUrl100:
						'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d9/58/af/wrong.jpg/100x100bb.jpg',
				},
				baseResult,
			],
		);

		expect(match).toEqual({
			artworkUrl:
				'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d9/58/af/example.jpg/600x600bb.jpg',
			trackViewUrl: 'https://music.apple.com/es/album/cuando-calienta-el-sol/671129332',
		});
	});

	it('rejects mismatched songs and entries without artwork', () => {
		const match = selectBestITunesArtwork(
			{
				trackName: 'Cuando Calienta El Sol',
				artistName: 'Luis Miguel',
				albumName: 'Soy Como Quiero Ser',
			},
			[
				{ ...baseResult, artistName: 'A Different Artist' },
				{ ...baseResult, artworkUrl100: undefined },
				{ ...baseResult, kind: 'music-video' },
			],
		);

		expect(match).toBeNull();
	});
});
