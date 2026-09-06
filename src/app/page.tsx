import { MapUpload } from "@/components/map-upload";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Evony Scout</p>
        <h1>Find Your Map</h1>
        <p className="lede">
          Turn map captures into searchable monster intelligence for your alliance.
        </p>
        <MapUpload />
      </section>
      <section className="status-grid" aria-label="MVP pipeline">
        <article><strong>1</strong><span>Capture</span></article>
        <article><strong>2</strong><span>Recognize</span></article>
        <article><strong>3</strong><span>Rank</span></article>
        <article><strong>4</strong><span>Share</span></article>
      </section>
    </main>
  );
}
