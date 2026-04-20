import { randomBytes } from "crypto";
import { v4 } from "uuid";
import { nanoid } from "nanoid";

export function generateId() {
  return v4();
}

export function generateUserToken() {
  return randomBytes(32).toString("hex");
}

export function generateShortId(size: number = 7) {
  return nanoid(size);
}
