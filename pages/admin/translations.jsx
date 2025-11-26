import { useState, useEffect } from 'react'
import Head from 'next/head'
import styles from './translations.module.css'

export default function TranslationsAdminPage() {
  const [stats, setStats] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminSecret, setAdminSecret] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/translation/health')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats', error)
    }
  }

  const fetchSuggestions = async () => {
    if (!adminSecret) return
    try {
      const res = await fetch(`/api/translation/queue?secret=${adminSecret}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions || [])
        setAuthenticated(true)
      } else {
        setAuthenticated(false)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSuggestionStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/translation/queue?secret=${encodeURIComponent(adminSecret)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        fetchSuggestions()
      }
    } catch (error) {
      console.error('Failed to update suggestion', error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleAuth = (e) => {
    e.preventDefault()
    fetchSuggestions()
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Translation Admin Dashboard</title>
      </Head>

      <h1>Translation System Dashboard</h1>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <h2>System Stats</h2>
        {stats ? (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Status</h3>
              <p className={stats.ok ? styles.statusOk : styles.statusError}>
                {stats.ok ? '✓ Operational' : '✗ Issues Detected'}
              </p>
            </div>
            <div className={styles.statCard}>
              <h3>Supported Languages</h3>
              <p>{stats.languageCount || 'N/A'}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Cache Size</h3>
              <p>{stats.cache?.size || 0} entries</p>
            </div>
            <div className={styles.statCard}>
              <h3>Cache Hit Rate</h3>
              <p>{stats.cache?.hitRate ? `${(stats.cache.hitRate * 100).toFixed(1)}%` : 'N/A'}</p>
            </div>
          </div>
        ) : (
          <p>Loading stats...</p>
        )}
      </section>

      {/* Suggestions Queue Section */}
      <section className={styles.queueSection}>
        <h2>Community Translation Suggestions</h2>

        {!authenticated ? (
          <form onSubmit={handleAuth} className={styles.authForm}>
            <input
              type="password"
              placeholder="Admin Secret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              className={styles.input}
            />
            <button type="submit" className={styles.button}>
              Authenticate
            </button>
          </form>
        ) : (
          <>
            <button onClick={fetchSuggestions} className={styles.button}>
              Refresh Queue
            </button>

            {loading ? (
              <p>Loading suggestions...</p>
            ) : suggestions.length === 0 ? (
              <p>No suggestions yet.</p>
            ) : (
              <div className={styles.suggestionsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Original</th>
                      <th>Suggested</th>
                      <th>Lang</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id.slice(-8)}</td>
                        <td className={styles.textCell}>{s.originalText.slice(0, 50)}...</td>
                        <td className={styles.textCell}>{s.suggestedTranslation.slice(0, 50)}...</td>
                        <td>
                          {s.sourceLang} → {s.targetLang}
                        </td>
                        <td>{new Date(s.submittedAt).toLocaleDateString()}</td>
                        <td>
                          <span className={styles[`status${s.status}`]}>{s.status}</span>
                        </td>
                        <td>
                          {s.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateSuggestionStatus(s.id, 'approved')}
                                className={styles.approveBtn}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateSuggestionStatus(s.id, 'rejected')}
                                className={styles.rejectBtn}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
