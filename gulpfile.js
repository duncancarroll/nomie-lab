var gulp        = require('gulp');
var browserSync = require('browser-sync').create();
var sass        = require('gulp-sass');

// Static server
gulp.task('serve', ['sass'], function() {

    browserSync.init({
        server: "./"
    });
    gulp.watch("scss/*.scss", ['sass']);
    gulp.watch(["*.html","app/*","app/*/*"]).on('change', browserSync.reload);
});

gulp.task('sass', function() {
    return gulp.src("scss/*.scss")
        .pipe(sass())
        .pipe(gulp.dest("app/css"))
        .pipe(browserSync.stream());
});

gulp.task('default', ['serve']);
