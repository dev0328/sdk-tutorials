---
title: "CosmJS on a Backend Script for Game Indexing"
order: 6
description: Introduce a Web2.0 server to track games per player
tag: deep-dive
---

# CosmJS on a Backend Script for Game Indexing

Now that your blockchain is complete, you can think about additional data and services that would add value without increasing cost or complexity on-chain.

For example, how do you list all of a player's games? Currently this information is not easily available. You can find the players of a given game, but not the games of a given player. Indexing this on-chain would add storage and computation costs.

## Server idea

To implement this functionality, build a Web 2.0 server to do the indexing. The server:

1. Listens to updates from the Checkers chain:
    1. On a game creation event, adds the game ID under each player.
    2. On a game deletion event, removes it. This happens either because of a rejection or in an end-block.
2. When asked about its status, returns the latest block height up to which it has indexed players.
3. When asked about a given player, returns the list of game IDs for this player.
4. When a game ID is submitted, patches its information about that game ID (to palliate potential de-synchronization).

## Barebones server

As a fast and simple Web 2.0 solution, navigate to the [CosmJS repository](https://github.com/cosmos/academy-checkers-ui) for the checkers blockchain and perform the following steps:

1. Create a sub-directory of the `src` folder (e.g. `server`).
2. Use the `express` Node.js module to create an HTTP REST API.
3. Use a local `db.json` as a _database_. This is obviously primitive and not thread-safe. In a production setting use a proper database.
4. Poll the blockchain at regular intervals. As part of an advanced topic, you can use WebSockets.

```sh
$ cd src/server
$ npm install express@4.17.3 --save-exact
$ npm install ts-node@10.7.0 @types/express@4.17.13 --save-dev --save-exact
```

### Data types

To keep the code type-safe, define the types of your `db.json` in `types.ts`:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/2e400d1/src/server/types.ts#L1-L30]
export interface LatestBlockStatus {
    height: number
}

export interface DbStatus {
    block: LatestBlockStatus
}

export interface PlayerInfo {
    gameIds: string[]
}

export interface PlayersInfo {
    [playerAddress: string]: PlayerInfo
}

export interface GameInfo {
    redAddress: string
    blackAddress: string
}

export interface GamesInfo {
    [gameId: string]: GameInfo
}

export interface DbType {
    status: DbStatus
    players: PlayersInfo
    games: GamesInfo
}
```

Not only does this keep information about players, it also keeps a copy of games. This gets around a current limitation of CosmJS, where you cannot get information about a game that has just been erased from the latest state. In practice you would need to query the game at an earlier block height, but this functionality is not available. Note that nodes may prune the old state, especially if they migrate, which may unpredictably impact any query at an earlier block height.

<HighlightBox type="info">

In blockchain, when "deleted" records are materially important, use a soft delete that removes them from the set of active records but doesn't terminate their existence. This principle helps ensure that historically important information is available at the latest block height.

</HighlightBox>

### Empty indexer module

A barebones server without any Cosmos elements is defined in an `indexer.ts`. This is not CosmJS related, so start from something else if you prefer.

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/20e6149/src/server/indexer.ts]
import { writeFile } from "fs/promises"
import { Server } from "http"
import express, { Express, Request, Response } from "express"
import { DbType } from "./types"

export const createIndexer = async () => {
    const port = "3001"
    const dbFile = `${__dirname}/db.json`
    const db: DbType = require(dbFile)
    const pollIntervalMs = 5_000 // 5 seconds
    let timer: NodeJS.Timer | undefined

    const app: Express = express()
    app.get("/", (req: Request, res: Response) => {
        res.send({
            error: "Not implemented",
        })
    })

    app.get("/status", (req: Request, res: Response) => {
        res.json({
            block: {
                height: db.status.block.height,
            },
        })
    })

    app.get("/players/:playerAddress", (req: Request, res: Response) => {
        res.json({
            gameCount:
                db.players[req.params.playerAddress]?.gameIds?.length ?? 0,
                gameIds: db.players[req.params.playerAddress]?.gameIds ?? [],
        })
    })

    app.get(
        "/players/:playerAddress/gameIds", (req: Request, res: Response) => {
            res.json(db.players[req.params.playerAddress]?.gameIds ?? [])
        }
    )

    app.patch("/games/:gameId", (req: Request, res: Response) => {
        res.json({
            result: "Not implemented",
        })
    })

    const saveDb = async () => {
        await writeFile(dbFile, JSON.stringify(db, null, 4))
    }

    const init = async () => {
        setTimeout(poll, 1)
    }

    const poll = async () => {
        console.log(new Date(Date.now()).toISOString(), "TODO poll")
        timer = setTimeout(poll, pollIntervalMs)
    }

    process.on("SIGINT", () => {
        if (timer) clearTimeout(timer)
        saveDb()
            .then(() => {
                console.log(`${dbFile} saved`)
            })
            .catch(console.error)
            .finally(() => {
                server.close(() => {
                    console.log("server closed")
                    process.exit(0)
                })
            })
    })

    const server: Server = app.listen(port, () => {
        init()
            .catch(console.error)
            .then(() => {
                console.log(`\nserver started at http://localhost:${port}`)
            })
    })
}
```

<HighlightBox type="note">

Note:

1. The timer is set at the end of the previous poll, in case indexing takes longer than the interval.
2. The _database_ is purely in memory as it runs and is saved on exit by catching the interruption signal.

</HighlightBox>

### Files for execution

Prepare these files around the `indexer` to run it in the terminal:

1. Create an `index.ts` that describes how to run the `indexer`:

    ```typescript [https://github.com/cosmos/academy-checkers-ui/blob/31c05e1/src/server/index.ts]
    require("./indexer").createIndexer().then(console.log).catch(console.error)
    export {}
    ```

   The `export {}` prevents Visual Studio Code from complaining.

2. Add a specific `tsconfig.json` file if necessary:

    ```json [https://github.com/cosmos/academy-checkers-ui/blob/6f6d9bd/src/server/tsconfig.json]
    {
        "extends": "../../tsconfig.json",
        "compilerOptions": {
            "target": "ESNext",
            "isolatedModules": false,
            "module": "CommonJS"
        }
    }
    ```

3. In `package.json`, add a `run` target:

    ```json [https://github.com/cosmos/academy-checkers-ui/blob/31c05e1/package.json#L12]
    "scripts": {
        ...
        "indexer-dev": "npx ts-node src/server/index.ts"
    }
    ```

4. Add your _database_, `db.json`:

    ```json [https://github.com/cosmos/academy-checkers-ui/blob/31c05e1/src/server/db.json.sample]
    {
        "status": {
            "block": {
                "height": 0
            }
        },
        "players": {},
        "games": {}
    }
    ```

    You cannot ask for block at height `0`, so the indexer first asks for the next block at `1`.

### Quick test

Check the `indexer` works:

```sh
$ npm run indexer-dev
```

It should print:

```
> checkers-server@1.0.0 dev
> npx ts-node index.ts

server started at http://localhost:3001
```

Now test the endpoints. Omit the `| jq` beautifier if it is not installed on your system:

<CodeGroup>
<CodeGroupItem title="status" active>

```sh
$ curl localhost:3001/status | jq
```

It should return:

```json
{
  "block": {
    "height": -1
  }
}
```

</CodeGroupItem>
<CodeGroupItem title="player info">

```sh
$ curl localhost:3001/players/cosmos123 | jq
```

It should return:

```json
{
  "gameCount": 0,
  "gameIds": []
}
```

</CodeGroupItem>
<CodeGroupItem title="player games">

```sh
$ curl localhost:3001/players/cosmos123/gameIds | jq
```

It should return:

```json
[]
```

</CodeGroupItem>
<CodeGroupItem title="game update">

```sh
$ curl -X PATCH localhost:3001/games/445 | jq
```

It should return:

```json
{
  "result": "Not implemented"
}
```

</CodeGroupItem>
</CodeGroup>

---

## Add CosmJS `StargateClient`

You need to create a client to connect to your Checkers blockchain. The client only needs read-only functionality because this server does not submit transactions. Your repository already contains useful elements:

* The `CheckersStargateClient`.
* An [`.env`](https://github.com/cosmos/academy-checkers-ui/blob/2e400d1/.env) file.

Add the following to `indexer.ts`:

1. The declarations:

    ```typescript [https://github.com/cosmos/academy-checkers-ui/blob/6f6d9bd/src/server/indexer.ts#L1-L5]
    import { config } from "dotenv"
    import { CheckersStargateClient } from "../checkers_stargateclient"
    ```

    The pickup of `RPC_URL`:

    ```typescript [https://github.com/cosmos/academy-checkers-ui/blob/6f6d9bd/src/server/indexer.ts#L8]
    config()
    ```

    The client in the indexer:

    ```typescript [https://github.com/cosmos/academy-checkers-ui/blob/6f6d9bd/src/server/indexer.ts#L16]
    let client: CheckersStargateClient
    ```

2. The modified `init`:

    ```typescript [https://github.com/cosmos/academy-checkers-ui/blob/6f6d9bd/src/server/indexer.ts#L54-L58]
    const init = async() => {
        client = await CheckersStargateClient.connect(process.env.RPC_URL!)
        console.log("Connected to chain-id:", await client.getChainId())
        setTimeout(poll, 1)
    }
    ```
3. The modified `poll`:

    ```typescript [https://github.com/cosmos/academy-checkers-ui/blob/6f6d9bd/src/server/indexer.ts#L60-L70]
    const poll = async() => {
        const currentHeight = await client.getHeight()
        console.log(
            new Date(Date.now()).toISOString(),
            "Current heights:",
            db.status.block.height,
            "<=",
            currentHeight,
        )
        timer = setTimeout(poll, pollIntervalMs)
    }
    ```

The `.env` file contains the `RPC_URL`, adjust it to your situation. If necessary, launch the Checkers blockchain:

* If you are running it locally with Ignite CLI:

    ```sh
    $ ignite chain serve
    ```

* If not, follow the relevant instructions to run it, or access a testnet.

Relaunch `npm run indexer-dev`. You should see the current height rising:

```
Connected to chain-id: checkers

server started at http://localhost:3001
2022-04-20T17:46:29.962Z Current heights: -1 <= 1353
2022-04-20T17:46:34.968Z Current heights: -1 <= 1357
```

## Handle blocks

To index games, take each block and listen for the following relevant events:

1. A transaction with a `NewGameCreated` event.
2. A transaction with a `GameRejected` event.
3. An `EndBlock` with a `GameForfeited` event.

Start by getting each block from your last saved state. Update `poll`:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/b030b2f/src/server/indexer.ts#L64-L79]
const poll = async () => {
    const currentHeight = await client.getHeight()
    if (db.status.block.height <= currentHeight - 100)
        console.log(`Catching up ${db.status.block.height}..${currentHeight}`)
    while (db.status.block.height < currentHeight) {
        const processing = db.status.block.height + 1
        process.stdout.cursorTo(0)
        // Get the block
        const block: Block = await client.getBlock(processing)
        process.stdout.write(`Handling block: ${processing} with ${block.txs.length} txs`)
        // Function yet to be declared
        await handleBlock(block)
        db.status.block.height = processing
    }
    await saveDb()
    timer = setTimeout(poll, pollIntervalMs)
}
```

This needs a new import:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/b030b2f/src/server/indexer.ts#L3]
import { Block } from "@cosmjs/stargate"
```

The indexer:

* Declares a new function `handleBlock`. Create one and put `console.log(block)` inside to explore what this object is and consider what actions you would take with it.
* Saves the `db` after a poll, so _you_ can watch it in real time.
* Uses `process.stdout.write` and `process.stdout.cursorTo(0)` so that the repetitive logging happens on a single line.

Observe the relevant content in `handleBlock`. It must:

1. Extract the events from transactions.
2. Extract the events from `EndBlock`.

If you examine `block.txs` directly you find transactions as they were posted. However, this does not reveal any execution results, such as if a transaction executed as expected or what game ID it used for the new game. To get this extra information:

1. Calculate `txHash` from the transaction.
2. Call `await client.getTx(txHash)`, which returns an `IndexedTx`.

The `handleBlock` function can be:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/b030b2f/src/server/indexer.ts#L81-L92]
const handleBlock = async (block: Block) => {
    if (0 < block.txs.length) console.log("")
    let txIndex = 0
    while (txIndex < block.txs.length) {
        const txHash: string = toHex(sha256(block.txs[txIndex])).toUpperCase()
        const indexed: IndexedTx | null = await client.getTx(txHash)
        if (!indexed) throw new Error(`Could not find indexed tx: ${txHash}`)
        // Function yet to be declared
        await handleTx(indexed)
        txIndex++
    }
    // TODO handle EndBlock
}
```

This needs new imports:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/b030b2f/src/server/indexer.ts#L1-L3]
import { sha256 } from "@cosmjs/crypto"
import { toHex } from "@cosmjs/encoding"
import { Block, IndexedTx } from "@cosmjs/stargate"
```

<HighlightBox type="note">

* `while() {}` simplifies the syntax of `await`ing multiple times.
* The hash is calculated this way as per [here](https://github.com/cosmos/cosmjs/blob/902f21b/packages%2Fstargate%2Fsrc%2Fstargateclient.ts#L74).
* `console.log("")` puts a new line (`poll` does a `process.stdout.write` which adds no line).
* The `handleBlock` function uses a new function, `handleTx`. Create one and put `console.log(indexed)` inside to explore what this object is and consider what actions you can take with it.
* The `EndBlock` part has not yet been incorporated. This is explained in **Prepare for EndBlock**.

</HighlightBox>

## Handle a transaction

Define the `handleTx` function:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/b030b2f/src/server/indexer.ts#L94-L98]
const handleTx = async (indexed: IndexedTx) => {
    const rawLog: any = JSON.parse(indexed.rawLog)
    const events: StringEvent[] = rawLog.flatMap((log: ABCIMessageLog) => log.events)
    // Function yet to be declared
    await handleEvents(events)
}
```

This needs new imports:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/b030b2f/src/server/indexer.ts#L4]
import { ABCIMessageLog, StringEvent } from "cosmjs-types/cosmos/base/abci/v1beta1/abci"
```

<HighlightBox type="note">

* [`.flatMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap) transforms an array of arrays into a flattened array.
* The `handleTx` function uses a new function, `handleEvents`. Create one and put `console.log(events)` in it to explore what this object is and consider what actions you can take with it.

</HighlightBox>

## Handle events

Define the `handleEvents` function:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/b030b2f/src/server/indexer.ts#L100-L118]
const handleEvents = async (events: StringEvent[]): Promise<void> => {
    try {
        const myEvents: StringEvent[] = events
            .filter((event: StringEvent) => event.type === "message")
            .filter((event: StringEvent) =>
                event.attributes.some(
                    (attribute: Attribute) =>
                        attribute.key === "module" && attribute.value === "checkers",
                ),
            )
        let eventIndex = 0
        while (eventIndex < myEvents.length) {
            // Function yet to be declared
            await handleEvent(myEvents[eventIndex])
            eventIndex++
        }
    } catch (e) {
        // Skipping if the handling failed. Most likely the transaction failed.
    }
}
```

This needs a new import:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/b030b2f/src/server/indexer.ts#L4]
import { ABCIMessageLog, Attribute, StringEvent } from "cosmjs-types/cosmos/base/abci/v1beta1/abci"
```

<HighlightBox type="note">

* `while() {}` simplifies the syntax of `await`ing multiple times.
* The `handleEvents` function only keeps events that have a `message` type.
* It only keeps events that emanate from the `checkers` module.
* It uses a new function, `handleEvent`. Create one and put `console.log(event)` inside to explore what this object is and consider what actions you can take with it.

</HighlightBox>

## Handle one event

Define `handleEvent` as follows:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/b030b2f/src/server/indexer.ts#L120-L134]
const handleEvent = async (event: StringEvent): Promise<void> => {
    const isActionOf = (actionValue: string): boolean =>
        event.attributes.some(
            (attribute: Attribute) => attribute.key === "action" && attribute.value === actionValue,
        )
    if (isActionOf("NewGameCreated")) {
        // Function yet to be declared
        await handleEventCreate(event)
    }
    if (isActionOf("GameRejected")) {
        // Function yet to be declared
        await handleEventReject(event)
    }
    if (isActionOf("MovePlayed")) {
        // Function yet to be declared
        await handleEventPlay(event)
    }
}
```

<HighlightBox type="note">

* [`NewGameCreated`](https://github.com/cosmos/b9-checkers-academy-draft/blob/9a22cd21/x/checkers/types/keys.go#L50), [`GameRejected`](https://github.com/cosmos/b9-checkers-academy-draft/blob/9a22cd21/x/checkers/types/keys.go#L60), and [`MovePlayed`](https://github.com/cosmos/b9-checkers-academy-draft/blob/9a22cd21/x/checkers/types/keys.go#L66) are constant values defined in your Go code. They were associated with a `key` of [`"action"`](https://github.com/cosmos/b9-checkers-academy-draft/blob/9a22cd21/x/checkers/keeper/msg_server_create_game.go#L52).
* Because events are arrays of key/value pairs you must go through them to find what you want, unless you proactively index events as part of a later optimization.
* `handleEvent` uses three new functions: `handleEventCreate`, `handleEventReject`, and `handleEventPlay`. Create them and put `console.log(event)` inside each to explore what these objects are and consider what actions you would take with them.

</HighlightBox>

## Handle one create event

Now update your `db` with the information provided. First, define a convenience function in `createIndexer`:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/b030b2f/src/server/indexer.ts#L191-L193]
const getAttributeValueByKey = (attributes: Attribute[], key: string): string | undefined => {
    return attributes.find((attribute: Attribute) => attribute.key === key)?.value
}
```

Now define `handleEventCreate` as:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/b030b2f/src/server/indexer.ts#L136-L158]
const handleEventCreate = async (event: StringEvent): Promise<void> => {
    const newId: string | undefined = getAttributeValueByKey(event.attributes, "Index")
    if (!newId) throw new Error(`Create event missing Index`)
    const blackAddress: string | undefined = getAttributeValueByKey(event.attributes, "Black")
    if (!blackAddress) throw new Error(`Create event missing Black address`)
    const redAddress: string | undefined = getAttributeValueByKey(event.attributes, "Red")
    if (!redAddress) throw new Error(`Create event missing Red address`)
    console.log(`New game: ${newId}, black: ${blackAddress}, red: ${redAddress}`)
    const blackInfo: PlayerInfo = db.players[blackAddress] ?? {
        gameIds: [],
    }
    const redInfo: PlayerInfo = db.players[redAddress] ?? {
        gameIds: [],
    }
    if (blackInfo.gameIds.indexOf(newId) < 0) blackInfo.gameIds.push(newId)
    if (redInfo.gameIds.indexOf(newId) < 0) redInfo.gameIds.push(newId)
    db.players[blackAddress] = blackInfo
    db.players[redAddress] = redInfo
    db.games[newId] = {
        redAddress: redAddress,
        blackAddress: blackAddress,
    }
}
```

<HighlightBox type="note">

* [`Index`](https://github.com/cosmos/b9-checkers-academy-draft/blob/9a22cd21/x/checkers/keeper/msg_server_create_game.go#L54), [`Black`](https://github.com/cosmos/b9-checkers-academy-draft/blob/9a22cd21/x/checkers/keeper/msg_server_create_game.go#L56), and [`Red`](https://github.com/cosmos/b9-checkers-academy-draft/blob/9a22cd21/x/checkers/keeper/msg_server_create_game.go#L55) are constants from the Go code.
* You have implemented error handling.
* `handleEventCreate` is careful not to double-add a given game ID.
* It does not save `db` as this is under the purview of `poll()`.

</HighlightBox>

## Handle one reject event

`handleEventReject` is the counterpart of `handleEventCreate`, as it removes games from the system.

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/b030b2f/src/server/indexer.ts#L160-L172]
const handleEventReject = async (event: StringEvent): Promise<void> => {
    const rejectedId: string | undefined = getAttributeValueByKey(event.attributes, "IdValue")
    if (!rejectedId) throw new Error(`Reject event missing rejectedId`)
    const blackAddress: string | undefined = db.games[rejectedId]?.blackAddress
    const redAddress: string | undefined = db.games[rejectedId]?.redAddress
    const blackGames: string[] = db.players[blackAddress]?.gameIds ?? []
    const redGames: string[] = db.players[redAddress]?.gameIds ?? []
    console.log(`Reject game: ${rejectedId}, black: ${blackAddress}, red: ${redAddress}`)
    const indexInBlack: number = blackGames.indexOf(rejectedId)
    if (0 <= indexInBlack) blackGames.splice(indexInBlack, 1)
    const indexInRed: number = redGames.indexOf(rejectedId)
    if (0 <= indexInRed) redGames.splice(indexInRed, 1)
}
```

<HighlightBox type="note">

* `handleEventReject` keeps the game information in the `db`. This is a debatable choice, but helps the `patch` function identify old games that once existed as opposed to games that never existed.
* There is additional error handling.

</HighlightBox>

## Handle one play event

Not all play events are equal. `handleEventPlay` is only interested when there is a winner. Until then, there is no need to take any action.

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/b030b2f/src/server/indexer.ts#L174-L189]
const handleEventPlay = async (event: StringEvent): Promise<void> => {
    const playedId: string | undefined = getAttributeValueByKey(event.attributes, "IdValue")
    if (!playedId) throw new Error(`Play event missing rejectedId`)
    const winner: string | undefined = getAttributeValueByKey(event.attributes, "Winner")
    if (!winner) throw new Error("Play event missing winner")
    if (winner === "NO_PLAYER") return
    const blackAddress: string | undefined = db.games[playedId]?.blackAddress
    const redAddress: string | undefined = db.games[playedId]?.redAddress
    const blackGames: string[] = db.players[blackAddress]?.gameIds ?? []
    const redGames: string[] = db.players[redAddress]?.gameIds ?? []
    console.log(`Win game: ${playedId}, black: ${blackAddress}, red: ${redAddress}, winner: ${winner}`)
    const indexInBlack: number = blackGames.indexOf(playedId)
    if (0 <= indexInBlack) blackGames.splice(indexInBlack, 1)
    const indexInRed: number = redGames.indexOf(playedId)
    if (0 <= indexInRed) redGames.splice(indexInRed, 1)
}
```

<HighlightBox type="note">

* `handleEventPlay` returns quietly if there is no winner.
* As when there is a rejected game, it keeps the game information in the `db`.

</HighlightBox>

## Test time

You can now test what happens when a game is created and rejected. Restart `npm run indexer-dev`.

You can choose how to create and reject games:

* Run the GUI with `npm start`, although it does not have a reject function at the time of writing.
* Run `checkersd` command lines.
* Any other way available.

And in another terminal 3:

<CodeGroup>
<CodeGroupItem title="Create game">

```sh
$ checkersd tx checkers create-game $alice $bob 1 token --from $alice
```

Alternatively, use a GUI if preferred. The indexer should log something like:

```
New game: 1, black: cosmos1ac6srz8wh848zc08wrfghyghuf5cf3tvd45pnw, red: cosmos1t88fkwurlnusf6agvptsnm33t40kr4hlq6h08s
```

It should update `db.json` to:

```json
{
    "status": {
        "block": {
            "height": 100
        }
    },
    "players": {
        "cosmos1ac6srz8wh848zc08wrfghyghuf5cf3tvd45pnw": {
            "gameIds": [
                "1"
            ]
        },
        "cosmos1t88fkwurlnusf6agvptsnm33t40kr4hlq6h08s": {
            "gameIds": [
                "1"
            ]
        }
    },
    "games": {
        "1": {
            "redAddress": "cosmos1t88fkwurlnusf6agvptsnm33t40kr4hlq6h08s",
            "blackAddress": "cosmos1ac6srz8wh848zc08wrfghyghuf5cf3tvd45pnw"
        }
    }
}
```

</CodeGroupItem>
<CodeGroupItem title="Reject game">


```sh
$ checkersd tx checkers reject-game 1 --from $bob -y
```

The indexer should log something like:

```
Reject game: 1, black: cosmos1ac6srz8wh848zc08wrfghyghuf5cf3tvd45pnw, red: cosmos1t88fkwurlnusf6agvptsnm33t40kr4hlq6h08s
```

It should update `db.json` to:

```json
{
    "status": {
        "block": {
            "height": 100
        }
    },
    "players": {
        "cosmos1ac6srz8wh848zc08wrfghyghuf5cf3tvd45pnw": {
            "gameIds": []
        },
        "cosmos1t88fkwurlnusf6agvptsnm33t40kr4hlq6h08s": {
            "gameIds": []
        }
    },
    "games": {
        "1": {
            "redAddress": "cosmos1t88fkwurlnusf6agvptsnm33t40kr4hlq6h08s",
            "blackAddress": "cosmos1ac6srz8wh848zc08wrfghyghuf5cf3tvd45pnw"
        }
    }
}
```

</CodeGroupItem>
<CodeGroupItem title="Play game">


```sh
$ checkersd tx checkers play-move 1 1 2 2 3 --from $bob -y
```

In this case the indexer should not log anything. Because performing moves from the command line is laborious, using the GUI is advisable.

</CodeGroupItem>
</CodeGroup>

---

What remains is handling the games that get removed or forfeited in `EndBlock`.

## Prepare for `EndBlock`

Nicely formatted `EndBlock` events are still missing from CosmJS, so these require a little extra work:

1. To get a block's `EndBlock` events, you need to ask for the block information from a Tendermint client. This client is a [`private` field](https://github.com/cosmos/cosmjs/blob/902f21b/packages%2Fstargate%2Fsrc%2Fstargateclient.ts#L140) of `StargateClient`.
2. The function to call is [`blockResults`](https://github.com/cosmos/cosmjs/blob/5ee3f82/packages/tendermint-rpc/src/tendermint34/tendermint34client.ts#L88).
3. It returns a [`BlockResultsResponse`](https://github.com/cosmos/cosmjs/blob/ca969f2/packages/tendermint-rpc/src/tendermint34/responses.ts#L55), of which `endBlockEvents: Event` is of interest.
4. This [`Event`](https://github.com/cosmos/cosmjs/blob/ca969f2/packages/tendermint-rpc/src/tendermint34/responses.ts#L182) type has `attributes: Attribute[]` of interest.
5. The [`Attribute`](https://github.com/cosmos/cosmjs/blob/ca969f2/packages/tendermint-rpc/src/tendermint34/responses.ts#L177-L180) type is coded as `Uint8Array`.

With this information, you can do the necessary actions:

1. To handle the conversion of Tendermint `Event`s into `StringEvent`s, create a helper in your existing `src/types/checkers/events.ts` file alongside the `getCreatedGameId` helper:

    ```typescript [https://github.com/cosmos/academy-checkers-ui/blob/d623ae0/src/types/checkers/events.ts#L12-L24]
    import { fromUtf8 } from "@cosmjs/encoding"
    import { Attribute as TendermintAttribute, Event } from "@cosmjs/tendermint-rpc"
    import { Attribute, StringEvent } from "cosmjs-types/cosmos/base/abci/v1beta1/abci"

    export const convertTendermintEvents = (events: readonly Event[]): StringEvent[] => {
        return events.map(
            (event: Event): StringEvent => ({
                type: event.type,
                attributes: event.attributes.map(
                    (attribute: TendermintAttribute): Attribute => ({
                        key: fromUtf8(attribute.key),
                        value: fromUtf8(attribute.value),
                    }),
                ),
            }),
        )
    }
    ```

2. To handle the call to `blockResults`, you need access to a Tendermint client. One option is to make a copy of the private Tendermint client. You can do this only on construction, so create a child class of `CheckersStargateClient` to do that. It is recommended to keep it close by `indexer.ts`. In a new `indexer_stargateclient.ts`:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/d623ae0/src/server/indexer_stargateclient.ts]
import { StargateClientOptions } from "@cosmjs/stargate"
import { BlockResultsResponse, Tendermint34Client } from "@cosmjs/tendermint-rpc"
import { StringEvent } from "cosmjs-types/cosmos/base/abci/v1beta1/abci"
import { convertTendermintEvents } from "../types/checkers/events"
import { CheckersStargateClient } from "../checkers_stargateclient"

export class IndexerStargateClient extends CheckersStargateClient {
    private readonly myTmClient: Tendermint34Client

    public static async connect(
        endpoint: string,
        options: StargateClientOptions = {},
    ): Promise<IndexerStargateClient> {
        const tmClient = await Tendermint34Client.connect(endpoint)
        return new IndexerStargateClient(tmClient, options)
    }

    protected constructor(tmClient: Tendermint34Client, options: StargateClientOptions) {
        super(tmClient, options)
        this.myTmClient = tmClient
    }

    public async getEndBlockEvents(height: number): Promise<StringEvent[]> {
        const results: BlockResultsResponse = await this.myTmClient.blockResults(height)
        return convertTendermintEvents(results.endBlockEvents)
    }
}
```

Now swap out `CheckersStargateClient` with `IndexerStargateClient`:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/d623ae0/src/server/indexer.ts#L20]
import { IndexerStargateClient } from "./IndexerStargateClient"

export const createIndexer = async () => {
    ...
    let client: IndexerStargateClient

    ...
    const init = async () => {
        client = await IndexerStargateClient.connect(process.env.RPC_URL!)
        ...
    }
}
```

With this in place, go back to `handleBlock` and work on the remaining TODO.

## Handle one block's `EndBlock`

Go to the function and update it:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/d623ae0/src/server/indexer.ts#L91-L93]
const handleBlock = async (block: Block) => {
    ...
    const events: StringEvent[] = await client.getEndBlockEvents(block.header.height)
    if (0 < events.length) console.log("")
    await handleEvents(events)
}
```

The events that you have converted are compatible with those emanating from transactions, so you can just pass them on. You still need to update `handleEvent` so that it acts on the new event type:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/d623ae0/src/server/indexer.ts#L136-L138]
const handleEvent = async (event: StringEvent): Promise<void> => {
    ...
    if (isActionOf("GameForfeited")) {
        // Function yet to be declared
        await handleEventForfeit(event)
    }
}
```

To achieve this, add a new function:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/d623ae0/src/server/indexer.ts#L196-L214]
const handleEventForfeit = async (event: StringEvent): Promise<void> => {
    const forfeitedId: string | undefined = getAttributeValueByKey(event.attributes, "IdValue")
    if (!forfeitedId) throw new Error(`Forfeit event missing forfeitedId`)
    const winner: string | undefined = getAttributeValueByKey(event.attributes, "Winner")
    const blackAddress: string | undefined = db.games[forfeitedId]?.blackAddress
    const redAddress: string | undefined = db.games[forfeitedId]?.redAddress
    const blackGames: string[] = db.players[blackAddress]?.gameIds ?? []
    const redGames: string[] = db.players[redAddress]?.gameIds ?? []
    console.log(
        `Forfeit game: ${forfeitedId}, black: ${blackAddress}, red: ${redAddress}, winner: ${winner}`,
    )
    const indexInBlack: number = blackGames.indexOf(forfeitedId)
    if (0 <= indexInBlack) blackGames.splice(indexInBlack, 1)
    const indexInRed: number = redGames.indexOf(forfeitedId)
    if (0 <= indexInRed) redGames.splice(indexInRed, 1)
    if (winner === "NO_PLAYER") {
        delete db.games[forfeitedId]
    }
}
```

<HighlightBox type="note">

* Again there is a lot of error handling.
* `handleEvent` deletes the game only if there are no winners, which means that it was a deletion, not a forfeit.

</HighlightBox>

## Test time of forfeit

Run the previous tests again. Create a game and see how the deletion event is picked up:

```
Forfeit game: 1, black: cosmos1ac6srz8wh848zc08wrfghyghuf5cf3tvd45pnw, red: cosmos1t88fkwurlnusf6agvptsnm33t40kr4hlq6h08s, winner: *
```

## Patch a game

In the actions that the Express server exposes, `app.patch` must still be implemented. This allows a user to inform the server that its database is no longer synchronized, and that it should look at a specific game. It is a matter of data re-synchronization:

1. If the game can be found in the blockchain state, update the indexer's database accordingly:
    1. If there is a winner, then the game should be removed from its players' lists of games.
    2. If there is no winner, then the game should be added to its players' lists of games.
2. If the game cannot be found in the blockchain state, but is present in the indexer's database, then the game should be removed from the lists of games of its players. This shows the usefulness of keeping _old_ games.
3. If the game cannot be found either in the blockchain state nor in the indexer's database, then it is better not to do anything. To remove it from all players' lists of games is potentially expensive. This could expose the server to a DoS attack.

Code the following:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/2e400d1/src/server/indexer.ts#L225-L275]
const patchGame = async (gameId: string): Promise<boolean> => {
    const game: StoredGame | undefined = await client.checkersQueryClient?.checkers.getStoredGame(gameId)
    const cachedGame: GameInfo | undefined = db.games[gameId]
    if (!game && cachedGame) {
        const blackGames: string[] = db.players[cachedGame.blackAddress]?.gameIds ?? []
        const redGames: string[] = db.players[cachedGame.redAddress]?.gameIds ?? []
        console.log(
            `Patch game: deleted, ${gameId}, black: ${cachedGame.blackAddress}, red: ${cachedGame.redAddress}`,
        )
        const indexInBlack: number = blackGames.indexOf(gameId)
        if (0 <= indexInBlack) blackGames.splice(indexInBlack, 1)
        const indexInRed: number = redGames.indexOf(gameId)
        if (0 <= indexInRed) redGames.splice(indexInRed, 1)
        return true
    } else if (!game) {
        // No information to work from.
        // If we try to remove it from all players, it is very expensive and we are at risk of a DoS attack.
        console.log(`Patch game: not found, ${gameId}`)
        return false
    } else if (game.winner !== "NO_PLAYER") {
        const blackGames: string[] = db.players[game.black]?.gameIds ?? []
        const redGames: string[] = db.players[game.red]?.gameIds ?? []
        console.log(
            `Patch game: ended, ${gameId}, black: ${game.black}, red: ${game.red}, winner: ${game.winner}`,
        )
        const indexInBlack: number = blackGames.indexOf(gameId)
        if (0 <= indexInBlack) blackGames.splice(indexInBlack, 1)
        const indexInRed: number = redGames.indexOf(gameId)
        if (0 <= indexInRed) redGames.splice(indexInRed, 1)
        return true
    } else {
        const blackInfo: PlayerInfo = db.players[game.black] ?? {
            gameIds: [],
        }
        const redInfo: PlayerInfo = db.players[game.red] ?? {
            gameIds: [],
        }
        console.log(
            `Patch game: new, ${gameId}, black: ${game.black}, red: ${game.red}`,
        )
        if (blackInfo.gameIds.indexOf(gameId) < 0) blackInfo.gameIds.push(gameId)
        if (redInfo.gameIds.indexOf(gameId) < 0) redInfo.gameIds.push(gameId)
        db.players[game.black] = blackInfo
        db.players[game.red] = redInfo
        db.games[gameId] = {
            redAddress: game.red,
            blackAddress: game.black,
        }
        return true
    }
}
```

There are some issues to be aware of:

1. Javascript is not thread-safe, so you could cause two opposite actions: one coming from the polling and the other from a patch submission, or even from two concurrent patch submissions. To reduce this risk the _database_ is not saved to disk in this function, but instead relies on the polling to save it at the next run.
2. Assuming that _there is no such game when you cannot find it_ can result in deleting data that is simply taking time to appear on your blockchain node.

Next, you need to call `patchGame` from the `app.patch` callback:

```typescript [https://github.com/cosmos/academy-checkers-ui/blob/2e400d1/src/server/indexer.ts#L49-L57]
app.patch("/games/:gameId", async (req: Request, res: Response) => {
    const found = await patchGame(req.params.gameId)
    if (!found) res.status(404)
    else {
        res.json({
            result: "Thank you",
        })
    }
})
```

## Test time of patch

To simulate a case where the game is in the blockchain state but not the indexer's:

1. Stop your indexer.
2. Create a game and check at what block it is included (for example, at index `3` and block `1001`).
3. Update your indexer's `db.json` and pretend that it already indexed the game's block by setting:

    ```json
    "status": {
        "block": {
            "height": 1001
        }
    }
    ```

4. Restart the indexer.
5. From another terminal, make a call to it:

    ```sh
    $ curl -X PATCH localhost:3001/games/3 | jq
    ```

It should return:

```json
{
  "result": "Thank you"
}
```

And the indexer should log something like:

```
Patch game: new, 3, black: cosmos1ac6srz8wh848zc08wrfghyghuf5cf3tvd45pnw, red: cosmos1t88fkwurlnusf6agvptsnm33t40kr4hlq6h08s
```

Develop your own ways to test the other scenarios.

## Conclusion

You have created a small server that:

* Polls the blockchain to get events about created, rejected, won, and forfeited games.
* Maintains a database with information indexed in real time.
* Offers this information as a Web service.
* Accepts requests for patches.

These are examples of server-side scripts, which can improve user experience.

You can find the complete code [here](https://github.com/cosmos/academy-checkers-ui/tree/server-indexing).

So what's next? The Cosmos is vast, with lots of projects, people and concepts to discover:

* Reach out to the community.
* Contribute to the Cosmos SDK, IBC, and Tendermint BFT consensus development.
* Get support for enterprise solutions which you are developing.

Head to the [What's Next section](../6-whats-next/index.md) to find useful information to launch your journey into the Cosmos universe.
