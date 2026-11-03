"use client";

import { useRef, useState } from "react";
import Link from "next/link";

// A Link that stays visibly "pressed" (orange tint) from the moment it is
// tapped until the component unmounts on navigation, so a slow route
// change never feels like a dead tap. If nothing navigates (e.g. tapping
// the page you're already on), the tint clears itself shortly after.
//
// It loads the whole page, data included, in the background as soon as
// it's on screen, so the tap opens it straight away. Long lists (workout
// history) pass prefetch={null} to get Next's lighter default instead.
export default function TapLink({ href, className = "", children, onClick, prefetch = true, ...rest }) {
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
      prefetch={prefetch}
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
