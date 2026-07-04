import { describe, it, expect } from "vitest";
import { substituteVars, maskSecrets, type Var } from "@/lib/vars";

const vars: Var[] = [
  { key: "email", value: "test@x.com", isSecret: false },
  { key: "password", value: "hunter2", isSecret: true },
];

describe("substituteVars", () => {
  it("replaces known vars", () => {
    expect(substituteVars("login as {{email}} / {{password}}", vars))
      .toBe("login as test@x.com / hunter2");
  });
  it("leaves unknown vars untouched", () => {
    expect(substituteVars("go to {{unknown}}", vars)).toBe("go to {{unknown}}");
  });
});

describe("maskSecrets", () => {
  it("masks secret values, not non-secret", () => {
    expect(maskSecrets("logged in test@x.com with hunter2", vars))
      .toBe("logged in test@x.com with ***");
  });
});
