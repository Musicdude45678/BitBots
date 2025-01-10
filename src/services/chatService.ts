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
  setDoc,
  Timestamp,
  FieldValue
} from 'firebase/firestore';

export interface Message {
  id?: string;
  content: string;
  senderId: string;
  timestamp: Timestamp;
  isBot: boolean;
}

export interface Chat {
  id?: string;
  userId: string;
  botId: string;
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp | FieldValue;
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
export async function sendMessage(chatId: string, message: Omit<Message, 'timestamp'>) {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(chatRef, 'messages');

    // Add message with server timestamp
    await addDoc(messagesRef, {
      ...message,
      timestamp: serverTimestamp()
    });

    // Update chat's last message
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
      if (!a.lastMessageTimestamp || !b.lastMessageTimestamp) return 0;
      
      // When reading from Firestore, timestamps are always Timestamp objects
      const timeA = (a.lastMessageTimestamp as Timestamp).seconds || 0;
      const timeB = (b.lastMessageTimestamp as Timestamp).seconds || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error getting user bot chats:', error);
    return [];
  }
};

// Get messages for a specific chat
export async function getChatMessages(chatId: string): Promise<Message[]> {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(chatRef, 'messages');
    const messagesQuery = query(
      messagesRef,
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp
      } as Message;
    });
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
