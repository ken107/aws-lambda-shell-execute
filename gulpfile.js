
const zip = require("gulp-zip");
const gulp = require("gulp");
const gutil = require("gulp-util");
const chalk = require("chalk");

gulp.task("default", function() {
	gutil.log(chalk.yellow("Make sure binaries have execute permission before packaging."));
	gutil.log(chalk.yellow("This should be run from a Linux shell so that permissions are properly copied into the package."));

	return gulp.src(["index.js", "package.json", "package-lock.json", "bin/*"], {base: "."})
		.pipe(zip("package.zip"))
		.pipe(gulp.dest("dist"))
})
