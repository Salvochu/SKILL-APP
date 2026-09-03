// The SKILL wordmark. `height` is a CSS length (default "1.5rem"); width
// scales to the logo's aspect ratio. Plain <img> on purpose: a tiny static
// asset that needs no optimization pipeline. The width/height attributes
// give the browser the intrinsic ratio so `width:auto` sizes correctly.
const RATIO = 266 / 108;

export default function Wordmark({ height = "1.5rem", className = "" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/skill-logo.png"
      alt="SKILL"
      width={266}
      height={108}
      className={className}
      style={{ height, width: `calc(${height} * ${RATIO})`, maxWidth: "none" }}
    />
  );
}
