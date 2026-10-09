const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

const readHiddenPassword = () =>
  new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
      reject(new Error("Run this script from an interactive terminal."));
      return;
    }

    process.stdout.write("Enter the admin password: ");
    process.stdin.setRawMode(true);
    process.stdin.resume();

    let password = "";
    const onData = (key) => {
      if (key[0] === 3) {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        reject(new Error("Password generation cancelled."));
        return;
      }
      if (key[0] === 13 || key[0] === 10) {
        process.stdin.removeListener("data", onData);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        resolve(password);
        return;
      }
      if (key[0] === 8 || key[0] === 127) {
        password = password.slice(0, -1);
        return;
      }
      password += key.toString();
    };

    process.stdin.on("data", onData);
  });

const main = async () => {
  const password = await readHiddenPassword();
  if (password.length < 12) {
    throw new Error("Use an admin password with at least 12 characters.");
  }

  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  process.stdout.write(
    `ADMIN_PASSWORD_HASH=${salt.toString("hex")}:${hash.toString("hex")}\n`,
  );
};

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
