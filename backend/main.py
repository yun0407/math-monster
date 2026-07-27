from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import random
import time
import traceback

app = FastAPI(title="Math Monster Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[WebSocket, str] = {}
        self.players_state = {}
        self.stage_start_time = 0
        self.current_time_limit = 0
        self.current_correct_answer = ""
        self.current_stage = ""
        self.bingo_winners = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[websocket] = None

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections.keys()):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception:
            pass

    async def broadcast_host_update(self):
        player_details = [
            {
                "name": k,
                "score": v["score"],
                "has_answered": v.get("has_answered", False),
                "last_answer": v.get("last_answer", "")
            }
            for k, v in self.players_state.items()
        ]
        await self.broadcast({"type": "HOST_UPDATE", "player_details": player_details})


manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            action_type = message.get("type")

            if action_type != "SYNC_COOP":
                print(f"📥 收到指令: {action_type}")

            if action_type == "PLAYER_JOIN":
                name = message.get("name")
                manager.active_connections[websocket] = name

                # ==== 修正：HOST 與 DISPLAY 都不列入計分板 ====
                if name not in ["HOST", "DISPLAY"] and name not in manager.players_state:
                    manager.players_state[name] = {
                        "score": 0, "partner": None, "cards": [],
                        "is_correct": False, "rank": -1,
                        "has_answered": False, "last_answer": ""
                    }

                print(f"✅ [登入] {name} 已上線")
                online_players = [n for n in manager.active_connections.values() if n and n not in ["HOST", "DISPLAY"]]
                await manager.broadcast({"type": "UPDATE_PLAYERS", "players": online_players})
                await manager.broadcast_host_update()

            elif action_type == "START_TIMER":
                stage = message.get("stage")
                print(f"🚀 [發送關卡] 主持人發送了: {stage}")
                question_data = message.get("questionData", {})

                manager.current_stage = stage
                manager.stage_start_time = time.time()
                manager.current_time_limit = message.get("time", 30)
                manager.bingo_winners = []

                raw_ans = question_data.get("answer", "")
                manager.current_correct_answer = str(raw_ans).strip().lower() if raw_ans else ""

                for p in manager.players_state.values():
                    p["round_added_score"] = 0
                    p["round_time_taken"] = 0
                    p["has_answered"] = False
                    p["is_correct"] = False
                    p["rank"] = -1
                    p["last_answer"] = ""

                await manager.broadcast(message)
                await manager.broadcast_host_update()

            elif action_type == "SUBMIT_ANSWER":
                name = message.get("name")
                player_answer = str(message.get("answer", "")).strip().lower()

                if name in manager.players_state and not manager.players_state[name].get("has_answered"):
                    manager.players_state[name]["last_answer"] = player_answer

                    if manager.current_stage == "stage_2":
                        if name not in manager.bingo_winners:
                            manager.bingo_winners.append(name)
                            rank = len(manager.bingo_winners)

                            if rank == 1: points = 20
                            elif rank == 2: points = 15
                            elif rank == 3: points = 10
                            elif rank == 4: points = 5
                            else: points = 3

                            manager.players_state[name]["round_added_score"] = points
                            manager.players_state[name]["score"] = round(manager.players_state[name]["score"] + points, 1)
                            manager.players_state[name]["has_answered"] = True
                            manager.players_state[name]["rank"] = rank
                            manager.players_state[name]["is_correct"] = True

                            if len(manager.bingo_winners) >= 4:
                                for p_name, p_state in manager.players_state.items():
                                    if not p_state.get("has_answered"):
                                        p_state["round_added_score"] = 3
                                        p_state["score"] = round(p_state["score"] + 3, 1)
                                        p_state["has_answered"] = True
                                        p_state["rank"] = 0

                                leaderboard = [{"name": k, "score": v["score"], "added_score": v.get("round_added_score", 0), "time_taken": v.get("round_time_taken", 0), "is_correct": v.get("is_correct", False), "rank": v.get("rank", -1)} for k, v in manager.players_state.items()]
                                leaderboard = sorted(leaderboard, key=lambda x: x["score"], reverse=True)
                                await manager.broadcast({"type": "CHANGE_STATE", "state": "result", "leaderboard": leaderboard, "correct_answer": manager.current_correct_answer})
                    else:
                        time_taken = time.time() - manager.stage_start_time
                        remaining = max(0, manager.current_time_limit - time_taken)

                        is_correct = False
                        if player_answer == "未作答":
                             is_correct = False
                        elif manager.current_correct_answer == "" or player_answer == manager.current_correct_answer:
                            is_correct = True

                        points = round(10 + (remaining * 0.5), 1) if is_correct else 0

                        manager.players_state[name]["round_added_score"] = points
                        manager.players_state[name]["round_time_taken"] = round(time_taken, 2)
                        manager.players_state[name]["score"] = round(manager.players_state[name]["score"] + points, 1)
                        manager.players_state[name]["has_answered"] = True
                        manager.players_state[name]["is_correct"] = is_correct

                    await manager.broadcast_host_update()

            elif action_type == "CHANGE_STATE" and message.get("state") == "result":
                if manager.current_stage == "stage_2":
                    for p_name, p_state in manager.players_state.items():
                        if not p_state.get("has_answered"):
                            p_state["round_added_score"] = 3
                            p_state["score"] = round(p_state["score"] + 3, 1)
                            p_state["has_answered"] = True
                            p_state["rank"] = 0

                leaderboard = [
                    {
                        "name": k,
                        "score": v["score"],
                        "added_score": v.get("round_added_score", 0),
                        "time_taken": v.get("round_time_taken", 0),
                        "is_correct": v.get("is_correct", False),
                        "rank": v.get("rank", -1)
                    }
                    for k, v in manager.players_state.items()
                ]
                leaderboard = sorted(leaderboard, key=lambda x: x["score"], reverse=True)

                await manager.broadcast({
                    "type": "CHANGE_STATE",
                    "state": "result",
                    "leaderboard": leaderboard,
                    "correct_answer": manager.current_correct_answer
                })

            elif action_type == "CHANGE_STATE":
                await manager.broadcast(message)

            elif action_type == "RESET_SCORES":
                manager.bingo_winners = []
                for p in manager.players_state.values():
                    p["score"] = 0
                    p["round_added_score"] = 0
                    p["round_time_taken"] = 0
                    p["has_answered"] = False
                    p["is_correct"] = False
                    p["rank"] = -1
                    p["last_answer"] = ""

                await manager.broadcast({"type": "SCORES_RESET"})
                await manager.broadcast_host_update()

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        traceback.print_exc()
        manager.disconnect(websocket)
