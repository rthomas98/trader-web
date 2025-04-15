import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        // Try to resolve the page component with the given name
        // This approach handles case sensitivity issues by trying multiple variations
        const pages = import.meta.glob('./pages/**/*.tsx');
        
        // First try with the exact name as provided
        const exactPath = `./pages/${name}.tsx`;
        if (exactPath in pages) {
            return resolvePageComponent(exactPath, pages);
        }
        
        // Try with lowercase name
        const lowercaseName = name.toLowerCase();
        const lowercasePath = `./pages/${lowercaseName}.tsx`;
        if (lowercasePath in pages) {
            return resolvePageComponent(lowercasePath, pages);
        }
        
        // Try with capitalized first letter (e.g., "onboarding/index" -> "Onboarding/Index")
        const capitalizedParts = name.split('/').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
        );
        const capitalizedName = capitalizedParts.join('/');
        const capitalizedPath = `./pages/${capitalizedName}.tsx`;
        if (capitalizedPath in pages) {
            return resolvePageComponent(capitalizedPath, pages);
        }
        
        // If all else fails, try the original path as a last resort
        return resolvePageComponent(`./pages/${name}.tsx`, pages);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
