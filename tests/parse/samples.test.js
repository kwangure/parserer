import { describe, expect, test } from 'vitest';
import { createParser } from 'src/parser';
import fs from 'node:fs';
import { tryToLoadJson } from './helpers.js';

describe('parse', () => {
	const samples = fs.readdirSync(`${__dirname}/samples`);
	for (const dir of samples.slice(samples.length - 2)) {
		if (dir[0] === '.') return;

		// add .solo to a sample directory name to only run that test
		const solo = (/\.solo$/).test(dir);

		if (solo && process.env.CI) {
			throw new Error(
				`Forgot to remove '.solo' from test parser/samples/${dir}`,
			);
		}

		const skip = !fs.existsSync(`${__dirname}/samples/${dir}/input.sm`);

		/** @type {typeof test | typeof test.skip} */
		let runner = test;
		if (skip) {
			runner = test.skip;
		} else if (solo) {
			runner = test.only;
		}

		console.log('adding test', dir);

		runner(dir, () => {
			console.log('starting test', dir);
			const input = fs
				.readFileSync(`${__dirname}/samples/${dir}/input.sm`, 'utf-8')
				.replace(/\s+$/, '')
				.replace(/\r/g, '');
			const expectedOutput = tryToLoadJson(`${__dirname}/samples/${dir}/output.json`);
			const expectedError = tryToLoadJson(`${__dirname}/samples/${dir}/error.json`);

			try {
				console.log('creating parser');
				const parser = createParser();
				parser.init(input).parse();
				fs.writeFileSync(`${__dirname}/samples/${dir}/_actual.json`, JSON.stringify(parser.result, null, 4));
				expect(parser.result).toEqual(expectedOutput);
			} catch (/** @type {any} */error) {
				if (error.name !== 'ParseError') throw error;
				if (!expectedError) throw error;
				const { code, message, pos, start } = error;
				try {
					expect({ code, message, pos, start })
						.toEqual(expectedOutput);
				} catch (/** @type {any} */error2) {
					const err = error2.code === 'MODULE_NOT_FOUND' ? error : error2;
					throw err;
				}
			}
			console.log('finished test', dir);
		});
	}
});
