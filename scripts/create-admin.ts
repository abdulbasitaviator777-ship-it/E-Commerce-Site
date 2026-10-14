#!/usr/bin/env node
/**
 * Securely create the first administrator (or promote an existing user).
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='StrongPass1' ADMIN_NAME='Your Name' \
 *     npm run create-admin
 *
 * Or run interactively (prompts will ask for email/password) if env vars are
 * not set. There is intentionally NO default admin account and no hardcoded
 * credentials anywhere in this project.
 */
import { PrismaClient } from "@prisma/client";
import * as readline from "node:readline";
import { hashPassword } from "../src/lib/crypto";

const prisma = new PrismaClient();

function prompt(query: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  return new Promise((resolve) => {
    if (hidden) {
      // Mask input for passwords.
      const stdin = process.stdin;
      process.stdout.write(query);
      let value = "";
      const onData = (char: Buffer) => {
        const c = char.toString("utf8");
        if (c === "\n" || c === "\r" || c === "\u0004") {
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          rl.close();
          resolve(value);
        } else if (c === "\u0003") {
          process.exit(1);
        } else if (c === "\u007F" || c === "\b") {
          value = value.slice(0, -1);
        } else {
          value += c;
        }
      };
      stdin.on("data", onData);
      stdin.resume();
    } else {
      rl.question(query, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

async function main() {
  let email = process.env.ADMIN_EMAIL?.trim();
  let password = process.env.ADMIN_PASSWORD;
  let name = process.env.ADMIN_NAME?.trim();

  if (!email) email = (await prompt("Admin email: ")).toLowerCase();
  if (!password) {
    password = await prompt("Admin password: ", true);
    const confirm = await prompt("Confirm password: ", true);
    if (password !== confirm) {
      console.error("Passwords do not match.");
      process.exit(1);
    }
  }
  if (!name) name = (await prompt("Admin name: ")) || "Administrator";

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("Invalid email address.");
    process.exit(1);
  }
  if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    console.error("Password must be at least 8 characters and include a letter and a number.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, role: "ADMIN", emailVerified: new Date() },
    update: { role: "ADMIN" },
  });

  console.log(`\nAdministrator ready: ${user.email} (role=${user.role})`);
  console.log("You can now sign in at /login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
