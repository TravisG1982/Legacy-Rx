import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import semaVial from "@/assets/semaglutide-vial.webp.asset.json";
import tirzVial from "@/assets/tirzepatide-vial.webp.asset.json";
import hipaaLogo from "@/assets/hipaa-compliant-transparent.webp.asset.json";
import legitScriptLogo from "@/assets/legitscript-certified.webp.asset.json";
import heroImg from "@/assets/ldo-hero.webp";
import heroImgSm from "@/assets/ldo-hero-sm.webp";
import step1Img from "@/assets/ldo-step1.webp";
import step2Img from "@/assets/ldo-step2.webp";
import step3Img from "@/assets/ldo-step3.webp";
import t1Img from "@/assets/ldo-t1.webp";
import t2Img from "@/assets/ldo-t2.webp";
import t3Img from "@/assets/ldo-t3.webp";
import doctorImg from "@/assets/ldo-doctor.webp";
import metabolismImg from "@/assets/ldo-metabolism.webp";
import { useFromPrices } from "@/hooks/use-live-prices";
import { trackGa4 } from "@/lib/analytics";


export const Route = createFileRoute("/deal-of-the-day")({
  head: () => ({
    meta: [
      { title: "Today's Exclusive Offer - GLP-1 From $168.90/mo | LegacyRX" },
      {
        name: "description",
        content:
          "Today only: doctor-prescribed compounded Semaglutide from $168.90/mo and Tirzepatide from $175/mo. All doses included, free shipping, cancel anytime.",
      },
      { property: "og:title", content: "Today's Exclusive Offer - GLP-1 From $168.90/mo | LegacyRX" },
      {
        property: "og:description",
        content:
          "Today's exclusive pricing on compounded Semaglutide and Tirzepatide, prescribed online by US-licensed providers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;700&display=swap",
      },
      {
        rel: "preload",
        as: "image",
        href: heroImgSm,
        imageSrcSet: `${heroImgSm} 480w, ${heroImg} 900w`,
        imageSizes: "(max-width: 900px) 92vw, 460px",
        fetchPriority: "high",
      },
    ],
  }),
  component: DealOfTheDayPage,
});

const PROMO = "EXCLUSIVE" as const;
const CTA = "/qualify" as const;
const CTA_SEARCH = {} as const;

const CSS = `
.ootd-root{--bg:#B4232C;--bg2:#5D1017;--gold:#F1C75B;--goldd:#9A6A19;--goldbg:#FBF3DF;--cream:#F6F1EA;--text:#2A1214;--mid:#6F5652;--light:#927D78;--line:#E6D7D2;--disp:'Playfair Display',Georgia,serif;--body:'DM Sans',system-ui,sans-serif;font-family:var(--body);color:var(--text);background:#fff;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden;padding-bottom:82px}
.ootd-root *{margin:0;padding:0;box-sizing:border-box}
.ootd-root h1,.ootd-root h2,.ootd-root h3{font-family:var(--disp);font-weight:700;line-height:1.14;color:var(--bg)}
.ootd-root a{text-decoration:none;color:inherit}
.ootd-root .btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;font-family:var(--body);font-weight:700;border-radius:14px;cursor:pointer;border:none;transition:.2s;min-height:56px;padding:16px 32px;font-size:1.02rem}
.ootd-root .btn-gold{background:linear-gradient(135deg,var(--gold),var(--goldd));color:#2A1216;box-shadow:0 10px 26px rgba(212,168,83,.36)}
.ootd-root .btn-gold:hover{transform:translateY(-2px)}
.ootd-root .btn-cream{background:var(--cream);color:var(--bg)}
.ootd-root .wide{width:100%;max-width:420px}
.ootd-root .wrap{max-width:1080px;margin:0 auto;padding:0 18px}

.ootd-root .marq{background:var(--bg2);color:var(--gold);overflow:hidden;white-space:nowrap;padding:8px 0;font-weight:800;letter-spacing:.32em;font-size:12px;border-bottom:1px solid rgba(212,168,83,.35)}
.ootd-root .marq span{display:inline-block;animation:ootd-slide 22s linear infinite}
@keyframes ootd-slide{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.ootd-root .topbar{background:var(--bg);color:#fff;text-align:center;padding:11px 18px;font-size:13.5px;font-weight:600}
.ootd-root .topbar b{color:var(--gold)}
.ootd-root .nav{display:flex;align-items:center;justify-content:center;padding:16px;background:#fff;border-bottom:1px solid var(--line)}
.ootd-root .logo{font-family:var(--disp);font-size:26px;font-weight:800;color:var(--bg)}
.ootd-root .logo .rx{color:var(--gold)}

.ootd-root .hero{background:linear-gradient(168deg,#fff,var(--goldbg) 55%,var(--cream));padding:34px 0 40px}
.ootd-root .hgrid{display:grid;grid-template-columns:1.05fr .95fr;gap:34px;align-items:center}
.ootd-root .pill{display:inline-flex;align-items:center;gap:8px;background:rgba(212,168,83,.16);border:1px solid rgba(212,168,83,.5);color:var(--goldd);padding:7px 15px;border-radius:99px;font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:16px}
.ootd-root .hero h1{font-size:clamp(2.05rem,4.4vw,3.1rem);margin-bottom:14px}
.ootd-root .hero h1 em{font-style:italic;color:var(--goldd)}
.ootd-root .hero .sub{font-size:16.5px;color:var(--mid);margin-bottom:18px;max-width:520px}
.ootd-root .hero .sub b{color:var(--bg)}
.ootd-root .promise-band{padding:14px 20px 4px}
.ootd-root .promise{max-width:1080px;margin:0 auto;background:linear-gradient(135deg,var(--bg) 0%,#5A1F2C 100%);border:2px solid var(--gold);border-radius:16px;padding:18px 22px;box-shadow:0 14px 34px -18px rgba(0,0,0,.55),0 0 0 5px rgba(212,168,83,.14);text-align:center}
.ootd-root .promise strong{display:block;color:var(--gold);font-weight:900;font-size:25px;line-height:1.15;letter-spacing:-.015em;text-transform:none}
.ootd-root .promise span{display:block;margin-top:8px;color:#fff;font-size:15.5px;font-weight:700;line-height:1.45;opacity:.95}
.ootd-root .hphoto{border-radius:22px;overflow:hidden;box-shadow:0 22px 50px -24px rgba(180,35,44,.6);position:relative}
.ootd-root .hphoto img{width:100%;height:100%;object-fit:cover;display:block}
.ootd-root .hphoto .tagf{position:absolute;left:14px;bottom:14px;background:rgba(255,255,255,.94);border-radius:13px;padding:9px 13px;font-size:12.5px;font-weight:700;color:var(--bg);box-shadow:0 8px 20px rgba(0,0,0,.14)}

.ootd-root .cards{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:0 0 18px}
.ootd-root .card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px 14px 18px;text-align:center;position:relative;box-shadow:0 8px 26px rgba(180,35,44,.07);transition:.2s}
.ootd-root .card:hover{transform:translateY(-3px);border-color:var(--gold)}
.ootd-root .card .tag{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:var(--bg);color:var(--gold);font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:4px 12px;border-radius:99px;white-space:nowrap}
.ootd-root .card img.vial{height:104px;width:auto;object-fit:contain;margin:8px auto 6px;display:block}
.ootd-root .card .nm{font-family:var(--disp);font-size:19px;font-weight:700;color:var(--bg)}
.ootd-root .card .dose{font-size:11.5px;color:var(--light);margin-bottom:8px}
.ootd-root .card .was{font-size:13px;color:#B4453A;text-decoration:line-through;font-weight:600}
.ootd-root .card .now{font-family:var(--disp);font-size:44px;font-weight:800;color:var(--bg2);line-height:1;letter-spacing:-1.5px}
.ootd-root .card .per{font-size:13px;font-weight:700;color:var(--mid)}
.ootd-root .card .inc{display:inline-block;margin-top:9px;background:var(--goldbg);color:var(--goldd);border-radius:7px;padding:4px 10px;font-size:11.5px;font-weight:700}

.ootd-root .assure{font-size:13px;color:var(--mid);margin-top:10px}
.ootd-root .stars{color:var(--gold);letter-spacing:2px;font-size:15px}
.ootd-root .ratebar{display:flex;flex-wrap:wrap;justify-content:center;gap:14px 34px;padding:20px;background:#fff;border-bottom:1px solid var(--line);text-align:center}
.ootd-root .ratebar .it{font-size:13px;color:var(--mid)}
.ootd-root .ratebar .it b{display:block;font-family:var(--disp);font-size:22px;color:var(--bg);line-height:1.2}

.ootd-root .cd{background:var(--bg);color:#fff;text-align:center;padding:26px 18px}
.ootd-root .cd .lb{font-size:11.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);font-weight:800;margin-bottom:10px}
.ootd-root .cd .clock{display:flex;justify-content:center;gap:10px}
.ootd-root .cd .u{background:rgba(255,255,255,.08);border:1px solid rgba(212,168,83,.4);border-radius:12px;min-width:74px;padding:9px 6px}
.ootd-root .cd .u b{display:block;font-family:var(--disp);font-size:30px;color:var(--gold);line-height:1;font-variant-numeric:tabular-nums}
.ootd-root .cd .u span{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)}

.ootd-root .sec{padding:52px 0}
.ootd-root .sec.cream{background:var(--cream)}
.ootd-root .sec.dark{background:var(--bg2);color:#fff}
.ootd-root .sec.dark h2,.ootd-root .sec.dark h3{color:#fff}
.ootd-root .shead{text-align:center;max-width:620px;margin:0 auto 30px}
.ootd-root .lbl{font-size:11.5px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--goldd);margin-bottom:9px}
.ootd-root .sec.dark .lbl{color:var(--gold)}
.ootd-root .shead h2{font-size:clamp(1.65rem,3.3vw,2.3rem);margin-bottom:10px}
.ootd-root .shead p{color:var(--mid);font-size:15.5px}
.ootd-root .sec.dark .shead p{color:rgba(255,255,255,.78)}

.ootd-root .trap{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:900px;margin:0 auto}
.ootd-root .tbox{border-radius:18px;padding:24px}
.ootd-root .tbox.bad{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14)}
.ootd-root .tbox.good{background:linear-gradient(150deg,rgba(212,168,83,.2),rgba(212,168,83,.06));border:1px solid var(--gold)}
.ootd-root .tbox h3{font-size:19px;margin-bottom:12px}
.ootd-root .tbox ul{list-style:none}
.ootd-root .tbox li{display:flex;gap:9px;padding:6px 0;font-size:14.5px;color:rgba(255,255,255,.85)}
.ootd-root .tbox.bad li i{color:#E28C7E;font-style:normal;font-weight:800}
.ootd-root .tbox.good li i{color:var(--gold);font-style:normal;font-weight:800}

.ootd-root .incl{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:900px;margin:0 auto}
.ootd-root .incl div{background:#fff;border:1px solid var(--line);border-radius:99px;padding:10px 18px;font-size:13.5px;font-weight:600;color:var(--bg)}
.ootd-root .incl div i{color:var(--goldd);font-style:normal;font-weight:800;margin-right:6px}

.ootd-root .ootd-doc{position:relative;max-width:820px;margin:24px auto 0;display:grid;grid-template-columns:1.05fr 1fr;align-items:end;gap:16px;background:linear-gradient(180deg,#fff,var(--cream-card,#F7EFE6));border:1px solid var(--line);border-radius:22px;padding:18px 18px 0;box-shadow:0 14px 40px rgba(180,35,44,.08);overflow:hidden}
.ootd-root .ootd-doc-fig{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-height:340px;padding-top:14px}
.ootd-root .ootd-doc-halo{position:absolute;left:50%;top:8%;transform:translateX(-50%);width:290px;height:290px;border-radius:50%;background:radial-gradient(circle at 50% 40%,rgba(216,178,106,.42),rgba(216,178,106,.12) 58%,transparent 70%)}
.ootd-root .ootd-doc-rings{position:absolute;left:50%;top:10%;transform:translateX(-50%);width:250px;height:250px;border-radius:50%;border:1px solid rgba(122,29,44,.16);box-shadow:0 0 0 18px rgba(122,29,44,.05),0 0 0 36px rgba(216,178,106,.09)}
.ootd-root .ootd-doc-chip{position:absolute;z-index:2;display:flex;flex-direction:column;line-height:1.2;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);border:1px solid var(--line);border-radius:14px;padding:8px 12px;font-size:11.5px;font-weight:600;color:#6b5a53;box-shadow:0 10px 24px rgba(180,35,44,.12)}
.ootd-root .ootd-doc-chip b{font-family:var(--display,inherit);font-size:15px;color:var(--ink,#2A1216)}
.ootd-root .ootd-doc-chip-a{top:12%;left:-4px}
.ootd-root .ootd-doc-chip-b{top:40%;right:-6px}
.ootd-root .ootd-doc-chip-c{bottom:24%;left:-8px}
.ootd-root .ootd-doc-fig>img{position:relative;z-index:1;width:100%;max-width:330px;height:auto;display:block;filter:drop-shadow(0 14px 24px rgba(180,35,44,.18))}
.ootd-root .ootd-doc-cap{position:relative;z-index:2;text-align:center;margin-top:-6px;padding:10px 14px 16px}
.ootd-root .ootd-doc-cap strong{display:block;font-size:14px;color:var(--ink,#2A1216)}
.ootd-root .ootd-doc-cap em{display:block;font-style:normal;font-size:12px;color:#6b5a53;margin-top:2px}
.ootd-root .ootd-doc-pills{display:flex;flex-direction:column;gap:10px;padding-bottom:26px}
.ootd-root .ootd-doc-pills span{display:inline-flex;align-items:center;gap:9px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:10px 16px;font-weight:700;font-size:14px;color:var(--ink,#2A1216);box-shadow:0 6px 18px rgba(180,35,44,.08)}
.ootd-root .ootd-doc-pills span i{font-style:normal;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:var(--gold);font-size:13px}


.ootd-root .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.ootd-root .step{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 8px 26px rgba(180,35,44,.06)}
.ootd-root .step img{width:100%;height:168px;object-fit:cover;display:block}
.ootd-root .step .body{padding:18px}
.ootd-root .step .n{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:var(--gold);color:#2A1216;font-weight:800;font-size:14px;margin-bottom:10px}
.ootd-root .step h3{font-size:17.5px;margin-bottom:6px}
.ootd-root .step p{font-size:14px;color:var(--mid)}

.ootd-root .tests{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.ootd-root .tcard{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px;box-shadow:0 8px 26px rgba(180,35,44,.06)}
.ootd-root .tcard p{font-size:14.5px;color:var(--mid);margin:10px 0 16px}
.ootd-root .twho{display:flex;align-items:center;gap:11px}
.ootd-root .twho img{width:46px;height:46px;border-radius:50%;object-fit:cover}
.ootd-root .twho b{display:block;font-size:14px;color:var(--bg)}
.ootd-root .twho span{font-size:12px;color:var(--light)}

.ootd-root .badges{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:26px;margin-top:6px}
.ootd-root .badges img{height:58px;width:auto;display:block}

.ootd-root .faq{max-width:760px;margin:0 auto}
.ootd-root .faq details{background:#fff;border:1px solid var(--line);border-radius:14px;padding:15px 18px;margin-bottom:10px}
.ootd-root .faq summary{cursor:pointer;font-weight:700;color:var(--bg);font-size:15px;list-style:none}
.ootd-root .faq summary::-webkit-details-marker{display:none}
.ootd-root .faq p{margin-top:9px;font-size:14.5px;color:var(--mid)}

.ootd-root .final{background:linear-gradient(160deg,var(--bg),var(--bg2));color:#fff;text-align:center;padding:52px 18px}
.ootd-root .final h2{color:#fff;font-size:clamp(1.7rem,3.4vw,2.4rem);margin-bottom:12px}
.ootd-root .final p{color:rgba(255,255,255,.8);max-width:520px;margin:0 auto 22px}
.ootd-root .final .pr{display:flex;justify-content:center;gap:26px;margin-bottom:22px;flex-wrap:wrap}
.ootd-root .final .pr div{font-size:13px;color:rgba(255,255,255,.72)}
.ootd-root .final .pr b{display:block;font-family:var(--disp);font-size:30px;color:var(--gold);line-height:1.15}

.ootd-root .bar{position:fixed;left:0;right:0;bottom:0;z-index:60;background:rgba(58,20,27,.97);backdrop-filter:blur(10px);border-top:1px solid rgba(212,168,83,.45);padding:10px 14px}
.ootd-root .bar .in{max-width:1080px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px}
.ootd-root .bar .txt{color:#fff;font-size:12.5px;line-height:1.35}
.ootd-root .bar .txt b{display:block;color:var(--gold);font-size:14.5px;font-weight:800;letter-spacing:.04em}
.ootd-root .bar .btn{min-height:48px;padding:12px 22px;font-size:.95rem;white-space:nowrap}

.ootd-root .foot{background:#fff;text-align:center;padding:24px 18px 30px;font-size:12.5px;color:var(--light);border-top:1px solid var(--line)}
.ootd-root .foot a{color:var(--bg);font-weight:600}
.ootd-root .foot .dis{max-width:720px;margin:10px auto 0;font-size:11.5px;line-height:1.6}

.ootd-root .ootd-met-sec{background:#fff}
.ootd-root .ootd-met{display:grid;grid-template-columns:0.95fr 1.05fr;gap:34px;align-items:center}
.ootd-root .ootd-met-fig{position:relative;border-radius:22px;overflow:hidden;border:1px solid rgba(122,29,44,.16);box-shadow:0 18px 44px -22px rgba(58,20,27,.45)}
.ootd-root .ootd-met-fig img{display:block;width:100%;height:100%;object-fit:cover;aspect-ratio:1/1}
.ootd-root .ootd-met-copy h2{font-size:clamp(1.7rem,3.4vw,2.5rem);margin:8px 0 12px;line-height:1.14}
.ootd-root .ootd-met-copy h2 em{font-style:normal;color:var(--bg);background:linear-gradient(180deg,transparent 62%,rgba(212,168,83,.42) 62%)}
.ootd-root .ootd-met-copy p{color:var(--light);font-size:16.5px;line-height:1.65;margin-bottom:20px;max-width:520px}
.ootd-root .ootd-met-copy strong{color:var(--bg)}

.ootd-root .ootd-res-sec .shead h2 em{font-style:normal;color:var(--gold)}
.ootd-root .ootd-res{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.ootd-root .ootd-res-c{background:rgba(255,255,255,.07);border:1px solid rgba(212,168,83,.3);border-radius:18px;padding:22px 16px;text-align:center;backdrop-filter:blur(6px)}
.ootd-root .ootd-res-c b{display:block;font-family:var(--disp);font-size:clamp(1.9rem,4vw,2.7rem);color:var(--gold);line-height:1.1;margin-bottom:8px}
.ootd-root .ootd-res-c span{display:block;font-size:13.5px;color:rgba(255,255,255,.82);line-height:1.5}

@media(max-width:900px){
.ootd-root .hgrid{grid-template-columns:1fr;gap:22px}
.ootd-root .hphoto{order:-1;max-height:300px}
.ootd-root .steps,.ootd-root .tests,.ootd-root .trap{grid-template-columns:1fr}
.ootd-root .ootd-doc{grid-template-columns:1fr;padding:16px 14px 16px;gap:4px}
.ootd-root .ootd-doc-fig{min-height:0;padding-top:6px}
.ootd-root .ootd-doc-fig>img{margin:0 auto;max-width:210px}
.ootd-root .ootd-doc-halo{width:210px;height:210px;top:2%}
.ootd-root .ootd-doc-rings{width:180px;height:180px;top:4%;box-shadow:0 0 0 12px rgba(122,29,44,.05),0 0 0 24px rgba(216,178,106,.08)}
.ootd-root .ootd-doc-chip{font-size:10.5px;padding:6px 9px;border-radius:12px}
.ootd-root .ootd-doc-chip b{font-size:13px}
.ootd-root .ootd-doc-chip-a{top:4%;left:0}
.ootd-root .ootd-doc-chip-b{top:34%;right:0}
.ootd-root .ootd-doc-chip-c{bottom:26%;left:0}
.ootd-root .ootd-doc-cap{padding:8px 10px 12px}
.ootd-root .ootd-doc-pills{padding-bottom:0}
.ootd-root .ootd-doc-pills span{font-size:13.5px;padding:9px 13px}

.ootd-root .ootd-met{grid-template-columns:1fr;gap:18px}
.ootd-root .ootd-met-copy h2{font-size:1.75rem}
.ootd-root .ootd-res{grid-template-columns:1fr 1fr;gap:12px}
.ootd-root .ootd-res-c{padding:16px 12px}
.ootd-root .hero h1{font-size:1.95rem}
.ootd-root .promise-band{padding:12px 14px 2px}
.ootd-root .promise{padding:14px 14px}
.ootd-root .promise strong{font-size:20px}
.ootd-root .promise span{font-size:13.5px}
.ootd-root .sec{padding:40px 0}
.ootd-root .card .now{font-size:38px}
.ootd-root .cd .u{min-width:64px}
.ootd-root .bar .txt b{font-size:13px}
.ootd-root .bar .btn{padding:12px 16px;font-size:.9rem}
}
.ootd-root .sec,.ootd-root .steps,.ootd-root .tests,.ootd-root .ootd-met-sec{content-visibility:auto;contain-intrinsic-size:auto 700px}
.ootd-root img{max-width:100%;height:auto}
@media(max-width:900px){
.ootd-root .sec,.ootd-root .steps,.ootd-root .tests{contain-intrinsic-size:auto 900px}
.ootd-root *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
}
@media(prefers-reduced-motion:reduce){
.ootd-root *,.ootd-root *::before,.ootd-root *::after{animation:none!important;transition:none!important}
}
`;

const STEPS: [string, string, string, string][] = [
  [step1Img, "1", "Answer a few questions", "A 2-minute online health check. No insurance, no clinic visit, no waiting room."],
  [step2Img, "2", "A licensed provider reviews", "A clinician licensed in your state reviews your answers, usually within 1 day. Not everyone qualifies."],
  [step3Img, "3", "Delivered to your door", "Plain, discreet packaging with everything you need, shipped free with next day delivery."],
];

const TESTS: [string, string, string, string][] = [
  [
    t1Img,
    "I'd tried so many programs and felt stuck. LegacyRX was simple, the team was attentive, and my price never changed when my dose did.",
    "Jennifer Mitchell",
    "Verified patient · Ohio",
  ],
  [
    t2Img,
    "Honest pricing and quick shipping. I appreciated being able to do everything from home without feeling rushed.",
    "Michael Carter",
    "Verified patient · North Carolina",
  ],
  [
    t3Img,
    "The team made the process easy to understand. I felt supported every step and the results have been steady.",
    "Ashley Robinson",
    "Verified patient · Arizona",
  ],
];

const FAQ: [string, string][] = [
  ["Does my price go up when my dose goes up?", "No. Your monthly price is the same on every dose your provider prescribes. No dose upcharges, no membership fee."],
  ["Do I need insurance?", "No. LegacyRX is self-pay, so there are no claims, no prior authorizations and no surprise bills."],
  ["How fast does it ship?", "Approved orders ship free with next day delivery in temperature-controlled packaging, with all supplies included."],
  ["Am I locked into a contract?", "No. You can cancel at any time. Longer plans simply cost less per month."],
  ["Who qualifies?", "Adults 18+ in the states we serve, after a licensed provider reviews your health information. Not everyone qualifies."],
  ["What are the common side effects?", "Nausea, constipation and mild stomach upset are the most commonly reported and usually ease over time. Your provider will review your full history with you."],
];

function useEndOfDay() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  // Seconds remaining until midnight US Eastern (EST/EDT aware)
  const left = useMemo(() => {
    if (now === null) return null;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(new Date(now));
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
    const h = get("hour") % 24;
    const secsElapsed = h * 3600 + get("minute") * 60 + get("second");
    return Math.max(0, 86400 - secsElapsed);
  }, [now]);

  const pad = (n: number) => String(n).padStart(2, "0");
  return left === null
    ? { h: "--", m: "--", s: "--" }
    : { h: pad(Math.floor(left / 3600)), m: pad(Math.floor((left % 3600) / 60)), s: pad(left % 60) };
}

function DealOfTheDayPage() {
  const { sema, tirz } = useFromPrices();
  const semaSale = sema;
  const tirzSale = tirz;
  const clock = useEndOfDay();


  const click = (where: string) => trackGa4("offer_of_the_day_cta", { where });


  return (
    <div className="ootd-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="marq" aria-hidden="true">
        <span>
          {"TODAY'S EXCLUSIVE OFFER · ".repeat(12)}
          {"TODAY'S EXCLUSIVE OFFER · ".repeat(12)}
        </span>
      </div>
      <div className="topbar">
        Today only - GLP-1 from <b>${semaSale}/month</b>.
      </div>
      <nav className="nav">
        <Link to="/" className="logo" aria-label="LegacyRX home">
          Legacy<span className="rx">Rx</span>
        </Link>
      </nav>

      <div className="promise-band">
        <div className="promise">
          <strong>Flat monthly pricing. Every month.</strong>
          <span>No price hike after month 1. No subscription tricks. No membership fee.</span>
        </div>
      </div>


      <header className="hero">
        <div className="wrap hgrid">
          <div>
            <span className="pill">★ Today's exclusive offer · lowest price of the year</span>
            <h1>
              Take control of your weight at our <em>lowest price ever</em>
            </h1>
            <p className="sub">
              Doctor-prescribed compounded GLP-1, delivered to your door. No insurance, no clinic visits,
              cancel anytime.
            </p>



            <div className="cards">
              <Link to={CTA} search={CTA_SEARCH} className="card" onClick={() => click("hero_card_sema")}>
                <span className="tag">Most popular</span>
                <img className="vial" width={120} height={120} loading="lazy" decoding="async" src={semaVial.url} alt="Compounded Semaglutide vial" />
                <div className="nm">Semaglutide</div>
                <div className="dose">Doses included: 0.25mg - 2.5mg</div>
                <div>
                  <span className="now">${semaSale}</span>
                  <span className="per">/mo</span>
                </div>
                <span className="inc">All doses included</span>
              </Link>
              <Link to={CTA} search={CTA_SEARCH} className="card" onClick={() => click("hero_card_tirz")}>
                <span className="tag">Strongest option</span>
                <img className="vial" width={120} height={120} loading="lazy" decoding="async" src={tirzVial.url} alt="Compounded Tirzepatide vial" />
                <div className="nm">Tirzepatide</div>
                <div className="dose">Doses included: 2.5mg - 15mg</div>
                <div>
                  <span className="now">${tirzSale}</span>
                  <span className="per">/mo</span>
                </div>
                <span className="inc">All doses included</span>
              </Link>
            </div>

            <Link to={CTA} search={CTA_SEARCH} className="btn btn-gold wide" onClick={() => click("hero_primary")}>
              Check if I qualify <span aria-hidden="true">→</span>
            </Link>
            <p className="assure">
              <span className="stars">★★★★★</span> Free to check · you only pay if a provider approves you.
            </p>
          </div>

          <div className="hphoto">
            <img
              fetchPriority="high"
              decoding="async"
              width={900}
              height={1125}
              src={heroImgSm}
              srcSet={`${heroImgSm} 480w, ${heroImg} 900w`}
              sizes="(max-width: 900px) 92vw, 460px"
              alt="LegacyRX patient at home"
            />
            <div className="tagf">"My price never changed when my dose did."</div>
          </div>
        </div>
      </header>

      <div className="ratebar">
        <div className="it">
          <b>4.8</b>
          <span className="stars">★★★★★</span> average rating
        </div>
        <div className="it">
          <b>147,800+</b>patients treated
        </div>
        <div className="it">
          <b>100%</b>online visit, US-licensed providers
        </div>
        <div className="it">
          <b>$0</b>shipping, always
        </div>
      </div>

      <div className="cd">
        <div className="lb">Today's exclusive pricing ends in</div>
        <div className="clock">
          <div className="u">
            <b>{clock.h}</b>
            <span>Hours</span>
          </div>
          <div className="u">
            <b>{clock.m}</b>
            <span>Mins</span>
          </div>
          <div className="u">
            <b>{clock.s}</b>
            <span>Secs</span>
          </div>
        </div>
      </div>

      <section className="sec dark">
        <div className="wrap">
          <div className="shead">
            <div className="lbl">The thing nobody tells you</div>
            <h2>Most GLP-1 programs start you low, then raise the bill</h2>
            <p>
              They quote an intro price. Then your provider increases your dose, and the price increases with it.
              Suddenly you're paying $300+ a month, and stopping feels harder than paying.
            </p>
          </div>
          <div className="trap">
            <div className="tbox bad">
              <h3>Typical GLP-1 programs</h3>
              <ul>
                <li><i>✕</i> Price climbs with every dose increase</li>
                <li><i>✕</i> Monthly membership on top of medication</li>
                <li><i>✕</i> Shipping and supplies billed separately</li>
                <li><i>✕</i> Long lock-in, awkward cancellation</li>
              </ul>
            </div>
            <div className="tbox good">
              <h3>LegacyRX keeps pricing simple</h3>
              <ul>
                <li><i>✓</i> Flat monthly pricing, always</li>
                <li><i>✓</i> No memberships, no hidden fees</li>
                <li><i>✓</i> Free shipping, needles and supplies included</li>
                <li><i>✓</i> Cancel anytime, no fine print</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="sec ootd-met-sec">
        <div className="wrap">
          <div className="ootd-met">
            <div className="ootd-met-fig">
              <img src={metabolismImg} alt="Man showing a slimmer waistline after weight loss" loading="lazy" decoding="async" width={760} height={760} />
            </div>
            <div className="ootd-met-copy">
              <div className="lbl">Why willpower was never the problem</div>
              <h2>Your appetite is <em>biology, not weakness.</em></h2>
              <p>
                Hunger signals, cravings and how quickly your body stores fat are driven by hormones.
                That is why cutting calories alone rarely lasts. GLP-1 treatment from LegacyRX helps
                turn down those signals so eating less feels normal, and your clinician adjusts the
                plan as your body changes - all included in your monthly plan.
              </p>
              <Link to={CTA} search={CTA_SEARCH} className="btn btn-gold" onClick={() => click("metabolism")}>
                Get started <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="sec dark ootd-res-sec">
        <div className="wrap">
          <div className="shead">
            <div className="lbl">Why patients stay with us</div>
            <h2>Treatment that is simple to start, <em>and easy to stay on.</em></h2>
            <p>Flat pricing, licensed US clinicians and refills that arrive before you run out.</p>
          </div>
          <div className="ootd-res">
            <div className="ootd-res-c"><b>147,800+</b><span>Patients treated through our partner pharmacy network</span></div>
            <div className="ootd-res-c"><b>4.8★</b><span>Average patient rating</span></div>
            <div className="ootd-res-c"><b>$0</b><span>Membership or hidden fees, ever</span></div>
            <div className="ootd-res-c"><b>Next day</b><span>Discreet delivery once approved</span></div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link to={CTA} search={CTA_SEARCH} className="btn btn-gold" onClick={() => click("results")}>
              See if I qualify <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>



      <section className="sec cream">
        <div className="wrap">
          <div className="shead">
            <div className="lbl">What's included</div>
            <h2>Everything in one flat monthly price</h2>
          </div>
          <div className="incl">
            <div><i>✓</i> All doses included</div>
            <div><i>✓</i> Transparent refill pricing</div>
            <div><i>✓</i> Made in US pharmacies</div>
            <div><i>✓</i> Provider messaging included</div>
            <div><i>✓</i> Cancel anytime</div>
            <div><i>✓</i> Next day delivery</div>
          </div>
          <div style={{ textAlign: "center", marginTop: 26 }}>
            <Link to={CTA} search={CTA_SEARCH} className="btn btn-gold" onClick={() => click("included")}>
              Start my 2-minute visit <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="sec ootd-doc-sec">
        <div className="wrap">
          <div className="shead">
            <div className="lbl">Physician-led care</div>
            <h2>A US-licensed doctor reviews every order</h2>
            <p>5-minute online visit. No insurance required.</p>
          </div>
          <div className="ootd-doc">
            <div className="ootd-doc-fig">
              <span className="ootd-doc-halo" aria-hidden="true" />
              <span className="ootd-doc-rings" aria-hidden="true" />
              <span className="ootd-doc-chip ootd-doc-chip-a" aria-hidden="true">
                <b>4.8★</b>
                patient rating
              </span>
              <span className="ootd-doc-chip ootd-doc-chip-b" aria-hidden="true">
                <b>147,800+</b>
                patients treated
              </span>
              <span className="ootd-doc-chip ootd-doc-chip-c" aria-hidden="true">
                <b>~1 day</b>
                script review
              </span>
              <img
                loading="lazy"
                decoding="async"
                width={900}
                height={900}
                src={doctorImg}
                alt="US-licensed LegacyRX physician in a white coat"
              />
              <div className="ootd-doc-cap">
                <strong>Licensed in all 50 states</strong>
                <em>Board-certified providers, HIPAA-compliant visits</em>
              </div>
            </div>
            <div className="ootd-doc-pills">
              <span><i>🩺</i> US Licensed Doctors</span>
              <span><i>💲</i> Price Never Increases</span>
              <span><i>🚚</i> Free Shipping</span>
              <span><i>✕</i> Cancel Anytime</span>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 26 }}>
            <Link to={CTA} search={CTA_SEARCH} className="btn btn-gold" onClick={() => click("doctor")}>
              Check if I qualify <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="shead">
            <div className="lbl">How it works</div>
            <h2>Three simple steps, all from home</h2>
            <p>No clinic, no waiting room, no insurance paperwork.</p>
          </div>
          <div className="steps">
            {STEPS.map(([img, n, title, copy]) => (
              <div key={n} className="step">
                <img loading="lazy" decoding="async" width={640} height={480} src={img} alt={title} />
                <div className="body">
                  <span className="n">{n}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec cream">
        <div className="wrap">
          <div className="shead">
            <div className="lbl">Real patients</div>
            <h2>People who stopped overpaying</h2>
          </div>
          <div className="tests">
            {TESTS.map(([img, quote, name, meta]) => (
              <div key={name} className="tcard">
                <div className="stars">★★★★★</div>
                <p>"{quote}"</p>
                <div className="twho">
                  <img loading="lazy" decoding="async" width={96} height={96} src={img} alt={name} />
                  <div>
                    <b>{name}</b>
                    <span>{meta}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="shead">
            <div className="lbl">Certified &amp; accredited</div>
            <h2>Care you can verify</h2>
            <p>HIPAA-secure platform, LegitScript certified, US-licensed providers and registered pharmacies.</p>
          </div>
          <div className="badges">
            <img loading="lazy" decoding="async" src={hipaaLogo.url} alt="HIPAA Compliant" />
            <a
              href="https://www.legitscript.com/websites/?checker_keywords=legacyrx.net"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LegitScript Certified - verify"
            >
              <img loading="lazy" decoding="async" src={legitScriptLogo.url} alt="LegitScript Certified" />
            </a>
          </div>
        </div>
      </section>

      <section className="sec cream">
        <div className="wrap">
          <div className="shead">
            <div className="lbl">Questions</div>
            <h2>Before you start</h2>
          </div>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final">
        <h2>Your exclusive price is waiting</h2>
        <div className="pr">
          <div>
            <b>${semaSale}/mo</b>Semaglutide
          </div>
          <div>
            <b>${tirzSale}/mo</b>Tirzepatide
          </div>
          <div>
            <b>
              {clock.h}:{clock.m}:{clock.s}
            </b>
            Offer ends in
          </div>
        </div>
        <p>Takes about 2 minutes. Free to check, and you only pay if a licensed provider approves you.</p>
        <Link to={CTA} search={CTA_SEARCH} className="btn btn-gold wide" onClick={() => click("final")}>
          Check if I qualify <span aria-hidden="true">→</span>
        </Link>
      </section>

      <div className="bar">
        <div className="in">
          <p className="txt">
            <b>TODAY'S OFFER</b>
            Semaglutide ${semaSale}/mo · Tirzepatide ${tirzSale}/mo · all doses included
          </p>
          <Link to={CTA} search={CTA_SEARCH} className="btn btn-gold" onClick={() => click("sticky_bar")}>
            Check if I qualify <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <footer className="foot">
        © 2026 LegacyRX LLC. All rights reserved.
        <div style={{ marginTop: 6 }}>
          <Link to="/privacy-policy">Privacy Policy</Link> · <Link to="/hipaa-notice">HIPAA</Link> ·{" "}
          <Link to="/returns-refund-policy">Returns &amp; Refunds</Link> ·{" "}
          <Link to="/important-safety-information">Safety Info</Link>
        </div>
        <p className="dis">
          Compounded medications are not FDA-approved. Prescriptions are issued only when clinically appropriate
          by a licensed provider. Individual results vary. Not everyone qualifies.
        </p>
      </footer>
    </div>
  );
}
