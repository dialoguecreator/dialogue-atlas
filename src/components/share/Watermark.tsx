interface WatermarkProps {
  email: string;
}

export function Watermark({ email }: WatermarkProps) {
  const text = `${email}  ·  ${new Date().toLocaleString()}  ·  Dialogue Atlas`;
  // Repeat to cover the screen
  const repeated = Array.from({ length: 60 }).map(() => text).join("    ");
  return <div className="watermark-overlay" data-watermark={repeated} />;
}
