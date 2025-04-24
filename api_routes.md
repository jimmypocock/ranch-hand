# Card Game API Routes

| Route                         | Method | Description         | Service/Function             | Authorization |
|-------------------------------|--------|---------------------|------------------------------|---------------|
| `/auth/register`              | POST   | Register new player | `AuthFunction`               | None          |
| `/auth/login`                 | POST   | Login to get tokens | `AuthFunction`               | None          |
| `/players/profile`            | GET    | Get player details  | `PlayerFunction`             | Cognito       |
| `/players/balance`            | GET    | Get token balance   | `PlayerFunction`             | Cognito       |
| `/matchmaking`                | POST   | Request matchmaking | `MatchmakingRequestFunction` | Cognito       |
| `/matchmaking/status`         | GET    | Check match status  | `MatchStatusFunction`        | Cognito       |
| `/matchmaking/cancel`         | DELETE | Cancel matchmaking  | `MatchCancelFunction`        | Cognito       |
| `/sessions/{sessionId}`       | GET    | Get session details | `SessionFunction`            | Cognito       |
| `/sessions/{sessionId}/join`  | POST   | Join a session      | `SessionFunction`            | Cognito       |
| `/sessions/{sessionId}/leave` | POST   | Leave a session     | `SessionFunction`            | Cognito       |
| `/games/{gameId}`             | GET    | Get game state      | `GameStateFunction`          | Cognito       |
| `/games/{gameId}/action`      | POST   | Make game move      | `GameActionFunction`         | Cognito       |
| `/games/history`              | GET    | Get game history    | `GameHistoryFunction`        | Cognito       |