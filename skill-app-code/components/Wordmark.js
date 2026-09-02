// The SKILL wordmark. One orange dot, no coloured letters.
export default function Wordmark({ className = "" }) {
  return (
    <span
      className={`font-display font-extrabold tracking-tight text-fg ${className}`}
    >
      SKILL<span className="text-accent">.</span>
    </span>
  );
}
