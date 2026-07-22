import axios from 'axios';
import { env } from '../../config/env.js';
import { Tool, ToolDefinition } from '../types.js';

export const weatherTodayTool: Tool = {
  definition: {
    name: 'weather_today',
    description: 'Get today\'s weather forecast for a specific location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name (e.g., London, Jakarta)' }
      },
      required: ['location']
    }
  },
  execute: async (args: any) => {
    const { location } = args;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${env.OPENWEATHERMAP_API_KEY}&units=metric`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    return {
      location: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed
    };
  }
};
