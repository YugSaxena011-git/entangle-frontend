import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { API_BASE_URL, WS_BASE_URL } from "./config";

const buildRoomId = (userA, userB) => {
  return [userA.trim().toLowerCase(), userB.trim().toLowerCase()]
    .sort()
    .join("__");
};

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

  const stompClientRef = useRef(null);

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
    }
  }, [user]);

  useEffect(() => {
    if (currentUser && contacts.length > 0) {
      loadRecentChats(currentUser, contacts);
    } else {
      setRecentChats([]);
    }
  }, [currentUser, contacts]);

  const makeKey = (msg) =>
    `${msg.roomId || ""}-${msg.sender || ""}-${msg.type || ""}-${msg.content || ""}-${msg.timestamp || ""}-${msg.createdAtEpoch || 0}`;

  const mergeMessages = (prev, incoming) => {
    const map = new Map();

    [...prev, ...incoming].forEach((m) => {
      map.set(makeKey(m), m);
    });

    return Array.from(map.values()).sort(
      (a, b) => (a.createdAtEpoch || 0) - (b.createdAtEpoch || 0)
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

  const loadRecentChats = async (username, contactList) => {
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

            return {
              contact,
              roomId,
              lastMessage,
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

  const loadHistory = async (roomId) => {
    const res = await fetch(
      `${API_BASE_URL}/history?roomId=${encodeURIComponent(roomId)}`
    );

    if (!res.ok) {
      throw new Error("Failed to load history");
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
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
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
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
      await loadRecentChats(currentUser, updatedContacts);
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
            disconnect();
            return;
          }

          if (parsed.type === "JOIN" && parsed.sender === normalizedUser) {
            try {
              const history = await loadHistory(roomId);
              setMessages((prev) => mergeMessages(prev, [...history, parsed]));
            } catch (error) {
              console.error("History load error:", error);
              setMessages((prev) => mergeMessages(prev, [parsed]));
            }

            setJoined(true);
            setIsConnecting(false);
            await loadRecentChats(normalizedUser, contacts);
            return;
          }

          setMessages((prev) => mergeMessages(prev, [parsed]));
          await loadRecentChats(normalizedUser, contacts);
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

    const baseString = buildIntegrityBase(sender, content, roomId, type, key);

    let integrityHash = await sha256(baseString);

    if (tamperMode) {
      integrityHash = integrityHash.slice(0, -1) + "x";
    }

    stompClientRef.current.send(
      "/app/sendMessage",
      {},
      JSON.stringify({
        sender,
        content,
        roomId,
        type,
        integrityHash,
        secretKey: key,
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
    setCurrentUser,
    setSecretKey,
    addContact,
    setSelectedContact,
    connectToPrivateChat,
    sendMessage,
  };
}