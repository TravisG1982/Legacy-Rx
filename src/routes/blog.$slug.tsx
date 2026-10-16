import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getBlogPost } from "../lib/blog-data";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getBlogPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ params, loaderData }) => {
    const post = loaderData?.post;
    const url = `https://legacyrx.net/blog/${params.slug}`;
    if (!post) {
      return { meta: [{ title: "Article not found | LegacyRX" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${post.metaTitle ?? post.title} | LegacyRX` },
        { name: "description", content: post.description },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "article:published_time", content: post.date },
        { property: "article:author", content: post.author },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: { "@type": "Organization", name: post.author },
          publisher: { "@type": "Organization", name: "LegacyRX", url: "https://legacyrx.net" },
          mainEntityOfPage: url,
        }),
      }],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  return (
    <article className="blog-article">
      <header className="blog-article-header">
        <div className="blog-article-shell">
          <Link to="/blog" className="blog-back-link">← All articles</Link>
          <p className="eyebrow">{post.category}</p>
          <h1>{post.title}</h1>
          <div className="blog-byline">
            <span>By {post.author}</span>
            <span aria-hidden="true">•</span>
            <time dateTime={post.date}>{post.dateLabel}</time>
          </div>
        </div>
      </header>

      <div className="blog-article-shell">
        <img src={post.image} alt={post.imageAlt} className="blog-article-image" decoding="async" />
        <div className="blog-article-content">
          {post.intro.map((paragraph) => <p className="blog-intro" key={paragraph}>{paragraph}</p>)}
          {post.sections.map((section) => {
            const Heading = section.level === 3 ? "h3" : "h2";
            return (
              <section key={section.heading}>
                <Heading>{section.heading}</Heading>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && (
                  <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
                )}
              </section>
            );
          })}
          <aside className="blog-medical-note">
            <strong>Medical note</strong>
            <p>This article is for general education and does not replace medical advice, diagnosis, or treatment from a licensed clinician.</p>
          </aside>
        </div>

        <div className="blog-article-cta">
          <p className="eyebrow">Your next step</p>
          <h2>See whether LegacyRX is right for you</h2>
          <p>Complete a private health assessment for review by a licensed clinician. Not everyone qualifies for treatment.</p>
          <Link to="/qualify" className="btn btn-cream btn-lg">Start my assessment →</Link>
        </div>
      </div>
    </article>
  );
}