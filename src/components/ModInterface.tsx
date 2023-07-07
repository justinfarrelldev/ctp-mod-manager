import React, { FC } from 'react';
import { Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

export type Props = {};

export const ModInterface: FC<Props> = (props: Props) => {
  const { location } = useParams();
  return (
    <>
      <Typography>{`Install location: ${location}`}</Typography>
    </>
  );
};
