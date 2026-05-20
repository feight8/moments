import Image from "next/image";

interface CircaLogoProps {
  className?: string;
}

export default function CircaLogo({ className = "" }: CircaLogoProps) {
  return (
    <Image
      src="/circalogo_transparent.png"
      alt="Circa"
      width={320}
      height={320}
      className={`${className} circa-logo`}
      priority
    />
  );
}
