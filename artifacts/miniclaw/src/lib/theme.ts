import { createContext, useContext } from 'react';

export interface Theme {
  bg: string;
  text: string;
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
  label: '#666666',
  faint: '#888888',
  divider: '#e8e8e8',
  surface: '#f0f0f0',
  navBorder: '#e8e8e8',
  dark: false,
};

export const DARK: Theme = {
  bg: '#0f0f0f',
  text: '#e2e2e2',
  label: '#707070',
  faint: '#666666',
  divider: '#222222',
  surface: '#1a1a1a',
  navBorder: '#1e1e1e',
  dark: true,
};

export const ThemeCtx = createContext<Theme>(LIGHT);
export const useTheme = () => useContext(ThemeCtx);
