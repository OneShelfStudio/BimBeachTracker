import { InshoreChopLevel } from "./scoring";

export interface WatermarkTelemetryInput {
  beachName: string;
  beachSlug: string;
  sargassumLevel: "None (0%)" | "Light Trace" | "Moderate Wrack" | "Heavy Blanket";
  waterChop: InshoreChopLevel;
  lat: number;
  lon: number;
  gpsVerified: boolean;
  reporterHandle?: string;
}

export interface WatermarkedPhotoResult {
  dataUrl: string;
  blob: Blob;
  sha256Digest: string;
  astTimestampLabel: string;
  width: number;
  height: number;
}

/**
 * Formats a Date into Atlantic Standard Time (AST / America/Barbados, UTC-4, no DST).
 */
export function formatBarbadosAstTimestamp(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-BB", {
    timeZone: "America/Barbados",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${formatter.format(date)} AST (UTC-4)`;
}

/**
 * Computes a hexadecimal SHA-256 digest in the browser using Web Crypto API.
 */
export async function computeBrowserSha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * Client-side HTML5 Canvas pipeline that burns a tamper-evident
 * "BIMBEACH VERIFIED" telemetry HUD bar onto the bottom of a shoreline photo.
 */
export async function burnTelemetryWatermark(
  sourceFileOrDataUrl: File | string,
  telemetry: WatermarkTelemetryInput
): Promise<WatermarkedPhotoResult> {
  const img = await loadImageElement(sourceFileOrDataUrl);

  const targetWidth = 1280;
  const scale = targetWidth / img.width;
  const targetHeight = Math.max(720, Math.round(img.height * scale));
  const barHeight = 128;

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("HTML5 2D Canvas context unavailable.");
  }

  // 1. Draw the captured shoreline frame
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 2. Compute AST Timestamp & cryptographic verification digest
  const now = new Date();
  const astTimestampLabel = formatBarbadosAstTimestamp(now);
  const digestSeed = `${telemetry.beachSlug}|${astTimestampLabel}|${telemetry.lat.toFixed(
    5
  )},${telemetry.lon.toFixed(5)}|${telemetry.sargassumLevel}|${telemetry.waterChop}|${img.width}x${img.height}`;
  const sha256Digest = await computeBrowserSha256(digestSeed);

  // 3. Draw top-right live telemetry corner reticle badge
  ctx.save();
  ctx.fillStyle = "rgba(6, 13, 24, 0.82)";
  ctx.strokeStyle = "rgba(0, 240, 255, 0.65)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, targetWidth - 310, 22, 286, 42, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#00f0ff";
  ctx.beginPath();
  ctx.arc(targetWidth - 290, 43, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "700 13px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "#e2f1ff";
  ctx.fillText("BIMBEACH.ORG // GROUND TRUTH", targetWidth - 275, 48);
  ctx.restore();

  // 4. Burn bottom tamper-evident "BIMBEACH VERIFIED" telemetry bar
  const barY = targetHeight - barHeight;
  const grad = ctx.createLinearGradient(0, barY - 24, 0, targetHeight);
  grad.addColorStop(0, "rgba(6, 13, 24, 0.0)");
  grad.addColorStop(0.18, "rgba(6, 13, 24, 0.92)");
  grad.addColorStop(1, "rgba(4, 9, 18, 0.98)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, barY - 24, targetWidth, barHeight + 24);

  // Bioluminescent cyan top border line
  ctx.strokeStyle = "#00f0ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, barY);
  ctx.lineTo(targetWidth, barY);
  ctx.stroke();

  // Left Verification Shield Pill
  ctx.fillStyle = "rgba(0, 240, 255, 0.14)";
  ctx.strokeStyle = "#00f0ff";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 24, barY + 16, 235, 32, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = "800 14px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "#00f0ff";
  ctx.fillText(
    telemetry.gpsVerified ? "✓ BIMBEACH GPS VERIFIED" : "◉ BIMBEACH FIELD REPORT",
    36,
    barY + 37
  );

  // Beach Name & AST Timestamp
  ctx.font = "800 26px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(telemetry.beachName.toUpperCase(), 276, barY + 40);

  ctx.font = "600 15px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(
    `${astTimestampLabel}  •  GPS: ${telemetry.lat.toFixed(4)}°N, ${Math.abs(
      telemetry.lon
    ).toFixed(4)}°W`,
    24,
    barY + 76
  );

  // Right Telemetry Metrics (Sargassum Level & Inshore Chop)
  const sargColor =
    telemetry.sargassumLevel === "None (0%)"
      ? "#00d4aa"
      : telemetry.sargassumLevel === "Light Trace"
      ? "#38bdf8"
      : telemetry.sargassumLevel === "Moderate Wrack"
      ? "#ffb020"
      : "#ff4757";

  ctx.font = "700 16px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = sargColor;
  ctx.textAlign = "right";
  ctx.fillText(`SARGASSUM: ${telemetry.sargassumLevel.toUpperCase()}`, targetWidth - 24, barY + 40);

  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(`INSHORE CHOP: ${telemetry.waterChop.toUpperCase()}`, targetWidth - 24, barY + 72);

  // Bottom tamper-evident SHA-256 verification row
  ctx.font = "500 12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(0, 240, 255, 0.72)";
  ctx.textAlign = "left";
  ctx.fillText(
    `SHA-256 TELEMETRY SEAL: ${sha256Digest}  //  REPORTER: ${
      telemetry.reporterHandle || "@island_scout"
    }`,
    24,
    barY + 106
  );

  const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      0.88
    );
  });

  return {
    dataUrl,
    blob,
    sha256Digest,
    astTimestampLabel,
    width: targetWidth,
    height: targetHeight,
  };
}

function loadImageElement(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    if (typeof source === "string") {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
