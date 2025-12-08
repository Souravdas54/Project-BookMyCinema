"use client";

import React, { useEffect, useState, useRef } from "react";
import {Drawer,Box,Typography,Button,Divider,List,ListItem,ListItemIcon,ListItemText,IconButton,Badge,
Avatar,Chip,TextField,InputAdornment,CircularProgress,Snackbar,Alert,Menu,MenuItem,} from "@mui/material";
import {Close,ShoppingBag,VideoLibrary,Chat as ChatIcon,Send,Search,AttachFile,Image,InsertDriveFile,EmojiEmotions,} from "@mui/icons-material";
import { io, Socket } from "socket.io-client";

// Types
interface UserType {
  _id: string;
  name: string;
  email: string;
}

interface Chat {
  _id: string;
  participants: string[];
  messages: IMessage[];
  lastMessage?: IMessage;
  createdAt: string;
  updatedAt: string;
}

interface IMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  type: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

interface ChatContact {
  id: string;
  chatId?: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  lastMessage: string;
  unreadCount?: number;
  isAdmin?: boolean;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onLoginClick: () => void;
  onSignupClick: () => void;
  user: unknown;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8500';

export default function Sidebar({
  open,
  onClose,
  onLoginClick,
  onSignupClick,
}: SidebarProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [chatContacts, setChatContacts] = useState<ChatContact[]>([
    {
      id: 'support-chat',
      name: 'Customer Support',
      avatar: 'S',
      status: 'online',
      lastMessage: 'How can I assist you today?',
      unreadCount: 0,
      isAdmin: true,
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const [attachmentMenuAnchor, setAttachmentMenuAnchor] = useState<null | HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);


  const debugChatData = () => {
    console.log("=== DEBUG CHAT DATA ===");
    console.log("User ID:", user?._id);
    console.log("Active Chat ID:", activeChat);
    console.log("All Chats:", chats);

    if (activeChat) {
      const currentChat = chats.find(chat => chat._id === activeChat);
      console.log("Current Chat:", currentChat);
      console.log("Participants:", currentChat?.participants);

      if (currentChat?.participants) {
        console.log("Other Participant:",
          currentChat.participants.find(p => {
            if (typeof p === 'object') return p._id !== user?._id;
            return p !== user?._id;
          })
        );
      }
    }
    console.log("=== END DEBUG ===");
  };

  // Chat open  call 
  // useEffect(() => {
  //   if (activeChat) {
  //     debugChatData();
  //   }
  // }, [activeChat]);

  // Initialize user from sessionStorage
  useEffect(() => {
    const storedUser = sessionStorage.getItem("userData");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("User loaded from sessionStorage:", parsedUser._id);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Initialize socket connection when user is available
  useEffect(() => {
    if (user && showChat) {
      console.log("Initializing socket connection for user:", user._id);

      // Socket options update
      // const newSocket = io(SOCKET_URL, {
      //   withCredentials: true,
      //   reconnection: true,
      //   reconnectionAttempts: 5,
      //   reconnectionDelay: 1000,
      //   reconnectionDelayMax: 5000,
      //   timeout: 20000,
      //   transports: ['websocket', 'polling'],
      //   // query: {
      //   //   userId: user._id
      //   // }
      // });

      const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 30000,
            transports: ['websocket', 'polling'],
            autoConnect: true,
            forceNew: false
        });

      setSocket(newSocket);

      // newSocket.on("connect", () => {
      //   console.log("Socket connected with ID:", newSocket.id);
      //   console.log("User ID for registration:", user._id);

      //   // Register user
      //   newSocket.emit("register", user._id);
      //   showNotification("Connected to chat", 'success');
      // });

      newSocket.on("connect", () => {
        console.log("User Socket connected with ID:", newSocket.id);
        console.log("Registering user:", user._id);

        // ✅ FIX: Register user immediately
        newSocket.emit("register", user._id);
        showNotification("Connected to chat server", 'success');

        // ✅ FIX: If active chat exists, join the room
        if (activeChat && !activeChat.startsWith('temp-') && !activeChat.startsWith('local-')) {
          newSocket.emit("join", {
            chatId: activeChat,
            userId: user._id
          });
          console.log(`User joined chat room: ${activeChat}`);
        }
      });



      newSocket.on("message", (data: any) => {
        console.log("📩 User received message:", data);

        if (activeChat && data.chatId === activeChat) {
          // ✅ FIX: Handle temp message replacement
          setMessages(prev => {
            // Remove any temp message with same content
            const filteredMessages = prev.filter(msg =>
              !(msg._id.startsWith('temp-') && msg.message === data.message)
            );

            // Check if message already exists
            const messageExists = filteredMessages.some(msg =>
              msg._id === data._id ||
              (msg.message === data.message &&
                new Date(msg.createdAt).getTime() === new Date(data.createdAt).getTime())
            );

            if (!messageExists) {
              const newMessages = [...filteredMessages, data];
              // Sort by timestamp
              return newMessages.sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
            }
            return filteredMessages;
          });

          scrollToBottom();
        }
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        showNotification("Connection error: " + error.message, 'error');
      });

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [user, showChat]);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat && !activeChat.startsWith('temp-') && !activeChat.startsWith('offline-')) {
      fetchMessages();
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleChatClick = async () => {
    if (!user) {
      showNotification('Please login to use chat support', 'warning');
      onLoginClick();
      return;
    }

    setShowChat(true);

    // Create a temporary chat ID while we're loading
    const tempChatId = `temp-${Date.now()}`;
    setActiveChat(tempChatId);

    // Show loading state in chat contacts
    setChatContacts([{
      id: 'support-chat',
      chatId: tempChatId,
      name: 'Customer Support',
      avatar: 'S',
      status: 'online',
      lastMessage: 'Connecting to support...',
      unreadCount: 0,
      isAdmin: true,
    }]);

    // Start the chat
    await startNewChat();
  };

  const startNewChat = async () => {
    if (!user) {
      showNotification('Please login to use chat support', 'warning');
      return;
    }

    try {
      setLoading(true);
      console.log("Starting chat for user:", user._id);

      const token = sessionStorage.getItem('accessToken');

      // Use the new route that gets or creates chat
      const response = await fetch(`${API_URL}/chats/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user._id }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start chat');
      }

      const data = await response.json();
      console.log("Chat created:", data);

      if (data.success && data.chat) {
        const chat = data.chat;

        // Find the support admin participant
        const supportAdminParticipant = chat.participants?.find(
          (p: any) => p.isSupportAdmin === true
        ) || chat.participants?.find((p: any) => p._id !== user._id);

        const adminContact: ChatContact = {
          id: 'support-chat',
          chatId: chat._id,
          name: supportAdminParticipant?.name || 'Support Admin',
          avatar: supportAdminParticipant?.name?.charAt(0) || 'S',
          status: 'online',
          lastMessage: chat.lastMessage?.message || 'Hello! How can I help you?',
          unreadCount: 0,
          isAdmin: true,
        };

        setChatContacts([adminContact]);
        setChats([chat]);
        setActiveChat(chat._id);
        setMessages(chat.messages || []);

        // Join socket room
        if (socket && socket.connected) {
          socket.emit("join", {
            chatId: chat._id,
            userId: user._id
          });

          // Register with socket
          socket.emit("register", user._id);
        }

        showNotification('Connected to support chat', 'success');
      }
    } catch (error: any) {
      console.error('Error starting chat:', error);
      showNotification('Failed to start chat: ' + error.message, 'error');

      // Fallback to local mode
      const localChatId = `local-${Date.now()}`;
      const localContact: ChatContact = {
        id: 'support-chat',
        chatId: localChatId,
        name: 'Customer Support',
        avatar: 'S',
        status: 'online',
        lastMessage: 'Welcome! How can I help you today?',
        unreadCount: 0,
        isAdmin: true,
      };

      setChatContacts([localContact]);
      setActiveChat(localChatId);

      // Add a welcome message
      const welcomeMessage: IMessage = {
        _id: Date.now().toString(),
        senderId: 'support',
        receiverId: user._id,
        message: 'Hello! I am your support assistant. How can I help you today?',
        type: 'text',
        read: false,
        createdAt: new Date().toISOString(),
      };

      setMessages([welcomeMessage]);
      showNotification('Connected in local mode', 'info');
    } finally {
      setLoading(false);
    }
  };

  // Update the handleSendMessage function to include proper typing

  const getReceiverId = (): string => {
    if (!user || !activeChat) return '';

    const currentChat = chats.find(chat => chat._id === activeChat);

    if (!currentChat || !currentChat.participants) return '';

    if (Array.isArray(currentChat.participants)) {

      const otherParticipant = currentChat.participants.find((p: any) => {
        if (typeof p === 'object') {
          return p._id !== user._id;
        }
        return p !== user._id;
      });

      if (otherParticipant) {
        return typeof otherParticipant === 'object'
          ? otherParticipant._id
          : otherParticipant;
      }
    }

    return '';
  };


  const handleSendMessage = () => {
    if (!message.trim() || !user || !activeChat) return;

    if (!socket?.connected) {
      showNotification('Connection lost. Please try again.', 'error');
      return;
    }

    const receiverId = getReceiverId();

    if (!receiverId) {
      showNotification('Cannot send message. No recipient found.', 'error');
      return;
    }

    const messageData = {
      chatId: activeChat,
      senderId: user._id,
      receiverId: receiverId,
      message: message.trim(),
      type: 'text'
    };

    console.log("Sending message data:", messageData);

    // socket.emit("sendMessage", messageData);

    // Optimistically add message to UI
    // const tempId = `temp-${Date.now()}`;
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage: IMessage = {
      _id: tempId,
      senderId: user._id,
      receiverId: receiverId,
      message: message.trim(),
      type: 'text',
      read: false,
      createdAt: new Date().toISOString(),
    };

    // First add temp message to UI
    // setMessages(prev => [...prev, tempMessage]);
    setMessages(prev => {
      const newMessages = [...prev, tempMessage];
      return newMessages.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
    setMessage("");
    setShowTypingIndicator(false);
    scrollToBottom();
    // Then send via socket
    socket.emit("sendMessage", messageData);
  };

  // const startNewChat = async () => {
  //   if (!user) {
  //     showNotification('Please login to use chat support', 'warning');
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     console.log("Starting chat with user ID:", user._id);

  //     // First, let's check if we have an existing chat
  //     const checkResponse = await fetch(`${API_URL}/chat/user/${user._id}`, {
  //       headers: { 
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${sessionStorage.getItem('token') || ''}`
  //       },
  //     });

  //     if (checkResponse.ok) {
  //       const existingChats = await checkResponse.json();
  //       if (existingChats.length > 0) {
  //         // Use existing chat
  //         const chat = existingChats[0];
  //         const adminContact: ChatContact = {
  //           id: 'support-chat',
  //           chatId: chat._id,
  //           name: 'Customer Support',
  //           avatar: 'S',
  //           status: 'online',
  //           lastMessage: chat.lastMessage?.message || 'How can I assist you today?',
  //           unreadCount: 0,
  //           isAdmin: true,
  //         };

  //         setChatContacts([adminContact]);
  //         setChats([chat]);
  //         setActiveChat(chat._id);
  //         setLoading(false);
  //         return;
  //       }
  //     }

  //     // If no existing chat, create a new one
  //     console.log("Creating new chat...");
  //     const response = await fetch(`${API_URL}/chat/start`, {
  //       method: 'POST',
  //       headers: { 
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${sessionStorage.getItem('token') || ''}`
  //       },
  //       body: JSON.stringify({ userId: user._id }),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || 'Failed to start chat');
  //     }

  //     const data = await response.json();
  //     console.log("Chat created successfully:", data);

  //     const chat = data.chat || data;
  //     const adminContact: ChatContact = {
  //       id: 'support-chat',
  //       chatId: chat._id,
  //       name: 'Customer Support',
  //       avatar: 'S',
  //       status: 'online',
  //       lastMessage: 'How can I assist you today?',
  //       unreadCount: 0,
  //       isAdmin: true,
  //     };

  //     setChatContacts([adminContact]);
  //     setChats([chat]);
  //     setActiveChat(chat._id);
  //     showNotification('Connected to support', 'success');

  //   } catch (error: any) {
  //     console.error('Error starting chat:', error);

  //     // Fallback: Create a local chat session
  //     const localChatId = `local-${Date.now()}`;
  //     const localContact: ChatContact = {
  //       id: 'support-chat',
  //       chatId: localChatId,
  //       name: 'Customer Support',
  //       avatar: 'S',
  //       status: 'online',
  //       lastMessage: 'Welcome! How can I help you today?',
  //       unreadCount: 0,
  //       isAdmin: true,
  //     };

  //     setChatContacts([localContact]);
  //     setActiveChat(localChatId);

  //     // Add a welcome message
  //     const welcomeMessage: IMessage = {
  //       _id: Date.now().toString(),
  //       senderId: 'support',
  //       receiverId: user._id,
  //       message: 'Hello! I am your support assistant. How can I help you today?',
  //       type: 'text',
  //       read: false,
  //       createdAt: new Date().toISOString(),
  //     };

  //     setMessages([welcomeMessage]);
  //     showNotification('Connected in local mode. Some features may be limited.', 'info');

  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchMessages = async () => {
    if (!activeChat || activeChat.startsWith('temp-') || activeChat.startsWith('local-')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/chats/${activeChat}/messages`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken') || ''}`
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        // Token expired - handle gracefully
        console.log('Token expired while fetching messages');
        showNotification('Session expired. Please refresh the page.', 'warning');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();

if(data.success && data.message){
  const sortedMessages = [...data.messages].sort(
        (a: IMessage, b: IMessage) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages);  // final clean update

      console.log(`Loaded ${sortedMessages.length} messages`)

}
      // SORT BY CREATED DATE ALWAYS
      // const sorted = [...data.messages].sort(
      //   (a: IMessage, b: IMessage) =>
      //     new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      // );

      // setMessages(sorted);  // final clean update

      // if (messages.success) {
      //   setMessages(messages.messages || []);

      // } else {
      //   throw new Error(messages.message || 'Failed to fetch messages');
      // }

      // setMessages(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };


  const handleTyping = () => {
    if (!socket || !activeChat || !user || !socket.connected || activeChat.startsWith('local-')) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit("typing", {
      chatId: activeChat,
      userId: user._id,
      isTyping: true
    });

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        chatId: activeChat,
        userId: user._id,
        isTyping: false
      });
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackToMenu = () => {
    setShowChat(false);
    setActiveChat(null);
    setMessages([]);
    setMessage("");
  };

  const handleFileUpload = (type: 'image' | 'file') => {
    if (type === 'image') {
      imageInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
    setAttachmentMenuAnchor(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    showNotification(`${type === 'image' ? 'Image' : 'File'} selected: ${file.name}`, 'info');

    // In local mode, add a file message
    if (activeChat?.startsWith('local-')) {
      const fileMessage: IMessage = {
        _id: Date.now().toString(),
        senderId: user._id,
        receiverId: 'support',
        message: `[${type === 'image' ? 'Image' : 'File'}] ${file.name}`,
        type: type,
        read: false,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, fileMessage]);
      scrollToBottom();
    }

    e.target.value = '';
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  const isLoggedIn = !!user;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: showChat ? 400 : 350 },
            backgroundColor: "#f8f9fa",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
            borderTopLeftRadius: "20px",
            borderBottomLeftRadius: "20px",
            overflow: "hidden",
          }
        }}
      >
        <Box sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}>
          {!showChat ? (
            // Main Menu View
            <>
              <Box sx={{
                p: 3,
                backgroundColor: "white",
                borderBottom: "1px solid #e0e0e0",
              }}>
                <Box sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <Typography variant="h5" sx={{
                    fontWeight: 700,
                    color: "#2c3e50",
                    fontSize: "1.5rem"
                  }}>
                    {isLoggedIn ? `Hey! ${user?.name}` : "Welcome!"}
                  </Typography>
                  <IconButton onClick={onClose}>
                    <Close sx={{ color: "#666" }} />
                  </IconButton>
                </Box>
              </Box>

              {!isLoggedIn && (
                <Box sx={{
                  p: 3,
                  backgroundColor: "white",
                  margin: 2,
                  borderRadius: "16px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}>
                  <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2
                  }}>
                    <Button
                      variant="outlined"
                      onClick={onLoginClick}
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderRadius: "12px",
                        border: "2px solid #4a6491",
                        color: "#4a6491",
                        fontWeight: 600,
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="contained"
                      onClick={onSignupClick}
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderRadius: "12px",
                        backgroundColor: "#4a6491",
                        fontWeight: 600,
                        "&:hover": {
                          backgroundColor: "#3a5479",
                        }
                      }}
                    >
                      Register
                    </Button>
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 2, mx: 2 }} />

              {/* Chat Support Button */}
              <Box sx={{ p: 2 }}>
                <ListItem
                  button
                  onClick={handleChatClick}
                  disabled={loading}
                  sx={{
                    px: 2,
                    py: 2,
                    borderRadius: "12px",
                    backgroundColor: "rgba(74, 100, 145, 0.05)",
                    "&:hover": {
                      backgroundColor: "rgba(74, 100, 145, 0.1)",
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: "#4a6491" }}>
                    <Badge badgeContent={chatContacts[0]?.unreadCount || 0} color="error">
                      <ChatIcon />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: "#2c3e50" }}>
                          Chat Support
                        </Typography>
                        {loading && <CircularProgress size={16} />}
                      </Box>
                    }
                    secondary={
                      isLoggedIn ? "Live chat with our support team" : "Login to use chat support"
                    }
                  />
                  {isLoggedIn && (
                    <Chip
                      label="Live"
                      size="small"
                      sx={{
                        backgroundColor: "#4CAF50",
                        color: "white",
                        fontWeight: 600,
                      }}
                    />
                  )}
                </ListItem>
              </Box>
            </>
          ) : (
            // Chat View
            <>
              <Box sx={{
                p: 2,
                backgroundColor: "white",
                borderBottom: "1px solid #e0e0e0",
                display: "flex",
                alignItems: "center",
                gap: 2
              }}>
                <IconButton onClick={handleBackToMenu}>
                  <Close sx={{ color: "#666", transform: "rotate(180deg)" }} />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", flexGrow: 1 }}>
                  Messages
                </Typography>
              </Box>

              {/* Active Chat View */}
              <Box sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}>
                {/* Chat Header */}
                <Box sx={{
                  p: 2,
                  backgroundColor: "white",
                  borderBottom: "1px solid #e0e0e0",
                  display: "flex",
                  alignItems: "center",
                  gap: 2
                }}>
                  <Avatar sx={{ bgcolor: '#4a6491', fontWeight: 600 }}>
                    S
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 600, color: "#2c3e50" }}>
                      Customer Support
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "#4CAF50" }}>
                      {activeChat?.startsWith('local-') ? 'Local Mode' : 'Online'}
                    </Typography>
                  </Box>
                </Box>

                {/* Typing Indicator */}
                {showTypingIndicator && (
                  <Box sx={{ px: 2, py: 1, backgroundColor: "#f0f0f0" }}>
                    <Typography sx={{ fontSize: "0.75rem", color: "#666" }}>
                      Customer support is typing...
                    </Typography>
                  </Box>
                )}

                {/* Chat Messages */}
                <Box sx={{
                  flex: 1,
                  p: 2,
                  overflowY: "auto",
                  backgroundColor: "#f8f9fa",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}>
                  {messages.length === 0 && activeChat?.startsWith('temp-') ? (
                    <Box sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "#999",
                      textAlign: "center"
                    }}>
                      <CircularProgress sx={{ mb: 2 }} />
                      <Typography variant="body1">
                        Connecting to support...
                      </Typography>
                    </Box>
                  ) : messages.length === 0 ? (
                    <Box sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "#999",
                      textAlign: "center"
                    }}>
                      <ChatIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        Start a conversation with our support team
                      </Typography>
                    </Box>
                  ) : (
                    messages.map((msg) => (
                      <Box
                        key={msg._id}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: msg.senderId === user?._id ? 'flex-end' : 'flex-start',
                          maxWidth: "80%",
                        }}
                      >
                        <Box sx={{
                          p: 2,
                          borderRadius: msg.senderId === user?._id ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          backgroundColor: msg.senderId === user?._id ? "#4a6491" : "white",
                          color: msg.senderId === user?._id ? "white" : "#2c3e50",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        }}>
                          <Typography>{msg.message}</Typography>
                          {msg.type === 'image' && (
                            <Box sx={{ mt: 1, p: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Image fontSize="small" /> Image file
                              </Typography>
                            </Box>
                          )}
                          {msg.type === 'file' && (
                            <Box sx={{ mt: 1, p: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InsertDriveFile fontSize="small" /> File attachment
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Typography sx={{
                          fontSize: "0.75rem",
                          color: "#999",
                          mt: 0.5,
                          px: 1,
                        }}>
                          {formatTime(msg.createdAt)}
                        </Typography>
                      </Box>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input Area */}
                <Box sx={{
                  p: 2,
                  backgroundColor: "white",
                  borderTop: "1px solid #e0e0e0",
                }}>
                  <Menu
                    anchorEl={attachmentMenuAnchor}
                    open={Boolean(attachmentMenuAnchor)}
                    onClose={() => setAttachmentMenuAnchor(null)}
                  >
                    <MenuItem onClick={() => handleFileUpload('image')}>
                      <ListItemIcon>
                        <Image fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Photo</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => handleFileUpload('file')}>
                      <ListItemIcon>
                        <InsertDriveFile fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Document</ListItemText>
                    </MenuItem>
                  </Menu>

                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="*/*"
                    onChange={(e) => handleFileChange(e, 'file')}
                  />
                  <input
                    type="file"
                    ref={imageInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'image')}
                  />

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton
                      onClick={(e) => setAttachmentMenuAnchor(e.currentTarget)}
                      sx={{ color: "#666" }}
                    >
                      <AttachFile />
                    </IconButton>

                    <TextField
                      fullWidth
                      placeholder="Type your message..."
                      variant="outlined"
                      size="small"
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={handleKeyPress}
                      multiline
                      maxRows={4}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: "24px",
                          backgroundColor: "#f5f5f5",
                        }
                      }}
                    />

                    <IconButton
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      sx={{
                        backgroundColor: "#4a6491",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "#3a5479"
                        },
                        "&.Mui-disabled": {
                          backgroundColor: "#e0e0e0",
                          color: "#999"
                        }
                      }}
                    >
                      <Send />
                    </IconButton>
                  </Box>

                  <Typography sx={{
                    fontSize: "0.75rem",
                    color: "#999",
                    textAlign: "center",
                    mt: 1
                  }}>
                    Press Enter to send
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Drawer>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}