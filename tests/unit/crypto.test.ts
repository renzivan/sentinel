import { describe, it, expect, beforeAll } from "vitest";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

beforeAll(() => { process.env.ENCRYPTION_KEY = "11".repeat(32); });

describe("crypto", () => {
  it("round-trips a value", () => {
    const enc = encryptSecret("hunter2");
    expect(enc).not.toContain("hunter2");
    expect(decryptSecret(enc)).toBe("hunter2");
  });
  it("produces different ciphertext each call (random IV)", () => {
    expect(encryptSecret("x")).not.toBe(encryptSecret("x"));
  });
  it("throws on tampered ciphertext", () => {
    const enc = encryptSecret("secret");
    const tampered = enc.slice(0, -2) + (enc.endsWith("00") ? "11" : "00");
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
