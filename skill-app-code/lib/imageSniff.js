// What kind of image an upload really is, read from its first bytes
// rather than the file name or type the browser sent (both are easy to
// fake, and the avatars bucket is public: a "photo" that is really a web
// page or a script would be served from it). Null when it is not one of
// the image formats we accept. Server-side only.
export async function sniffImage(file) {
  if (!file || typeof file.slice !== "function") return null;
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = (from, to) => String.fromCharCode(...head.slice(from, to));

  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return { type: "image/jpeg", ext: "jpg" };
  if (head[0] === 0x89 && ascii(1, 4) === "PNG") return { type: "image/png", ext: "png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { type: "image/webp", ext: "webp" };
  // iPhone photos (HEIC / HEIF), if the browser sends them as they are.
  if (ascii(4, 8) === "ftyp" && /^(heic|heix|hevc|heim|heis|mif1|msf1|heif)$/.test(ascii(8, 12))) {
    return { type: "image/heic", ext: "heic" };
  }
  return null;
}
