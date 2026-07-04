import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

const id = () => integer("id").primaryKey({ autoIncrement: true });
const now = () => integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date());

export const users = sqliteTable("users", {
  id: id(),
  email: text("email"),
  createdAt: now(),
});

export const projects = sqliteTable("projects", {
  id: id(),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  createdAt: now(),
});

export const projectVars = sqliteTable("project_vars", {
  id: id(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  valueEnc: text("value_enc").notNull(),
  isSecret: integer("is_secret", { mode: "boolean" }).notNull().default(false),
});

export const flows = sqliteTable("flows", {
  id: id(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  steps: text("steps", { mode: "json" }).notNull().$type<string[]>(),
  createdAt: now(),
});

export const runs = sqliteTable("runs", {
  id: id(),
  flowId: integer("flow_id").notNull().references(() => flows.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("queued"), // queued|running|passed|failed|error
  error: text("error"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  createdAt: now(),
});

export const stepResults = sqliteTable("step_results", {
  id: id(),
  runId: integer("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
  stepIndex: integer("step_index").notNull(),
  stepText: text("step_text").notNull(),
  status: text("status").notNull(), // passed|failed
  aiSummary: text("ai_summary"),
});

export const findings = sqliteTable("findings", {
  id: id(),
  runId: integer("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
  stepResultId: integer("step_result_id").references(() => stepResults.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // functional|console|network|visual
  severity: text("severity").notNull(), // critical|high|medium|low|info
  title: text("title").notNull(),
  detail: text("detail"),
  repro: text("repro"),
});

export const artifacts = sqliteTable("artifacts", {
  id: id(),
  runId: integer("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
  stepResultId: integer("step_result_id").references(() => stepResults.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // screenshot|trace|console|network
  path: text("path").notNull(),
});

export type Project = typeof projects.$inferSelect;
export type Flow = typeof flows.$inferSelect;
export type Run = typeof runs.$inferSelect;
export type StepResult = typeof stepResults.$inferSelect;
export type Finding = typeof findings.$inferSelect;
export type Artifact = typeof artifacts.$inferSelect;
