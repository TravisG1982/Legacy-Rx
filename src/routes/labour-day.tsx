// Removed Labour Day sale — permanent redirect for legacy ad URLs.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/labour-day")({
  beforeLoad: () => {
    throw redirect({ to: "/qualify" });
  },
});
