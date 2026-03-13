import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import JSZip from "jszip";

export async function exportAsPng(
  element: HTMLElement,
  width: number,
  height: number,
  filename: string
): Promise<void> {
  await document.fonts.ready;

  const dataUrl = await toPng(element, {
    width,
    height,
    pixelRatio: 2,
    cacheBust: true,
    style: {
      transform: "scale(1)",
      transformOrigin: "top left",
    },
  });

  saveAs(dataUrl, filename);
}

export async function exportAsPngBlob(
  element: HTMLElement,
  width: number,
  height: number
): Promise<Blob> {
  await document.fonts.ready;

  const dataUrl = await toPng(element, {
    width,
    height,
    pixelRatio: 2,
    cacheBust: true,
    style: {
      transform: "scale(1)",
      transformOrigin: "top left",
    },
  });

  const res = await fetch(dataUrl);
  return res.blob();
}

export async function exportAllAsZip(
  elements: { element: HTMLElement; width: number; height: number; name: string }[]
): Promise<void> {
  const zip = new JSZip();

  for (const { element, width, height, name } of elements) {
    const blob = await exportAsPngBlob(element, width, height);
    zip.file(`${name}.png`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "adforge-exports.zip");
}
