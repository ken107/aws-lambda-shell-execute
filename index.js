
const shellExec = require("./shell-exec.js");

exports.handler = (event, context, callback) => {
  shellExec(event.command, event.args, event.stdin, event.stdinEncoding, event.stdoutEncoding)
    .then(result => callback(null, result))
    .catch(err => callback(err))
};
