import { 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  serverTimestamp, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { CodingFile, UserProfile } from '../types';

export interface Collaborator {
  id: string;
  username: string;
  displayName: string;
  photoURL?: string;
  color: string;
  activeFileId: string;
  activeFileName?: string;
  cursor?: {
    line: number;
    ch: number;
    index: number;
  };
  selection?: {
    start: number;
    end: number;
  };
  isTyping?: boolean;
  lastActive: number;
}

export interface CollabChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderAvatar?: string;
  text: string;
  timestamp: number;
}

export interface CollabRoomData {
  roomId: string;
  title: string;
  hostId: string;
  hostName: string;
  files: CodingFile[];
  collaborators: Record<string, Collaborator>;
  messages: CollabChatMessage[];
  lastUpdated: number;
  activeEditorId?: string;
}

const COLLAB_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#e11d48', // Rose
];

export function getRandomCollabColor(seed?: string): string {
  if (!seed) return COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

export function generateCollabRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'LEM-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Real-time Collaboration Manager
 * Supports multi-user simultaneous editing with Firebase Firestore + BroadcastChannel fallback
 */
export class CollabSessionManager {
  private roomId: string;
  private currentUser: UserProfile;
  private userColor: string;
  private broadcastChannel: BroadcastChannel | null = null;
  private unsubscribeFirestore: (() => void) | null = null;
  private heartbeatInterval: any = null;
  private onStateChangeCallback: ((room: CollabRoomData) => void) | null = null;
  private currentRoomState: CollabRoomData;
  private isDestroyed: boolean = false;

  constructor(
    roomId: string,
    user: UserProfile,
    initialFiles: CodingFile[],
    onStateChange: (room: CollabRoomData) => void
  ) {
    this.roomId = roomId.toUpperCase().trim();
    this.currentUser = user;
    this.userColor = getRandomCollabColor(user.uid || user.username);
    this.onStateChangeCallback = onStateChange;

    this.currentRoomState = {
      roomId: this.roomId,
      title: `Collaboration Room ${this.roomId}`,
      hostId: user.uid,
      hostName: user.displayName || user.username || 'Developer',
      files: initialFiles,
      collaborators: {},
      messages: [],
      lastUpdated: Date.now(),
    };

    this.initSession(initialFiles);
  }

  private initSession(initialFiles: CodingFile[]) {
    // 1. Setup local BroadcastChannel for zero-latency multi-tab sync
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(`lemai_collab_${this.roomId}`);
        this.broadcastChannel.onmessage = (event) => {
          if (this.isDestroyed) return;
          const { type, payload } = event.data;
          this.handleBroadcastMessage(type, payload);
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel not supported:', err);
    }

    // 2. Setup Firebase Firestore realtime sync
    this.connectFirestore(initialFiles);

    // 3. Start Heartbeat (presence update every 4 seconds)
    this.sendPresence(this.currentRoomState.files[0]?.id || 'html-1');
    this.heartbeatInterval = setInterval(() => {
      if (this.isDestroyed) return;
      this.sendPresence(this.currentCollaboratorData?.activeFileId || 'html-1');
      this.cleanupStaleCollaborators();
    }, 4000);
  }

  private get currentCollaboratorData(): Collaborator {
    return {
      id: this.currentUser.uid,
      username: this.currentUser.username || 'developer',
      displayName: this.currentUser.displayName || this.currentUser.username || 'Developer',
      photoURL: this.currentUser.photoURL,
      color: this.userColor,
      activeFileId: this.currentRoomState.files[0]?.id || 'html-1',
      activeFileName: this.currentRoomState.files[0]?.name || 'index.html',
      lastActive: Date.now(),
    };
  }

  private async connectFirestore(initialFiles: CodingFile[]) {
    try {
      const roomRef = doc(db, 'lemai_collab_rooms', this.roomId);
      
      // Check if room exists
      const snap = await getDoc(roomRef);
      if (!snap.exists()) {
        const initialData: CollabRoomData = {
          roomId: this.roomId,
          title: `LemAI Room ${this.roomId}`,
          hostId: this.currentUser.uid,
          hostName: this.currentUser.displayName || this.currentUser.username || 'Developer',
          files: initialFiles,
          collaborators: {
            [this.currentUser.uid]: this.currentCollaboratorData,
          },
          messages: [
            {
              id: `msg-init-${Date.now()}`,
              senderId: 'system',
              senderName: 'LemAI System',
              senderColor: '#10b981',
              text: `Room ${this.roomId} created. Share code to start real-time paired programming.`,
              timestamp: Date.now(),
            },
          ],
          lastUpdated: Date.now(),
        };

        try {
          await setDoc(roomRef, initialData);
        } catch (e) {
          console.warn('Firestore room initial write:', e);
        }
      }

      // Realtime listener
      this.unsubscribeFirestore = onSnapshot(
        roomRef,
        (docSnap) => {
          if (!docSnap.exists() || this.isDestroyed) return;
          const data = docSnap.data() as CollabRoomData;
          if (data) {
            // Merge remote state while preserving local presence freshness
            this.mergeRemoteState(data);
          }
        },
        (error) => {
          console.warn('Firestore collab listener notice (using peer fallback):', error.message);
        }
      );
    } catch (error) {
      console.warn('Collab Firestore connection notice:', error);
    }
  }

  private mergeRemoteState(incoming: CollabRoomData) {
    const updatedCollaborators = {
      ...incoming.collaborators,
      [this.currentUser.uid]: {
        ...this.currentCollaboratorData,
        ...this.currentRoomState.collaborators[this.currentUser.uid],
        lastActive: Date.now(),
      },
    };

    this.currentRoomState = {
      ...incoming,
      collaborators: updatedCollaborators,
      files: incoming.files || this.currentRoomState.files,
      messages: incoming.messages || this.currentRoomState.messages,
      lastUpdated: incoming.lastUpdated || Date.now(),
    };

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.currentRoomState);
    }
  }

  private handleBroadcastMessage(type: string, payload: any) {
    if (type === 'PRESENCE') {
      const { collaborator } = payload;
      if (collaborator.id === this.currentUser.uid) return;

      this.currentRoomState.collaborators[collaborator.id] = {
        ...collaborator,
        lastActive: Date.now(),
      };
      this.notifyUpdate();
    } else if (type === 'FILE_UPDATE') {
      const { fileId, content, senderId, senderName } = payload;
      if (senderId === this.currentUser.uid) return;

      const targetIdx = this.currentRoomState.files.findIndex((f) => f.id === fileId);
      if (targetIdx !== -1) {
        this.currentRoomState.files[targetIdx].content = content;
        this.currentRoomState.lastUpdated = Date.now();
        this.currentRoomState.activeEditorId = senderId;
        this.notifyUpdate();
      }
    } else if (type === 'FILES_SYNC') {
      const { files, senderId } = payload;
      if (senderId === this.currentUser.uid) return;
      this.currentRoomState.files = files;
      this.currentRoomState.lastUpdated = Date.now();
      this.notifyUpdate();
    } else if (type === 'CURSOR_MOVE') {
      const { userId, fileId, cursor, selection, isTyping } = payload;
      if (userId === this.currentUser.uid) return;

      if (this.currentRoomState.collaborators[userId]) {
        this.currentRoomState.collaborators[userId].cursor = cursor;
        this.currentRoomState.collaborators[userId].selection = selection;
        this.currentRoomState.collaborators[userId].activeFileId = fileId;
        this.currentRoomState.collaborators[userId].isTyping = isTyping;
        this.currentRoomState.collaborators[userId].lastActive = Date.now();
        this.notifyUpdate();
      }
    } else if (type === 'CHAT_MESSAGE') {
      const { message } = payload;
      if (!this.currentRoomState.messages.some((m) => m.id === message.id)) {
        this.currentRoomState.messages.push(message);
        this.notifyUpdate();
      }
    }
  }

  private notifyUpdate() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ ...this.currentRoomState });
    }
  }

  public sendPresence(activeFileId: string, cursor?: { line: number; ch: number; index: number }, isTyping = false) {
    const activeFile = this.currentRoomState.files.find((f) => f.id === activeFileId);
    const collab: Collaborator = {
      id: this.currentUser.uid,
      username: this.currentUser.username || 'developer',
      displayName: this.currentUser.displayName || this.currentUser.username || 'Developer',
      photoURL: this.currentUser.photoURL,
      color: this.userColor,
      activeFileId,
      activeFileName: activeFile?.name || 'index.html',
      cursor,
      isTyping,
      lastActive: Date.now(),
    };

    this.currentRoomState.collaborators[this.currentUser.uid] = collab;

    // Broadcast locally
    this.broadcastChannel?.postMessage({
      type: 'PRESENCE',
      payload: { collaborator: collab },
    });

    // Update Firestore presence
    try {
      const roomRef = doc(db, 'lemai_collab_rooms', this.roomId);
      updateDoc(roomRef, {
        [`collaborators.${this.currentUser.uid}`]: collab,
        lastUpdated: Date.now(),
      }).catch(() => {});
    } catch {}
  }

  public updateFileContent(fileId: string, newContent: string) {
    const targetIdx = this.currentRoomState.files.findIndex((f) => f.id === fileId);
    if (targetIdx === -1) return;

    this.currentRoomState.files[targetIdx].content = newContent;
    this.currentRoomState.lastUpdated = Date.now();
    this.currentRoomState.activeEditorId = this.currentUser.uid;

    // Broadcast file change locally
    this.broadcastChannel?.postMessage({
      type: 'FILE_UPDATE',
      payload: {
        fileId,
        content: newContent,
        senderId: this.currentUser.uid,
        senderName: this.currentUser.displayName || this.currentUser.username,
      },
    });

    // Sync to Firestore
    try {
      const roomRef = doc(db, 'lemai_collab_rooms', this.roomId);
      updateDoc(roomRef, {
        files: this.currentRoomState.files,
        lastUpdated: Date.now(),
        activeEditorId: this.currentUser.uid,
      }).catch(() => {});
    } catch {}

    this.notifyUpdate();
  }

  public syncAllFiles(files: CodingFile[]) {
    this.currentRoomState.files = files;
    this.currentRoomState.lastUpdated = Date.now();

    this.broadcastChannel?.postMessage({
      type: 'FILES_SYNC',
      payload: {
        files,
        senderId: this.currentUser.uid,
      },
    });

    try {
      const roomRef = doc(db, 'lemai_collab_rooms', this.roomId);
      updateDoc(roomRef, {
        files,
        lastUpdated: Date.now(),
      }).catch(() => {});
    } catch {}

    this.notifyUpdate();
  }

  public updateCursor(fileId: string, cursor: { line: number; ch: number; index: number }, isTyping = false) {
    this.sendPresence(fileId, cursor, isTyping);

    this.broadcastChannel?.postMessage({
      type: 'CURSOR_MOVE',
      payload: {
        userId: this.currentUser.uid,
        fileId,
        cursor,
        isTyping,
      },
    });
  }

  public sendChatMessage(text: string) {
    if (!text.trim()) return;
    const msg: CollabChatMessage = {
      id: `collab-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: this.currentUser.uid,
      senderName: this.currentUser.displayName || this.currentUser.username || 'Developer',
      senderColor: this.userColor,
      senderAvatar: this.currentUser.photoURL,
      text: text.trim(),
      timestamp: Date.now(),
    };

    this.currentRoomState.messages.push(msg);

    this.broadcastChannel?.postMessage({
      type: 'CHAT_MESSAGE',
      payload: { message: msg },
    });

    try {
      const roomRef = doc(db, 'lemai_collab_rooms', this.roomId);
      updateDoc(roomRef, {
        messages: this.currentRoomState.messages,
        lastUpdated: Date.now(),
      }).catch(() => {});
    } catch {}

    this.notifyUpdate();
  }

  private cleanupStaleCollaborators() {
    const now = Date.now();
    let changed = false;

    Object.keys(this.currentRoomState.collaborators).forEach((userId) => {
      if (userId === this.currentUser.uid) return;
      const collab = this.currentRoomState.collaborators[userId];
      if (now - collab.lastActive > 25000) {
        delete this.currentRoomState.collaborators[userId];
        changed = true;
      }
    });

    if (changed) {
      this.notifyUpdate();
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.unsubscribeFirestore) this.unsubscribeFirestore();
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }
}
