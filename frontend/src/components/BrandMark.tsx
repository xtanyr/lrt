interface BrandMarkProps { size?: number; }

export default function BrandMark({ size = 20 }: BrandMarkProps) {
  return <img aria-hidden="true" src="/flower-favicon.svg?v=20260918" width={size} height={size} alt="" />;
}
