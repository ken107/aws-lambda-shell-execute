
process.env.PATH = require("path").join(__dirname, "bin") + ":" + process.env.PATH;
module.exports = shellExec;

function shellExec(command, args, stdin, stdinEncoding, stdoutEncoding) {
  const child = require("child_process").spawn(command, args, {shell: true});
  if (stdin) {
    const Readable = require("stream").Readable;
    const str = new Readable();
    str.push(Buffer.from(stdin, stdinEncoding || "utf8"));
    str.push(null);
    str.pipe(child.stdin);
  }
  return Promise.all([
      getExitCode(child),
      getStream(child.stdout, stdoutEncoding || "utf8"),
      getStream(child.stderr, "utf8")
    ])
    .then(([exitCode, stdout, stderr]) => ({exitCode, stdout, stderr}))
};

function getExitCode(child) {
  return new Promise(function(fulfill, reject) {
    child.on("error", reject);
    child.on("exit", (code, signal) => fulfill(signal || code));
  })
}

function getStream(stream, encoding) {
  return new Promise(function(fulfill) {
    const chunks = [];
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("end", () => fulfill(Buffer.concat(chunks)));
  })
  .then(buf => encoding ? buf.toString(encoding) : buf)
}
