
const zip = (await import("gulp-zip")).default
const { task, src, dest } = await import("gulp")

task("default", function() {
	console.log("Put binaries into bin/ directory first.")
	console.log("Make sure binaries have execute permission before packaging.")
	console.log("This should be run from a Linux shell so that permissions are properly copied into the package.")

	return src(["*.js", "package.json", "package-lock.json", "bin/*"], {base: "."})
		.pipe(zip("package.zip"))
		.pipe(dest("dist"))
})
