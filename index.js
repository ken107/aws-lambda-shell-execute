
const childProc = require("child_process");
const Readable = require("stream").Readable;

process.env.PATH += ":" + require("path").join(__dirname, "bin");

exports.handler = (event, context, callback) => {
  const child = childProc.spawn(event.command, event.args, {shell: true});
  let hasError = false;
  child.on("error", err => {
    hasError = true;
    callback(err);
  })
  const getExitCode = new Promise(function(fulfill) {
    child.on("exit", (code, signal) => fulfill(signal || code));
  })
  Promise.all([getExitCode, getStream(child.stdout), getStream(child.stderr)])
    .then(function([exitCode, stdout, stderr]) {
      if (!hasError)
        callback(null, {
          exitCode,
          stdout: stdout.toString(event.stdoutEncoding || "utf8"),
          stderr: stderr.toString(event.stderrEncoding || "utf8")
        })
    })
  if (event.stdin) {
    const stdin = new Readable();
    stdin.push(Buffer.from(event.stdin, event.stdinEncoding || "utf8"));
    stdin.push(null);
    stdin.pipe(child.stdin);
  }
};

function getStream(stream) {
  return new Promise(function(fulfill) {
    const chunks = [];
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("end", () => fulfill(Buffer.concat(chunks)));
  })
}
