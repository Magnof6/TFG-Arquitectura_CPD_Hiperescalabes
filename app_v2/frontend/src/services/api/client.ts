//Cliente Axios para conectar con FastApi
import axios from 'axios';

export const api = axios.create({
    baseURL: 'https://ubiquitous-carnival-qrqr6qq9xjhqpg-8000.app.github.dev/api', // Cambiar esto por mi URL del backend FastAPI

});