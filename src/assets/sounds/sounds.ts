import { Howl, Howler, SoundSpriteDefinitions } from 'howler';

import spriteDefs from './spriteDefs.json';

const soundsSrcMap = import.meta.glob('./sounds.*', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>;
const { './sounds.ogg': soundsOgg, './sounds.mp3': soundsMp3 } = soundsSrcMap;

const sounds: { howl?: Howl } = {};

function load() {
  Howler.volume(0.9);

  sounds.howl = new Howl({
    preload: true,
    src: [soundsOgg, soundsMp3],
    sprite: spriteDefs as unknown as SoundSpriteDefinitions
  });

  window.addEventListener('beforeunload', () => Howler.volume(0));
}

window.addEventListener('click', load, { once: true });

export default sounds;
