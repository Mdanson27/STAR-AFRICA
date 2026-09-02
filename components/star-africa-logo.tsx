import Link from 'next/link';
import Image from 'next/image';

type StarAfricaLogoProps = {
  size?: 'small' | 'medium' | 'large';
  linked?: boolean;
  className?: string;
};

export function StarAfricaLogo({ size = 'medium', linked = false, className = '' }: StarAfricaLogoProps) {
  const image = (
    <span className={`star-africa-logo-frame star-africa-logo-${size} ${className}`.trim()}>
      <Image
        className="star-africa-logo"
        src="/branding/star-africa-logo-compact.png"
        alt="Star Africa Logistics"
        width={1649}
        height={820}
        priority={size === 'large'}
      />
    </span>
  );

  return linked ? <Link className="star-africa-logo-link" href="/" aria-label="Star Africa OS home">{image}</Link> : image;
}
