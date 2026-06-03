import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, Conversation, Message } from '../../core/services/message.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.component.html',
})
export class MessagesComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  conversations = signal<Conversation[]>([]);
  messages = signal<Message[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  newMessage = signal('');
  isLoading = signal(true);
  isSending = signal(false);

  private userId = '';
  private shouldScroll = false;

  ngOnInit() {
    const user: any = this.authService.getUser();
    this.userId = user?.id || user?._id || '';

    this.route.queryParams.subscribe((params: any) => {
      const propertyId = params['propertyId'];
      const hostId = params['hostId'];
      if (propertyId && hostId) {
        this.messageService.createConversation(propertyId, hostId).subscribe((conv: Conversation) => {
          this.loadConversations(conv._id);
        });
      } else {
        this.loadConversations();
      }
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  loadConversations(selectId?: string) {
    this.messageService.getConversations().subscribe({
      next: (data: Conversation[]) => {
        this.conversations.set(data);
        this.isLoading.set(false);
        if (selectId) {
          const conv = data.find((c: Conversation) => c._id === selectId);
          if (conv) this.selectConversation(conv);
        } else if (data.length > 0) {
          this.selectConversation(data[0]);
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation.set(conv);
    this.messageService.getMessages(conv._id).subscribe((msgs: Message[]) => {
      this.messages.set(msgs);
      this.shouldScroll = true;
      this.conversations.update((convs: Conversation[]) =>
        convs.map((c: Conversation) => c._id === conv._id ? { ...c, unreadCount: 0 } : c)
      );
    });
  }

  sendMessage() {
    const content = this.newMessage().trim();
    const conv = this.selectedConversation();
    if (!content || !conv || this.isSending()) return;

    this.isSending.set(true);
    this.messageService.sendMessage(conv._id, content).subscribe({
      next: (msg: Message) => {
        this.messages.update((msgs: Message[]) => [...msgs, msg]);
        this.newMessage.set('');
        this.isSending.set(false);
        this.shouldScroll = true;
        this.conversations.update((convs: Conversation[]) =>
          convs.map((c: Conversation) => c._id === conv._id ? { ...c, lastMessage: content.substring(0, 100), lastMessageAt: new Date().toISOString() } : c)
        );
      },
      error: () => this.isSending.set(false),
    });
  }

  isMine(msg: Message): boolean {
    const senderId = typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId as any)?._id;
    return senderId === this.userId;
  }

  getOtherName(conv: Conversation): string {
    if (!conv) return '';
    const isGuest = (conv.guestId as any)?._id === this.userId;
    const other = isGuest ? conv.hostId : conv.guestId;
    return other ? `${other.firstName} ${other.lastName}` : '';
  }

  getPropertyTitle(conv: Conversation): string {
    return (conv?.propertyId as any)?.title || 'Propriété';
  }

  getTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
