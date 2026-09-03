import Image from "next/image";
import logo from "@/public/skill-logo.png";

// The SKILL wordmark. Pass a Tailwind height class (e.g. "h-6"); width
// scales automatically to the logo's aspect ratio.
export default function Wordmark({ className = "h-6", priority = false }) {
  return (
    <Image
      src={logo}
      alt="SKILL"
      priority={priority}
      sizes="240px"
      className={`w-auto ${className}`}
    />
  );
}
