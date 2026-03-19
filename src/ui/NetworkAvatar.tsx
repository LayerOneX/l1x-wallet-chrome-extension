import { useState } from "react";

const DEFILLAMA_CDN = "https://icons.llamao.fi/icons/chains/rsz_";

function getDefiLlamaUrl(name: string): string {
  // Normalize: lowercase, remove spaces and special chars
  const normalized = name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  return `${DEFILLAMA_CDN}${normalized}?w=40&h=40`;
}

interface NetworkAvatarProps {
  name: string;
  icon?: string;       // bundled SVG/PNG (built-in networks) or empty string (custom)
  size?: number;       // px, default 36
  className?: string;
}

const NetworkAvatar = ({ name, icon, size = 36, className = "" }: NetworkAvatarProps) => {
  const [imgSrc, setImgSrc] = useState<string>(icon || getDefiLlamaUrl(name));
  const [failed, setFailed] = useState(false);

  const sizeStyle = { width: size, height: size, minWidth: size };
  const letter = name?.charAt(0)?.toUpperCase() || "?";

  // If bundled icon provided, use it directly (no fallback chain needed)
  if (icon) {
    return (
      <span
        style={sizeStyle}
        className={`overflow-hidden rounded-full bg-dark-surface flex items-center justify-center shrink-0 ${className}`}
      >
        <img src={icon} className="w-full h-full object-cover" alt={name} />
      </span>
    );
  }

  // Custom network: try DefiLlama → letter avatar
  return (
    <span
      style={sizeStyle}
      className={`overflow-hidden rounded-full bg-dark-surface flex items-center justify-center shrink-0 ${className}`}
    >
      {!failed ? (
        <img
          src={imgSrc}
          className="w-full h-full object-cover"
          alt={name}
          onError={() => {
            if (imgSrc !== "") {
              setImgSrc("");
              setFailed(true);
            }
          }}
        />
      ) : (
        <span className="text-white text-sm font-bold select-none">{letter}</span>
      )}
    </span>
  );
};

export default NetworkAvatar;
