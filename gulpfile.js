
const zip = require("gulp-zip");
const gulp = require("gulp");
const chalk = require("chalk");

gulp.task("default", function() {
	console.log(chalk.yellow("Make sure binaries have execute permission before packaging."));
	console.log(chalk.yellow("This should be run from a Linux shell so that permissions are properly copied into the package."));

	return gulp.src(["*.js", "package.json", "package-lock.json", "bin/*"], {base: "."})
		.pipe(zip("package.zip"))
		.pipe(gulp.dest("dist"))
})
