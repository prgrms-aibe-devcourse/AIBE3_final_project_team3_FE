'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePostQuery, useUpdatePostMutation } from '@/global/api/usePostQuery';

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { t } = useLanguage();
  const { id } = use(params);
  const postId = parseInt(id);
  const router = useRouter();
  const { data: post, isLoading } = usePostQuery(postId);
  const updatePostMutation = useUpdatePostMutation(postId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [removeExistingImages, setRemoveExistingImages] = useState(false);

  const originalHadImages = (post?.imageUrls?.length ?? 0) > 0;
  const hasNewImages = images.length > 0;
  const willRemoveExistingImages = originalHadImages && (removeExistingImages || hasNewImages);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setPreviewUrls(post.imageUrls || []);
      setImages([]);
      setRemoveExistingImages(false);
    }
  }, [post]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files);
    setImages((prev) => [...prev, ...newImages]);

    // 미리보기 URL 생성
    const newPreviewUrls = newImages.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

    // 같은 파일을 다시 선택할 수 있도록 초기화
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const url = previewUrls[index];
    
    // 기존 이미지는 백엔드 스펙상 전체 삭제(removeImages)만 지원하므로 개별 삭제하지 않습니다.
    if (url.startsWith('http')) return;

    // 새로 추가한 이미지인 경우
    // previewUrls는 기존(http) + 새(blob) 섞여있어서 index가 images와 1:1이 아님
    const newImageIndex = previewUrls
      .slice(0, index)
      .filter((u) => !u.startsWith('http')).length;
    const newImages = images.filter((_, i) => i !== newImageIndex);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);

    // 이전 URL 해제
    URL.revokeObjectURL(url);

    setImages(newImages);
    setPreviewUrls(newPreviewUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert(t('board.edit.alerts.titleRequired'));
      return;
    }

    if (!content.trim()) {
      alert(t('board.edit.alerts.contentRequired'));
      return;
    }

    if (!post) {
      alert(t('board.edit.alerts.loadFailed'));
      return;
    }

    try {
      const removeImages = willRemoveExistingImages;

      await updatePostMutation.mutateAsync({
        title,
        content,
        removeImages,
        images: images.length > 0 ? images : undefined,
      });
      
      router.push(`/board/${postId}`);
    } catch (error) {
      alert(t('board.edit.alerts.updateFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">{t('board.detail.loading')}</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-500">{t('board.detail.error')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-4">
        <Link href={`/board/${postId}`} className="text-blue-600 hover:text-blue-800">
          {t('board.edit.back')}
        </Link>
      </div>

      <div className="border rounded-lg p-8" style={{ background: 'var(--surface-panel)', borderColor: 'var(--surface-border)' }}>
        <h1 className="text-3xl font-bold mb-6">{t('board.edit.title')}</h1>

        <form onSubmit={handleSubmit}>
          {/* 제목 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              {t('board.edit.fields.title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('board.edit.placeholders.title')}
              maxLength={255}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-sm text-gray-500 mt-1">
              {title.length} / 255
            </div>
          </div>

          {/* 내용 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              {t('board.edit.fields.content')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('board.edit.placeholders.content')}
              maxLength={10000}
              rows={15}
              className="w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-sm text-gray-500 mt-1">
              {content.length} / 10,000
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">{t('board.edit.fields.images')}</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {originalHadImages && !hasNewImages && (
              <label className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--page-text)' }}>
                <input
                  type="checkbox"
                  checked={removeExistingImages}
                  onChange={(e) => setRemoveExistingImages(e.target.checked)}
                />
                {t('board.edit.images.removeAllLabel')}
              </label>
            )}

            {hasNewImages ? (
              <div className="mt-2 text-sm text-gray-500">
                {t('board.edit.images.replaceNotice')}
              </div>
            ) : removeExistingImages ? (
              <div className="mt-2 text-sm text-gray-500">
                {t('board.edit.images.removeAllNotice')}
              </div>
            ) : null}
            
            {/* 이미지 미리보기 */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {previewUrls.map((url, index) => {
                  const isExistingImage = url.startsWith('http');
                  const isMarkedForRemoval = willRemoveExistingImages && isExistingImage;
                  return (
                    <div
                      key={`${url}-${index}`}
                      className={`relative h-32 rounded-lg overflow-hidden border ${isMarkedForRemoval ? 'opacity-60' : ''}`}
                    >
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-contain"
                      />
                      {isMarkedForRemoval && (
                        <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-2 py-1 rounded">
                          {t('board.edit.images.pendingRemovalBadge')}
                        </div>
                      )}
                      {!url.startsWith('http') && (
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 justify-end">
            <Link
              href={`/board/${postId}`}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              {t('board.edit.cancel')}
            </Link>
            <button
              type="submit"
              disabled={updatePostMutation.isPending}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {updatePostMutation.isPending ? t('board.edit.submitting') : t('board.edit.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
