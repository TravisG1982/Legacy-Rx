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
import { useEffect, useRef, type ReactNode } from "react";

import appCss from "../styles.css?url";
import faviconAsset from "../assets/favicon.png.asset.json";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header, TrustBar } from "../components/Header";
import { Footer } from "../components/Footer";
import { CookieConsent } from "../components/CookieConsent";
import { Toaster } from "../components/ui/sonner";
import { purgeLegacyPromo } from "../lib/funnel-store";

import { META_PIXEL_ID, initGa4, trackGa4, trackMeta } from "../lib/analytics";


const FUNNEL_PATHS = new Set(["/qualify", "/checkout"]);
const CHROMELESS_PATHS = new Set([
  "/lander",
  "/lander-1",
  "/lander-2",
  "/deal-of-the-day",
  "/weekend-sale",
  "/travis",
]);

function NotFoundComponent() {
  return (
    <div className="container-lx" style={{ padding: "120px 22px", textAlign: "center" }}>
      <h1>404</h1>
      <h2>Page not found</h2>
      <p className="lead">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="container-lx" style={{ padding: "120px 22px", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.6rem" }}>This page didn't load</h1>
      <p className="lead">Something went wrong on our end. You can try refreshing or head back home.</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          className="btn btn-primary"
          onClick={() => { router.invalidate(); reset(); }}
        >
          Try again
        </button>
        <a href="/" className="btn btn-ghost">Go home</a>
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
      { name: "description", content: "Doctor-prescribed compounded GLP-1 treatment. Flat monthly pricing. Start your assessment with a U.S.-licensed clinician." },
      { name: "author", content: "LegacyRX" },
      { name: "facebook-domain-verification", content: "vatb6d25eiy40xsz2swshc6fucgtrk" },
      { property: "og:title", content: "LegacyRX.net | Physician-Led Medical Weight Loss" },
      { property: "og:description", content: "Doctor-prescribed compounded GLP-1 treatment. Flat monthly pricing. Start your assessment with a U.S.-licensed clinician." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "LegacyRX.net | Physician-Led Medical Weight Loss" },
      { name: "twitter:description", content: "Doctor-prescribed compounded GLP-1 treatment. Flat monthly pricing. Start your assessment with a U.S.-licensed clinician." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4ea23fab-627b-4052-8c5e-addb791b884d/id-preview-163ace56--f4aea4b1-fbef-4bcc-a720-fdd4a6046a98.lovable.app-1780736119479.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4ea23fab-627b-4052-8c5e-addb791b884d/id-preview-163ace56--f4aea4b1-fbef-4bcc-a720-fdd4a6046a98.lovable.app-1780736119479.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Inter:wght@300;400;500;600;700&display=swap" },
      { rel: "icon", type: "image/png", href: faviconAsset.url },
      { rel: "apple-touch-icon", href: faviconAsset.url },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [
      {
        // Klaviyo onsite tracking. Site-wide <head> script (this project has no
        // static index.html; TanStack Start renders <head> from this route).
        // Klaviyo Site ID (public API key).
        type: "text/javascript",
        async: true,
        src: "https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=S6Pyjq",
      },
      {
        // try/catch: a restricted in-app webview (Facebook/Instagram) can block
        // cookie/storage access here, and an uncaught throw would surface as a
        // page-level JavaScript error and abort the rest of the inline scripts.
        children:
          "try{(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-WJ6THGR3');}catch(e){}",
      },
      {
        // Microsoft Clarity (project y0tjgxqr3i). Not loaded on the private /travis dashboard.
        children:
          'try{if(location.pathname.indexOf("/travis")!==0){(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "y0tjgxqr3i");}}catch(e){}',
      },

      {
        // Meta Pixel base code. Deliberately NO automatic fbq('track','PageView'):
        // PageView is fired from the router effect with an eventID so it
        // deduplicates against the matching Conversions API hit.
        //
        // Before fbevents.js loads we write the dedup keys ourselves - a
        // first-party _fbp cookie (adopted by the Pixel instead of writing its
        // own) and a per-session anonymous external_id passed as advanced
        // matching - so the browser hit and its server twin always agree.
        children:
          "(function(){try{var d=document,ls=window.sessionStorage;" +
          "if(!/(?:^|;\\s*)_fbp=/.test(d.cookie)){var h=location.hostname.replace(/^www\\./,'');" +
          "d.cookie='_fbp=fb.1.'+Date.now()+'.'+(Math.floor(Math.random()*1e10)+''+Math.floor(Math.random()*1e8))+'; path=/; max-age=7776000'+(h.indexOf('.')>-1?'; domain=.'+h:'')+'; SameSite=Lax';}" +
          "var k='lrx_external_id',id=ls&&ls.getItem(k);" +
          "if(!id){id=(window.crypto&&window.crypto.randomUUID)?window.crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);if(ls)ls.setItem(k,id);}" +
          "window.__lrxExternalId=id;}catch(e){}})();" +
          "try{!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('set','autoConfig',false,'" +
          META_PIXEL_ID +
          "');fbq('init','" +
          META_PIXEL_ID +
          "',window.__lrxExternalId?{external_id:window.__lrxExternalId}:undefined);}catch(e){}",
      },
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
      <head><HeadContent /></head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WJ6THGR3"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <noscript>
          <img
            height="1"
            width="1"
            alt=""
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>

        {children}
        <Scripts />
      </body>
    </html>
  );
}

function pushDataLayer(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(payload);
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isFunnel = FUNNEL_PATHS.has(pathname);
  const isChromeless = CHROMELESS_PATHS.has(pathname);
  const lastPushedPathRef = useRef<string | null>(null);

  // Wipe the old cross-visit promo storage: no discount applies by default.
  useEffect(() => {
    purgeLegacyPromo();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (lastPushedPathRef.current === pathname) return;

    // Force document.title from the matched routes' head() meta before pushing,
    // so page_title reflects the current route and never a stale value.
    try {
      const matches = router.state.matches;
      let routeTitle: string | undefined;
      for (const m of matches) {
        const head =
          typeof (m as { meta?: unknown }).meta !== "undefined"
            ? ((m as { meta?: Array<Record<string, unknown>> }).meta ?? [])
            : [];
        for (const tag of head) {
          if (tag && typeof (tag as { title?: unknown }).title === "string") {
            routeTitle = (tag as { title: string }).title;
          }
        }
      }
      if (routeTitle && document.title !== routeTitle) {
        document.title = routeTitle;
      }
    } catch {
      // ignore — fall back to current document.title
    }

    // Analytics must never be able to throw into the render tree: a blocked
    // cookie/storage jar in an in-app webview would otherwise show up as a
    // page-level JavaScript error mid-session.
    try {
      pushDataLayer({
        event: "PageView",
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
      // Meta PageView: Pixel + Conversions API, same event_id, neutralized title.
      initGa4();
      trackGa4("page_view", {
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
      trackMeta("PageView");
    } catch (err) {
      console.warn("analytics pageview failed", err);
    }
    lastPushedPathRef.current = pathname;
  }, [pathname, router]);


  return (
    <QueryClientProvider client={queryClient}>
      {!isFunnel && !isChromeless && <TrustBar />}
      {!isFunnel && !isChromeless && <Header />}
      <main style={isFunnel ? { background: "#f7f5f1", minHeight: "100vh" } : undefined}>
        <Outlet />
      </main>
      {!isFunnel && !isChromeless && <Footer />}
      {!isChromeless && <CookieConsent />}
      <Toaster position="top-right" richColors closeButton duration={5000} />

    </QueryClientProvider>
  );
}
