import { iconPaths, type IconName } from "./iconPaths";
import type { PlaceType } from "./placeMeta";

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: iconPaths[name] }}
    />
  );
}

export function TypeIcon({ type, size }: { type: PlaceType; size?: number }) {
  return <Icon name={type} size={size} />;
}
