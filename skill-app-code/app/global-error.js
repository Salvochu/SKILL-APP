"use client";

// Last-resort screen for when the root layout itself fails, so it can't
// rely on the app's CSS or fonts: everything here is inline.
export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 360, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/skill-logo.png" alt="SKILL" width={156} height={60} />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, textTransform: "uppercase" }}>Something went wrong</h1>
          <p style={{ margin: 0, color: "#a49d95", fontSize: 14, lineHeight: 1.5 }}>
            Nothing you logged has been lost. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ background: "#fc7605", color: "#000", border: 0, borderRadius: 8, padding: "12px 20px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
