"use client";

import { useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DownloadIcon, PrinterIcon } from "@/components/ui/icons";

interface QRPreviewCardProps {
  dataUrl: string;
  caption: string;
  displayUrl: string;
}

export function QRPreviewCard({ dataUrl, caption, displayUrl }: QRPreviewCardProps) {
  const printRef = useRef<HTMLImageElement>(null);

  function handlePrint() {
    const win = window.open("", "_blank", "width=480,height=560");
    if (!win) return;

    // Built with DOM APIs rather than document.write(`...${caption}...`)
    // — caption ultimately comes from a user-editable QR label, and
    // interpolating it into an HTML string would let a saved label
    // inject markup into this same-origin popup. `.textContent` and
    // `.title` never parse their input as HTML, so this is safe
    // regardless of what the label contains.
    win.document.title = caption;

    const style = win.document.createElement("style");
    style.textContent =
      "body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;}";
    win.document.head.appendChild(style);

    const img = win.document.createElement("img");
    img.src = dataUrl; // server-generated data URL, not user input
    img.style.width = "320px";
    img.style.height = "320px";
    img.onload = () => win.print();
    win.document.body.appendChild(img);

    const captionEl = win.document.createElement("p");
    captionEl.style.marginTop = "16px";
    captionEl.textContent = caption;
    win.document.body.appendChild(captionEl);
  }

  return (
    <Card className="flex flex-col items-center gap-6 p-8">
      <div className="flex w-full items-center justify-center rounded-card border border-border bg-white p-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable remote asset */}
        <img ref={printRef} src={dataUrl} alt={`QR code for ${caption}`} width={220} height={220} />
      </div>
      <div className="text-center">
        <p className="text-label font-semibold text-charcoal">{caption}</p>
        <p className="mt-1 text-micro text-charcoal/56">{displayUrl}</p>
      </div>
      <div className="flex gap-3">
        <a href={dataUrl} download="allergenly-qr-code.png">
          <Button variant="primary" size="sm">
            <DownloadIcon size={16} />
            Download
          </Button>
        </a>
        <Button variant="secondary" size="sm" onClick={handlePrint}>
          <PrinterIcon size={16} />
          Print
        </Button>
      </div>
    </Card>
  );
}
