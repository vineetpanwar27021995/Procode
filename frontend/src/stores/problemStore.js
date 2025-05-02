import { create } from 'zustand';
import { problemService } from '../services/problemService';

export const useProblemStore = create((set) => ({
  roadmap: [
    "Arrays & Hashing",
    "Two Pointers",
    "Sliding Window",
    "Stack",
    "Binary Search",
    "Linked List",
    "Trees",
    "Trie",
    "Heap / Priority Queue",
    "Backtracking",
    "Graphs",
    "Advanced Graphs",
    "1-D Dynamic Programming",
    "2-D Dynamic Programming",
    "Greedy",
    "Intervals",
    "Math & Geometry",
    "Bit Manipulation"
  ],
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const categories = await problemService.fetchCategories();
      set((state) => {
        const roadmapOrder = state.roadmap;
        const entries = Object.entries(categories);
  
        const sortedEntries = entries.sort(([keyA], [keyB]) => {
          const indexA = roadmapOrder.indexOf(keyA);
          const indexB = roadmapOrder.indexOf(keyB);
  
          return (
            (indexA === -1 ? Number.MAX_VALUE : indexA) -
            (indexB === -1 ? Number.MAX_VALUE : indexB)
          );
        });
  
        const sortedCategories = Object.fromEntries(sortedEntries);
  
        return {
          categories: sortedCategories,
          loading: false,
        };
      });
    } catch (error) {
      set({
        error: error.message || 'Failed to fetch categories',
        loading: false,
      });
    }
  },
}));
