import React, { useState, useEffect } from 'react';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

const ThemeToggle: React.FC = () => {
    // Inicializa o tema com base no localStorage ou preferência do sistema
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (localStorage.theme === 'dark') {
            return true;
        }
        if (localStorage.theme === 'light') {
            return false;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label={`Ativar modo ${isDarkMode ? 'claro' : 'escuro'}`}
        >
            {isDarkMode ? (
                <SunIcon className="w-6 h-6 text-yellow-400" />
            ) : (
                <MoonIcon className="w-6 h-6 text-slate-600" />
            )}
        </button>
    );
};

export default ThemeToggle;
