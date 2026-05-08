"use client";

import type { IconProps as PhosphorIconProps } from "@phosphor-icons/react";
import {
  Bell,
  CalendarBlank,
  ClipboardText,
  Code,
  DeviceMobile,
  Flask,
  Heart,
  Leaf,
  Lightning,
  ListBullets,
  Moon,
  PaintBrush,
  RocketLaunch,
  ShieldCheck,
  SidebarSimple,
  Sparkle,
  Star,
  Sun,
  Tray,
  UsersThree,
  X,
} from "@phosphor-icons/react";

const MAP = {
  RocketLaunch,
  CalendarBlank,
  Tray,
  ClipboardText,
  ListBullets,
  ShieldCheck,
  Sparkle,
  Lightning,
  Leaf,
  Flask,
  UsersThree,
  Bell,
  SidebarSimple,
  Moon,
  Sun,
  X,
  Heart,
  Star,
  Code,
  DeviceMobile,
  PaintBrush,
} as const;

export type IconName = keyof typeof MAP;

export type IconProps = {
  name: IconName;
  className?: string;
  weight?: PhosphorIconProps["weight"];
  "aria-hidden"?: boolean;
};

export function Icon({
  name,
  className,
  weight = "regular",
  ...rest
}: IconProps) {
  const Cmp = MAP[name];
  return <Cmp className={className} weight={weight} {...rest} />;
}
