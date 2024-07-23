import cp from 'child_process';
import ffmpeg from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import wav from 'wav-file-info';

const soundsDir = path.join(import.meta.dirname, '../src/assets/sounds');
const oggFilePath = path.join(soundsDir, 'sounds.ogg');
const mp3FilePath = path.join(soundsDir, 'sounds.mp3');
const spriteDefsPath = path.join(soundsDir, 'spriteDefs.json');

function getWavFileInfo(fileName: string) {
  return new Promise<wav.WavFileInfo>((resolve, reject) => {
    wav.infoByFilename(fileName, (err, info) => {
      if (err) {
        reject(err);
      }

      resolve(info);
    });
  });
}

async function normalizeWavFiles(filePaths: string[] = []) {
  const concatFilePaths: string[] = [];
  const spriteDefs: Record<string, [number, number]> = {}; // Object to store file names with their start and end times

  const silenceDuration = 0.01; // 10ms
  const silenceDurationMs = silenceDuration * 1000;
  const silenceFilePath = path.join(import.meta.dirname, 'temp_silence.wav');
  const silenceCommand = `${ffmpeg} -y -v error -f lavfi -i anullsrc=r=44100:cl=stereo -t ${silenceDuration} "${silenceFilePath}"`;
  cp.execSync(silenceCommand);

  async function normalize(filePathIndex = 0, offsetMs = 0) {
    const filePath = filePaths[filePathIndex];

    if (!filePath) {
      return;
    }

    const fileName = path.basename(filePath);
    const outputFilePath = path.join(
      import.meta.dirname,
      `temp_normalized_${fileName}`
    );
    const normalizeCommand = `${ffmpeg} -y -v error -i "${filePath}" -ac 2 -ar 44100 -acodec pcm_s16le "${outputFilePath}"`;
    cp.execSync(normalizeCommand);

    const wavInfo = await getWavFileInfo(outputFilePath);
    const durationMs = Math.ceil(wavInfo.duration * 1000);
    spriteDefs[path.parse(fileName).name] = [offsetMs, durationMs];

    // Pad the start and end of the output sound with silence
    concatFilePaths.push(silenceFilePath, outputFilePath, silenceFilePath);

    const nextOffset = offsetMs + durationMs + 2 * silenceDurationMs;
    await normalize(filePathIndex + 1, nextOffset);
  }

  await normalize();
  const prettySpriteDefs = await prettier.format(JSON.stringify(spriteDefs), {
    filepath: spriteDefsPath
  });
  fs.writeFileSync(spriteDefsPath, prettySpriteDefs);

  return concatFilePaths;
}

fs.readdir(soundsDir, async (err, files) => {
  if (err) {
    console.error(`Error reading directory: ${err}`);

    return;
  }

  const wavFileNames = files.filter((file) => path.extname(file) === '.wav');
  const wavFilePaths = wavFileNames.map((file) => path.join(soundsDir, file));
  const tempConcatDataFilePath = path.join(import.meta.dirname, 'temp.txt');
  const tempConcatAudioFilePath = path.join(import.meta.dirname, 'sounds.wav');
  let concatFilePaths: string[] = [];

  try {
    concatFilePaths = await normalizeWavFiles(wavFilePaths);

    fs.writeFileSync(
      tempConcatDataFilePath,
      concatFilePaths.map((filePath) => `file '${filePath}'`).join('\n')
    );

    // Concatenate sound files into an audio sprite
    const concatCommand = `${ffmpeg} -v error -f concat -safe 0 -i "${tempConcatDataFilePath}" -c copy ${tempConcatAudioFilePath}`;
    cp.execSync(concatCommand);

    // Convert the audio sprite file into a .ogg format
    const convertToOggCommand = `${ffmpeg} -y -v error -i ${tempConcatAudioFilePath} ${oggFilePath}`;
    cp.execSync(convertToOggCommand);

    // Convert the audio sprite file into a .mp3 format
    const convertToMp3Command = `${ffmpeg} -y -v error -i ${tempConcatAudioFilePath} ${mp3FilePath}`;
    cp.execSync(convertToMp3Command);
  } catch (error) {
    console.error(error);
  }

  // Delete temp files
  new Set([
    ...concatFilePaths,
    tempConcatDataFilePath,
    tempConcatAudioFilePath
  ]).forEach((filePath) => {
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) {
        console.error(unlinkErr);
      }
    });
  });
});
