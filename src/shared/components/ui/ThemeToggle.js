import { jsx as _jsx } from "react/jsx-runtime";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
export function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();
    const handleClick = () => {
        console.log('🎯 ThemeToggle button clicked!');
        toggleTheme();
    };
    return (_jsx("button", { onClick: handleClick, className: "p-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-gray-800 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 border border-blue-200 dark:border-gray-600 shadow-sm hover:shadow-md", "aria-label": isDark ? 'Switch to light mode' : 'Switch to dark mode', title: isDark ? 'Switch to light mode' : 'Switch to dark mode', children: isDark ? (_jsx(Sun, { className: "h-5 w-5 text-amber-500 hover:text-amber-400 transition-colors" })) : (_jsx(Moon, { className: "h-5 w-5 text-indigo-600 hover:text-indigo-700 transition-colors" })) }));
}
