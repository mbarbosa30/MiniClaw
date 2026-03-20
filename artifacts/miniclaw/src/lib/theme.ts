import { createContext, useContext } from 'react';

export interface Theme {
  bg: string;
  text: string;
  textDim: string;
  label: string;
  faint: string;
  divider: string;
  surface: string;
  navBorder: string;
  dark: boolean;
}

export const LIGHT: Theme = {
  bg: '#ffffff',
  text: '#0a0a0a',
  textDim: '#c4c4c4',
  label: '#aaa',
  faint: '#bbb',
  divider: '#f5f5f5',
  surface: '#f0f0f0',
  navBorder: '#f0f0f0',
  dark: false,
};

export const DARK: Theme = {
  bg: '#0f0f0f',
  text: '#e2e2e2',
  textDim: '#3a3a3a',
  label: '#707070',
  faint: '#555555',
  divider: '#222222',
  surface: '#1a1a1a',
  navBorder: '#1e1e1e',
  dark: true,
};

export const ThemeCtx = createContext<Theme>(LIGHT);
export const useTheme = () => useContext(ThemeCtx);
