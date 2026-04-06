/**
 * mcBridge — Core Pathways ↔ Mission Control bidirectional bridge.
 *
 * Two message contracts:
 *
 *   1. Course → Task linking
 *      Mission Control (while creating/editing a Task) posts:
 *        { type: "pflx_course_list_request" }
 *      Core Pathways responds with:
 *        { type: "pflx_course_list_response", courses: Course[] }
 *      MC stores the selected courseId on the Task, then at completion
 *      time posts:
 *        { type: "pflx_course_mark_complete", courseId, playerId }
 *      Core Pathways marks the node completed for that player.
 *
 *   2. Project → Node publishing
 *      Mission Control (from the Projects panel) posts:
 *        { type: "pflx_project_publish_node",
 *          pathwayId, project: Project, position?: {x,y} }
 *      Core Pathways creates a new node inside the given pathway that
 *      references the project and posts back:
 *        { type: "pflx_project_node_created", projectId, nodeId, pathwayId }
 *
 * This file lives on the Core Pathways side. A mirror (mcBridgeHost.ts)
 * lives inside the Overlay shell's preview.html Mission Control code.
 */

export type Course = {
  id: string;
  pathwayId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  checkpointIds: string[];
};

export type ProjectPublishPayload = {
  projectId: string;
  title: string;
  description: string;
  ownerUserId: string | null;
  requiredSkills: string[];
  rewardXC: number;
  rewardBadges: string[];
};

type MCBridgeMessage =
  | { type: "pflx_course_list_request" }
  | { type: "pflx_course_list_response"; courses: Course[] }
  | { type: "pflx_course_mark_complete"; courseId: string; playerId: string }
  | {
      type: "pflx_project_publish_node";
      pathwayId: string;
      project: ProjectPublishPayload;
      position?: { x: number; y: number };
    }
  | {
      type: "pflx_project_node_created";
      projectId: string;
      nodeId: string;
      pathwayId: string;
    };

/**
 * Install the listener inside the Core Pathways app. Call once from a
 * top-level client component (e.g. a useEffect in the pathway page).
 *
 * @param handlers — implementation-specific callbacks; each one should
 *                   touch the app's local state / persistence layer.
 */
export function installMCBridge(handlers: {
  getCourses: () => Course[];
  markCourseComplete: (courseId: string, playerId: string) => void;
  createNodeFromProject: (
    pathwayId: string,
    project: ProjectPublishPayload,
    position?: { x: number; y: number }
  ) => { nodeId: string };
}) {
  function handleMessage(ev: MessageEvent) {
    try {
      const msg: MCBridgeMessage =
        typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
      if (!msg || typeof msg !== "object") return;

      switch (msg.type) {
        case "pflx_course_list_request": {
          const courses = handlers.getCourses();
          replyTo(ev, { type: "pflx_course_list_response", courses });
          break;
        }
        case "pflx_course_mark_complete": {
          handlers.markCourseComplete(msg.courseId, msg.playerId);
          break;
        }
        case "pflx_project_publish_node": {
          const { nodeId } = handlers.createNodeFromProject(
            msg.pathwayId,
            msg.project,
            msg.position
          );
          replyTo(ev, {
            type: "pflx_project_node_created",
            projectId: msg.project.projectId,
            nodeId,
            pathwayId: msg.pathwayId,
          });
          break;
        }
      }
    } catch {
      // ignore non-JSON
    }
  }

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}

function replyTo(ev: MessageEvent, msg: MCBridgeMessage) {
  const target = ev.source as Window | null;
  if (target && target.postMessage) {
    try {
      target.postMessage(JSON.stringify(msg), "*");
    } catch {}
  }
  // Also broadcast to parent shell in case MC lives there
  if (window.parent !== window) {
    try {
      window.parent.postMessage(JSON.stringify(msg), "*");
    } catch {}
  }
}

/**
 * Convenience helpers for the Mission Control side (call from preview.html
 * or X-Coin's task-management page).
 */
export const MCBridge = {
  requestCourses(target: Window) {
    target.postMessage(JSON.stringify({ type: "pflx_course_list_request" }), "*");
  },
  publishProject(
    target: Window,
    pathwayId: string,
    project: ProjectPublishPayload,
    position?: { x: number; y: number }
  ) {
    target.postMessage(
      JSON.stringify({
        type: "pflx_project_publish_node",
        pathwayId,
        project,
        position,
      }),
      "*"
    );
  },
};
