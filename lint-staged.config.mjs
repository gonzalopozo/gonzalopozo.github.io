/**
 * lint-staged — run ESLint + Prettier only on staged files (fast pre-commit).
 *
 * Order: `eslint --fix` first, then `prettier --write` (Prettier last; aligns with eslint-config-prettier).
 *
 * @see https://github.com/lint-staged/lint-staged
 * @see https://nextjs.org/docs/app/api-reference/config/eslint
 */
export default {
	'*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}': ['eslint --fix', 'prettier --write'],
	'*.{json,md,mdx,css,scss,html,yml,yaml}': 'prettier --write',
};
