数据库表结构设计
1. 用户表 (users)

|字段|	类型|	说明|
|--|--|--|
|id|	string|	用户ID（PeerID），主键|
|name|	string|	用户名|
|status|	enum|	在线状态：online / offline / away|
|avatar|	string (可选)|	头像URL或生成的头像|
|lastSeen|	number (可选)|	最后上线时间戳|
|createdAt|	number|	创建时间|
|updatedAt|	number|	更新时间|

2. 会话表 (chats)

|字段|	类型|	说明|
|--|--|--|
|id|	string|	会话ID（peerId 或 'broadcast'），主键|
|peerId|	string|	对方PeerID（广播时为 'broadcast'）|
|type|	enum|	会话类型：private / broadcast|
|name|	string (可选)|	会话名称|
|avatar|	string (可选)|	会话头像|
|unreadCount|	number|	未读消息数|
|lastMessage|	string (可选)|	最后一条消息预览|
|lastMessageTime|	number (可选)|	最后消息时间|
|createdAt|	number|	创建时间|
|updatedAt|	number|	更新时间|

3. 消息表 (messages)

|字段|	类型|	说明|
|--|--|--|
|id|	string|	消息唯一ID，主键|
|chatId|	string|	所属会话ID|
|from|	string|	发送者PeerID|
|to|	string|	接收者PeerID|
|type|	enum|	消息类型：text / file / image / video / audio / system|
|content|	string|	消息内容（文本或文件ID）|
|fileName|	string (可选)|	文件名
|fileSize|	number (可选)|	文件大小
|status|	enum|	消息状态：pending / sending / sent / delivered / read / failed|
|timestamp	|number|	发送时间