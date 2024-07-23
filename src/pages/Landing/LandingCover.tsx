import { getLandingMessage } from '@Content';
import { clsm } from '@Utils';
import { useEffect, useState } from 'react';

const landingCovers = import.meta.glob('../../assets/landingCovers/*.webp', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<string>>;

const getRandomLandingCoverUrl = async () => {
  const paths = Object.keys(landingCovers);
  const randomIndex = (paths.length * Math.random()) << 0; // eslint-disable-line no-bitwise
  const randomPath = paths[randomIndex];

  const url = await landingCovers[randomPath]();

  return url;
};

function LandingCover() {
  const [landingCoverUrl, setLandingCoverUrl] = useState('');

  useEffect(() => {
    (async function setRandomLandingCoverUrl() {
      const url = await getRandomLandingCoverUrl();
      setLandingCoverUrl(url);
    })();
  }, []);

  return landingCoverUrl ? (
    <img
      className={clsm(['h-full', 'w-full', 'object-cover', 'animate-burns'])}
      alt={getLandingMessage('landingCoverImgAlt')}
      src={landingCoverUrl}
    />
  ) : null;
}

export default LandingCover;
