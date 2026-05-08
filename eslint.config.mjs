import js from '@eslint/js';
import globals from 'globals';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		files: ['**/*.{js,mjs,cjs}'],
		plugins: { js },
		extends: ['js/recommended'],
		languageOptions: { globals: globals.browser },
	},
	prettierRecommended,
	{
		rules: {
			'no-unused-vars': 'warn',
			'no-undef': 'warn',
			'no-unused-private-class-members': 'warn',
			'preserve-caught-error': 'warn',
		},
	},
	{
		ignores: ['dist/**', 'node_modules/**', 'webpack.*js'],
	},
]);
