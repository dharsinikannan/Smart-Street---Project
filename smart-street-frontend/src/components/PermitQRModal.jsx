import { useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { QRCodeCanvas } from "qrcode.react";
import QRCode from "qrcode";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export default function PermitQRModal({ isOpen, onClose, permit }) {
  const qrRef = useRef();

  if (!permit) return null;

  // Data to embed in the QR code
  const qrData = permit.qr_payload || JSON.stringify({
    permit_id: permit.permit_id,
    error: "MISSING_PAYLOAD"
  });

  const downloadCard = async () => {
    // Create a new canvas to draw the card
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Card Dimensions
    const width = 600;
    const height = 900; // Portrait ID Card style
    canvas.width = width;
    canvas.height = height;

    // Helper for rounded rect to ensure compatibility
    const drawRoundedRect = (x, y, w, h, r) => {
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
    };

    // 1. Background
    // Gradient Background (Blue Theme)
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(1, "#eff6ff"); // blue-50
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Top Header Bar (Blue/Indigo)
    const headerGradient = ctx.createLinearGradient(0, 0, width, 0);
    headerGradient.addColorStop(0, "#2563eb"); // blue-600
    headerGradient.addColorStop(1, "#4f46e5"); // indigo-600
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, 140);

    // 2. Header Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SMART STREET", width / 2, 70);

    ctx.font = "500 20px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText("OFFICIAL VENDOR PERMIT", width / 2, 110);

    // 3. Draw QR Code
    // White box container for QR
    const qrBoxSize = 340;
    const qrBoxX = (width - qrBoxSize) / 2;
    const qrBoxY = 200;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "#ffffff";

    drawRoundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20);
    ctx.fill();
    ctx.restore();

    // NUCLEAR FIX: Generate QR matrix data and draw each module as a pure rectangle.
    // This uses ZERO canvas-to-canvas copies, ZERO image scaling, ZERO OS-dependent paths.
    // Just math + fillRect = identical output on Windows, Linux, macOS.
    const qrPadding = 30;
    const qrDrawSize = qrBoxSize - (qrPadding * 2); // 280px
    const qrOriginX = qrBoxX + qrPadding;
    const qrOriginY = qrBoxY + qrPadding;

    // Get raw QR matrix (array of 0s and 1s)
    const qrObj = QRCode.create(qrData, { errorCorrectionLevel: "H" });
    const moduleCount = qrObj.modules.size; // e.g., 73 modules per side
    const marginModules = 2; // quiet zone
    const totalModules = moduleCount + marginModules * 2;
    const cellSize = qrDrawSize / totalModules; // exact floating point for even distribution

    // White background for the QR area
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrOriginX, qrOriginY, qrDrawSize, qrDrawSize);

    // Draw each dark module as a black rectangle
    ctx.fillStyle = "#000000";
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qrObj.modules.data[row * moduleCount + col]) {
          // Use Math.round for pixel-snapped coordinates (no sub-pixel anti-aliasing)
          const x = Math.round(qrOriginX + (col + marginModules) * cellSize);
          const y = Math.round(qrOriginY + (row + marginModules) * cellSize);
          const w = Math.round(qrOriginX + (col + marginModules + 1) * cellSize) - x;
          const h = Math.round(qrOriginY + (row + marginModules + 1) * cellSize) - y;
          ctx.fillRect(x, y, w, h);
        }
      }
    }

    // 4. Details
    const startY = 600;

    ctx.fillStyle = "#1e293b"; // slate-800
    ctx.textAlign = "center";

    // Status Badge
    // Badge Background
    ctx.fillStyle = "#dcfce7"; // green-100
    drawRoundedRect((width - 180) / 2, startY - 20, 180, 40, 20);
    ctx.fill();

    ctx.fillStyle = "#166534"; // green-800
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("ACTIVE PERMIT", width / 2, startY + 6);

    // Permit ID
    ctx.fillStyle = "#64748b"; // slate-500
    ctx.font = "14px sans-serif";
    ctx.fillText("PERMIT ID", width / 2, startY + 70);

    ctx.fillStyle = "#0f172a"; // slate-900
    ctx.font = "bold 24px monospace";
    ctx.fillText(`#${permit.permit_id.substring(0, 8)}...`, width / 2, startY + 100);

    // Location (Only if populated)
    let currentY = startY + 150;
    if (permit.Space && permit.Space.space_name) {
      ctx.fillStyle = "#64748b";
      ctx.font = "14px sans-serif";
      ctx.fillText("ASSIGNED LOCATION", width / 2, currentY);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(permit.Space.space_name, width / 2, currentY + 30);
      currentY += 80;
    }

    // Validity
    ctx.fillStyle = "#64748b";
    ctx.font = "16px sans-serif";
    const validFrom = new Date(permit.valid_from).toLocaleDateString();
    const validTo = new Date(permit.valid_to).toLocaleDateString();
    ctx.fillText(`Valid: ${validFrom} - ${validTo}`, width / 2, currentY + 30); // Adjusted Y

    // Footer
    ctx.fillStyle = "#f8fafc"; // slate-50
    ctx.fillRect(0, height - 60, width, 60);

    ctx.fillStyle = "#94a3b8"; // slate-400
    ctx.font = "12px sans-serif";
    ctx.fillText("Scan to verify authenticity • Smart Street Platform", width / 2, height - 25);

    // Download
    const link = document.createElement('a');
    link.download = `SmartStreet-Permit-${permit.permit_id.substring(0, 8)}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[3000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl transition-all border border-slate-200 dark:border-slate-800">

                {/* Visual Card Representation - Blue Theme */}
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-6 pb-20 text-center overflow-hidden">
                  {/* Decorative Circles */}
                  <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                  <div className="absolute top-[20px] right-[-20px] w-20 h-20 bg-purple-500 opacity-20 rounded-full blur-xl"></div>

                  <h3 className="text-2xl font-bold text-white tracking-widest uppercase mb-1 drop-shadow-sm">Smart Street</h3>
                  <p className="text-blue-100 text-sm font-medium tracking-wider uppercase">Official Vendor Permit</p>

                  <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative px-6 pb-8 -mt-16">
                  {/* QR Code Card */}
                  <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 mb-6 flex justify-center">
                    <div ref={qrRef}>
                      <QRCodeCanvas
                        value={qrData}
                        size={280}
                        level={"H"}
                        includeMargin={true}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="text-center space-y-4">

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-bold uppercase tracking-wide">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Active Permit
                    </div>

                    {permit.Space?.space_name && (
                      <div>
                        <h4 className="text-slate-900 dark:text-white font-bold text-2xl">{permit.Space.space_name}</h4>
                        <p className="text-slate-500 text-base">{permit.Space.address}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Permit ID</p>
                        <p className="font-mono font-bold text-slate-700 dark:text-slate-300 text-base">#{permit.permit_id.substring(0, 6)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Valid Until</p>
                        <p className="font-bold text-slate-700 dark:text-slate-300 text-base">{new Date(permit.valid_to).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <button
                      onClick={downloadCard}
                      className="w-full mt-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowDownTrayIcon className="w-6 h-6" />
                      Download Permit Card
                    </button>
                  </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
