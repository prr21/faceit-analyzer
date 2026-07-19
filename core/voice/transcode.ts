import ffmpegPath from "ffmpeg-static"
import { VOICE_MP3_BITRATE } from "../constants"
import { spawnRunner, type ProcessRunner } from "./runner"

/** WAV → MP3 (mono, 64 kbps) через ffmpeg-static */
export async function transcodeToMp3(
  wavPath: string,
  mp3Path: string,
  runner: ProcessRunner = spawnRunner,
): Promise<void> {
  if (!ffmpegPath) throw new Error("ffmpeg-static не нашёл бинарник для этой платформы")
  const { code, stderr } = await runner(ffmpegPath as string, [
    "-y",
    "-i", wavPath,
    "-ac", "1",
    "-b:a", VOICE_MP3_BITRATE,
    mp3Path,
  ])
  if (code !== 0) {
    throw new Error(`ffmpeg завершился с кодом ${code}: ${stderr.slice(0, 500)}`)
  }
}
