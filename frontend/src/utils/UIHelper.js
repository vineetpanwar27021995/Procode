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