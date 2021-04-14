const gulp = require('gulp');
const dot = require('gulp-dot');

exports.default = () =>
	gulp
		.src(['src/templates/*.dot'])
		.pipe(
			dot({
				it: {
					libraries: require('./src/data/libraries'),
					slugger: require('slugger')
				}
			})
		)
		.pipe(gulp.dest('.'));

exports.watch = () => gulp.watch('src/**/*.*', exports.default);
