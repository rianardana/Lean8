import { Milestone } from "@/lib/milestones";

const APPLAUSE = ["/applause1.webp", "/applause2.webp", "/applause3.webp", "/applause4.webp"];

export function pickApplause(): string {
  return APPLAUSE[Math.floor(Math.random() * APPLAUSE.length)];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.strokeText(line, x, yy);
      ctx.fillText(line, x, yy);
      line = w;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.strokeText(line, x, yy);
    ctx.fillText(line, x, yy);
  }
}

// Render kartu 9:16 (1080x1920) lalu share via share sheet (WhatsApp dsb).
// Kalau share sheet nggak support file, fallback ke download.
export async function shareAchievement(m: Milestone): Promise<boolean> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(1, "#10b981");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Garis abstract dekoratif (di belakang foto)
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-150, 250); ctx.lineTo(W + 150, 650); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-150, 650); ctx.lineTo(W + 150, 250); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath(); ctx.moveTo(-150, 950); ctx.lineTo(W + 150, 1300); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-150, 1250); ctx.lineTo(W + 150, 900); ctx.stroke();

  try {
    const img = await loadImage(pickApplause());
    const scale = Math.max(W / img.width, H / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } catch { /* bg kosong pakai gradient */ }

  const top = ctx.createLinearGradient(0, 0, 0, H * 0.4);
  top.addColorStop(0, "rgba(4,120,87,0.55)");
  top.addColorStop(1, "rgba(4,120,87,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, H * 0.4);

  const bot = ctx.createLinearGradient(0, H * 0.55, 0, H);
  bot.addColorStop(0, "rgba(6,78,59,0)");
  bot.addColorStop(1, "rgba(6,78,59,0.65)");
  ctx.fillStyle = bot;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);

  const fontFamily = (typeof document !== "undefined"
    ? getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim()
    : "") || "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

  ctx.textAlign = "center";
  ctx.fillStyle = "#facc15";
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 3;

  // Blok teks di tengah kartu
  const cy = H * 0.45;
  ctx.font = `600 60px ${fontFamily}`;
  ctx.lineWidth = 8;
  ctx.strokeText("SELAMAT!", W / 2, cy - 130);
  ctx.fillText("SELAMAT!", W / 2, cy - 130);

  ctx.font = `700 84px ${fontFamily}`;
  ctx.lineWidth = 10;
  ctx.strokeText(m.title, W / 2, cy - 30);
  ctx.fillText(m.title, W / 2, cy - 30);

  ctx.font = `400 40px ${fontFamily}`;
  ctx.lineWidth = 6;
  ctx.fillStyle = "#facc15";
  wrapText(ctx, m.desc, W / 2, cy + 60, W - 200, 58);

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  try {
    const logo = await loadImage("/Logo_LeanMode.png");
    const cx = W / 2, cyL = H - 282;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cyL, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const s = 88;
    ctx.drawImage(logo, cx - s / 2, cyL - s / 2, s, s);
  } catch { /* logo gagal load, skip */ }

  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = "#facc15";
  ctx.font = `700 52px ${fontFamily}`;
  ctx.lineWidth = 8;
  ctx.strokeText("Lean Mode", W / 2, H - 195);
  ctx.fillText("Lean Mode", W / 2, H - 195);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `400 32px ${fontFamily}`;
  ctx.lineWidth = 5;
  ctx.strokeText("Consistency Over Perfection", W / 2, H - 137);
  ctx.fillText("Consistency Over Perfection", W / 2, H - 137);

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) return false;
  const file = new File([blob], `${m.id}.png`, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: m.title, text: m.desc });
    return true;
  }

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${m.id}.png`;
  a.click();
  return false;
}
