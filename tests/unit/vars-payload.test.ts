import { describe, it, expect } from "vitest";
import { buildVarsPayload, type VarRow } from "@/lib/vars-payload";

describe("buildVarsPayload", () => {
  it("(a) unchanged stored secret + blank + Secret unchecked -> still preserves ciphertext", () => {
    const rows: VarRow[] = [
      { key: "password", value: "", isSecret: false, wasSecret: true },
    ];
    expect(buildVarsPayload(rows)).toEqual([
      { key: "password", value: "", isSecret: true },
    ]);
  });

  it("(b) stored secret + new value entered + Secret checked -> sends the new value as a secret", () => {
    const rows: VarRow[] = [
      { key: "password", value: "newSecret123", isSecret: true, wasSecret: true },
    ];
    expect(buildVarsPayload(rows)).toEqual([
      { key: "password", value: "newSecret123", isSecret: true },
    ]);
  });

  it("(c) new value + Secret unchecked -> sends as plain", () => {
    const rows: VarRow[] = [
      { key: "email", value: "test@x.com", isSecret: false, wasSecret: false },
    ];
    expect(buildVarsPayload(rows)).toEqual([
      { key: "email", value: "test@x.com", isSecret: false },
    ]);
  });

  it("(d) non-secret plain row passes through unchanged", () => {
    const rows: VarRow[] = [
      { key: "email", value: "test@x.com", isSecret: false, wasSecret: false },
      { key: "region", value: "us-east", isSecret: false, wasSecret: false },
    ];
    expect(buildVarsPayload(rows)).toEqual([
      { key: "email", value: "test@x.com", isSecret: false },
      { key: "region", value: "us-east", isSecret: false },
    ]);
  });

  it("stored secret + new value entered but Secret unchecked -> honors the checkbox (downgrades to plain)", () => {
    const rows: VarRow[] = [
      { key: "password", value: "nowPlain", isSecret: false, wasSecret: true },
    ];
    expect(buildVarsPayload(rows)).toEqual([
      { key: "password", value: "nowPlain", isSecret: false },
    ]);
  });

  it("stored secret left blank but Secret still checked -> still preserves ciphertext", () => {
    const rows: VarRow[] = [
      { key: "password", value: "", isSecret: true, wasSecret: true },
    ];
    expect(buildVarsPayload(rows)).toEqual([
      { key: "password", value: "", isSecret: true },
    ]);
  });
});
