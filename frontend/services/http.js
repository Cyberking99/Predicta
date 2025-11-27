import axios from "axios";
import routes from "./routes";

const AxiosInstance = axios.create({
  baseURL: "https://dev.basicpayng.com/api/",
  headers: {
    accept: "application/json",
    "content-Type": "application/json",
    // Add authorization if required
    // "Authorization": `Bearer ${localStorage.getItem('token')}`
  },
});

// Add request interceptor for debugging
AxiosInstance.interceptors.request.use(
  (config) => {
    console.log('Request Config:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
AxiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response:', response);
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

class BaseUrl {
  async httpGetAllEvents() {
    try {
      const response = await AxiosInstance.get(routes.EVENTS);
      return response.data;
    } catch (error) {
      console.error("Events API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }
    
  async httpPostBet(data) {
    try {
      if (!data.betting_event_id || !data.option) {
        throw new Error("Missing required bet data");
      }

      if (!data.user_id) {
        throw new Error("User ID is required");
      }

      console.log("Sending bet data:", data);
      
      const response = await AxiosInstance.post(routes.BET, data);
      
      console.log("Bet API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Bet API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Enhanced error handling
      if (error.response?.status === 422) {
        const errorData = error.response.data;
        const errorMessages = [];
        
        // Handle validation errors
        if (errorData.errors) {
          Object.entries(errorData.errors).forEach(([field, messages]) => {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          });
        }
        
        throw new Error(errorMessages.join('. ') || "Invalid bet data. Please check your inputs.");
      }
      
      if (error.response?.status === 401) {
        throw new Error("Please log in to place a bet");
      }
      
      throw error;
    }
  }
}

export default new BaseUrl();