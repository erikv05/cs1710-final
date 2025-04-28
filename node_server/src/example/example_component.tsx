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
            <div className="example-component dark-mode">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    } else if (isLoading && !isDarkMode) {
        return (
            <div className="example-component light-mode">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    } else if (!isLoading && isDarkMode) {
        return (
            <div className="example-component dark-mode">
                <div className="content">
                    <h2>Example Component</h2>
                    <p>This component has loaded successfully.</p>
                    <button onClick={toggleDarkMode}>
                        Switch to Light Mode
                    </button>
                </div>
            </div>
        );
    } else if (!isLoading && !isDarkMode) {
        return (
            <div className="example-component light-mode">
                <div className="content">
                    <h2>Example Component</h2>
                    <p>This component has loaded successfully.</p>
                    <button onClick={toggleDarkMode}>
                        Switch to Dark Mode
                    </button>
                </div>
            </div>
        );
    }
};

export default ExampleComponent;