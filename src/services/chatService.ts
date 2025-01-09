import { db } from '../config/firebase';
import { 
  collection, 
  addDoc,
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  setDoc
} from 'firebase/firestore';

export interface Message {
  content: string;
  senderId: string;
  timestamp: any;
  isBot: boolean;
}

export interface Chat {
  id?: string;
  userId: string;
  botId: string;
  lastMessage?: string;
  lastMessageTimestamp?: any;
}

export interface Bot {
  id: string;
  name: string;
  systemPrompt: string;
  description?: string;
}

// Create a new chat
export const createChat = async (userId: string, botId: string): Promise<string> => {
  try {
    // Generate a unique chat ID
    const chatRef = doc(collection(db, 'chats'));
    
    const chatData: Chat = {
      userId,
      botId,
      lastMessageTimestamp: serverTimestamp()
    };
    
    await setDoc(chatRef, chatData);
    return chatRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

// Send a message in a chat
export const sendMessage = async (chatId: string, message: Omit<Message, 'timestamp'>) => {
  try {
    const messageData = {
      ...message,
      timestamp: serverTimestamp()
    };
    
    // Add message to the messages subcollection
    await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
    
    // Update the chat document with last message
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: message.content,
      lastMessageTimestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Get all chats for a user with a specific bot
export const getUserBotChats = async (userId: string, botId: string): Promise<Chat[]> => {
  try {
    // Temporarily remove orderBy until index is created
    const chatsQuery = query(
      collection(db, 'chats'),
      where('userId', '==', userId),
      where('botId', '==', botId)
    );
    
    const querySnapshot = await getDocs(chatsQuery);
    const chats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Chat));

    // Sort the chats client-side for now
    return chats.sort((a, b) => {
      const timeA = a.lastMessageTimestamp?.seconds || 0;
      const timeB = b.lastMessageTimestamp?.seconds || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error getting user bot chats:', error);
    return [];
  }
};

// Get messages for a specific chat
export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    return querySnapshot.docs.map(doc => doc.data() as Message);
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return [];
  }
};

// Get a specific chat by ID
export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (!chatDoc.exists()) return null;
    return { id: chatDoc.id, ...chatDoc.data() } as Chat;
  } catch (error) {
    console.error('Error getting chat by ID:', error);
    return null;
  }
};

// Delete a chat and all its messages
export const deleteChat = async (chatId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Delete all messages in the chat
    const messagesQuery = query(collection(db, 'chats', chatId, 'messages'));
    const messagesSnapshot = await getDocs(messagesQuery);
    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete the chat document itself
    batch.delete(doc(db, 'chats', chatId));
    
    // Commit the batch
    await batch.commit();
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

// Get bot details
export const getBotById = async (botId: string): Promise<Bot | null> => {
  try {
    const botDoc = await getDoc(doc(db, 'bots', botId));
    if (!botDoc.exists()) return null;
    return { id: botDoc.id, ...botDoc.data() } as Bot;
  } catch (error) {
    console.error('Error getting bot by ID:', error);
    return null;
  }
};

// Delete a bot and all its chats
export const deleteBot = async (botId: string): Promise<void> => {
  try {
    // Get all chats for this bot
    const chatsQuery = query(
      collection(db, 'chats'),
      where('botId', '==', botId)
    );
    const chatsSnapshot = await getDocs(chatsQuery);
    
    // Delete all chats and their messages
    const batch = writeBatch(db);
    for (const chatDoc of chatsSnapshot.docs) {
      await deleteChat(chatDoc.id);
    }
    
    // Delete the bot document
    const botRef = doc(db, 'bots', botId);
    batch.delete(botRef);
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting bot:', error);
    throw error;
  }
};

// Update bot details
export const updateBot = async (botId: string, updates: Partial<Bot>): Promise<void> => {
  try {
    const botRef = doc(db, 'bots', botId);
    await updateDoc(botRef, updates);
  } catch (error) {
    console.error('Error updating bot:', error);
    throw error;
  }
};

// Share bot with another user
export const shareBot = async (botId: string, targetUserId: string): Promise<void> => {
  try {
    const botRef = doc(db, 'bots', botId);
    const botDoc = await getDoc(botRef);
    
    if (!botDoc.exists()) {
      throw new Error('Bot not found');
    }
    
    const botData = botDoc.data();
    
    // Create a new bot document for the target user
    const sharedBotRef = doc(collection(db, 'bots'));
    await setDoc(sharedBotRef, {
      ...botData,
      userId: targetUserId,
      createdAt: serverTimestamp(),
      sharedFrom: botId,
    });
  } catch (error) {
    console.error('Error sharing bot:', error);
    throw error;
  }
};
