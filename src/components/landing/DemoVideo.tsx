// The 35-second product film, served from /public. No autoplay: it has sound,
// and preload="none" keeps its 7 MB off the first page load.
export function DemoVideo() {
  return (
    <section id="demo" aria-labelledby="demo-title" className="max-w-5xl mx-auto px-5 sm:px-8 py-12 md:py-16">
      <h2 id="demo-title" className="font-headline text-3xl sm:text-4xl text-on-surface mb-3">
        See it answer in 35 seconds
      </h2>
      <p className="text-on-surface-variant mb-8 max-w-2xl">
        Connect a database, ask in plain English, read the SQL Kakaw writes, then get the answer as a table and a
        chart.
      </p>
      <video
        className="w-full h-auto rounded-xl border border-border bg-surface-container"
        controls
        playsInline
        preload="none"
        poster="/video/kakaw-demo-poster.jpg"
        width={1920}
        height={1080}
      >
        <source src="/video/kakaw-demo.mp4" type="video/mp4" />
      </video>
    </section>
  );
}
