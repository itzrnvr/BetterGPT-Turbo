import React, { useEffect, useState } from 'react';

import TTSIcon from '@icon/TTSIcon';

import BaseButton from './BaseButton';
import useTTS from '@hooks/useTTS';
import PauseTTSIcon from '@icon/PauseTTSIcon';

const TextToSpeechButton = ({
  playing,
  onClick,
}: {
  playing: boolean,
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) => {

  return (
    <>
      <BaseButton
        icon={playing ? <PauseTTSIcon/> : <TTSIcon />}
        buttonProps={{ 'aria-label': 'tts' }}
        onClick={onClick}
      />
    </>
  );
};

export default TextToSpeechButton;
