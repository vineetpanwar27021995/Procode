import React from 'react';
import styles from '../../styles/Profile.module.css'; 
import { FiCheckSquare, FiAward, FiPercent, FiBarChart2, FiCalendar, FiCheckCircle } from 'react-icons/fi'; 
import { FaMedal } from 'react-icons/fa'; 


const achievementsData = [
  { id: 1, icon: <FaMedal color="#FFD700"/>, title: 'Earned Gold in 200 Days grind', date: 'May 1, 2024', score: '5/5 Correct' }, 
  { id: 2, icon: <FiCheckCircle color="#ccc"/>, title: 'Completed 50 Medium Question', date: 'May 1, 2024', score: '5/10 Correct' },
  { id: 3, icon: <FaMedal color="#CD7F32"/>, title: 'Earned Bronze in 50 Days grind', date: 'May 1, 2024', score: '8/10 Correct' },
  { id: 4, icon: <FaMedal color="#C0C0C0"/>, title: 'Earned Silver in 100 Days grind', date: 'May 1, 2024', score: '9/10 Correct' },
  { id: 5, icon: <FaMedal color="#FFD700"/>, title: 'Earned Gold in Blind 150', date: 'May 1, 2024', score: '10/10 Correct' },
  { id: 6, icon: <FaMedal color="#FFD700"/>, title: 'Earned Gold in Blind 75', date: 'May 1, 2024', score: '5/7 Correct' },
];

const ActivityTab = () => {
  // TODO: Fetch actual achievements data

  return (
    <div className={styles.tabContent}>
      {/* Display Achievements List */}
      <ul className={styles.achievementList}>
        {achievementsData.map(ach => (
          <li key={ach.id} className={styles.achievementItem}>
            <div className={styles.achievementIcon}>{ach.icon}</div>
            <div className={styles.achievementDetails}>
              <span className={styles.achievementTitle}>{ach.title}</span>
              <div className={styles.achievementMeta}>
                <FiCalendar size={12} />
                <span>{ach.date}</span>
                <span>{ach.score}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
       {/* Removed original activity grid and placeholders */}
    </div>
  );
};

export default ActivityTab;
