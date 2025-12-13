"""
WebSocket 连接管理器 - 支持实时双向通信
"""
import asyncio
import json
from typing import Dict, Set, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect


@dataclass
class ClientSession:
    """客户端会话"""
    websocket: WebSocket
    client_id: str
    connected_at: datetime = field(default_factory=datetime.now)
    is_active: bool = True
    metadata: Dict[str, Any] = field(default_factory=dict)


class ConnectionManager:
    """
    WebSocket 连接管理器
    
    管理多个客户端连接，支持：
    - 单播消息
    - 广播消息
    - 分组消息
    """
    
    def __init__(self):
        self.active_connections: Dict[str, ClientSession] = {}
        self.groups: Dict[str, Set[str]] = {}  # group_name -> set of client_ids
        
    async def connect(self, websocket: WebSocket, client_id: str) -> ClientSession:
        """接受新连接"""
        await websocket.accept()
        
        session = ClientSession(
            websocket=websocket,
            client_id=client_id
        )
        
        self.active_connections[client_id] = session
        
        print(f"✅ WebSocket 连接建立: {client_id}")
        
        # 发送欢迎消息
        await self.send_to_client(client_id, {
            "type": "connected",
            "client_id": client_id,
            "message": "连接成功，开始实时对话辅助"
        })
        
        return session
    
    def disconnect(self, client_id: str):
        """断开连接"""
        if client_id in self.active_connections:
            self.active_connections[client_id].is_active = False
            del self.active_connections[client_id]
            
            # 从所有组中移除
            for group in self.groups.values():
                group.discard(client_id)
            
            print(f"❌ WebSocket 连接断开: {client_id}")
    
    async def send_to_client(self, client_id: str, message: Dict):
        """发送消息给特定客户端"""
        if client_id in self.active_connections:
            session = self.active_connections[client_id]
            if session.is_active:
                try:
                    await session.websocket.send_json(message)
                except Exception as e:
                    print(f"发送消息失败: {e}")
                    self.disconnect(client_id)
    
    async def broadcast(self, message: Dict, exclude: Optional[Set[str]] = None):
        """广播消息给所有连接"""
        exclude = exclude or set()
        
        for client_id, session in list(self.active_connections.items()):
            if client_id not in exclude and session.is_active:
                try:
                    await session.websocket.send_json(message)
                except Exception:
                    self.disconnect(client_id)
    
    async def send_to_group(self, group_name: str, message: Dict):
        """发送消息给特定组"""
        if group_name not in self.groups:
            return
            
        for client_id in list(self.groups[group_name]):
            await self.send_to_client(client_id, message)
    
    def join_group(self, client_id: str, group_name: str):
        """加入组"""
        if group_name not in self.groups:
            self.groups[group_name] = set()
        self.groups[group_name].add(client_id)
    
    def leave_group(self, client_id: str, group_name: str):
        """离开组"""
        if group_name in self.groups:
            self.groups[group_name].discard(client_id)
    
    def get_active_count(self) -> int:
        """获取活跃连接数"""
        return len(self.active_connections)
    
    def get_client_ids(self) -> list:
        """获取所有客户端 ID"""
        return list(self.active_connections.keys())


# 全局连接管理器
connection_manager = ConnectionManager()
