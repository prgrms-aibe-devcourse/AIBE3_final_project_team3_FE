import { useInviteMemberMutation } from "@/global/api/useChatQuery";
import { useFriendsQuery } from "@/global/api/useMemberQuery";
import { ChatRoomMember } from "@/global/types/chat.types";
import { Check, Search, UserPlus, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface InviteFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  existingMembers: ChatRoomMember[];
}

export default function InviteFriendModal({ isOpen, onClose, roomId, existingMembers }: InviteFriendModalProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: friendsPage, isLoading } = useFriendsQuery({ page: 0, size: 100 }); // Load up to 100 friends for now
  const { mutate: inviteMember, isPending } = useInviteMemberMutation();
  const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const friends = friendsPage?.items || [];
  const existingMemberIds = new Set(existingMembers.map(m => m.id));

  const filteredFriends = friends.filter(friend =>
    friend.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInvite = (friendId: number) => {
    inviteMember(
      { roomId, targetMemberId: friendId },
      {
        onSuccess: () => {
          setInvitedIds(prev => {
            const next = new Set(prev);
            next.add(friendId);
            return next;
          });
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center theme-overlay backdrop-blur-sm p-4">
      <div className="rounded-xl shadow-xl w-full max-w-md theme-surface flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--surface-border)" }}>
          <h2 className="text-lg font-semibold text-white">{t('chat.ui.invite_friend_title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b" style={{ borderColor: "var(--surface-border)" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={t('chat.ui.search_friend_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full theme-field pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">{t('chat.ui.loading_friends')}</div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? t('chat.ui.no_search_results') : t('chat.ui.no_friends_list')}
            </div>
          ) : (
            filteredFriends.map((friend) => {
              const isAlreadyMember = existingMemberIds.has(friend.id);
              const isInvited = invitedIds.has(friend.id);

              return (
                <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg transition-colors group hover:bg-[var(--surface-panel-muted)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden" style={{ background: "var(--surface-panel-muted)" }}>
                      {friend.profileImageUrl ? (
                        <Image
                          src={friend.profileImageUrl}
                          alt={friend.nickname}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-medium">
                          {friend.nickname.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-200 truncate">{friend.nickname}</p>
                      {friend.description && (
                        <p className="text-xs text-gray-500 truncate">{friend.description}</p>
                      )}
                    </div>
                  </div>

                  {isAlreadyMember ? (
                    <span className="text-xs text-gray-500 font-medium px-3 py-1.5 rounded-md" style={{ background: "var(--surface-panel-muted)" }}>
                      {t('chat.ui.already_joined')}
                    </span>
                  ) : isInvited ? (
                    <span className="flex items-center text-emerald-400 font-medium px-3 py-1.5">
                      <Check size={16} className="mr-1" /> {t('chat.ui.invited')}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleInvite(friend.id)}
                      disabled={isPending}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlus size={16} />
                      {t('chat.ui.invite_button')}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
