"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import CommunityHeader from "@/app/components/community/CommunityHeader";
import CommunityFilters from "@/app/components/community/CommunityFilters";
import CreatePost from "@/app/components/community/CreatePost";
import PostCard from "@/app/components/community/PostCard";
import TeamPanel from "@/app/components/community/TeamPanel";
import CommunityStatus from "@/app/components/community/CommunityStatus";
import { TEAM_MEMBERS, COMMUNITY_STATS } from "@/app/lib/community-data";
import { api } from "@/app/services/api";
import { API_BASE_URL } from "@/app/lib/constants";

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchPosts = async () => {
    try {
      const res = await api.posts.getAll(20, 0);
      if (res.success) {
        setPosts(res.data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Connect to Socket.IO
    const socketInstance = io(API_BASE_URL);
    setSocket(socketInstance);

    // Listen for real-time events
    socketInstance.on('post:liked', ({ postId, likeCount, userId }) => {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            // Check if current user liked it
            const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('ps_user_id') : null;
            const isCurrentUser = currentUserId && parseInt(currentUserId) === userId;
            
            return {
              ...post,
              _count: { ...post._count, likes: likeCount },
              isLikedByUser: isCurrentUser ? true : post.isLikedByUser,
            };
          }
          return post;
        })
      );
    });

    socketInstance.on('post:unliked', ({ postId, likeCount, userId }) => {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            // Check if current user unliked it
            const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('ps_user_id') : null;
            const isCurrentUser = currentUserId && parseInt(currentUserId) === userId;
            
            return {
              ...post,
              _count: { ...post._count, likes: likeCount },
              isLikedByUser: isCurrentUser ? false : post.isLikedByUser,
            };
          }
          return post;
        })
      );
    });

    socketInstance.on('post:created', (newPost) => {
      setPosts(prevPosts => [newPost, ...prevPosts]);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <>
      <CommunityHeader onPostCreated={fetchPosts} />
      <CommunityFilters />

      {/* Main layout: Posts (left) + Sidebar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-start">

        {/* Left — Posts */}
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>
              No posts yet. Be the first to post!
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
            ))
          )}
        </div>

        {/* Right — Team Panel + Community Status */}
        <div className="flex flex-col gap-4">
          <TeamPanel members={TEAM_MEMBERS} />
          <CommunityStatus stats={COMMUNITY_STATS} />
        </div>

      </div>
    </>
  );
}
