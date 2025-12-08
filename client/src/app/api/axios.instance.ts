import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8500';

interface TokenPayload {
    accessToken: string;
    refreshToken: string;
}

interface FailedQueueItem {
    resolve: (token: string) => void;
    reject: (error: AxiosError) => void;
}

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: AxiosError | null, token: string | null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else if (token) prom.resolve(token);
    });
    failedQueue = [];
};

const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// ✅ Popup window function
const openLoginPopup = () => {
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
        '/auth/login',
        'loginPopup',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    const checkPopup = setInterval(() => {
        if (popup && popup.closed) {
            clearInterval(checkPopup);
            window.location.reload();
        }
    }, 1000);

    return popup;
};

// REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        // ✅ Debugging জন্য console.log
        console.log('Request Interceptor - Token:', token);
        console.log('Request URL:', config.url);

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

//  FIXED RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // If token expired (401 error)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token: string) => {
                            if (originalRequest.headers) {
                                originalRequest.headers.Authorization = `Bearer ${token}`;
                            }
                            resolve(axiosInstance(originalRequest));
                        },
                        reject,
                    });
                });
            }

            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");

                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                // ✅ Refresh token request
                const res = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });

                // ✅ Get both tokens from response
                const newAccessToken = res.data.data.accessToken;
                const newRefreshToken = res.data.data.refreshToken;

                // ✅ Store BOTH new tokens
                localStorage.setItem("accessToken", newAccessToken);
                localStorage.setItem("refreshToken", newRefreshToken);
                sessionStorage.setItem("accessToken", newAccessToken);
                sessionStorage.setItem("refreshToken", newRefreshToken);

                processQueue(null, newAccessToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                return axiosInstance(originalRequest);
            } catch (refreshError: any) {
                processQueue(refreshError as AxiosError, null);

                // ✅ Clear tokens
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                sessionStorage.removeItem("accessToken");
                sessionStorage.removeItem("refreshToken");

                // ✅ Open login popup (only if not already on login page)
                // const isLoginPage = window.location.pathname === '/auth/login';
                // if (!isLoginPage) {
                //     openLoginPopup();
                // }

                // ✅ Check if it's a refresh token expiration
                if (refreshError.response?.status === 401 || refreshError.message?.includes('refresh token')) {
                    const isLoginPage = window.location.pathname === '/auth/login';
                    if (!isLoginPage) {
                        openLoginPopup();
                    }
                }

                return Promise.reject(refreshError);

            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;

// import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

// const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8500';

// interface TokenPayload {
//     accessToken: string;
//     refreshToken: string;
// }

// interface FailedQueueItem {
//     resolve: (token: string) => void;
//     reject: (error: AxiosError) => void;
// }

// let isRefreshing = false;
// let failedQueue: FailedQueueItem[] = [];

// const processQueue = (error: AxiosError | null, token: string | null) => {
//     failedQueue.forEach((prom) => {
//         if (error) prom.reject(error);
//         else if (token) prom.resolve(token);
//     });
//     failedQueue = [];
// };

// const axiosInstance: AxiosInstance = axios.create({
//     baseURL: API_URL,
//     withCredentials: true,
// });

// // REQUEST INTERCEPTOR
// axiosInstance.interceptors.request.use(
//     (config: InternalAxiosRequestConfig) => {
//         // Check both localStorage and sessionStorage for token
//         const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
//         if (token && config.headers) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error: AxiosError) => Promise.reject(error)
// );

// // ⭐ RESPONSE INTERCEPTOR
// axiosInstance.interceptors.response.use(
//     (response) => response,
//     async (error: AxiosError) => {
//         const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

//         // If token expired
//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;

//             if (isRefreshing) {
//                 return new Promise((resolve, reject) => {
//                     failedQueue.push({
//                         resolve: (token: string) => {
//                             if (originalRequest.headers) {
//                                 originalRequest.headers.Authorization = `Bearer ${token}`;
//                             }
//                             resolve(axiosInstance(originalRequest));
//                         },
//                         reject,
//                     });
//                 });
//             }

//             isRefreshing = true;

//             try {
//                 const refreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");

//                 if (!refreshToken) {
//                     throw new Error("No refresh token available");
//                 }

//                 const res = await axios.post<TokenPayload>(
//                     `${API_URL}/auth/refresh-token`,
//                     { refreshToken }
//                 );

//                 const newAccessToken = res.data.accessToken;

//                 // Store in both localStorage and sessionStorage for consistency
//                 localStorage.setItem("accessToken", newAccessToken);
//                 sessionStorage.setItem("accessToken", newAccessToken);

//                 processQueue(null, newAccessToken);

//                 if (originalRequest.headers) {
//                     originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//                 }

//                 return axiosInstance(originalRequest);
//             } catch (refreshError) {
//                 processQueue(refreshError as AxiosError, null);
//                 localStorage.removeItem("accessToken");
//                 localStorage.removeItem("refreshToken");
//                 sessionStorage.removeItem("accessToken");
//                 sessionStorage.removeItem("refreshToken");

//                 window.location.href = "/auth/login";

//                 return Promise.reject(refreshError);

//             } finally {
//                 isRefreshing = false;
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// export default axiosInstance;


// import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

// const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8500' // BACKEND - SERVER HTTP API


// interface TokenPayload {
//     accessToken: string;
//     refreshToken: string;
// }

// interface FailedQueueItem {
//     resolve: (token: string) => void;
//     reject: (error: AxiosError) => void;
// }

// let isRefreshing = false;
// let failedQueue: FailedQueueItem[] = [];

// const processQueue = (error: AxiosError | null, token: string | null) => {
//     failedQueue.forEach((prom) => {
//         if (error) prom.reject(error);
//         else if (token) prom.resolve(token);
//     });
//     failedQueue = [];
// };

// const axiosInstance: AxiosInstance = axios.create({
//     baseURL: API_URL,
//     withCredentials: true,
// });

// // ⭐ REQUEST INTERCEPTOR
// axiosInstance.interceptors.request.use(
//     (config: InternalAxiosRequestConfig) => {
//         const token = localStorage.getItem("accessToken");
//         if (token && config.headers) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error: AxiosError) => Promise.reject(error)
// );

// // ⭐ RESPONSE INTERCEPTOR
// axiosInstance.interceptors.response.use(
//     (response) => response,

//     async (error: AxiosError) => {
//         const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

//         // If token expired
//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;

//             if (isRefreshing) {
//                 return new Promise((resolve, reject) => {
//                     failedQueue.push({
//                         resolve: (token: string) => {
//                             if (originalRequest.headers) {
//                                 originalRequest.headers.Authorization = `Bearer ${token}`;
//                             }
//                             resolve(axiosInstance(originalRequest));
//                         },
//                         reject,
//                     });
//                 });
//             }

//             isRefreshing = true;

//             try {
//                 const refreshToken = localStorage.getItem("refreshToken");

//                 const res = await axios.post<TokenPayload>(
//                     `${API_URL}/auth/refresh-token`,
//                     { refreshToken }
//                 );

//                 const newAccessToken = res.data.accessToken;

//                 localStorage.setItem("accessToken", newAccessToken);

//                 processQueue(null, newAccessToken);

//                 if (originalRequest.headers) {
//                     originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//                 }

//                 return axiosInstance(originalRequest);
//             } catch (refreshError) {
//                 processQueue(refreshError as AxiosError, null);
//                 localStorage.removeItem("accessToken");
//                 localStorage.removeItem("refreshToken");
//                 window.location.href = "/login";
//                 return Promise.reject(refreshError);
//             } finally {
//                 isRefreshing = false;
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// export default axiosInstance;
