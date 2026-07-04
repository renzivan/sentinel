export type VarRow = {
  key: string;
  value: string;
  isSecret: boolean;
  /** true if this row started out as a stored secret (loaded with a blank "unchanged" value) */
  wasSecret: boolean;
};

export type VarPayloadItem = { key: string; value: string; isSecret: boolean };

/**
 * Build the payload sent to PUT /api/projects/[id]/vars.
 *
 * A stored secret's real value is never available client-side (the GET only
 * ever returns "***" for secrets). If a row that was originally a stored
 * secret is left blank, we cannot know whether the user intends to keep the
 * secret, blank it, or downgrade it to plaintext -- so we always preserve the
 * existing ciphertext in that case, regardless of the current checkbox state.
 * The API's keep-existing-ciphertext logic triggers on `isSecret:true` with
 * an empty value, so sending `{isSecret:true, value:""}` is what actually
 * preserves it server-side.
 *
 * The only way to change or clear a previously-stored secret is to type a
 * new value, at which point the current checkbox state is honored as-is.
 */
export function buildVarsPayload(rows: VarRow[]): VarPayloadItem[] {
  return rows.map((row) => {
    if (row.wasSecret && row.value === "") {
      return { key: row.key, value: "", isSecret: true };
    }
    return { key: row.key, value: row.value, isSecret: row.isSecret };
  });
}
