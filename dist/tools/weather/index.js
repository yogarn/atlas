import axios from 'axios';
import { env } from '../../config/env.js';
export const weatherForecastTool = {
    definition: {
        name: 'weather_forecast',
        description: 'Get weather forecast for a specific location. Can provide current weather or a forecast for a specific date (up to 5 days ahead).',
        parameters: {
            type: 'object',
            properties: {
                location: { type: 'string', description: 'City name (e.g., London, Jakarta, Malang)' },
                date: { type: 'string', description: 'Date in YYYY-MM-DD format (optional, defaults to current weather)' }
            },
            required: ['location']
        }
    },
    execute: async (args) => {
        const { location, date } = args;
        if (!date) {
            // Current weather
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${env.OPENWEATHERMAP_API_KEY}&units=metric`;
            const response = await axios.get(url);
            const data = response.data;
            return {
                location: data.name,
                type: 'current',
                temperature: data.main.temp,
                description: data.weather[0].description,
                humidity: data.main.humidity,
                windSpeed: data.wind.speed
            };
        }
        else {
            // Forecast
            const url = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${env.OPENWEATHERMAP_API_KEY}&units=metric`;
            const response = await axios.get(url);
            const data = response.data;
            // Find the forecast closest to noon on the target date
            const targetPrefix = date; // 'YYYY-MM-DD'
            // Filter items matching the date
            const dayForecasts = data.list.filter((item) => item.dt_txt.startsWith(targetPrefix));
            if (dayForecasts.length === 0) {
                return { error: `No forecast available for ${date}` };
            }
            // Pick the noon forecast (12:00:00), or fallback to the first available for that day
            const noonForecast = dayForecasts.find((item) => item.dt_txt.includes('12:00:00')) || dayForecasts[0];
            // Compute min and max temp for the day
            const minTemp = Math.min(...dayForecasts.map((i) => i.main.temp_min));
            const maxTemp = Math.max(...dayForecasts.map((i) => i.main.temp_max));
            return {
                location: data.city.name,
                type: 'forecast',
                date: date,
                temperature: noonForecast.main.temp,
                minTemp,
                maxTemp,
                description: noonForecast.weather[0].description,
                humidity: noonForecast.main.humidity,
                windSpeed: noonForecast.wind.speed
            };
        }
    }
};
//# sourceMappingURL=index.js.map