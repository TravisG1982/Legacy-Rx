import { createFileRoute, Link } from "@tanstack/react-router";
import { BLOG_POSTS } from "../lib/blog-data";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Health & Wellness Blog | LegacyRX" },
      { name: "description", content: "Clear, clinician-informed articles about weight management, hormone health, healthy aging, and telehealth care from LegacyRX." },
      { property: "og:title", content: "Health & Wellness Blog | LegacyRX" },
      { property: "og:description", content: "Clear, clinician-informed articles about weight management, hormone health, healthy aging, and telehealth care." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://legacyrx.net/blog" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://legacyrx.net/blog" }],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <div className="blog-page">
      <header className="blog-index-header">
        <div className="container-lx">
          <p className="eyebrow">LegacyRX Journal</p>
          <h1>Practical guidance for your health journey</h1>
          <p className="lead">Clinician-informed education to help you understand your options and have better conversations about your care.</p>
        </div>
      </header>

      <section className="blog-index-section" aria-label="Latest articles">
        <div className="container-lx blog-grid">
          {BLOG_POSTS.map((post) => (
            <article className="blog-card" key={post.slug}>
              <Link to="/blog/$slug" params={{ slug: post.slug }} className="blog-card-image-link" aria-label={`Read ${post.title}`}>
                <img src={post.image} alt={post.imageAlt} className="blog-card-image" loading="lazy" decoding="async" />
              </Link>
              <div className="blog-card-body">
                <div className="blog-card-meta">
                  <span>{post.category}</span>
                  <time dateTime={post.date}>{post.dateLabel}</time>
                </div>
                <h2><Link to="/blog/$slug" params={{ slug: post.slug }}>{post.title}</Link></h2>
                <p>{post.excerpt}</p>
                <Link to="/blog/$slug" params={{ slug: post.slug }} className="blog-read-more">
                  Read More <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}