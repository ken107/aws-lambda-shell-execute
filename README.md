# aws-lambda-shell-execute
An AWS Lambda function that executes a shell command and returns the output.  Additional executable binaries can be deployed with and used by the function.

### 1. Prepare
Create a 'bin' subdirectory in the project directory and add any executable binaries your function needs.  These binaries must be compatible with the AWS Lambda execution environment, which is Amazon Linux.  Make sure they have the execute permission set.

### 2. Build
Open a shell in the project directory and run `npm run dist`.  If you're on Windows, make sure you use a Linux shell so that file permissions are properly copied into the package.  Then deploy the `dist/package.zip` file to your AWS Lambda function.

### 3. Invoke
You can quickly test your function from the Lambda console with this simple test event:
```javascript
{
  "command": "ls",
  "args": ["-l"]
}
```

# Request
The request event can have the following properties:

1. _command_: the shell command to execute
2. _args_: array of arguments
3. _stdin_: a string that is passed as stdin
4. _stdinEncoding_: encoding of _stdin_ (default 'utf8', use 'base64' for binary)
5. _stdoutEncoding_: encoding to use to encode stdout into a string


# Response
The response can have the following properties:

1. _exitCode_: either the exit code or the signal that ended the command
2. _stdout_: the command's stdout as a string
3. _stderr_: the command's stderr as a string
