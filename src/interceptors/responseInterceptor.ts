import axios, {InternalAxiosRequestConfig} from 'axios';
import { AxiosError } from 'axios';

import { BASE_URL } from '../config';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const responseInterceptor = async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            try {
                const response = await axios.post(`${BASE_URL}/api/token/refresh/`, { refresh: refreshToken });
                const newToken = response.data.access;
                localStorage.setItem('access_token', newToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                return axios(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        } else {
            console.warn('No refresh token available');
            return Promise.reject(error);
        }
    }
    return Promise.reject(error);
};

export default responseInterceptor;