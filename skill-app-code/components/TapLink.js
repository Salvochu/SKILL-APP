"use client";

import { useRef, useState } from "react";
import Link from "next/link";

// A Link that stays visibly "pressed" (orange tint) from the moment it is
// tapped until the component unmounts on navigation, so a slow route
// change never feels like a dead tap. If nothing navigates (e.g. tapping
// the page you're already on), the tint clears itself shortly after.
export default function TapLink({ href, className = "", children, onClick, ...rest }) {
  const [pressed, setPressed] = useState(false);
  const timer = useRef(null);

  function press() {
    if (timer.current) clearTimeout(timer.current);
    setPressed(true);
  }
  function release() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPressed(false), 500);
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      className={`${className} ${pressed ? "bg-accent-soft" : ""}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
