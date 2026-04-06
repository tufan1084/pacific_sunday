import CommunityHeader from "@/app/components/community/CommunityHeader";
import CommunityFilters from "@/app/components/community/CommunityFilters";
import PostCard from "@/app/components/community/PostCard";
import TeamPanel from "@/app/components/community/TeamPanel";
import CommunityStatus from "@/app/components/community/CommunityStatus";
import { COMMUNITY_POSTS, TEAM_MEMBERS, COMMUNITY_STATS } from "@/app/lib/community-data";

export default function CommunityPage() {
  return (
    <>
      <CommunityHeader />
      <CommunityFilters />

      {/* Main layout: Posts (left) + Sidebar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-start">

        {/* Left — Posts */}
        <div>
          {COMMUNITY_POSTS.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
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
