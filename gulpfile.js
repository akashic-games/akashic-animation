var gulp = require("gulp");
var path = require("path");
var dts = require('dts-bundle');
var shell = require("gulp-shell");
var del = require("del");
var typedoc = require('gulp-typedoc');
var tslint = require("gulp-tslint");
var jasmine = require("gulp-jasmine");
var istanbul = require("gulp-istanbul");
var reporters = require("jasmine-reporters");
var Reporter = require("jasmine-terminal-reporter");
var fs = require('fs');
var execSync = require('child_process').execSync;

var pkg = require("./package.json");

gulp.task("clean", function(cb) { del(["lib"], cb); });
gulp.task("clean:typings", function(cb) { del(["typings"], cb); });
gulp.task("compile:ts", shell.task("tsc"));

// lib/@akashic-extension/akashic-animaiton.d.ts の生成。
// 今や不要(package.jsonのtypingsフィールドがある)が、後方互換性のため生成する。
gulp.task("compile", ["compile:ts"], function () {
	dts.bundle({
		name: pkg.name,
		main: "lib/index.d.ts"
	});
});

gulp.task("typedoc", function() {
	fs.rename("node_modules/@types", "node_modules/@types.bak", function (err) {
		if (err && err.code !== "ENOENT") {
			throw err;
		}

		var command = "typedoc --out ./doc .";
		var commandException;
		try {
			execSync(command);
		} catch (e) {
			commandException = e;
		}

		fs.rename("node_modules/@types.bak", "node_modules/@types", function (err) {
			if (commandException) {
				throw commandException;
			}
			if (err && err.code !== "ENOENT") {
				throw err;
			}
		});
	});
});


gulp.task("lint-md", function(){
	return gulp.src(["**/*.md", "!node_modules/**/*.md"])
		.pipe(shell(["mdast <%= file.path %> --frail --no-stdout --quiet"]));
});

gulp.task("lint", function() {
	return gulp
		.src("./src/**/*.ts")
		.pipe(tslint())
		.pipe(tslint.report('prose', {
			summarizeFailureOutput: true
		}
	));
});

gulp.task("test", ["compile"], function(cb) {
	var jasmineReporters = [
		new Reporter({
			isVerbose: false,
			showColors: true,
			includeStackTrace: false
		}),
		new reporters.JUnitXmlReporter()
	];
	gulp.src(["./lib/**/*.js"])
		.pipe(istanbul())
		.pipe(istanbul.hookRequire())
		.on("finish", function() {
			gulp.src("spec/**/*[sS]pec.js")
				.pipe(jasmine({ reporter: jasmineReporters }))
				.pipe(istanbul.writeReports({ reporters: ["text", "cobertura", "lcov"] }))
				.on("end", cb);
		});
});

gulp.task("default", ["compile"]);
