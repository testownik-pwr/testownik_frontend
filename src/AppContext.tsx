import React, {createContext, useState} from 'react';
import {AppTheme} from "./Theme.tsx";
import axios, {AxiosInstance} from "axios";
import {BASE_URL} from './config';
import requestInterceptor from "./interceptors/requestInterceptor.ts";
import responseInterceptor, {RefreshTokenExpiredError} from "./interceptors/responseInterceptor.ts";

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
    setAuthenticated: () => {
    },
    theme: new AppTheme(),
    axiosInstance: axiosInstance,
});

const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem("access_token"));
    const context: AppContextType = {
        isAuthenticated: isAuthenticated,
        setAuthenticated: setIsAuthenticated,
        theme: new AppTheme(),
        axiosInstance: axiosInstance,
    }

    axiosInstance.interceptors.response.use((response) => response, (error) => {
        if (error instanceof RefreshTokenExpiredError) {
            localStorage.removeItem("profile_picture");
            localStorage.removeItem("is_staff");
            context.setAuthenticated(false);
        }
        return Promise.reject(error);
    });

    return (
        <AppContext.Provider value={context}>
            {children}
        </AppContext.Provider>
    );
}

export {AppContextProvider};

export default AppContext;