import React, { useState, useEffect } from 'react';

interface ExampleComponentProps {
    initialDarkMode?: boolean;
}

const ExampleComponent: React.FC<ExampleComponentProps> = ({ initialDarkMode = false }) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(initialDarkMode);

    useEffect(() => {
        // Simulate loading data
        const loadData = async () => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsLoading(false);
        };

        loadData();
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

    // Rendering using if-else-if with CNF conditions
    if (isLoading && isDarkMode) {
        return (
            <div className="example-component dark-mode" aria-label="loading-dark-container">
                <div className="loading-spinner" aria-label="loading-indicator">Loading...</div>
            </div>
        );
    } else if (isLoading && !isDarkMode) {
        return (
            <div className="example-component light-mode" aria-label="loading-light-container">
                <div className="loading-spinner" aria-label="loading-indicator">Loading...</div>
            </div>
        );
    } else if (!isLoading && isDarkMode) {
        return (
            <div className="example-component dark-mode" aria-label="content-dark-container">
                <div className="content" aria-label="content-area">
                    <h2>Example Component</h2>
                    <p>This component has loaded successfully.</p>
                    <button 
                        onClick={() => setIsDarkMode(false)}
                        aria-label="toggle-light-mode"
                    >
                        Switch to Light Mode
                    </button>
                </div>
            </div>
        );
    } else if (!isLoading && !isDarkMode) {
        return (
            <div className="example-component light-mode" aria-label="content-light-container">
                <div className="content" aria-label="content-area">
                    <h2>Example Component</h2>
                    <p>This component has loaded successfully.</p>
                    <button 
                        onClick={toggleDarkMode}
                        aria-label="toggle-dark-mode"
                    >
                        Switch to Dark Mode
                    </button>
                </div>
            </div>
        );
    }
};

export default ExampleComponent;