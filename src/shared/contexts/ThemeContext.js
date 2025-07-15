import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(undefined);
export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved) {
            setIsDark(saved === 'dark');
        }
        else {
            setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
    }, []);
    useEffect(() => {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        if (isDark) {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);
    const toggleTheme = () => {
        setIsDark(!isDark);
    };
    return (_jsx(ThemeContext.Provider, { value: { isDark, toggleTheme }, children: children }));
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
