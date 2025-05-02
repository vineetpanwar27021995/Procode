import api from "./api";

export const problemService = {
    fetchRoadmap: async () => {
        try {
          const response = await api.get('/problems/roadmap');
          return response.data;
        } catch (error) {
          throw new Error(error.response?.data?.message || 'Failed to fetch roadmap');
        }
      },
    
      fetchCategories: async () => {
        try {
          const response = await api.get('/problems/categories');
          return response.data.categories;
        } catch (error) {
          throw new Error(error.response?.data?.message || 'Failed to fetch categories');
        }
      },
};
