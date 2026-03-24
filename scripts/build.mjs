import * as esbuild from 'esbuild';

// LuCI packages treat a top-level src/ directory as a special build/install hook.
const watch = process.argv.includes('--watch');

const buildOptions = {
	entryPoints: ['frontend-src/fluent-vendor.js'],
	outfile: 'htdocs/luci-static/fluent/vendor/web-components.min.js',
	bundle: true,
	format: 'iife',
	platform: 'browser',
	target: ['es2020'],
	minify: true,
	legalComments: 'none',
	logLevel: 'info',
};

if (watch) {
	const ctx = await esbuild.context(buildOptions);
	await ctx.watch();
	console.log('Watching Fluent vendor bundle...');
}
else {
	await esbuild.build(buildOptions);
}
