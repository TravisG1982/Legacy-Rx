import { createFileRoute, Link } from "@tanstack/react-router";
import semaVial from "@/assets/semaglutide-vial.webp";
import tirzVial from "@/assets/tirzepatide-vial.webp";
import brandLogo from "@/assets/legacyrx-burgundy.webp";
import footerLogo from "@/assets/legacyrx-cream.webp";
import { useFromPrices } from "@/hooks/use-live-prices";
import { useOfferDeadline } from "@/hooks/use-offer-deadline";
import { trackGa4 } from "@/lib/analytics";
import { MEDS } from "@/lib/legacyrx-data";
import hipaaLogo from "@/assets/hipaa-compliant-transparent.webp";
import legitScriptLogo from "@/assets/legitscript-certified.webp";

export const Route = createFileRoute("/lander-2")({
  head: () => ({
    meta: [
      { title: "LegacyRX | Flat-Price GLP-1 Weight Care" },
      {
        name: "description",
        content:
          "Compounded GLP-1 prescribed online at one flat monthly price. All doses included, free cold-chain shipping, cancel anytime.",
      },
      { property: "og:title", content: "LegacyRX | Flat-Price GLP-1 Weight Care" },
      {
        property: "og:description",
        content:
          "Compounded GLP-1 prescribed online at one flat monthly price. All doses included, free cold-chain shipping, cancel anytime.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: Lander2Page,
});

const CSS = `
.lander2-root{--navy:#B4232C;--navy2:#7A1620;--gold:#D3A33B;--goldd:#A56C16;--goldbg:#FBF3DF;--cream:#F6F1EA;--white:#fff;--text:#2A1214;--mid:#6F5652;--light:#927D78;--line:#E6D7D2;--teal:#D13B43;--coral:#C9543B;--l1-display:'Playfair Display',Georgia,serif;--l1-body:'DM Sans',sans-serif;font-family:var(--l1-body);color:var(--text);background:#fff;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.lander2-root *{margin:0;padding:0;box-sizing:border-box}
.lander2-root h1,.lander2-root h2,.lander2-root h3,.lander2-root h4{font-family:var(--l1-display);font-weight:600;line-height:1.15;color:var(--navy)}
.lander2-root a{text-decoration:none;color:inherit}
.lander2-root .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--l1-body);font-weight:600;border-radius:12px;cursor:pointer;border:none;transition:.2s;min-height:54px;padding:16px 34px;font-size:1rem}
.lander2-root .btn-gold{background:var(--gold);color:var(--navy);box-shadow:0 8px 22px rgba(212,168,83,.3)}
.lander2-root .btn-gold:hover{background:var(--goldd);color:#fff;transform:translateY(-2px)}
.lander2-root .btn-o{background:transparent;border:2px solid var(--gold);color:var(--goldd)}
.lander2-root .topbar{background:var(--navy);color:#fff;text-align:center;padding:10px 20px;font-size:13px;font-weight:500}
.lander2-root .topbar span{color:var(--gold);font-weight:700}
.lander2-root .topbar .offer{display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700;margin-bottom:3px}
.lander2-root .cdn{color:var(--gold);font-variant-numeric:tabular-nums lining-nums;font-weight:800;letter-spacing:.5px}
.lander2-root .smob .cdrow{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--goldd);margin-bottom:2px}
.lander2-root .smob .cdn{color:var(--goldd)}
.lander2-root .nav{display:flex;justify-content:center;align-items:center;padding:18px 30px;background:#fff;border-bottom:1px solid var(--line)}
.lander2-root .logo{font-family:var(--l1-display);font-size:27px;font-weight:700;color:var(--navy)}
.lander2-root .logo .rx{color:var(--gold)}
.lander2-root .hero{background:linear-gradient(170deg,#fff 0%,var(--goldbg) 45%,var(--cream) 100%);padding:66px 20px 56px;text-align:center}
.lander2-root .hbadge{display:inline-flex;align-items:center;gap:8px;background:rgba(212,168,83,.14);border:1px solid rgba(212,168,83,.4);padding:7px 18px;border-radius:100px;font-size:12px;font-weight:700;color:var(--goldd);text-transform:uppercase;letter-spacing:1px;margin-bottom:24px}
.lander2-root .hero h1{font-size:clamp(2.3rem,5vw,3.4rem);max-width:680px;margin:0 auto 14px;font-variant-numeric:lining-nums}
.lander2-root .hero h1 em{font-style:italic;color:var(--gold)}
.lander2-root .hero .sub{font-size:18px;color:var(--mid);max-width:520px;margin:0 auto 8px}
.lander2-root .hero .cmp{font-size:14px;color:var(--light);margin-bottom:34px}
.lander2-root .hero .cmp .st{text-decoration:line-through;color:var(--coral)}
.lander2-root .hero .cmp strong{color:var(--goldd);font-size:16px}
.lander2-root .pcards{display:flex;justify-content:center;gap:26px;max-width:880px;margin:0 auto;flex-wrap:wrap}
.lander2-root .pcard{background:#fff;border:1px solid var(--line);border-radius:20px;padding:34px 30px;width:380px;box-shadow:0 6px 30px rgba(15,43,60,.06);position:relative}
.lander2-root .pcard.pop{border:2px solid var(--gold)}
.lander2-root .ptag{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--gold);color:var(--navy);padding:5px 18px;border-radius:100px;font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase}
.lander2-root .ptag.v{background:var(--navy);color:#fff}
.lander2-root .pname{font-family:var(--l1-display);font-size:25px;font-weight:600;margin-bottom:4px}
.lander2-root .ptype{font-size:13px;color:var(--light);margin-bottom:18px}
.lander2-root .pblock{position:relative;margin:14px 0 20px;padding:22px 0 20px;text-align:center}
.lander2-root .pblock::before,.lander2-root .pblock::after{content:"";position:absolute;left:50%;transform:translateX(-50%);width:56px;height:2px;background:var(--gold);border-radius:2px}
.lander2-root .pblock::before{top:0}
.lander2-root .pblock::after{bottom:0}
.lander2-root .pstart{display:block;font-size:13px;font-weight:600;letter-spacing:2.2px;text-transform:uppercase;color:var(--goldd);margin-bottom:2px}
.lander2-root .prow{display:flex;align-items:baseline;justify-content:center;gap:4px}
.lander2-root .pcur{font-family:var(--l1-display);font-size:30px;font-weight:700;color:var(--navy);align-self:flex-start;margin-top:10px}
.lander2-root .pprice{font-family:var(--l1-display);font-size:78px;font-weight:800;color:var(--navy2);line-height:.92;letter-spacing:-2px}
.lander2-root .pper{font-size:20px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--navy);margin-left:4px}
.lander2-root .psave{display:inline-block;background:var(--goldbg);color:var(--goldd);font-size:12px;font-weight:700;padding:4px 12px;border-radius:6px;margin:12px 0 18px}
.lander2-root .pfeat{list-style:none;margin-bottom:22px}
.lander2-root .pfeat li{display:flex;gap:10px;font-size:14px;color:var(--mid);padding:6px 0}
.lander2-root .pfeat .ck{color:var(--gold);font-weight:700}
.lander2-root .pdose{background:var(--cream);border-radius:10px;padding:10px 14px;font-size:12px;color:var(--mid);text-align:center;margin-bottom:18px}
.lander2-root .proofbar{display:flex;justify-content:center;gap:48px;padding:36px 20px;background:#fff;border-bottom:1px solid var(--line);flex-wrap:wrap}
.lander2-root .proofbar .it{text-align:center}
.lander2-root .proofbar .n{font-family:var(--l1-display);font-size:32px;font-weight:700;color:var(--gold);line-height:1;margin-bottom:4px}
.lander2-root .proofbar .l{font-size:13px;color:var(--light)}
.lander2-root .tstrip{display:flex;justify-content:center;gap:36px;padding:30px 20px;background:var(--navy);flex-wrap:wrap}
.lander2-root .tstrip .it{display:flex;align-items:center;gap:10px;color:rgba(255,255,255,.85);font-size:14px}
.lander2-root .tic{width:34px;height:34px;background:rgba(212,168,83,.2);border-radius:9px;display:flex;align-items:center;justify-content:center}
.lander2-root .sec{padding:76px 20px}
.lander2-root .sec.cream{background:var(--cream)}
.lander2-root .shead{text-align:center;max-width:580px;margin:0 auto 44px}
.lander2-root .label{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:var(--gold);margin-bottom:10px}
.lander2-root .shead h2{font-size:clamp(1.9rem,3.6vw,2.5rem);margin-bottom:10px}
.lander2-root .shead p{color:var(--mid)}
.lander2-root .ctable{max-width:800px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,43,60,.06)}
.lander2-root table{width:100%;border-collapse:collapse;background:#fff}
.lander2-root .ctable th{background:var(--navy);color:#fff;padding:16px 22px;font-size:14px;text-align:left}
.lander2-root .ctable th:last-child{background:var(--gold);color:var(--navy)}
.lander2-root .ctable td{padding:15px 22px;font-size:14px;color:var(--mid);border-bottom:1px solid var(--cream)}
.lander2-root .ctable td:last-child{color:var(--goldd);font-weight:700}
.lander2-root .ctable tr:last-child td{border-bottom:none}
.lander2-root .prow2 td{font-family:var(--l1-display);font-size:20px;font-weight:700}
.lander2-root .prow2 td:nth-child(2){color:var(--coral)}
.lander2-root .prow2 td:last-child{color:var(--goldd)}
.lander2-root .steps{display:flex;justify-content:center;gap:28px;max-width:920px;margin:0 auto;flex-wrap:wrap}
.lander2-root .step{flex:1;min-width:240px;max-width:280px;text-align:center;padding:32px 22px;border-radius:16px;background:#fff;border:1px solid var(--line)}
.lander2-root .snum{width:48px;height:48px;background:var(--gold);color:var(--navy);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--l1-display);font-size:20px;font-weight:700;margin:0 auto 18px}
.lander2-root .step h3{font-family:var(--l1-display);font-size:19px;margin-bottom:8px}
.lander2-root .step p{font-size:14px;color:var(--mid)}
.lander2-root .whygrid{display:grid;grid-template-columns:1fr 1fr;gap:22px;max-width:880px;margin:0 auto}
.lander2-root .why{background:#fff;border:1px solid var(--line);border-radius:16px;padding:30px 26px}
.lander2-root .whyi{width:48px;height:48px;background:var(--goldbg);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:16px}
.lander2-root .why h3{font-size:17px;margin-bottom:8px;font-family:var(--l1-display)}
.lander2-root .why p{font-size:14px;color:var(--mid)}
.lander2-root .tgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:920px;margin:0 auto}
.lander2-root .tc{background:var(--cream);border:1px solid var(--line);border-radius:16px;padding:28px 24px;text-align:left}
.lander2-root .tc .stars{color:var(--gold);letter-spacing:2px;margin-bottom:14px}
.lander2-root .tc p{font-size:14px;color:var(--mid);font-style:italic;margin-bottom:18px}
.lander2-root .tc .au{display:flex;align-items:center;gap:10px}
.lander2-root .tc .avi{width:42px;height:42px;border-radius:50%;background:var(--goldbg);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--goldd)}
.lander2-root .tc .nm{font-weight:600;font-size:14px;color:var(--navy)}
.lander2-root .tc .mt{font-size:12px;color:var(--gold)}
.lander2-root .ph-note{max-width:920px;margin:18px auto 0;font-size:12px;color:var(--light);text-align:center;font-style:italic}
.lander2-root .faq{max-width:700px;margin:0 auto;text-align:left}
.lander2-root .faq .item{border-bottom:1px solid var(--line);padding:22px 0}
.lander2-root .faq .item:first-child{border-top:1px solid var(--line)}
.lander2-root .faq .q{font-family:var(--l1-display);font-size:17px;font-weight:600;margin-bottom:8px}
.lander2-root .faq .a{font-size:14px;color:var(--mid)}
.lander2-root .final{padding:80px 20px;text-align:center;background:linear-gradient(170deg,var(--goldbg),var(--cream))}
.lander2-root .final h2{font-size:clamp(2rem,4vw,2.8rem);margin-bottom:14px}
.lander2-root .final p{color:var(--mid);max-width:480px;margin:0 auto 28px}
.lander2-root .fsub{font-size:13px;color:var(--light);margin-top:16px}
.lander2-root .l1foot{background:var(--navy);color:rgba(255,255,255,.5);padding:38px 20px;text-align:center;font-size:11px;line-height:1.7}
.lander2-root .l1foot .flogo{font-family:var(--l1-display);font-size:23px;color:#fff;margin-bottom:14px}
.lander2-root .l1foot .flogo .rx{color:var(--gold)}
.lander2-root .l1foot .disc{max-width:600px;margin:0 auto 16px}
.lander2-root .l1foot a{color:rgba(255,255,255,.5);text-decoration:underline}
.lander2-root .smob{display:none;position:fixed;bottom:0;left:0;right:0;z-index:60;background:#fff;border-top:1px solid var(--line);padding:12px 20px;box-shadow:0 -4px 20px rgba(0,0,0,.1)}
.lander2-root .smob .in{display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:480px;margin:0 auto}
.lander2-root .smob .pr{font-size:13px;color:var(--mid)}
.lander2-root .smob .pr strong{font-size:22px;color:var(--goldd)}
@media(max-width:860px){.lander2-root .pcards{flex-direction:column;align-items:center}.lander2-root .pcard{width:100%;max-width:400px;padding:26px 22px}.lander2-root .proofbar{flex-direction:column;gap:12px;padding:22px 20px}.lander2-root .tstrip{gap:16px;padding:20px 20px}.lander2-root .whygrid,.lander2-root .tgrid{grid-template-columns:1fr}.lander2-root .ctable{overflow-x:auto}.lander2-root table{min-width:520px}.lander2-root .sec{padding:40px 18px}.lander2-root .shead{margin-bottom:26px}.lander2-root .hero{padding:36px 18px 32px}.lander2-root .hbadge{margin-bottom:14px}.lander2-root .hero h1{margin-bottom:10px;font-size:clamp(2rem,7vw,2.6rem)}.lander2-root .hero .cmp{margin-bottom:20px}.lander2-root .final{padding:48px 20px}.lander2-root .faq .item{padding:16px 0}.lander2-root .steps{flex-direction:column;align-items:center}.lander2-root .smob{display:block}.lander2-root .l1foot{padding-bottom:84px}.lander2-root .pprice{font-size:64px}.lander2-root .pcur{font-size:26px;margin-top:8px}.lander2-root .pper{font-size:18px}.lander2-root .pblock{padding:18px 0 16px}}
/* ---------- mobile refinements (<=560px) ---------- */
@media(max-width:560px){
.lander2-root .proofbar{display:grid;grid-template-columns:1fr 1fr;gap:18px 12px;padding:22px 16px}
.lander2-root .proofbar .n{font-size:27px}
.lander2-root .proofbar .l{font-size:12px}
.lander2-root .tstrip{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:18px 16px}
.lander2-root .tstrip .it{font-size:12.5px;gap:8px;min-width:0}
.lander2-root .tstrip .it span:last-child{min-width:0}
.lander2-root .tic{width:28px;height:28px;border-radius:8px;flex-shrink:0}
/* comparison table: fit the viewport so the LegacyRX column is never cut off */
.lander2-root .ctable{overflow:hidden;border-radius:14px}
.lander2-root table{min-width:0;table-layout:fixed}
.lander2-root .ctable th{padding:11px 8px;font-size:11.5px;line-height:1.25}
.lander2-root .ctable td{padding:11px 8px;font-size:12px;line-height:1.3}
.lander2-root .ctable th:first-child,.lander2-root .ctable td:first-child{width:38%}
.lander2-root .prow2 td{font-size:15px}
.lander2-root .why{padding:22px 18px}
.lander2-root .whyi{width:40px;height:40px;border-radius:10px;font-size:19px;margin-bottom:12px}
.lander2-root .tc{padding:22px 18px}
.lander2-root .step{padding:24px 18px;min-width:0;max-width:100%;width:100%}
.lander2-root .sec{padding:34px 16px}
.lander2-root .final{padding:40px 16px}
.lander2-root .smob{padding:10px 14px}
.lander2-root .smob .in{gap:10px}
.lander2-root .smob .pr{font-size:11.5px;min-width:0}
.lander2-root .smob .pr strong{font-size:19px}
}

/* ---------- premium layer (CSS only, GPU-friendly) ---------- */
.lander2-root{--glass:rgba(255,255,255,.72);--goldline:linear-gradient(135deg,rgba(212,168,83,.9),rgba(212,168,83,.15) 45%,rgba(212,168,83,.85))}
@keyframes l1up{from{opacity:0;transform:translate3d(0,18px,0)}to{opacity:1;transform:none}}
@keyframes l1sheen{0%{transform:translateX(-120%)}60%,100%{transform:translateX(220%)}}
@keyframes l1float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes l1pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.9;transform:scale(1.06)}}
.lander2-root .hero,.lander2-root .final{position:relative;overflow:hidden}
.lander2-root .hero::before,.lander2-root .hero::after{content:"";position:absolute;border-radius:50%;filter:blur(60px);pointer-events:none;will-change:opacity,transform;animation:l1pulse 9s ease-in-out infinite}
.lander2-root .hero::before{width:420px;height:420px;top:-140px;left:-120px;background:radial-gradient(circle,rgba(212,168,83,.34),transparent 70%)}
.lander2-root .hero::after{width:360px;height:360px;bottom:-150px;right:-110px;background:radial-gradient(circle,rgba(180,35,44,.16),transparent 70%);animation-delay:2.5s}
.lander2-root .hero>*{position:relative;z-index:1}
.lander2-root .hbadge,.lander2-root .hero h1,.lander2-root .hero .sub,.lander2-root .hero .cmp,.lander2-root .pcards{animation:l1up .7s cubic-bezier(.22,.7,.24,1) both}
.lander2-root .hero h1{animation-delay:.06s}
.lander2-root .hero .sub{animation-delay:.12s}
.lander2-root .hero .cmp{animation-delay:.18s}
.lander2-root .pcards{animation-delay:.24s}
.lander2-root .hbadge{position:relative;overflow:hidden;backdrop-filter:blur(8px);background:rgba(255,255,255,.55);box-shadow:0 2px 14px rgba(212,168,83,.18)}
.lander2-root .hbadge::after{content:"";position:absolute;inset:0;width:36%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.85),transparent);animation:l1sheen 4.5s ease-in-out infinite}
.lander2-root .hero h1 em{background:linear-gradient(100deg,#B8902F,#E7C275 45%,#B8902F);-webkit-background-clip:text;background-clip:text;color:transparent}
/* glass pricing cards with gradient hairline */
.lander2-root .pcard{background:var(--glass);backdrop-filter:blur(14px) saturate(140%);border:1px solid rgba(255,255,255,.6);box-shadow:0 18px 50px -22px rgba(180,35,44,.32),0 2px 6px rgba(180,35,44,.05);transition:transform .35s cubic-bezier(.22,.7,.24,1),box-shadow .35s ease}
.lander2-root .pcard::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;background:var(--goldline);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.55;pointer-events:none}
.lander2-root .pcard.pop{border-color:transparent}
.lander2-root .pcard.pop::before{opacity:1}
.lander2-root .pcard:hover{transform:translateY(-6px);box-shadow:0 30px 66px -24px rgba(180,35,44,.42)}
.lander2-root .pcard img{transition:transform .5s cubic-bezier(.22,.7,.24,1);filter:drop-shadow(0 22px 26px rgba(180,35,44,.22))}
.lander2-root .pcard:hover img{transform:translateY(-6px) scale(1.03)}
.lander2-root .pcard.pop img{animation:l1float 6s ease-in-out infinite}
.lander2-root .ptag{box-shadow:0 6px 18px -6px rgba(180,35,44,.45)}
.lander2-root .pblock{background:radial-gradient(120% 90% at 50% 50%,rgba(212,168,83,.16),rgba(212,168,83,0) 70%)}
.lander2-root .pcard:hover .pblock::before,.lander2-root .pcard:hover .pblock::after{width:82px;transition:width .35s cubic-bezier(.22,.7,.24,1)}
.lander2-root .pblock::before,.lander2-root .pblock::after{transition:width .35s cubic-bezier(.22,.7,.24,1)}
.lander2-root .pprice{animation:l2price .7s cubic-bezier(.22,.7,.24,1) .3s both}
@keyframes l2price{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
.lander2-root .pfeat li{transition:color .2s ease}
.lander2-root .pfeat li:hover{color:var(--navy)}
.lander2-root .pdose{background:linear-gradient(180deg,rgba(246,241,232,.9),rgba(251,243,225,.9));border:1px solid rgba(212,168,83,.28);letter-spacing:.3px}
.lander2-root .pwas{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:6px}
.lander2-root .pwas .old{font-size:19px;font-weight:700;color:var(--light);text-decoration:line-through}
.lander2-root .pwas .save{background:var(--coral);color:#fff;font-size:12px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:5px 11px;border-radius:999px}
.lander2-root .pclaim{font-family:var(--l1-body);font-size:15px;font-weight:700;color:var(--text);text-align:center;margin:14px 0 4px;line-height:1.4}
.lander2-root .pclaim span{display:block;font-weight:500;font-size:13px;color:var(--mid);margin-top:4px}
/* buttons: sheen + depth */
.lander2-root .btn{position:relative;overflow:hidden;letter-spacing:.2px}
.lander2-root .btn-gold{background:linear-gradient(135deg,#E0B863,#D4A853 45%,#BE9737);box-shadow:0 12px 28px -10px rgba(184,144,47,.65),inset 0 1px 0 rgba(255,255,255,.45)}
.lander2-root .btn-gold:hover{background:linear-gradient(135deg,#D4A853,#B8902F);box-shadow:0 18px 34px -12px rgba(184,144,47,.7)}
.lander2-root .btn-gold::after{content:"";position:absolute;top:0;bottom:0;width:42%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:translateX(-140%)}
.lander2-root .btn-gold:hover::after{animation:l1sheen 1.1s ease-out}
.lander2-root .btn-o{background:rgba(255,255,255,.6);backdrop-filter:blur(6px)}
.lander2-root .btn-o:hover{background:var(--navy);border-color:var(--navy);color:#fff;transform:translateY(-2px)}
/* proof + trust */
.lander2-root .proofbar{background:linear-gradient(180deg,#fff,#FEFBF4)}
.lander2-root .proofbar .it{transition:transform .3s ease}
.lander2-root .proofbar .it:hover{transform:translateY(-4px)}
.lander2-root .proofbar .n{background:linear-gradient(100deg,#B8902F,#E9C87C);-webkit-background-clip:text;background-clip:text;color:transparent}
.lander2-root .tstrip{background:linear-gradient(120deg,var(--navy2),var(--navy) 55%,#4f2429);position:relative}
.lander2-root .tstrip::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:linear-gradient(90deg,transparent,rgba(212,168,83,.7),transparent)}
.lander2-root .tic{background:rgba(212,168,83,.18);border:1px solid rgba(212,168,83,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.12);transition:transform .3s ease,background .3s ease}
.lander2-root .tstrip .it:hover .tic{transform:translateY(-3px);background:rgba(212,168,83,.3)}
/* section heads + cards */
.lander2-root .label{position:relative;display:inline-block;padding-bottom:8px}
.lander2-root .label::after{content:"";position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:38px;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent)}
.lander2-root .step,.lander2-root .why,.lander2-root .tc{transition:transform .35s cubic-bezier(.22,.7,.24,1),box-shadow .35s ease,border-color .35s ease}
.lander2-root .step:hover,.lander2-root .why:hover,.lander2-root .tc:hover{transform:translateY(-5px);border-color:rgba(212,168,83,.55);box-shadow:0 20px 44px -24px rgba(180,35,44,.35)}
.lander2-root .why,.lander2-root .step{background:linear-gradient(180deg,#fff,#FFFDF8)}
.lander2-root .snum{background:linear-gradient(135deg,#E0B863,#B8902F);box-shadow:0 10px 22px -10px rgba(184,144,47,.7)}
.lander2-root .whyi{background:linear-gradient(135deg,#FBF3E1,#F3E5C4);border:1px solid rgba(212,168,83,.28)}
.lander2-root .tc{background:rgba(255,255,255,.66);backdrop-filter:blur(10px)}
.lander2-root .tc .avi{background:linear-gradient(135deg,#FBF3E1,#EED9A9)}
.lander2-root .ctable{box-shadow:0 26px 60px -32px rgba(180,35,44,.42);border:1px solid rgba(212,168,83,.22)}
.lander2-root .ctable tbody tr{transition:background .2s ease}
.lander2-root .ctable tbody tr:hover{background:#FEFBF4}
.lander2-root .faq .item{transition:padding-left .3s ease}
.lander2-root .faq .item:hover{padding-left:8px}
.lander2-root .faq .q{transition:color .2s ease}
.lander2-root .faq .item:hover .q{color:var(--goldd)}
.lander2-root .final::before{content:"";position:absolute;width:520px;height:520px;top:-220px;left:50%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle,rgba(212,168,83,.28),transparent 70%);filter:blur(60px);pointer-events:none}
.lander2-root .final>*{position:relative;z-index:1}
.lander2-root .smob{background:rgba(255,255,255,.82);backdrop-filter:blur(14px) saturate(150%);border-top:1px solid rgba(212,168,83,.35)}
/* conversion additions (lander-2 only) */
.lander2-root .nav{justify-content:space-between;gap:14px}
.lander2-root .navcta{min-height:42px;padding:10px 18px;font-size:.9rem;border-radius:10px;white-space:nowrap}
.lander2-root .hcta{display:flex;flex-direction:column;align-items:center;gap:8px;margin:0 auto 26px}
.lander2-root .hcta .btn{min-width:290px}
.lander2-root .hnote{font-size:13px;color:var(--light)}
.lander2-root .hero .cmp{margin-bottom:18px}
.lander2-root .choicehint{max-width:560px;margin:0 auto 22px;font-size:14px;color:var(--mid);background:rgba(212,168,83,.1);border:1px solid rgba(212,168,83,.32);border-radius:12px;padding:10px 16px}
.lander2-root .pcard:not(.pop){opacity:.97}
.lander2-root .pcard.pop{box-shadow:0 18px 46px -18px rgba(184,144,47,.45);transform:translateY(-6px)}
.lander2-root .midcta{text-align:center;padding:0 20px 44px}
.lander2-root .midcta p{font-size:15px;color:var(--mid);margin-bottom:14px}
.lander2-root .sdesk{position:fixed;right:22px;bottom:22px;z-index:60;display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.9);backdrop-filter:blur(14px) saturate(150%);border:1px solid rgba(212,168,83,.4);border-radius:16px;padding:12px 16px;box-shadow:0 18px 44px -18px rgba(180,35,44,.4)}
.lander2-root .sdesk .pr{font-size:13px;color:var(--mid);text-align:left}
.lander2-root .sdesk .pr strong{font-size:20px;color:var(--goldd)}
/* trust elements (lander-2 only) */
.lander2-root .hstrip{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 18px;max-width:720px;margin:0 auto 24px}
.lander2-root .hstrip span{display:inline-flex;align-items:center;gap:7px;font-family:var(--l1-body);font-size:13px;font-weight:600;color:var(--mid);background:rgba(255,255,255,.72);border:1px solid rgba(212,168,83,.32);border-radius:999px;padding:7px 13px}
.lander2-root .hstrip svg{width:15px;height:15px;flex:0 0 auto;color:var(--goldd)}
.lander2-root .trustwrap{max-width:1040px;margin:0 auto;padding:0 20px 56px}
.lander2-root .trustbox{background:linear-gradient(180deg,#fff,#FEFBF4);border:1px solid rgba(212,168,83,.3);border-radius:20px;padding:26px 22px;box-shadow:0 22px 50px -30px rgba(180,35,44,.35)}
.lander2-root .trusth{display:flex;align-items:center;justify-content:center;text-align:center;gap:12px;font-family:var(--l1-body);font-size:13px;font-weight:800;letter-spacing:2.2px;text-transform:uppercase;color:var(--goldd);margin-bottom:22px}
.lander2-root .trusth::before,.lander2-root .trusth::after{content:"";flex:0 0 auto;height:1px;width:44px;background:linear-gradient(90deg,transparent,rgba(212,168,83,.7),transparent)}
@media(max-width:560px){.lander2-root .trusth::before,.lander2-root .trusth::after{width:22px}}
.lander2-root .trustgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.lander2-root .tcard{display:flex;align-items:flex-start;gap:13px;background:#fff;border:1px solid rgba(212,168,83,.22);border-radius:14px;padding:15px 16px;transition:transform .3s ease,border-color .3s ease,box-shadow .3s ease}
.lander2-root .tcard:hover{transform:translateY(-3px);border-color:rgba(212,168,83,.5);box-shadow:0 16px 34px -22px rgba(180,35,44,.4)}
.lander2-root .tcard .ic{flex:0 0 auto;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#FBF3E1,#EED9A9);border:1px solid rgba(212,168,83,.35);color:var(--goldd)}
.lander2-root .tcard .ic svg{width:21px;height:21px}
.lander2-root .tcard h4{font-family:var(--l1-body);font-size:15.5px;font-weight:800;color:var(--text);margin:1px 0 3px;line-height:1.25}
.lander2-root .tcard p{font-family:var(--l1-body);font-size:13.5px;color:var(--mid);line-height:1.4;margin:0}
.lander2-root .certgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.lander2-root .cert{background:#fff;border:1px solid rgba(212,168,83,.22);border-radius:14px;padding:20px 16px;text-align:center}
.lander2-root .cert img{height:66px;width:auto;display:block;margin:0 auto 12px}
.lander2-root .cert .cl{font-family:var(--l1-body);font-size:12.5px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:var(--mid)}
.lander2-root .statline{text-align:center;font-family:var(--l1-body);font-size:14.5px;font-weight:600;color:var(--mid);margin:-8px 0 22px}
.lander2-root .statline strong{color:var(--goldd);font-weight:800}
.lander2-root .ctanote{font-family:var(--l1-body);font-size:13px;color:var(--light);margin-top:12px}
@media(max-width:640px){.lander2-root .trustgrid,.lander2-root .certgrid{grid-template-columns:1fr}}
@media(max-width:860px){.lander2-root .sdesk{display:none}.lander2-root .navcta{padding:9px 14px;font-size:.82rem}.lander2-root .hcta .btn{min-width:0;width:100%}}
@media(prefers-reduced-motion:reduce){.lander2-root *,.lander2-root *::before,.lander2-root *::after{animation:none!important;transition:none!important}}
`;

const CTA_TARGET = "/qualify" as const;

// Every /lander-2 CTA reports where it was clicked so we can see which block
// earns the click and which visitors never click at all.
function ctaClick(location: string) {
  try {
    window.sessionStorage.setItem("lrx_lander_src", "lander-2");
  } catch {
    /* storage unavailable */
  }
  trackGa4("lander_cta_click", { lander: "lander-2", cta_location: location });
}

const SVG = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

function IconLock() {
  return (
    <svg {...SVG}>
      <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function IconBadge() {
  return (
    <svg {...SVG}>
      <path d="M12 3l2.2 1.6 2.7-.2.9 2.6 2.2 1.6-1 2.6 1 2.6-2.2 1.6-.9 2.6-2.7-.2L12 21l-2.2-1.6-2.7.2-.9-2.6L4 15.4l1-2.6-1-2.6 2.2-1.6.9-2.6 2.7.2z" />
      <path d="M9.4 12.2l1.9 1.9 3.3-3.6" />
    </svg>
  );
}
function IconTruck() {
  return (
    <svg {...SVG}>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18.5" r="1.8" />
      <circle cx="17" cy="18.5" r="1.8" />
    </svg>
  );
}
function IconNo() {
  return (
    <svg {...SVG}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6.2 17.8L17.8 6.2" />
    </svg>
  );
}
function IconPharmacy() {
  return (
    <svg {...SVG}>
      <path d="M5 9h14v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
      <path d="M4 5.5h16V9H4z" />
      <path d="M12 12.5v5M9.5 15h5" />
    </svg>
  );
}


function Lander2Page() {
  const { semaText, tirzText } = useFromPrices();
  const semaNow = Number(semaText.replace(/[^0-9.]/g, ""));
  const tirzNow = Number(tirzText.replace(/[^0-9.]/g, ""));
  const semaWas = MEDS.sema.plans.find((p) => p.id === "3")?.mo ?? 168.9;
  const tirzWas = MEDS.tirz.plans.find((p) => p.id === "3")?.mo ?? 175;
  // Persistent 15-minute offer window (shared with the funnel) instead of a
  // countdown that restarts on every page load.
  const offer = useOfferDeadline();
  const timer = offer.ready && !offer.expired ? offer.label : null;

  return (
    <div className="lander2-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <Link
        to={CTA_TARGET}
        className="topbar"
        style={{ display: "block", textDecoration: "none", cursor: "pointer" }}
        onClick={() => ctaClick("topbar")}
      >
        <div className="offer">
          {timer ? (
            <>⏱ Your price is held for <span className="cdn">{timer}</span></>
          ) : (
            <>⏱ Your price is held while you complete your visit</>

          )}
        </div>
        Others charge $299-$1,000+/mo for GLP-1s. <span>LegacyRX starts at {semaText}/mo.</span> All doses included.
      </Link>

      <nav className="nav">
        <img loading="lazy" decoding="async" src={brandLogo} alt="LegacyRX" style={{ height: 36, width: "auto", display: "block" }} />
        <Link to={CTA_TARGET} className="btn btn-gold navcta" onClick={() => ctaClick("nav")}>
          Get started →
        </Link>
      </nav>

      <section className="hero">
        <div className="hbadge">✦ Transparent pricing</div>
        <h1>GLP-1 Weight Management You Can <em>Actually</em> Afford</h1>
        <p className="sub">Doctor-prescribed medication. Flat monthly pricing. Every dose included. Delivered to your door.</p>
        <p className="cmp">Flat monthly pricing - <strong>from {semaText}/mo</strong>.</p>
        <div className="hcta">
          <Link to={CTA_TARGET} className="btn btn-gold" onClick={() => ctaClick("hero")}>
            Check if I qualify - 2 minutes, free →
          </Link>
          <span className="hnote">No insurance needed. Not everyone qualifies.</span>
        </div>
        <div className="hstrip">
          <span><IconLock /> HIPAA-secure &amp; private</span>
          <span><IconBadge /> U.S.-licensed providers</span>
          <span><IconTruck /> Free discreet shipping</span>
          <span><IconNo /> Cancel anytime</span>
        </div>
        <p className="choicehint">
          Not sure which one? Start your assessment and a U.S.-licensed clinician recommends the right medication for you.
        </p>
        <div className="pcards">
          <div className="pcard">
            <div className="ptag v">Best Value</div>
            <Link to={CTA_TARGET} style={{ display: "block" }} onClick={() => ctaClick("sema_image")}><img fetchPriority="high" decoding="async" width={230} height={230} src={semaVial} alt="Compounded Semaglutide vial" style={{ display: "block", margin: "8px auto 14px", height: 230, width: "auto", objectFit: "contain", cursor: "pointer" }} /></Link>
            <div className="pname">Semaglutide</div>
            <div className="ptype">Compounded GLP-1</div>
            <div className="pblock">
              <span className="pstart">Now only</span>
              <div className="prow"><span className="pcur">$</span><span className="pprice">{semaText.replace("$", "")}</span><span className="pper">/ mo</span></div>
              {semaWas > semaNow && (
                <div className="pwas">
                  <span className="old">${semaWas}</span>
                  <span className="save">Save ${semaWas - semaNow}</span>
                </div>
              )}
            </div>
            <p className="pclaim">
              Flat Monthly Pricing. No Membership Fees.
              <span>No hidden costs. Everything included.</span>
            </p>
            <ul className="pfeat">
              <li><span className="ck">✓</span> Doctor-prescribed compounded med</li>
              <li><span className="ck">✓</span> All doses included</li>
              <li><span className="ck">✓</span> Free shipping</li>
              <li><span className="ck">✓</span> No membership fees · no insurance needed</li>
            </ul>
            <div className="pdose">0.25mg | 0.5mg | 1mg | 1.5mg | 2mg | 2.5mg</div>
            <Link to={CTA_TARGET} className="btn btn-o" style={{ width: "100%" }} onClick={() => ctaClick("sema_card")}>Continue with Semaglutide →</Link>
          </div>
          <div className="pcard pop">
            <div className="ptag">Most Popular</div>
            <Link to={CTA_TARGET} style={{ display: "block" }} onClick={() => ctaClick("tirz_image")}><img fetchPriority="high" decoding="async" width={230} height={230} src={tirzVial} alt="Compounded Tirzepatide vial" style={{ display: "block", margin: "8px auto 14px", height: 230, width: "auto", objectFit: "contain", cursor: "pointer" }} /></Link>
            <div className="pname">Tirzepatide</div>
            <div className="ptype">Compounded GLP-1 + GIP</div>
            <div className="pblock">
              <span className="pstart">Now only</span>
              <div className="prow"><span className="pcur">$</span><span className="pprice">{tirzText.replace("$", "")}</span><span className="pper">/ mo</span></div>
              {tirzWas > tirzNow && (
                <div className="pwas">
                  <span className="old">${tirzWas}</span>
                  <span className="save">Save ${tirzWas - tirzNow}</span>
                </div>
              )}
            </div>
            <p className="pclaim">
              Flat Monthly Pricing. No Membership Fees.
              <span>No hidden costs. Everything included.</span>
            </p>
            <ul className="pfeat">
              <li><span className="ck">✓</span> Dual-action GLP-1 + GIP</li>
              <li><span className="ck">✓</span> All doses included</li>
              <li><span className="ck">✓</span> Free shipping</li>
              <li><span className="ck">✓</span> No membership fees · no insurance needed</li>
            </ul>
            <div className="pdose">2.5mg | 5mg | 7.5mg | 10mg | 12.5mg | 15mg</div>
            <Link to={CTA_TARGET} className="btn btn-gold" style={{ width: "100%" }} onClick={() => ctaClick("tirz_card")}>Continue with Tirzepatide →</Link>
          </div>
        </div>
      </section>


      <div className="proofbar">
        <div className="it"><div className="n">147,800+</div><div className="l">Patients served</div></div>
        <div className="it"><div className="n">4.8★</div><div className="l">Average rating</div></div>

        <div className="it"><div className="n">2–5 Days</div><div className="l">Typical delivery</div></div>
        <div className="it"><div className="n">$0</div><div className="l">Hidden fees</div></div>
      </div>

      <div className="tstrip">
        <div className="it"><div className="tic">🔒</div> HIPAA Compliant</div>
        <div className="it"><div className="tic">🚚</div> Free Shipping</div>
        <div className="it"><div className="tic">⚕️</div> U.S.-Licensed Clinicians</div>
        <div className="it"><div className="tic">🏥</div> State-Licensed Pharmacies</div>
      </div>

      <div className="trustwrap" style={{ paddingTop: 46 }}>
        <div className="trustbox">
          <div className="trusth">Why patients trust us</div>
          <div className="trustgrid">
            <div className="tcard">
              <div className="ic"><IconPharmacy /></div>
              <div>
                <h4>U.S.-Licensed Pharmacies</h4>
                <p>State-licensed compounding facilities</p>
              </div>
            </div>
            <div className="tcard">
              <div className="ic"><IconBadge /></div>
              <div>
                <h4>Licensed Providers</h4>
                <p>Telehealth visits in eligible states</p>
              </div>
            </div>
            <div className="tcard">
              <div className="ic"><IconTruck /></div>
              <div>
                <h4>Free Shipping</h4>
                <p>Fast and discreet to your door</p>
              </div>
            </div>
            <div className="tcard">
              <div className="ic"><IconNo /></div>
              <div>
                <h4>Cancel Anytime</h4>
                <p>No membership or hidden fees</p>
              </div>
            </div>
          </div>
        </div>
      </div>



      <section className="sec cream">
        <div className="shead"><div className="label">See the difference</div><h2>Why LegacyRX Saves You More</h2><p>Compared to typical GLP-1 providers.</p></div>
        <div className="ctable">
          <table>
            <thead><tr><th></th><th>Other Providers</th><th>LegacyRX ✓</th></tr></thead>
            <tbody>
              <tr className="prow2"><td style={{ fontFamily: "var(--l1-body)", fontSize: 14, fontWeight: 600 }}>Semaglutide</td><td>$149–$499</td><td>{semaText}</td></tr>
              <tr className="prow2"><td style={{ fontFamily: "var(--l1-body)", fontSize: 14, fontWeight: 600 }}>Tirzepatide</td><td>$299–$599</td><td>{tirzText}</td></tr>
              <tr><td>Price rises at higher doses?</td><td>Yes</td><td>No</td></tr>
              <tr><td>Membership / subscription fees?</td><td>$49–$129/mo</td><td>$0 - none</td></tr>
              <tr><td>Shipping</td><td>$9.99–$29.99</td><td>Free</td></tr>
              <tr><td>Consultation</td><td>$50–$100</td><td>Included</td></tr>
            </tbody>
          </table>
        </div>
        <div className="midcta" style={{ paddingTop: 28, paddingBottom: 0 }}>
          <p>See if you qualify in 2 minutes.</p>
          <Link to={CTA_TARGET} className="btn btn-gold" onClick={() => ctaClick("mid_compare")}>
            Get started →
          </Link>
          <div className="ctanote">Free 2-minute assessment. No charge to see if you qualify.</div>
        </div>
      </section>



      <section className="sec">
        <div className="shead"><div className="label">How it works</div><h2>Three Steps. That's It.</h2><p>100% online, from home.</p></div>
        <div className="steps">
          <div className="step"><div className="snum">1</div><h3>Quick Health Check</h3><p>Answer a few questions about your health history. See if you may qualify.</p></div>
          <div className="step"><div className="snum">2</div><h3>Clinician Reviews</h3><p>A U.S.-licensed provider reviews your info and prescribes if appropriate.</p></div>
          <div className="step"><div className="snum">3</div><h3>Delivered to You</h3><p>Ships from a state-licensed pharmacy with free shipping, discreet packaging.</p></div>
        </div>
      </section>

      <section className="sec cream">
        <div className="shead"><div className="label">Why LegacyRX</div><h2>Results Without the Runaround</h2><p>Not a subscription trap or a membership club.</p></div>
        <div className="whygrid">
          <div className="why"><div className="whyi">💲</div><h3>Transparent Pricing</h3><p>One simple price covers medication, clinician consultation, and shipping - no surprise charges.</p></div>
          <div className="why"><div className="whyi">🔐</div><h3>Flat at Every Dose</h3><p>Your plan price stays the same as your dose changes. No escalation fees.</p></div>
          <div className="why"><div className="whyi">⚡</div><h3>Quick, Private &amp; Online</h3><p>Complete your visit from home. Discreet packaging at your door.</p></div>
          <div className="why"><div className="whyi">🩺</div><h3>Real Clinicians &amp; Pharmacies</h3><p>U.S.-licensed providers and state-licensed pharmacies.</p></div>
        </div>
      </section>

      <section className="sec">
        <div className="shead"><div className="label">Real stories</div><h2>What Patients Say</h2><p>From people who started their journey with LegacyRX.</p></div>
        <p className="statline"><strong>147,800+ patients treated</strong> · <strong>4.8/5</strong> average rating</p>
        <div className="tgrid">
          {[
            { q: "I'd tried so many programs and felt stuck. LegacyRX was simple, the team was attentive, and my price never changed when my dose did.", n: "Jennifer Mitchell", m: "Verified patient · Ohio", i: "J" },
            { q: "Honest pricing and quick shipping. I appreciated being able to do everything from home without feeling rushed.", n: "Michael Carter", m: "Verified patient · North Carolina", i: "M" },
            { q: "The team made the process easy to understand. I felt supported every step and the results have been steady.", n: "Ashley Robinson", m: "Verified patient · Arizona", i: "A" },
          ].map((t) => (
            <div key={t.n} className="tc">
              <div className="stars">★★★★★</div>
              <p>"{t.q}"</p>
              <div className="au"><div className="avi">{t.i}</div><div><div className="nm">{t.n}</div><div className="mt">{t.m}</div></div></div>
            </div>
          ))}
        </div>

        <p className="ph-note">Testimonials and results must be from real, substantiated patients. Individual results vary; not everyone qualifies.</p>
      </section>

      <div className="trustwrap">
        <div className="trustbox">
          <div className="trusth">Certified &amp; accredited</div>
          <div className="certgrid">
            <div className="cert">
              <img loading="lazy" decoding="async" src={hipaaLogo} alt="HIPAA Compliant" />
              <div className="cl">Private &amp; Secure</div>
            </div>
            <div className="cert">
              <a
                href="https://www.legitscript.com/websites/?checker_keywords=legacyrx.net"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LegitScript Certified - verify"
              >
                <img loading="lazy" decoding="async" src={legitScriptLogo} alt="LegitScript Certified" />
              </a>
              <div className="cl">Verified Pharmacy</div>
            </div>
          </div>
        </div>
      </div>

      <div className="midcta">
        <p>Ready to see if you're a fit? It takes about 2 minutes.</p>
        <Link to={CTA_TARGET} className="btn btn-gold" onClick={() => ctaClick("mid_testimonials")}>
          Check if I qualify →
        </Link>
        <div className="ctanote">Free 2-minute assessment. No charge to see if you qualify.</div>
      </div>




      <section className="sec cream">
        <div className="shead"><div className="label">Common questions</div><h2>Frequently Asked Questions</h2></div>
        <div className="faq">
          <div className="item"><div className="q">Will my price ever increase?</div><div className="a">Your plan price is flat at every dose - no surprise dose-escalation charges.</div></div>
          <div className="item"><div className="q">Is this real prescription medication?</div><div className="a">Yes - physician-prescribed compounded medication with the same active ingredients as branded GLP-1s, dispensed by state-licensed U.S. pharmacies. Compounded medications are not FDA-approved.</div></div>
          <div className="item"><div className="q">Are there hidden fees?</div><div className="a">No. Medication, clinician consultation, and free shipping are included.</div></div>
          <div className="item"><div className="q">Do I need insurance?</div><div className="a">No - flat self-pay pricing, no insurance required.</div></div>
          <div className="item"><div className="q">Is it safe?</div><div className="a">Treatment is overseen by U.S.-licensed clinicians who review your history before prescribing. Not everyone qualifies.</div></div>
        </div>
      </section>

      <section className="final">
        <h2>Ready to Get Started?</h2>
        <p>Check your eligibility in 2 minutes. No commitment. Not everyone qualifies.</p>
        <Link to={CTA_TARGET} className="btn btn-gold" onClick={() => ctaClick("final")}>Check My Eligibility →</Link>
        <div className="fsub">Free 2-minute assessment. No charge to see if you qualify.</div>
        <div className="fsub" style={{ marginTop: 6 }}>HIPAA Compliant · Free Shipping · No Insurance Required</div>
      </section>

      <footer className="l1foot">
        <img loading="lazy" decoding="async" src={footerLogo} alt="LegacyRX" style={{ height: 40, width: "auto", display: "block", margin: "0 auto 14px", filter: "brightness(0) invert(1)" }} />
        <div className="disc">LegacyRX is a telehealth and pharmacy-fulfillment platform, not a medical practice. All prescribing decisions are made independently by a licensed clinician. Compounded medications are not FDA-approved; the FDA does not evaluate them for safety, effectiveness, or quality. Individual results vary. Not everyone qualifies. In an emergency call 9-1-1.</div>
        <div>
          <Link to="/privacy-policy">Privacy</Link> · <Link to="/hipaa-notice">HIPAA</Link> · <Link to="/important-safety-information">Safety Info</Link> · <Link to="/terms-of-use">Terms</Link>
        </div>
        <div style={{ marginTop: 12 }}>© 2026 LegacyRX LLC</div>
      </footer>

      <div className="smob">
        <Link to={CTA_TARGET} className="in" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }} onClick={() => ctaClick("sticky_mobile")}>
          <div className="pr">
            {timer && <div className="cdrow">⏱ Price held for <span className="cdn">{timer}</span></div>}
            From <strong>{semaText}</strong>/mo - all doses included
          </div>
          <span className="btn btn-gold" style={{ minHeight: 46, padding: "12px 20px" }}>Check if I qualify →</span>
        </Link>
      </div>

      <div className="sdesk">
        <div className="pr">
          {timer && <div style={{ fontSize: 12, fontWeight: 700, color: "var(--goldd)" }}>⏱ Price held for {timer}</div>}
          From <strong>{semaText}</strong>/mo
        </div>
        <Link to={CTA_TARGET} className="btn btn-gold" style={{ minHeight: 46, padding: "12px 20px" }} onClick={() => ctaClick("sticky_desktop")}>
          Check if I qualify →
        </Link>
      </div>


    </div>
  );
}
