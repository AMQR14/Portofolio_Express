const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const uploadDirectory = path.join(__dirname, "../../uploads");
const acceptedTypes = {
  "image/avif": { extension: "avif", signature: (buffer) => buffer.toString("ascii", 4, 12).startsWith("ftypavif") || buffer.toString("ascii", 4, 12).startsWith("ftypavis") },
  "image/gif": { extension: "gif", signature: (buffer) => buffer.toString("ascii", 0, 6) === "GIF87a" || buffer.toString("ascii", 0, 6) === "GIF89a" },
  "image/jpeg": { extension: "jpg", signature: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  "image/png": { extension: "png", signature: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extension: "webp", signature: (buffer) => buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" },
  "application/pdf": { extension: "pdf", signature: (buffer) => buffer.toString("ascii", 0, 5) === "%PDF-" },
};

// When BLOB_READ_WRITE_TOKEN is set (always on Vercel once a Blob store is
// connected) files go to Vercel Blob. Otherwise they are saved to ./uploads
// like before, so local development keeps working.
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const uploadFile = async (req, res) => {
  const mimeType = (req.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const fileType = acceptedTypes[mimeType];
  const file = req.body;

  if (!fileType) {
    return res.status(415).json({
      success: false,
      message: "Upload a PNG, JPEG, WebP, GIF, AVIF image, or PDF.",
    });
  }

  if (!Buffer.isBuffer(file) || file.length === 0) {
    return res.status(400).json({ success: false, message: "Choose a file to upload." });
  }

  if (!fileType.signature(file)) {
    return res.status(400).json({
      success: false,
      message: "The file contents do not match the selected file type.",
    });
  }

  const fileName = `${crypto.randomUUID()}.${fileType.extension}`;
  try {
    if (useBlob()) {
      const { put } = require("@vercel/blob");
      const blob = await put(`portfolio/${fileName}`, file, {
        access: "public",
        contentType: mimeType,
        addRandomSuffix: false,
      });
      return res.status(201).json({ success: true, url: blob.url });
    }

    await fs.mkdir(uploadDirectory, { recursive: true });
    await fs.writeFile(path.join(uploadDirectory, fileName), file, { flag: "wx" });
    return res.status(201).json({
      success: true,
      url: `${req.protocol}://${req.get("host")}/uploads/${fileName}`,
    });
  } catch (error) {
    console.error("Unable to save uploaded file:", error);
    return res.status(500).json({
      success: false,
      message: "The server could not save the uploaded file.",
    });
  }
};

// Only used for older resumes that were saved on the local disk.
const downloadResume = (req, res) => {
  const { filename } = req.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i.test(filename)) {
    return res.status(400).json({ success: false, message: "Invalid resume file." });
  }

  res.download(path.join(uploadDirectory, filename), "resume.pdf", (error) => {
    if (!error || res.headersSent) return;
    if (error.code === "ENOENT") {
      return res.status(404).json({ success: false, message: "Resume file not found." });
    }
    console.error("Unable to download resume:", error);
    return res.status(500).json({ success: false, message: "Unable to download resume." });
  });
};

module.exports = { uploadFile, downloadResume };
