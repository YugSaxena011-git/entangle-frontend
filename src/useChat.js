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

  const [consumedMessages, setConsumedMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("entangle_consumed");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const stompClientRef = useRef(null);
  const currentUserRef = useRef(user?.username || "");
  const activeRoomIdRef = useRef("");
  const secretKeyRef = useRef(secretKey);
  const contactsRef = useRef(contacts);

  const [playNotify] = useSound("/sounds/notify.mp3", {
    volume: 0.5,
    interrupt: true,
    soundEnabled: true,
  });

  const playNotifyRef = useRef(playNotify);

  useEffect(() => { playNotifyRef.current = playNotify; }, [playNotify]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);
  useEffect(() => { secretKeyRef.current = secretKey; }, [secretKey]);
  useEffect(() => { contactsRef.current = contacts; }, [contacts]);

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

  useEffect(() => {
    if (!currentUser) return;

    const socket = new SockJS(WS_BASE_URL);
    const stomp = Stomp.over(socket);
    stomp.debug = null;

    stomp.connect({}, () => {
      stompClientRef.current = stomp;

      stomp.subscribe("/topic/messages", async (msg) => {
        const parsed = JSON.parse(msg.body);
        const safeCurrentUser = currentUserRef.current.toLowerCase();

        if (!parsed.roomId.includes(safeCurrentUser)) return;

        const isForActiveRoom = parsed.roomId === activeRoomIdRef.current;
        const incomingFromOther = parsed.sender.toLowerCase() !== safeCurrentUser && parsed.type !== "JOIN" && parsed.type !== "LEAVE";

        if (incomingFromOther && (!isForActiveRoom || document.hidden)) {
          if (!isForActiveRoom) {
            setUnreadMap((prev) => ({
              ...prev,
              [parsed.roomId]: (prev[parsed.roomId] || 0) + 1,
            }));
          }

          try { playNotifyRef.current(); } catch (e) {}

          showBrowserNotification(
            `ENTANGLE • @${parsed.sender}`,
            parsed.type === "ONE_TIME" ? "New Heisenberg one-time message" : "New encrypted payload received"
          );
        }

        if (isForActiveRoom) {
          if ((parsed.integrityStatus === "DENIED" || parsed.integrityStatus === "JOIN_LOCKED") && parsed.sender.toLowerCase() === safeCurrentUser) {
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
              : await decryptQuantumVeil(parsed.content, secretKeyRef.current, parsed.roomId),
          };

          if (parsed.type === "JOIN" && parsed.sender.toLowerCase() === safeCurrentUser) {
            try {
              const history = await loadHistory(parsed.roomId, secretKeyRef.current);
              setMessages((prev) => mergeMessages(prev, [...history, decryptedParsed]));
            } catch (error) {
              setMessages((prev) => mergeMessages(prev, [decryptedParsed]));
            }
            setJoined(true);
            setIsConnecting(false);
            setUnreadMap((prev) => ({ ...prev, [parsed.roomId]: 0 }));
          } else {
            setMessages((prev) => mergeMessages(prev, [decryptedParsed]));
          }
        }

        await loadRecentChats(currentUserRef.current, contactsRef.current, secretKeyRef.current);
      });
    });

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.disconnect(() => {});
        stompClientRef.current = null;
      }
    };
  }, [currentUser]);

  const makeKey = (msg) => `${msg.roomId || ""}-${msg.sender || ""}-${msg.createdAtEpoch || 0}`;

  const mergeMessages = (prev, incoming) => {
    const map = new Map();

    [...prev, ...incoming].forEach((m) => {
      map.set(makeKey(m), m);
    });

    return Array.from(map.values()).sort(
      (a, b) => (a.createdAtEpoch || 0) - (b.createdAtEpoch || 0)
    );
  };

  const markMessageConsumed = async (messageKey) => {
    setConsumedMessages((prev) => {
      const next = new Set(prev);
      next.add(messageKey);
      localStorage.setItem("entangle_consumed", JSON.stringify(Array.from(next)));
      return next;
    });

    const msgToPurge = messages.find(m => makeKey(m) === messageKey);
    
    if (msgToPurge) {
      try {
        const query = msgToPurge.id 
          ? `id=${msgToPurge.id}`
          : `roomId=${encodeURIComponent(msgToPurge.roomId)}&epoch=${msgToPurge.createdAtEpoch}`;

        await fetch(`${API_BASE_URL}/consume?${query}`, {
          method: "DELETE",
        });
      } catch (error) {
      }
    }
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

    setCurrentUser(normalizedUser);
    setSelectedContact(normalizedContact);
    setSecretKey(key);
    setActiveRoomId(roomId);
    setIsConnecting(true);
    setMessages([]);
    setUnreadMap((prev) => ({ ...prev, [roomId]: 0 }));

    await wakeBackend();

    setTimeout(() => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.send(
          "/app/addUser",
          {},
          JSON.stringify({
            sender: normalizedUser,
            roomId,
            secretKey: key,
            type: "JOIN",
          })
        );
      } else {
        alert("Secure socket not established yet. Please check connection.");
        setIsConnecting(false);
      }
    }, 100);
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