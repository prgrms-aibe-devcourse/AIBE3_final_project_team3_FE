"use client";

import Image from "next/image";
import { MemberListItem, MemberSource, getAvatar, getPresenceMeta, resolveIsOnline, resolveProfileImageUrl } from "../_lib/memberUtils";
import { useFindProfileModal } from "./FindProfileProvider";

interface MemberGridProps {
  members?: MemberListItem[];
  source: MemberSource;
}

export default function MemberGrid({ members = [], source }: MemberGridProps) {
  const { openProfile } = useFindProfileModal();

  if (!members.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((user) => {
        const presence = getPresenceMeta(resolveIsOnline(user));
        const interests = Array.isArray(user.interests) ? user.interests : [];
        const description = user.description ?? "소개 정보가 아직 없습니다.";
        const fallbackNickname = user.nickname || "member";
        const avatarSrc = resolveProfileImageUrl(user.profileImageUrl) ?? getAvatar(fallbackNickname);

        return (
          <div
            key={user.id}
            className="bg-gray-800 border border-gray-600 rounded-lg p-6 hover:border-emerald-500 transition-all duration-300 cursor-pointer"
            onClick={() => openProfile(user, source)}
          >
            <div className="flex items-center mb-4">
              <div className="relative w-16 h-16">
                <Image
                  src={avatarSrc}
                  alt={user.nickname || "사용자 아바타"}
                  width={64}
                  height={64}
                  unoptimized
                  className="rounded-full object-cover w-16 h-16"
                />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-gray-800 rounded-full ${presence.badgeClass}`}></div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">{user.nickname}</h3>
                <p className="text-gray-400 text-sm">{user.country ?? "-"}</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-3 line-clamp-2">{description}</p>

            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 mb-1">INTERESTS</p>
              <div className="flex flex-wrap gap-1">
                {interests.slice(0, 3).map((interest, index) => (
                  <span
                    key={`${user.id}-interest-${index}`}
                    className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-full"
                  >
                    {interest.trim()}
                  </span>
                ))}
                {interests.length === 0 && (
                  <span className="text-xs text-gray-400">등록된 관심사가 없습니다.</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
