'use client';

import { useState } from 'react';
import { Box } from '@mui/material';

interface ProductImageProps {
  src?: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  priority?: boolean;
}

// Simple SVG placeholder component
const PlaceholderImage = ({ width, height }: { width: number; height: number }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" fill="#f3f4f6" />
    <path
      d="M30 40h40v20H30z"
      fill="#d1d5db"
      stroke="#9ca3af"
      strokeWidth="2"
    />
    <circle cx="40" cy="50" r="3" fill="#6b7280" />
    <path
      d="M50 50h15M45 55h10"
      stroke="#6b7280"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export function ProductImage({
  src,
  alt,
  width = 300,
  height = 300,
  style,
  className,
  priority = false
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Convert string to number if needed
  const imgWidth = typeof width === 'string' ? parseInt(width) || 300 : width;
  const imgHeight = typeof height === 'string' ? parseInt(height) || 300 : height;

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // If error or no src, show placeholder
  if (hasError || !src) {
    return (
      <Box
        className={className}
        sx={{
          position: 'relative',
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
          border: '1px solid #e5e7eb',
          borderRadius: 1,
          ...style
        }}
      >
        <PlaceholderImage width={imgWidth} height={imgHeight} />
      </Box>
    );
  }

  // Use standard img tag instead of Next.js Image
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onError={handleError}
      onLoad={handleLoad}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: isLoading ? 0.7 : 1,
        transition: 'opacity 0.3s ease',
        ...style
      }}
    />
  );
}
