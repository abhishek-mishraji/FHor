import axios from 'axios'
import environment from '../../config/environment'
import { setupRequestInterceptor } from './requestInterceptor'
import { setupResponseInterceptor } from './responseInterceptor'

const axiosInstance = axios.create({
  baseURL: environment.apiBaseUrl,
  timeout: environment.requestTimeout,
  withCredentials: true,
})

setupRequestInterceptor(axiosInstance)
setupResponseInterceptor(axiosInstance)

export default axiosInstance
