# Messaging Service Tests

## Unit Test Prompts

### Test 1: Send Text Message
**Test**: sendMessage should create a message in the correct path
```typescript
// Setup
- Mock Firebase RTDB
- Create test conversationId
- Mock authenticated user

// Execute
- Call sendMessage(conversationId, "Hello World", "text")

// Assert
- Message written to /messages/{conversationId}/{messageId}
- Message contains: senderId, text, createdAt, type
- Conversation lastMessage updated
- Returns valid message ID
```

### Test 2: Send Message - Not Authenticated
**Test**: sendMessage should throw error when user not authenticated
```typescript
// Setup
- Mock Firebase auth with no current user

// Execute
- Call sendMessage(conversationId, "Hello", "text")

// Assert
- Throws error: "User must be authenticated to send messages"
- No data written to database
```

### Test 3: Send Message - Empty Text
**Test**: sendMessage should throw error for empty text message
```typescript
// Setup
- Mock authenticated user

// Execute
- Call sendMessage(conversationId, "", "text")

// Assert
- Throws error: "Message text cannot be empty"
- No data written to database
```

### Test 4: Send Image Message
**Test**: sendMessage should handle image messages with metadata
```typescript
// Setup
- Mock authenticated user
- Create image metadata: { fileName: "test.jpg", fileSize: 1024, mimeType: "image/jpeg" }
- Mock storage reference URL

// Execute
- Call sendMessage(conversationId, "Check this out!", "image", metadata, storageRef)

// Assert
- Message type is "image"
- storageRef field is set
- metadata field contains all properties
- Conversation lastMessage shows "Sent image"
```

### Test 5: onMessages Listener
**Test**: onMessages should call callback with sorted messages
```typescript
// Setup
- Mock conversation with 3 messages at different timestamps
- Mock RTDB onValue

// Execute
- Call onMessages(conversationId, callback)
- Trigger Firebase onValue callback with mock data

// Assert
- Callback called with array of messages
- Messages sorted by createdAt ascending
- Each message has id property
- Returns unsubscribe function
```

### Test 6: onMessages - No Messages
**Test**: onMessages should handle empty conversation
```typescript
// Setup
- Mock conversation with no messages
- Mock RTDB onValue returning null snapshot

// Execute
- Call onMessages(conversationId, callback)

// Assert
- Callback called with empty array []
- No errors thrown
```

### Test 7: Typing Indicator - Start
**Test**: startTyping should set ephemeral typing status
```typescript
// Setup
- Mock authenticated user
- Mock RTDB set and onDisconnect

// Execute
- Call startTyping(conversationId)

// Assert
- Sets /conversations/{conversationId}/typing/{uid} to true
- onDisconnect.remove() is called for auto-cleanup
```

### Test 8: Typing Indicator - Stop
**Test**: stopTyping should remove typing status
```typescript
// Setup
- Mock authenticated user with active typing status

// Execute
- Call stopTyping(conversationId)

// Assert
- Sets /conversations/{conversationId}/typing/{uid} to null
```

### Test 9: onTypingIndicators Listener
**Test**: onTypingIndicators should exclude current user
```typescript
// Setup
- Current user: "user1"
- Mock typing data: { user1: true, user2: true, user3: true }

// Execute
- Call onTypingIndicators(conversationId, callback)

// Assert
- Callback called with ["user2", "user3"]
- Current user "user1" excluded
```

### Test 10: User Presence - Set Online
**Test**: setUserPresence should update presence and set disconnect handler
```typescript
// Setup
- Mock authenticated user
- Mock RTDB set and onDisconnect

// Execute
- Call setUserPresence(true)

// Assert
- Sets /user_status/{uid} with { isOnline: true, lastSeen: timestamp }
- onDisconnect sets isOnline: false
```

### Test 11: User Presence - Set Offline
**Test**: setUserPresence should update to offline
```typescript
// Setup
- Mock authenticated user currently online

// Execute
- Call setUserPresence(false)

// Assert
- Sets /user_status/{uid} with { isOnline: false, lastSeen: timestamp }
- No onDisconnect handler set
```

### Test 12: onUserPresence Listener
**Test**: onUserPresence should listen to user status changes
```typescript
// Setup
- Mock user "user1" with presence data
- Mock RTDB onValue

// Execute
- Call onUserPresence("user1", callback)
- Simulate status change from online to offline

// Assert
- Callback called initially with online status
- Callback called again with offline status
- Returns unsubscribe function
```

---

## Integration Test Prompts

### Integration Test 1: Complete Message Flow
**Test**: End-to-end message sending and receiving
```typescript
// Setup
- Create real Firebase test instance
- Create test conversation
- Set up two mock users (sender, receiver)

// Execute
1. User1 calls sendMessage("Hello!")
2. User2's onMessages listener fires
3. User2 receives message

// Assert
- Message appears in User2's UI
- Message has correct sender, text, timestamp
- Conversation lastMessage updated
- Total time < 500ms
```

### Integration Test 2: Typing Indicator Flow
**Test**: Real-time typing indicator updates
```typescript
// Setup
- Create conversation with 2 users
- Set up listeners for both users

// Execute
1. User1 calls startTyping()
2. Wait 100ms
3. User2's onTypingIndicators fires
4. User1 calls stopTyping()
5. User2's listener updates

// Assert
- User2 sees User1 typing
- User2 sees typing stopped
- Typing auto-removes after 3 seconds
```

### Integration Test 3: Presence System
**Test**: Online/offline presence tracking
```typescript
// Setup
- Create test user
- Initialize presence system

// Execute
1. Call initializePresence()
2. Verify user shown as online
3. Simulate disconnect
4. Verify user shown as offline
5. Reconnect
6. Verify user back online

// Assert
- Presence changes propagate to all listeners
- onDisconnect handler works
- lastSeen timestamp updates correctly
```

### Integration Test 4: Optimistic UI Updates
**Test**: useMessaging hook with optimistic updates
```typescript
// Setup
- Render component using useMessaging hook
- Mock slow network (500ms delay)

// Execute
1. Call sendMessage("Test")
2. Check messages state immediately
3. Wait for network response
4. Check messages state again

// Assert
- Optimistic message appears immediately with pending: true
- After network response, pending message replaced with real message
- Message ID changes from optimistic to real
- UI shows smooth transition
```

### Integration Test 5: Error Handling
**Test**: Message sending with network failure
```typescript
// Setup
- Mock network failure for sendMessage
- Use useMessaging hook

// Execute
1. Call sendMessage("Test")
2. Simulate network error
3. Check message state

// Assert
- Optimistic message shows error: true
- Error toast displayed
- Failed message removed after 3 seconds
- User can retry sending
```

### Integration Test 6: Multiple Simultaneous Typing
**Test**: Multiple users typing at once
```typescript
// Setup
- Create conversation with 4 users
- Set up listener for User1

// Execute
1. User2 starts typing
2. User3 starts typing
3. User4 starts typing
4. User2 stops typing

// Assert
- User1 sees [User2, User3, User4] typing
- User1 sees [User3, User4] after User2 stops
- No duplicate entries
- Updates happen in real-time
```

### Integration Test 7: Message Ordering
**Test**: Messages maintain correct order
```typescript
// Setup
- Create conversation
- Send 10 messages rapidly

// Execute
1. Send messages with 10ms delay each
2. Retrieve messages via onMessages

// Assert
- All 10 messages received
- Messages in correct chronological order
- No duplicate messages
- Timestamps are sequential
```

### Integration Test 8: Presence During Page Visibility
**Test**: Presence updates based on page visibility
```typescript
// Setup
- Initialize presence system
- Mock document visibility API

// Execute
1. Verify user online
2. Simulate tab hidden (visibilitychange)
3. Verify user offline
4. Simulate tab visible
5. Verify user online again

// Assert
- Presence changes with tab visibility
- Event listeners properly attached
- Cleanup on unmount works
```

### Integration Test 9: Message Persistence
**Test**: Messages persist across reconnects
```typescript
// Setup
- Send 5 messages
- Disconnect from Firebase
- Reconnect

// Execute
1. Send messages
2. Disconnect
3. Reconnect
4. Call onMessages listener

// Assert
- All 5 messages still present
- No duplicate messages
- Order preserved
- Data integrity maintained
```

### Integration Test 10: Concurrent User Actions
**Test**: Multiple users interacting simultaneously
```typescript
// Setup
- Create conversation with 3 users
- All users set up listeners

// Execute
1. User1 sends message
2. User2 starts typing
3. User3 sends message
4. User1 stops typing
5. User2 sends message

// Assert
- All users receive all messages in correct order
- Typing indicators work correctly
- No race conditions
- All state updates consistent
```

---

## Performance Test Prompts

### Performance Test 1: Large Message History
**Test**: Loading conversation with 1000+ messages
```typescript
// Setup
- Create conversation with 1000 messages
- Measure load time

// Execute
- Call onMessages listener
- Measure time to callback

// Assert
- Initial load < 1 second
- Memory usage acceptable
- UI remains responsive
- Pagination recommended for production
```

### Performance Test 2: High Message Frequency
**Test**: Handling rapid message sending
```typescript
// Setup
- Create conversation
- Prepare 100 messages to send

// Execute
- Send 100 messages as fast as possible
- Monitor listener updates

// Assert
- All messages received
- No dropped messages
- UI updates smoothly
- Firebase rate limits not exceeded
```

### Performance Test 3: Memory Leak Check
**Test**: Ensure proper cleanup of listeners
```typescript
// Setup
- Create/destroy messaging components 100 times
- Monitor memory usage

// Execute
- Mount component (starts listeners)
- Unmount component (should cleanup)
- Repeat 100 times

// Assert
- Memory usage stays constant
- No listener leaks
- Proper unsubscribe calls
- Event listeners removed
```

---

## Test Execution Commands

```bash
# Unit tests
npm test -- --testPathPattern=messagingService.test.ts

# Integration tests
npm test -- --testPathPattern=messaging.integration.test.ts

# Performance tests
npm test -- --testPathPattern=messaging.performance.test.ts

# All messaging tests
npm test -- messaging

# With coverage
npm test -- --coverage messaging
```

---

## Mock Data Examples

### Mock Conversation
```typescript
const mockConversation = {
  id: "conv-123",
  participants: {
    "user-1": true,
    "user-2": true,
  },
  lastMessage: {
    text: "Hello",
    senderId: "user-1",
    createdAt: 1700000000000,
  },
  createdAt: 1699900000000,
  updatedAt: 1700000000000,
};
```

### Mock Message
```typescript
const mockMessage = {
  id: "msg-456",
  senderId: "user-1",
  text: "Hello World!",
  createdAt: 1700000000000,
  type: "text" as const,
};
```

### Mock Presence
```typescript
const mockPresence = {
  isOnline: true,
  lastSeen: 1700000000000,
};
```
