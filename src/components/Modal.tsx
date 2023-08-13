import React, { FC } from 'react';
import { Box, Modal as MuiModal, ModalProps as MuiModalProps } from '@mui/material';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export interface ModalProps extends MuiModalProps {
  width: string;
  height?: string;
  children: React.ReactElement;
}

export const Modal: FC<ModalProps> = (props: ModalProps): React.ReactElement => {
  return (
    <MuiModal open {...props}>
      <Box sx={{ ...style, width: props.width, height: props.height }}>{props.children}</Box>
    </MuiModal>
  );
};
