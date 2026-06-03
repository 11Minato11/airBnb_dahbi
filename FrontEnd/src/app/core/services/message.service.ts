import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Conversation {
  _id: string;
  propertyId: { _id: string; title: string; imageUrl?: string; address: { city: string; country: string } };
  hostId: { _id: string; firstName: string; lastName: string };
  guestId: { _id: string; firstName: string; lastName: string };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: { _id: string; firstName: string; lastName: string };
  content: string;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private http = inject(HttpClient);
  private readonly BASE = 'http://localhost:3000';

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.BASE}/conversations`);
  }

  getMessages(conversationId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.BASE}/conversations/${conversationId}/messages`);
  }

  createConversation(propertyId: string, hostId: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.BASE}/conversations`, { propertyId, hostId });
  }

  sendMessage(conversationId: string, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.BASE}/messages`, { conversationId, content });
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.BASE}/messages/unread`);
  }
}
