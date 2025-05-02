export const getDifficultyBorderClass = (difficulty) => {
    if (difficulty === 'Easy') return 'easy-border';
    if (difficulty === 'Medium') return 'medium-border';
    if (difficulty === 'Hard') return 'hard-border';
    return '';
  };

export const getDifficultyClass = (difficulty) => {
    if (difficulty === 'Easy') return 'easy';
    if (difficulty === 'Medium') return 'medium';
    return 'hard';
  };

  export function getBgColorClass(difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-easy-color';
      case 'medium':
        return 'bg-medium-color';
      case 'hard':
        return 'bg-hard-color';
      default:
        return ''; // fallback if unknown
    }
  }