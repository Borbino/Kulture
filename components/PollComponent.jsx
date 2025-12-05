import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import styles from '../styles/PollComponent.module.css'

export default function PollComponent({ poll, onVote }) {
  const { data: session } = useSession()
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)

  const handleVote = async (optionKey) => {
    if (!session) {
      alert('로그인 후 투표 가능합니다.')
      return
    }

    if (hasVoted) {
      alert('이미 투표했습니다.')
      return
    }

    setLoading(true)
    setSelectedOption(optionKey)

    try {
      const res = await fetch('/api/polls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: poll._id,
          optionKey,
        }),
      })

      if (res.ok) {
        setHasVoted(true)
        if (onVote) onVote(optionKey)
      } else {
        const error = await res.json()
        alert(error.error || '투표 실패')
      }
    } catch (error) {
      alert('투표 중 오류 발생')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0)

  return (
    <div className={styles.pollContainer}>
      <div className={styles.pollHeader}>
        <h3 className={styles.pollTitle}>{poll.title}</h3>
        {poll.description && <p className={styles.pollDescription}>{poll.description}</p>}
      </div>

      <div className={styles.optionsList}>
        {poll.options.map((option) => {
          const votePercentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0
          const isSelected = selectedOption === option._key

          return (
            <div
              key={option._key}
              className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
              onClick={() => !hasVoted && !loading && handleVote(option._key)}
            >
              <div className={styles.optionBar}>
                <div
                  className={styles.optionFill}
                  style={{ width: `${votePercentage}%` }}
                />
              </div>
              <div className={styles.optionContent}>
                <span className={styles.optionTitle}>{option.title}</span>
                <span className={styles.optionStats}>
                  {option.voteCount || 0}
                  {votePercentage > 0 ? ` (${votePercentage.toFixed(1)}%)` : ''}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.pollFooter}>
        <small className={styles.totalVotes}>총 {totalVotes}명이 투표했습니다</small>
        {hasVoted && <small className={styles.hasVoted}>✅ 투표 완료</small>}
      </div>
    </div>
  )
}
