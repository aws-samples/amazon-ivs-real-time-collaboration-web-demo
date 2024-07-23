declare module 'wav-file-info' {
  import fs from 'fs';

  interface WavFileInfo {
    duration: number;
    stats: fs.Stats;
    header: {
      riff_head: string;
      chunk_size: number;
      wave_identifier: string;
      fmt_identifier: string;
      subchunk_size: number;
      audio_format: number;
      num_channels: number;
      sample_rate: number;
      byte_rate: number;
      block_align: number;
      bits_per_sample: number;
      data_identifier: string;
    };
  }

  function infoByFilename(
    fileName: string,
    cb: (err: Error, info: WavFileInfo) => void
  ): void;
}
