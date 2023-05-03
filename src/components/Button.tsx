import React, { FC } from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';

export interface ButtonProps extends MuiButtonProps {
  children: any;
}

export const Button: FC<ButtonProps> = (props: ButtonProps): React.ReactElement => {
  return <MuiButton {...props}>{props.children}</MuiButton>;
};
