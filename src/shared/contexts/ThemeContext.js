import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(undefined);
export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('theme');
        if (saved) {
            setIsDark(saved === 'dark');
        }
        else {
            setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
    }, []);
    useEffect(() => {
        if (!mounted)
            return;
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        if (isDark) {
            document.documentElement.classList.add('dark');
            console.log('🌙 Dark mode enabled');
        }
        else {
            document.documentElement.classList.remove('dark');
            console.log('☀️ Light mode enabled');
        }
    }, [isDark, mounted]);
    const toggleTheme = () => {
        console.log('🔄 Theme toggle clicked, current isDark:', isDark);
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
