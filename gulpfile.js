var gulp = require('gulp'),
    dot = require('gulp-dot');


gulp.task('dot', function() {
    gulp.src(['src/templates/*.dot'])
        .pipe(
            dot(
                {
                    it: {
                        libraries: require('./src/data/libraries'),
                        slugger: require('slugger')
                    }
                }
            )
        )
        .pipe(gulp.dest('.'));
});

gulp.task('watch', ['dot'], function () {
    gulp.watch('src/**/*.*', ['dot']);
});