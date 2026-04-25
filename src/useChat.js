import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import useSound from "use-sound";
import { API_BASE_URL, WS_BASE_URL } from "./config";

const buildRoomId = (userA, userB) => {
  return [userA.trim().toLowerCase(), userB.trim().toLowerCase()]
    .sort()
    .join("__");
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

async function deriveKey(secretKey, roomId) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secretKey),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: textEncoder.encode(roomId),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function encryptQuantumVeil(plainText, secretKey, roomId) {
  if (!plainText) return plainText;

  const key = await deriveKey(secretKey, roomId);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(plainText)
  );

  const cipherBytes = new Uint8Array(cipherBuffer);

  return JSON.stringify({
    mode: "QV1",
    iv: bytesToBase64(iv),
    data: bytesToBase64(cipherBytes),
  });
}

async function decryptQuantumVeil(cipherText, secretKey, roomId) {
  if (!cipherText) return "";

  try {
    const parsed = JSON.parse(cipherText);

    if (parsed.mode !== "QV1") {
      return cipherText;
    }

    const key = await deriveKey(secretKey, roomId);
    const iv = base64ToBytes(parsed.iv);
    const data = base64ToBytes(parsed.data);

    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    return textDecoder.decode(plainBuffer);
  } catch {
    return "[Encrypted message - wrong key or unreadable]";
  }
}

export default function useChat(user) {
  const [messages, setMessages] = useState([]);
  const [joined, setJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [currentUser, setCurrentUser] = useState(user?.username || "");
  const [secretKey, setSecretKey] = useState("123");
  const [contacts, setContacts] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [selectedContact, setSelectedContact] = useState("");
  const [activeRoomId, setActiveRoomId] = useState("");
  const [unreadMap, setUnreadMap] = useState({});
  const [consumedMessages, setConsumedMessages] = useState(() => new Set());

  const stompClientRef = useRef(null);
  const currentUserRef = useRef(user?.username || "");
  const activeRoomIdRef = useRef("");

  const [playNotify] = useSound("/sounds/notify.mp3", {
    volume: 0.5,
    interrupt: true,
    soundEnabled: true,
  });

  const requestBrowserNotifications = async () => {
    if (!("Notification" in window)) {
      return "unsupported";
    }

    if (Notification.permission === "default") {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  };

  const showBrowserNotification = (title, body) => {
    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    if (user?.username) {
      setCurrentUser(user.username);
      loadContacts(user.username);
    } else {
      setCurrentUser("");
      setContacts([]);
      setRecentChats([]);
      setSelectedContact("");
      setActiveRoomId("");
      setMessages([]);
      setJoined(false);
      setUnreadMap({});
      setConsumedMessages(new Set());
    }
  }, [user]);

  useEffect(() => {
    if (currentUser && contacts.length > 0) {
      loadRecentChats(currentUser, contacts, secretKey);
    } else {
      setRecentChats([]);
    }
  }, [currentUser, contacts, secretKey]);

  const makeKey = (msg) =>
    `${msg.id || ""}-${msg.roomId || ""}-${msg.sender || ""}-${msg.type || ""}-${msg.content || ""}-${msg.timestamp || ""}-${msg.createdAtEpoch || 0}`;

  const mergeMessages = (prev, incoming) => {
    const map = new Map();

    [...prev, ...incoming].forEach((m) => {
      map.set(makeKey(m), m);
    });

    return Array.from(map.values()).sort(
      (a, b) => (a.createdAtEpoch || 0) - (b.createdAtEpoch || 0)
    );
  };

  const markMessageConsumed = (messageKey) => {
    setConsumedMessages((prev) => {
      const next = new Set(prev);
      next.add(messageKey);
      return next;
    });
  };

  const decryptHistoryMessages = async (history, key, roomId) => {
    return Promise.all(
      history.map(async (msg) => ({
        ...msg,
        plainContent: msg.type === "JOIN" || msg.type === "LEAVE"
          ? msg.content
          : await decryptQuantumVeil(msg.content, key, roomId),
      }))
    );
  };

  const loadContacts = async (username) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/user/contacts?username=${encodeURIComponent(username)}`
      );

      if (!res.ok) {
        throw new Error("Failed to load contacts");
      }

      const data = await res.json();
      const loadedContacts = Array.isArray(data) ? data : [];
      setContacts(loadedContacts);
    } catch (error) {
      console.error("Load contacts error:", error);
      setContacts([]);
    }
  };

  const loadRecentChats = async (
    username,
    contactList,
    keyForPreview = secretKey
  ) => {
    try {
      const results = await Promise.all(
        contactList.map(async (contact) => {
          const roomId = buildRoomId(username, contact);

          try {
            const res = await fetch(
              `${API_BASE_URL}/history?roomId=${encodeURIComponent(roomId)}`
            );

            if (!res.ok) {
              return {
                contact,
                roomId,
                lastMessage: null,
              };
            }

            const data = await res.json();
            const history = Array.isArray(data) ? data : [];
            const lastMessage =
              history.length > 0 ? history[history.length - 1] : null;

            const plainLastMessage = lastMessage
              ? {
                  ...lastMessage,
                  plainContent: lastMessage.type === "JOIN" || lastMessage.type === "LEAVE"
                    ? lastMessage.content
                    : await decryptQuantumVeil(
                        lastMessage.content,
                        keyForPreview,
                        roomId
                      ),
                }
              : null;

            return {
              contact,
              roomId,
              lastMessage: plainLastMessage,
            };
          } catch (error) {
            console.error(`Recent chat load error for ${contact}:`, error);
            return {
              contact,
              roomId,
              lastMessage: null,
            };
          }
        })
      );

      results.sort((a, b) => {
        const aTime = a.lastMessage?.createdAtEpoch || 0;
        const bTime = b.lastMessage?.createdAtEpoch || 0;
        return bTime - aTime;
      });

      setRecentChats(results);
    } catch (error) {
      console.error("Load recent chats error:", error);
      setRecentChats([]);
    }
  };

  const loadHistory = async (roomId, key) => {
    const res = await fetch(
      `${API_BASE_URL}/history?roomId=${encodeURIComponent(roomId)}`
    );

    if (!res.ok) {
      throw new Error("Failed to load history");
    }

    const data = await res.json();
    const history = Array.isArray(data) ? data : [];
    return decryptHistoryMessages(history, key, roomId);
  };

  const wakeBackend = async () => {
    try {
      await fetch(`${API_BASE_URL}/history?roomId=__wake__`, {
        method: "GET",
      });
    } catch (error) {
      console.warn("Backend wake attempt failed, continuing...", error);
    }
  };

  const sha256 = async (text) => {
    const data = textEncoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const buildIntegrityBase = (
    senderValue,
    contentValue,
    roomValue,
    typeValue,
    secretValue
  ) => {
    return `${senderValue}|${contentValue}|${roomValue}|${typeValue}|${secretValue}`;
  };

  const disconnect = () => {
    try {
      if (stompClientRef.current) {
        stompClientRef.current.disconnect(() => {});
      }
    } catch (error) {
      console.error("Disconnect error:", error);
    } finally {
      stompClientRef.current = null;
      setJoined(false);
      setIsConnecting(false);
      setMessages([]);
    }
  };

  const addContact = async (name) => {
    const clean = name.trim().toLowerCase();

    if (!clean) return;

    if (!currentUser) {
      alert("User not loaded");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/user/addContact?username=${encodeURIComponent(
          currentUser
        )}&contactUsername=${encodeURIComponent(clean)}`
      );

      const text = await res.text();

      if (!res.ok) {
        if (text.includes("Contact not found")) {
          alert("Contact username not found");
          return;
        }

        if (text.includes("You cannot add yourself")) {
          alert("You cannot add yourself");
          return;
        }

        throw new Error(text || "Failed to add contact");
      }

      const data = JSON.parse(text);
      const updatedContacts = Array.isArray(data.contacts) ? data.contacts : [];
      setContacts(updatedContacts);
      await loadRecentChats(currentUser, updatedContacts, secretKey);
    } catch (error) {
      console.error("Add contact error:", error);
      alert("Unable to add contact");
    }
  };

  const connectToPrivateChat = async (userName, contactName, key) => {
    if (!userName.trim() || !contactName.trim() || !key.trim()) {
      alert("Please enter your name, contact name, and secret key.");
      return;
    }

    const normalizedUser = userName.trim().toLowerCase();
    const normalizedContact = contactName.trim().toLowerCase();
    const roomId = buildRoomId(normalizedUser, normalizedContact);

    if (
      joined &&
      activeRoomId === roomId &&
      currentUser.trim().toLowerCase() === normalizedUser
    ) {
      setSelectedContact(normalizedContact);
      setUnreadMap((prev) => ({ ...prev, [roomId]: 0 }));
      return;
    }

    if (stompClientRef.current) {
      disconnect();
    }

    setCurrentUser(normalizedUser);
    setSelectedContact(normalizedContact);
    setSecretKey(key);
    setActiveRoomId(roomId);
    setIsConnecting(true);
    setMessages([]);
    setUnreadMap((prev) => ({ ...prev, [roomId]: 0 }));

    await wakeBackend();

    const socket = new SockJS(WS_BASE_URL);
    const stomp = Stomp.over(socket);
    stomp.debug = null;

    stomp.connect(
      {},
      () => {
        stompClientRef.current = stomp;

        stomp.subscribe("/topic/messages", async (msg) => {
          const parsed = JSON.parse(msg.body);

          if (parsed.roomId !== roomId) return;

          if (
            (parsed.integrityStatus === "DENIED" ||
              parsed.integrityStatus === "JOIN_LOCKED") &&
            parsed.sender === normalizedUser
          ) {
            alert(parsed.content);
            setMessages([]);
            setJoined(false);
            setIsConnecting(false);
            setActiveRoomId("");
            setSelectedContact("");
            return;
          }

          const decryptedParsed = {
            ...parsed,
            plainContent: parsed.type === "JOIN" || parsed.type === "LEAVE"
              ? parsed.content
              : await decryptQuantumVeil(parsed.content, key, roomId),
          };

          const incomingFromOther =
            decryptedParsed.sender !== currentUserRef.current &&
            decryptedParsed.type !== "JOIN" &&
            decryptedParsed.type !== "LEAVE";

          if (incomingFromOther && activeRoomIdRef.current !== roomId) {
            setUnreadMap((prev) => ({
              ...prev,
              [roomId]: (prev[roomId] || 0) + 1,
            }));

            try {
              playNotify();
            } catch (e) {
              console.warn("Notify sound could not play:", e);
            }

            showBrowserNotification(
              `ENTANGLE • @${decryptedParsed.sender || "unknown"}`,
              decryptedParsed.type === "ONE_TIME"
                ? "New Heisenberg one-time message"
                : "New encrypted message"
            );
          }

          if (parsed.type === "JOIN" && parsed.sender === normalizedUser) {
            try {
              const history = await loadHistory(roomId, key);
              setMessages((prev) =>
                mergeMessages(prev, [...history, decryptedParsed])
              );
            } catch (error) {
              console.error("History load error:", error);
              setMessages((prev) => mergeMessages(prev, [decryptedParsed]));
            }

            setJoined(true);
            setIsConnecting(false);
            setUnreadMap((prev) => ({ ...prev, [roomId]: 0 }));
            await loadRecentChats(normalizedUser, contacts, key);
            return;
          }

          setMessages((prev) => mergeMessages(prev, [decryptedParsed]));
          await loadRecentChats(normalizedUser, contacts, key);
        });

        stomp.send(
          "/app/addUser",
          {},
          JSON.stringify({
            sender: normalizedUser,
            roomId,
            secretKey: key,
            type: "JOIN",
          })
        );
      },
      (error) => {
        console.error("STOMP connection error:", error);
        alert("Unable to connect to chat server.");
        disconnect();
      }
    );
  };

  const sendMessage = async (
    sender,
    roomId,
    key,
    content,
    type = "CHAT",
    tamperMode = false
  ) => {
    if (!joined || !stompClientRef.current || !content.trim()) return;

    const encryptedContent = await encryptQuantumVeil(content, key, roomId);

    const baseString = buildIntegrityBase(
      sender,
      encryptedContent,
      roomId,
      type,
      key
    );

    let integrityHash = await sha256(baseString);

    if (tamperMode) {
      integrityHash = integrityHash.slice(0, -1) + "x";
    }

    stompClientRef.current.send(
      "/app/sendMessage",
      {},
      JSON.stringify({
        sender,
        content: encryptedContent,
        roomId,
        type,
        integrityHash,
        secretKey: key,
        oneTime: type === "ONE_TIME",
      })
    );
  };

  return {
    messages,
    joined,
    isConnecting,
    currentUser,
    secretKey,
    contacts,
    recentChats,
    selectedContact,
    activeRoomId,
    unreadMap,
    consumedMessages,
    setCurrentUser,
    setSecretKey,
    addContact,
    setSelectedContact,
    connectToPrivateChat,
    sendMessage,
    markMessageConsumed,
    requestBrowserNotifications,
  };
}