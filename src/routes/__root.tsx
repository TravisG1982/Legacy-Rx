import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import faviconAsset from "../assets/favicon.png";
import { Header, TrustBar } from "../components/Header";
import { Footer } from "../components/Footer";
import { Toaster } from "../components/ui/sonner";
import { purgeLegacyPromo } from "../lib/funnel-store";

import { purgeLegacyTrackingState } from "../lib/analytics-consent";

const FUNNEL_PATHS = new Set(["/qualify"]);
const CHROMELESS_PATHS = new Set([
  "/lander",
  "/lander-1",
  "/lander-2",
  "/deal-of-the-day",
  "/weekend-sale",
  "/travis",
]);
const siteUrl = (import.meta.env.VITE_SITE_URL || "https://legacyrx.net").replace(/\/$/, "");

function NotFoundComponent() {
  return (
    <div className="container-lx" style={{ padding: "120px 22px", textAlign: "center" }}>
      <h1>404</h1>
      <h2>Page not found</h2>
      <p className="lead">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-primary">
        Go home
      </Link>
    </div>
  );
}

function ErrorComponent({ reset }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <div className="container-lx" style={{ padding: "120px 22px", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.6rem" }}>This page didn't load</h1>
      <p className="lead">
        Something went wrong on our end. You can try refreshing or head back home.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Try again
        </button>
        <a href="/" className="btn btn-ghost">
          Go home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LegacyRX.net | Physician-Led Medical Weight Loss" },
      {
        name: "description",
        content:
          "Doctor-prescribed compounded GLP-1 treatment. Flat monthly pricing. Start your assessment with a U.S.-licensed clinician.",
      },
      { name: "author", content: "LegacyRX" },
      { name: "facebook-domain-verification", content: "vatb6d25eiy40xsz2swshc6fucgtrk" },
      { property: "og:title", content: "LegacyRX.net | Physician-Led Medical Weight Loss" },
      {
        property: "og:description",
        content:
          "Doctor-prescribed compounded GLP-1 treatment. Flat monthly pricing. Start your assessment with a U.S.-licensed clinician.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "LegacyRX.net | Physician-Led Medical Weight Loss" },
      {
        name: "twitter:description",
        content:
          "Doctor-prescribed compounded GLP-1 treatment. Flat monthly pricing. Start your assessment with a U.S.-licensed clinician.",
      },
      { property: "og:image", content: `${siteUrl}/og-image.png` },
      { name: "twitter:image", content: `${siteUrl}/og-image.png` },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Inter:wght@300;400;500;600;700&display=swap",
      },
      { rel: "icon", type: "image/png", href: faviconAsset },
      { rel: "apple-touch-icon", href: faviconAsset },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isFunnel = FUNNEL_PATHS.has(pathname);
  const isChromeless = CHROMELESS_PATHS.has(pathname);

  // Wipe the old cross-visit promo storage: no discount applies by default.
  useEffect(() => {
    purgeLegacyPromo();
  }, []);

  // GA4, Meta, GTM and every other marketing tracker are intentionally off (client
  // decision). Only clear leftovers from earlier builds; never start tracking here.
  useEffect(() => {
    purgeLegacyTrackingState();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {!isFunnel && !isChromeless && <TrustBar />}
      {!isFunnel && !isChromeless && <Header />}
      <main id="main-content" tabIndex={-1} style={isFunnel ? { background: "#f7f5f1", minHeight: "100vh" } : undefined}>
        <Outlet />
      </main>
      {!isFunnel && !isChromeless && <Footer />}
      <Toaster position="top-right" richColors closeButton duration={5000} />
    </QueryClientProvider>
  );
}
