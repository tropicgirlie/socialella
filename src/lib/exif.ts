import sharp from "sharp";

/** Strip EXIF/GPS and normalize orientation for safer uploads. */
export async function stripExifFromBuffer(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .withMetadata({ exif: {}, icc: undefined })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}
