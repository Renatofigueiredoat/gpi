import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import CalculatorIcon from './icons/CalculatorIcon';
import Logo from './Logo';
import FolderIcon from './icons/FolderIcon';
import ThemeToggle from './ThemeToggle';
import UserCircleIcon from './icons/UserCircleIcon';

const Header: React.FC = () => {
    const navLinkClasses = "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700";
    const activeLinkClasses = "bg-slate-100 dark:bg-slate-700 text-sky-600 dark:text-sky-400";

    return (
        <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-40 print:hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold text-sky-600 dark:text-sky-400">
                            <Logo className="h-8 w-8" />
                            <span className="hidden sm:inline">GPI</span>
                        </Link>
                        <nav className="hidden sm:flex items-center gap-2">
                            <NavLink 
                                to="/my-prescriptions"
                                className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
                            >
                                <FolderIcon className="w-5 h-5" />
                                Minhas Prescrições
                            </NavLink>
                            <NavLink 
                                to="/calculators"
                                className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
                            >
                                <CalculatorIcon className="w-5 h-5" />
                                Calculadoras
                            </NavLink>
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <NavLink 
                            to="/profile"
                            title="Meu Perfil"
                            className={({ isActive }) => `${navLinkClasses} !px-2 sm:!px-3 ${isActive ? activeLinkClasses : ''}`}
                        >
                            <UserCircleIcon className="w-6 h-6" />
                            <span className="hidden lg:inline">Perfil</span>
                        </NavLink>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;