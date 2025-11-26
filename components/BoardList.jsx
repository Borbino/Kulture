import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import styles from './BoardList.module.css';

export default function BoardList({ category = null }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoards();
  }, [category]);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      
      const res = await fetch(`/api/boards?${params}`);
      const data = await res.json();
      setBoards(data.boards || []);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading boards...</div>;

  return (
    <div className={styles.boardList}>
      <h2 className={styles.title}>게시판</h2>
      <div className={styles.boards}>
        {boards.map((board) => (
          <Link key={board._id} href={`/board/${board.slug.current}`}>
            <div className={styles.boardCard} style={{ borderLeft: `4px solid ${board.color}` }}>
              <div className={styles.boardIcon}>{board.icon}</div>
              <div className={styles.boardInfo}>
                <h3 className={styles.boardName}>{board.name}</h3>
                <p className={styles.boardDesc}>{board.description}</p>
                <div className={styles.boardStats}>
                  <span>게시글 {board.postCount}</span>
                  <span>구독자 {board.subscriberCount}</span>
                  {board.isAnonymous && <span className={styles.badge}>익명</span>}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

BoardList.propTypes = {
  category: PropTypes.string,
};
