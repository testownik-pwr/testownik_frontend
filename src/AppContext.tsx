import React, {createContext, useState} from 'react';
import {AppTheme} from "./Theme.tsx";
import axios, {AxiosInstance} from "axios";
import {BASE_URL} from './config';
import requestInterceptor from "./interceptors/requestInterceptor.ts";
import responseInterceptor from "./interceptors/responseInterceptor.ts";

export interface AppContextType {
    isAuthenticated: boolean;
    setAuthenticated: (isAuthenticated: boolean) => void;
    theme: AppTheme;
    axiosInstance: AxiosInstance
}

const axiosInstance = axios.create({
    baseURL: BASE_URL + "/api",
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
axiosInstance.interceptors.response.use((response) => response, responseInterceptor);

const AppContext = createContext<AppContextType>({
    isAuthenticated: false,
    setAuthenticated: () => {},
    theme: new AppTheme(),
    axiosInstance: axiosInstance,
});

const AppContextProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem("access_token"));
    const context: AppContextType = {
        isAuthenticated: isAuthenticated,
        setAuthenticated: setIsAuthenticated,
        theme: new AppTheme(),
        axiosInstance: axiosInstance,
    }

    return (
        <AppContext.Provider value={context}>
            {children}
        </AppContext.Provider>
    );
}

export {AppContextProvider};

export default AppContext;