/** The active hotel (definition + palette) for everything inside the Canvas. */
import { createContext, useContext } from 'react';
import { HOTELS } from '../../game/hotels';

export const ThemeContext = createContext(HOTELS[0]);

export const useTheme = () => useContext(ThemeContext);
