/* browserify task
   ---------------
   Bundle javascripty things with browserify!

   If the watch task is running, this uses watchify instead
   of browserify for faster bundling using caching.
*/

var browserify   = require('browserify');
var watchify     = require('watchify');
var bundleLogger = require('../util/bundleLogger');
var gulp         = require('gulp');
var handleErrors = require('../util/handleErrors');
var source       = require('vinyl-source-stream');

gulp.task('browserify', function(callback) {

  // Each of these objects represent separate bundles we'd like to compile
  var filesToBundle = [{
      entries: './src/javascript/app.coffee',
      dest: './build/',
      bundleName: 'app.js'
    }, {
      entries: './src/javascript/admin.coffee',
      dest: './build/',
      bundleName: 'admin.js'
    }];

  var bundleQueue = filesToBundle.length;

  var browserifyThis = function(file) {
    var bundler = browserify({
      // Required watchify args
      cache: {}, packageCache: {}, fullPaths: true,
      // Specify the entry point of your app
      entries: file.entries,
      // Add file extentions to make optional in your requires
      extensions: ['.coffee', '.hbs'],
      // Enable source maps!
      debug: true
    });

    var bundle = function() {
      // Log when bundling starts
      bundleLogger.start(file.bundleName);

      return bundler
        .bundle()
        // Report compile errors
        .on('error', handleErrors)
        // Use vinyl-source-stream to make the
        // stream gulp compatible. Specifiy the
        // desired output filename here.
        .pipe(source(file.bundleName))
        // Specify the output destination
        .pipe(gulp.dest(file.dest))
        .on('end', function() {
          // Log when bundling completes
          bundleLogger.end(file.bundleName)

          if(bundleQueue.length) {
            bundleQueue--;
            if(bundleQueue === 0) {
              // Let gulp know the task is complete:
              // all bundles have been initialized.
              callback();
            }
          }
        });
    };

    if(global.isWatching) {
      // Wrap with watchify and rebundle on changes
      bundler = watchify(bundler);
      bundler.on('update', bundle);
    }

    return bundle();
  };

  // Browserify each item in the list
  filesToBundle.forEach(browserifyThis);
});
