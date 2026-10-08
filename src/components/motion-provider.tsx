"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  ArrowDown01Icon,
  PauseIcon,
  PlayIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { IconProvider, type IconComponentProps } from "@/lib/icon-context";
import { ShapeProvider } from "@/lib/shape-context";

function ChevronRight(props: IconComponentProps) {
  return <HugeiconsIcon icon={ArrowRight01Icon} {...props} aria-hidden="true" />;
}

function ChevronDown(props: IconComponentProps) {
  return <HugeiconsIcon icon={ArrowDown01Icon} {...props} aria-hidden="true" />;
}

function Pause(props: IconComponentProps) {
  return <HugeiconsIcon icon={PauseIcon} {...props} aria-hidden="true" />;
}

function Play(props: IconComponentProps) {
  return <HugeiconsIcon icon={PlayIcon} {...props} aria-hidden="true" />;
}

function Search(props: IconComponentProps) {
  return <HugeiconsIcon icon={Search01Icon} {...props} aria-hidden="true" />;
}

const icons = {
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  pause: Pause,
  play: Play,
  search: Search,
};

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ShapeProvider defaultShape="pill">
        <IconProvider icons={icons}>{children}</IconProvider>
      </ShapeProvider>
    </MotionConfig>
  );
}
