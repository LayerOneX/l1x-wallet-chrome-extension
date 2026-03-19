import { useState } from "react";
import tokenFallback from "@assets/images/token-fallback.svg";

interface TokenImageProps {
  src?: string;
  alt?: string;
  className?: string;
  size?: number;
}

/**
 * Renders a token/network icon with automatic fallback to token-fallback.svg
 * when the image fails to load (broken URL, 404, CORS, etc.)
 */
const TokenImage = ({ src, alt = "", className = "w-full h-full object-cover", size }: TokenImageProps) => {
  const [failed, setFailed] = useState(false);

  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src={!src || failed ? tokenFallback : src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
};

export default TokenImage;
