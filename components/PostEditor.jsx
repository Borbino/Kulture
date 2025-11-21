import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import styles from './PostEditor.module.css';

export default function PostEditor({ boardId = null, initialData = null, onSuccess }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    body: initialData?.body || '',
    boardId: boardId || initialData?.board?._id || '',
    categoryIds: initialData?.categories?.map(c => c._id) || [],
    tags: initialData?.tags || [],
    isAnonymous: initialData?.isAnonymous || false,
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!session) {
      alert('로그인이 필요합니다.');
      router.push('/auth/signin');
      return;
    }

    if (!formData.title || !formData.body || !formData.boardId) {
      alert('제목, 내용, 게시판을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const url = initialData ? '/api/posts' : '/api/posts';
      const method = initialData ? 'PATCH' : 'POST';
      
      const payload = initialData 
        ? { postId: initialData._id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save post');
      }

      alert(initialData ? '게시글이 수정되었습니다.' : '게시글이 작성되었습니다.');
      
      if (onSuccess) {
        onSuccess(data.post);
      } else {
        router.push(`/post/${data.post.slug.current}`);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <form className={styles.editor} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label>제목</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="제목을 입력하세요"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>내용</label>
        <textarea
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          placeholder="내용을 입력하세요"
          rows={15}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>태그</label>
        <div className={styles.tagInput}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="태그 입력 후 Enter"
          />
          <button type="button" onClick={handleAddTag}>추가</button>
        </div>
        <div className={styles.tags}>
          {formData.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
              <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={formData.isAnonymous}
            onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
          />
          익명으로 작성
        </label>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={() => router.back()} disabled={loading}>
          취소
        </button>
        <button type="submit" disabled={loading}>
          {loading ? '저장 중...' : (initialData ? '수정' : '작성')}
        </button>
      </div>
    </form>
  );
}
