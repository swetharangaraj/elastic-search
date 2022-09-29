import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  public socket: any;
  constructor() {}

  setupSocketConnection() {
    this.socket = io(environment.SOCKET_ENDPOINT);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
