import 'styled-components';
import { rosePineTheme } from './theme';

type ThemeType = typeof rosePineTheme;

declare module 'styled-components' {
    export interface DefaultTheme extends ThemeType { }
}