import { createServerFn } from "@tanstack/react-start";

export const getAdminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { adminStatus, auditAdminAction } = await import("./admin-access.server");
  let status: Awaited<ReturnType<typeof adminStatus>>;
  try {
    status = await adminStatus();
  } catch (error) {
    await auditAdminAction(null, "get_admin_status", "admin_access", null, "failure");
    throw error;
  }
  const { state, role, permissions, userId } = status;
  await auditAdminAction(userId ?? null, "get_admin_status", "admin_access", null, state === "ready" ? "success" : "denied");
  return { state, role, permissions };
});
