var gulp = require('gulp'),
    cp = require('child_process'),
    imagemin = require('gulp-imagemin'),
    browserSync = require('browser-sync').create(),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    minify = require('gulp-minify-css'),
    sourcemaps = require('gulp-sourcemaps'),
    util = require('gulp-util'),
    plumber = require('gulp-plumber'),
    prefixer = require('gulp-autoprefixer');

// config files (directories)
var config = {
  cssDir: 'assets/css/',
  jsDir: 'assets/js/', // javascript files
  bowerDir: 'assets/js/components/', // bower components directory
  imgDir: 'assets/img/',
  production: !!util.env.production, //for when you use the --production suffix. two exclamations turn undefined into a proper false
  notProduction: !util.env.production //--production NOT included
};
var errorMssg = function (err) {
    util.beep(3);
    util.log(util.colors.red(err));
};

// let jekyll build the static site html pages
gulp.task('jekyll-build', function(done){
  return cp.spawn('jekyll', ['build'], {stdio: 'inherit'})
    .on('close', done);
});
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

// compile and compress the scss files into the main.css file, then add autoprefixers
gulp.task('styles', function(){
  gulp.src('assets/css/main.scss')
  .pipe(config.notProduction ? sourcemaps.init() : util.noop())
    .pipe(config.notProduction ? plumber({ errorHandler: errorMssg }) : util.noop()) //Plumber prevents gulp from throwing a proper error exit code. For production, we want a proper error.
    .pipe(sass({
      includePaths: ['scss']
    }))
    .pipe(prefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(config.production ? minify() : util.noop())
    .pipe(config.notProduction ? sourcemaps.write('.') : util.noop())
    .pipe(gulp.dest('_site/' + config.cssDir))
    .pipe(browserSync.stream())
    .pipe(gulp.dest('assets/css'));
});

// gather all js files into one minified (uglify()) js file
gulp.task('js', function(){
  return gulp.src([config.bowerDir+'jquery/dist/jquery.min.js', config.jsDir + 'index.js'])
    .pipe(config.notProduction ? sourcemaps.init() : util.noop())
    .pipe(config.notProduction ? plumber({ errorHandler: errorMssg }) : util.noop())
    .pipe(concat('main.js'))
    .pipe(config.production ? uglify() : util.noop())
    .pipe(config.notProduction ? sourcemaps.write('.') : util.noop())
    .pipe(gulp.dest('_site/' + config.jsDir))
    .pipe(browserSync.stream())
    .pipe(gulp.dest('assets/js'));
});

// minify all the images you use for your site, save to same folder
gulp.task('min-images', function(){
	gulp.src(config.imgDir+'*.jpg')
		.pipe(imagemin({
      progessive: true
    }))
		.pipe(gulp.dest(config.imgDir));
});

// browser-sync init
gulp.task('browser-sync', ['styles', 'js', 'jekyll-build'], function(){
  browserSync.init({
    server: {
      baseDir: '_site'
    }
  });
});

gulp.task('watch', function(){
  gulp.watch(config.jsConc + '*.js', ['js']);
  gulp.watch(config.cssDir + '**/*.scss', ['styles']);
  gulp.watch([config.imgDir + '*.jpg', config.imgDir + '*.png'], ['min-images']);
  gulp.watch(['_includes/*.html', 'index.html'], ['jekyll-rebuild']);
});

gulp.task('default', ['browser-sync', 'watch']);
