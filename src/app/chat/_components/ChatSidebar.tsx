'use client'

import NewGroupChatModal from '@/app/find/components/NewGroupChatModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { ChatRoom } from '@/global/stores/useChatStore'
import {
  Bot,
  MessageSquare,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useChatSearchQuery } from '@/global/api/useChatQuery'
import { parseApiDate } from '@/global/lib/date'
import Avatar from "boring-avatars"

type ChatSidebarProps = {
  activeTab: 'direct' | 'group' | 'ai'
  setActiveTab: (tab: 'direct' | 'group' | 'ai') => void
  rooms: ChatRoom[]
  selectedRoomId: string | null
  setSelectedRoomId: (roomId: string | null) => void
}

export default function ChatSidebar({
  activeTab,
  setActiveTab,
  rooms,
  selectedRoomId,
  setSelectedRoomId,
}: ChatSidebarProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')

  const {
    data: searchResults = [],
    isLoading: isSearching,
    isError: isSearchError,
  } = useChatSearchQuery(debouncedTerm, activeTab)

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedTerm(searchTerm.trim()),
      300
    )
    return () => clearTimeout(timer)
  }, [searchTerm])

  const showingSearch = debouncedTerm.length >= 2

  // --- Merge Server Results + Local Matches ---
  const combinedResults = useMemo(() => {
    if (!showingSearch) return []

    const keyword = debouncedTerm.toLowerCase()

    // 1. Local Hits (from loaded rooms)
    const localHits = rooms
      .filter((room) => {
        const name = room.name?.toLowerCase() || ''
        const last = room.lastMessage?.toLowerCase() || ''
        return name.includes(keyword) || last.includes(keyword)
      })
      .map((room) => ({
        messageId: `local-${room.id}`,
        chatRoomId: Number(room.id.split('-')[1]), // "group-123" -> 123
        senderName: room.name, // Approximate sender as room name
        content: room.lastMessage || '',
        createdAt: room.lastMessageTime || new Date().toISOString(), // Use provided time or now
        isLocal: true,
      }))

    // 2. Deduplicate: If server found it, prefer server (has real ID/Date)
    // Simple check: if we have a server hit for this room, and content matches roughly
    const serverHits = searchResults || []
    
    // Filter out local hits that seem to be duplicates of server hits
    // (Optimization: Since server search is full-text and local is just last-message, 
    // it's safer to show BOTH if they differ, but if content is identical, hide local)
    const uniqueLocalHits = localHits.filter(local => {
      return !serverHits.some((server: any) => 
        server.chatRoomId === local.chatRoomId && 
        server.content === local.content
      )
    })

    // 3. Combine and Sort (Newest first)
    // Note: Local hits might have "10:42 PM" as time, Server has ISO.
    // Sorting might be imperfect but putting local (likely recent) at top is a good heuristic if needed.
    // For now, we just append local to server or vice versa.
    // Let's put server results first as they are "deep search", local is "recent/cache".
    // Or actually, user wants "recent messages" to show up. Local IS recent.
    return [...uniqueLocalHits, ...serverHits]
  }, [showingSearch, debouncedTerm, rooms, searchResults])

  // --- 기존의 방 목록 필터링 (검색어 없을 때 로컬 필터링용) ---
  const filteredRooms = useMemo(() => {
    if (showingSearch) return [] // 검색 모드일 땐 서버 결과(searchResults)만 사용
    const keyword = searchTerm.toLowerCase() // debouncedTerm 대신 즉각 반응
    return rooms.filter((room) => {
      const name = room.name?.toLowerCase() || ''
      const last = room.lastMessage?.toLowerCase() || ''
      return name.includes(keyword) || last.includes(keyword)
    })
  }, [rooms, searchTerm, showingSearch])

  const handlePlusClick = () => {
    if (activeTab === 'direct') {
      router.push('/find')
    } else if (activeTab === 'group') {
      setIsDropdownOpen(!isDropdownOpen)
    } else if (activeTab === 'ai') {
      router.push('/find?tab=ai')
    }
  }

  const TabButton = ({
    tabName,
    label,
    Icon,
  }: {
    tabName: 'direct' | 'group' | 'ai'
    label: string
    Icon: React.ElementType
  }) => (
    <button
      onClick={() => {
        router.push('/chat')
        setActiveTab(tabName)
        setIsDropdownOpen(false)
      }}
      className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${
        activeTab === tabName
          ? 'text-emerald-400'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )

  return (
    <>
      <aside
        className="w-1/4 min-w-[300px] max-w-[400px] flex flex-col border-r"
        style={{
          background: 'var(--surface-panel)',
          borderRightColor: 'var(--surface-border-strong)',
        }}
      >
        {/* Header */}
        <div
          className="p-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--surface-border)' }}
        >
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Chat</h1>
            <div className="relative">
              <button
                onClick={handlePlusClick}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Plus size={22} />
              </button>
              {activeTab === 'group' && isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 theme-popover rounded-md z-10">
                  <button
                    onClick={() => {
                      setIsModalOpen(true)
                      setIsDropdownOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--surface-panel-muted)]"
                  >
                    NEW GROUP CHAT
                  </button>
                  <Link
                    href="/find?tab=group"
                    className="block px-4 py-2 text-sm hover:bg-[var(--surface-panel-muted)]"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    FIND GROUP CHAT
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="relative mt-4">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full theme-field rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex-shrink-0 grid grid-cols-3 border-b"
          style={{
            background: 'var(--surface-panel-muted)',
            borderColor: 'var(--surface-border)',
          }}
        >
          <TabButton
            tabName="direct"
            label="1:1 Chat"
            Icon={MessageSquare}
          />
          <TabButton
            tabName="group"
            label="Group Chat"
            Icon={Users}
          />
          <TabButton tabName="ai" label="AI Chat" Icon={Bot} />
        </div>

        {/* Room List OR Search Results */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {isSearching ? (
              <div className="text-sm text-gray-400 px-3 py-2">
                Searching...
              </div>
            ) : isSearchError ? (
              <div className="text-sm text-red-400 px-3 py-2">
                Search failed.
              </div>
            ) : showingSearch ? (
              // --- 검색 결과 리스트 모드 (메시지 단위 표시) ---
              combinedResults.length === 0 ? (
                <div className="text-sm text-gray-400 px-3 py-2">
                  No results found.
                </div>
              ) : (
                combinedResults.map((hit: any) => {
                  // hit: ChatSearchResult
                  const roomIdStr = `${activeTab}-${hit.chatRoomId}`
                  // 해당 메시지의 실제 방 정보(이름, 아바타 등)를 찾기 위해 rooms 리스트 참조
                  const roomInfo = rooms.find((r) => r.id === roomIdStr) || {
                    name: hit.senderName || 'Unknown Room',
                    avatar: '',
                    id: `search-${activeTab}-${hit.chatRoomId}`,
                    type: activeTab,
                  } as ChatRoom

                  // 클릭 시 해당 방으로 이동
                  const href = `/chat/${activeTab}/${hit.chatRoomId}`

                  return (
                    <Link
                      href={href}
                      key={`${hit.messageId}-${hit.chatRoomId}`} // 고유 키 보장
                      className="flex items-start p-3 rounded-lg cursor-pointer transition-colors hover:bg-[var(--surface-panel-muted)]"
                      onClick={() => setSelectedRoomId(roomIdStr)}
                    >
                       <div className="relative mt-1">
                        {/* 검색 결과에서도 아바타 표시 */}
                        {(() => {
                          if (activeTab === 'group') {
                            return (
                              <Avatar
                                size={40}
                            name={roomInfo.topic || roomInfo.name}
                                variant="beam"
                                colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
                              />
                            )
                          }
                          const src = roomInfo.avatar?.trim() ?? ''
                          const isImageAvatar =
                            src.startsWith('http') || src.startsWith('/')
                          
                          if (isImageAvatar) {
                            return (
                              <Image
                                src={src}
                                alt={roomInfo.name}
                                width={40}
                                height={40}
                                unoptimized
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )
                          }
                          return (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold text-white"
                              style={{ background: 'var(--surface-panel-muted)' }}
                            >
                              {src || roomInfo.name?.charAt(0).toUpperCase()}
                            </div>
                          )
                        })()}
                       </div>

                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-sm text-white truncate">
                            {roomInfo.name}
                          </h3>
                          <span className="text-xs text-gray-500">
                             {/* Local hits might have non-standard date formats, handle gracefully */}
                             {(() => {
                               try {
                                 // If it's a simple time string like "10:42 PM", just show it
                                 if (hit.createdAt && hit.createdAt.includes('M') && !hit.createdAt.includes('-')) {
                                   return hit.createdAt
                                 }
                                 return (parseApiDate(hit.createdAt) ?? new Date(hit.createdAt)).toLocaleDateString()
                               } catch {
                                 return ''
                               }
                             })()}
                          </span>
                        </div>
                        
                        {/* 검색된 메시지 내용 표시 */}
                        <p className="text-sm text-emerald-400 truncate mt-0.5">
                          {hit.translatedContent || hit.content}
                        </p>
                        
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                           <span className="truncate max-w-[150px]">
                             Sender: {hit.senderName}
                           </span>
                           {hit.isLocal && (
                             <span className="ml-2 text-[10px] bg-gray-700 text-gray-300 px-1 rounded">
                               Recent
                             </span>
                           )}
                        </div>
                      </div>
                    </Link>
                  )
                })
              )
            ) : (
              // --- 기존 방 목록 모드 ---
              filteredRooms.map((room) => {
                const roomId = room.id
                const roomName = room.name
                const lastMessage = room.lastMessage
                const [type, actualId] = roomId.split('-')
                const href = `/chat/${type}/${actualId}`

                return (
                  <Link
                    href={href}
                    key={roomId}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRoomId === roomId
                        ? 'bg-emerald-600/20'
                        : 'hover:bg-[var(--surface-panel-muted)]'
                    }`}
                    onClick={() => setSelectedRoomId(roomId)}
                  >
                    <div className="relative">
                      {(() => {
                        // 1. For group chats, ALWAYS use boring-avatars based on topic/name
                        if (activeTab === 'group') {
                          return (
                            <Avatar
                              size={48}
                              name={room.topic || roomName}
                              variant="beam"
                              colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
                            />
                          )
                        }

                        const src = room.avatar?.trim() ?? ''
                        const isImageAvatar =
                          src.startsWith('http://') ||
                          src.startsWith('https://') ||
                          src.startsWith('/')

                        if (isImageAvatar) {
                          return (
                            <Image
                              src={src}
                              alt={roomName}
                              width={48}
                              height={48}
                              unoptimized
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )
                        }

                        const fallbackLabel =
                          src || roomName.charAt(0).toUpperCase()

                        return (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold text-white"
                            style={{
                              background: 'var(--surface-panel-muted)',
                            }}
                          >
                            {fallbackLabel}
                          </div>
                        )
                      })()}
                    </div>

                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-white truncate">
                          {roomName}
                        </h3>
                      </div>

                      <div className="flex justify-between items-start">
                        <p className="text-xs text-gray-400 truncate mt-1">
                          {(() => {
                            try {
                              if (!lastMessage) return ''
                              const parsed = JSON.parse(lastMessage)
                              if (parsed.type && parsed.params) {
                                return t(
                                  `chat.system.${parsed.type}`,
                                  parsed.params
                                )
                              }
                              return lastMessage
                            } catch {
                              return lastMessage
                            }
                          })()}
                        </p>

                        {room.type !== 'ai' &&
                        room.unreadCount &&
                        room.unreadCount > 0 ? (
                          <span className="ml-2 mt-1 bg-emerald-500 text-white text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center flex-shrink-0">
                            {room.unreadCount > 99
                              ? '99+'
                              : room.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </aside>

      <NewGroupChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
