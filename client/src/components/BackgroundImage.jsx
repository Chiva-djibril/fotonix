import React from "react";

export default function BackgroundImage({ image, className = "", radial = false }) {
  return (
    <div
      className={`absolute inset-0 -z-10 bg-image ${className}`}
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* main overlay to ensure readable text */}
      <div className="absolute inset-0 bg-image-overlay" />

      {/* subtle warm radial highlight when desired */}
      {radial && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 900px 500px at 82% 28%, rgba(232,125,40,0.06), transparent 45%), radial-gradient(ellipse 600px 400px at 90% 50%, rgba(232,125,40,0.04), transparent 35%)",
          }}
        />
      )}
    </div>
  );
}
