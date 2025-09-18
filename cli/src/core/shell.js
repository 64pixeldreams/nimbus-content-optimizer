import { exec } from "node:child_process";

export function runCommand(command, args = [], { cwd, env, stdio = "inherit" } = {}) {
  return new Promise((resolve, reject) => {
    const fullCommand = `${command} ${args.join(' ')}`;
    exec(fullCommand, {
      cwd,
      env: { ...process.env, ...env },
    }, (error, stdout, stderr) => {
      if (stdio === "inherit") {
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
      }
      if (error) {
        reject(error);
      } else {
        resolve(0);
      }
    });
  });
}

