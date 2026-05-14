import type { ApiNotification } from "@/app/services/api";

/**
 * Resolves a notification to the URL the user should land on after tapping it.
 *
 * Mapping mirrors how the backend stores entityType/entityId/teamId in
 * createNotification() — POST_* and COMMENT_REPLIED carry entityType='post'
 * with the postId; TEAM_* carry teamId; USER_FOLLOWED / FOLLOW_REQUEST_*
 * carry entityType='user' with the actor's user id; H2H_* and CHALLENGE_*
 * route to their hub pages since there's no per-entity detail route.
 *
 * Returns null when there's nothing useful to navigate to.
 */
export function getNotificationHref(n: ApiNotification): string | null {
  const data = (n.data || {}) as Record<string, any>;

  switch (n.type) {
    case "POST_LIKED":
    case "POST_COMMENTED":
    case "COMMENT_REPLIED":
    case "POST_RESHARED":
    case "TEAM_POST_CREATED": {
      const postId = n.entityId ?? data.postId;
      return postId ? `/post/${postId}` : null;
    }

    case "USER_FOLLOWED":
    case "FOLLOW_REQUEST_RECEIVED":
    case "FOLLOW_REQUEST_ACCEPTED": {
      const userId = n.entityId ?? n.actor?.id;
      return userId ? `/user/${userId}` : null;
    }

    case "TEAM_INVITED":
    case "TEAM_JOIN_REQUEST":
    case "TEAM_JOIN_APPROVED":
    case "TEAM_JOIN_REJECTED":
    case "TEAM_ROLE_CHANGED":
    case "TEAM_REMOVED": {
      const teamId = n.teamId ?? n.entityId;
      return teamId ? `/team/${teamId}` : null;
    }

    case "H2H_CHALLENGE_FIELD_AVAILABLE": {
      // Field is ready — drop the user straight into team selection.
      const challengeId = n.entityId ?? data.challengeId;
      return challengeId ? `/head-to-head/${challengeId}/select-team` : "/head-to-head";
    }

    case "H2H_CHALLENGE_RECEIVED":
    case "H2H_CHALLENGE_ACCEPTED":
    case "H2H_CHALLENGE_DECLINED":
    case "H2H_CHALLENGE_CANCELLED":
    case "H2H_CHALLENGE_OPPONENT_LOCKED":
    case "H2H_CHALLENGE_RESULT":
      return "/head-to-head";

    case "CHALLENGE_UNLOCKED":
      return "/achievements";

    default:
      return null;
  }
}
