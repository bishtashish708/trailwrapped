import { Router, Request, Response } from "express";
import multer from "multer";
import { parseGpx, parseTcx, parseFit } from "../services/parser";
import { insertActivity } from "../db/activities";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post("/", upload.array("files", 50), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) {
    res.status(400).json({ error: "No files uploaded" });
    return;
  }

  const results: { file: string; status: string; error?: string }[] = [];

  for (const file of files) {
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    try {
      let activity;
      if (ext === "gpx") activity = await parseGpx(file.buffer);
      else if (ext === "tcx") activity = await parseTcx(file.buffer);
      else if (ext === "fit") activity = await parseFit(file.buffer);
      else throw new Error(`Unsupported file type: .${ext}`);

      insertActivity(activity);
      results.push({ file: file.originalname, status: "imported" });
    } catch (err) {
      results.push({
        file: file.originalname,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  res.json({ results });
});

export default router;
