# DynamoDB Database Structure for Multiplayer Card Game

Based on the information you've provided about your multiplayer card game, I'll design a DynamoDB database structure that integrates with the AWS GameLift architecture we discussed earlier. Let me lay out the tables and fields needed, along with when they'll be updated during the game flow.

## Database Tables

### 1. Players Table

```
Table Name: Players
Primary Key: PlayerId (String)
GSI1: Username (String)
```

**Fields:**
- PlayerId (String, Partition Key) - Unique identifier, could be Cognito user ID
- Username (String, GSI1 Partition Key) - Player's display name
- Email (String) - For notifications
- TokenBalance (Number) - Player's permanent token stash
- CreatedAt (String) - ISO timestamp
- LastLoginAt (String) - ISO timestamp
- Stats (Map):
  - TotalSessionsPlayed (Number)
  - TotalGamesPlayed (Number)
  - TotalWinnings (Number)
  - WinRatio (Number)

**Update Timing:**
- Created when player registers via Cognito
- TokenBalance updated when a session ends and winnings are distributed
- Stats updated at the end of sessions and games
- LastLoginAt updated when player authenticates

### 2. Sessions Table

```
Table Name: Sessions
Primary Key: SessionId (String)
GSI1: {Status}-{CreatedAt} (String)
```

**Fields:**
- SessionId (String, Partition Key) - Unique identifier, could be GameLift session ID
- Status (String, GS1 Partition Key) - "WAITING", "IN_PROGRESS", "COMPLETED"
- CreatedAt (String) - ISO timestamp
- EndedAt (String) - ISO timestamp
- InitialPotSize (Number) - Starting tokens in the pot
- CurrentPotSize (Number) - Remaining tokens
- GameLiftData (Map):
  - FleetId (String)
  - GameSessionId (String)
  - IpAddress (String)
  - Port (Number)
- PlayerCount (Number) - Number of players in session
- CurrentGameId (String) - Reference to the current game being played
- GameCount (Number) - Total games played in this session

**Update Timing:**
- Created when GameLift creates a new match
- Status updated during session lifecycle
- CurrentPotSize updated after each game
- CurrentGameId updated when a new game starts
- GameCount incremented when a new game starts
- EndedAt updated when pot is empty and session ends

### 3. Games Table

```
Table Name: Games
Primary Key: GameId (String)
GSI1: SessionId-GameNumber (String)
```

**Fields:**
- GameId (String, Partition Key) - Unique identifier
- SessionId (String) - Reference to parent session
- GameNumber (Number) - Sequence number within session
- Status (String) - "STARTING", "IN_PROGRESS", "COMPLETED"
- StartedAt (String) - ISO timestamp
- EndedAt (String) - ISO timestamp
- Pot (Number) - Tokens at stake in this game
- WinnerId (String) - PlayerId of the winner
- DeckSeed (String) - Seed used for card shuffling
- GameState (Map) - Game-specific state data
- RoundNumber (Number) - Current round in the game

**Update Timing:**
- Created when a new game begins in a session
- Status updated during game lifecycle
- GameState updated on every player action
- WinnerId and EndedAt updated when game completes
- Pot updated when game ends and winner is determined

### 4. PlayerSessions Table

```
Table Name: PlayerSessions
Primary Key: {PlayerId}-{SessionId} (String)
GSI1: SessionId (String)
GSI2: PlayerId-Status (String)
```

**Fields:**
- PlayerId-SessionId (String, Partition Key) - Composite key
- PlayerId (String, GSI1 Partition Key) - Reference to player
- SessionId (String, GSI2 Partition Key) - Reference to session
- Status (String) - "ACTIVE", "LEFT", "COMPLETED"
- JoinedAt (String) - ISO timestamp
- LeftAt (String) - ISO timestamp
- InitialTokens (Number) - Tokens at start of session
- CurrentTokens (Number) - Current token count
- GamesPlayed (Number) - Games played in this session
- GamesWon (Number) - Games won in this session

**Update Timing:**
- Created when player joins a GameLift session
- CurrentTokens updated after each game
- GamesPlayed incremented after each game
- GamesWon incremented when player wins a game
- Status and LeftAt updated if player disconnects or session ends

### 5. PlayerGames Table

```
Table Name: PlayerGames
Primary Key: {PlayerId}-{GameId} (String)
GSI1: GameId (String)
GSI2: PlayerId-SessionId (String)
```

**Fields:**
- PlayerId-GameId (String, Partition Key) - Composite key
- PlayerId (String) - Reference to player
- GameId (String, GSI1 Partition Key) - Reference to game
- PlayerId-SessionId (String, GSI2 Partition Key) - Composite key
- SessionId (String) - Reference to session
- Position (Number) - Player's seat/position
- InitialCards (List) - Initial cards dealt
- Actions (List) - All actions taken during game
- Outcome (String) - "WIN", "LOSE"
- TokensWagered (Number) - Tokens player bet
- TokensWon (Number) - Tokens player won
- FinalCards (List) - Cards at end of game

**Update Timing:**
- Created when player joins a game
- InitialCards populated when cards are dealt
- Actions updated on each player move
- Outcome, TokensWon, and FinalCards updated when game ends

## Data Flow in Game Process

Here's how these tables integrate with the AWS GameLift flow we discussed earlier:

1. **Authentication (Cognito)**:
   - Player record validated in Players table
   - LastLoginAt updated

2. **Matchmaking Request (API Gateway → Lambda)**:
   - Lambda reads player skill from Players table
   - Submits matchmaking request to GameLift

3. **Match Found (GameLift → SNS → Lambda)**:
   - Sessions table entry created
   - PlayerSessions entries created for all matched players

4. **Game Server Connection**:
   - When players connect to game server, update PlayerSessions status

5. **Game Start**:
   - Games table entry created
   - PlayerGames entries created for all participants

6. **Game Progress**:
   - PlayerGames.Actions updated with each move
   - Games.GameState updated with game progression

7. **Game End**:
   - Games entry updated with winner and final state
   - PlayerGames entries updated with outcomes
   - PlayerSessions entries updated with new token counts
   - Sessions.CurrentPotSize and Sessions.CurrentGameId updated

8. **Session End (Pot Empty)**:
   - Sessions status updated to COMPLETED
   - PlayerSessions status updated to COMPLETED
   - Players.TokenBalance updated with final winnings

## DynamoDB Design Considerations

1. **Partition Key Selection**: Each table has carefully selected partition keys to distribute data evenly and support efficient queries.

2. **Global Secondary Indexes (GSIs)**: Added to support access patterns like:
   - Find all players in a session (GSI1 on PlayerSessions)
   - Find all games in a session (GSI1 on Games)
   - Find all sessions a player has participated in (GSI2 on PlayerSessions)

3. **Composite Keys**: Used for relationships (like PlayerSessions and PlayerGames) to support efficient querying.

4. **Denormalization**: Some data is duplicated across tables to optimize query performance (like SessionId in PlayerGames).
