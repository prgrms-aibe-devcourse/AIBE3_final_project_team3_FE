'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCreatePostMutation } from '@/global/api/usePostQuery';

export default function WritePostPage() {
  const router = useRouter();
  const createPostMutation = useCreatePostMutation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files);
    setImages([...images, ...newImages]);

    // 미리보기 URL 생성
    const newPreviewUrls = newImages.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    
    // 이전 URL 해제
    URL.revokeObjectURL(previewUrls[index]);
    
    setImages(newImages);
    setPreviewUrls(newPreviewUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      const result = await createPostMutation.mutateAsync({
        title,
        content,
        images,
      });
      
      if (result) {
        router.push(`/board/${result.id}`);
      }
    } catch (error) {
      alert('게시글 작성에 실패했습니다.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-4">
        <Link href="/board" className="text-blue-600 hover:text-blue-800">
          ← 목록으로
        </Link>
      </div>

      <div className="border rounded-lg p-8" style={{ background: 'var(--surface-panel)', borderColor: 'var(--surface-border)' }}>
        <h1 className="text-3xl font-bold mb-6">게시글 작성</h1>

        <form onSubmit={handleSubmit}>
          {/* 제목 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
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
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
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
            <label className="block text-sm font-semibold mb-2">이미지</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* 이미지 미리보기 */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative h-32 rounded-lg overflow-hidden border">
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 justify-end">
            <Link
              href="/board"
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={createPostMutation.isPending}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {createPostMutation.isPending ? '작성 중...' : '작성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
