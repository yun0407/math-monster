# 數學怪物 MATH MONSTER - 即時多人連線派對遊戲

> 一款專為線下實體派對打造的「大型多人即時互動」網頁遊戲。支援大螢幕投放、主持人控場面板，以及玩家手機跨平台掃碼即玩。

[![Demo](入口)](https://math-monster-2026.vercel.app/)

---

## 專案亮點 (Features)

- **極速即時連線**：基於 WebSocket (FastAPI) 打造，百人連線零延遲，支援斷線自動背景重連機制。
- **三端獨立介面 (RWD)**：
  - **Player (玩家端)**：專為手機操作優化的 UI，支援「一鍵搶答防呆」。
  - **Display (大螢幕端)**：提供派對現場投影，具備科幻風動態背景、大樂透式開獎動畫與即時排行榜。
  - **Host (主持端)**：強大的後台控制面板，可推播題目、操控 Bingo 開獎、播放派對氣氛音樂 (BGM) 及強制收卷結算。
- **多樣化題型支援**：內建「限時搶答選擇題」、「隨機賓果盤連線」、「密碼破解填充題」等多種派對關卡。
- **防 Race Condition 機制**：透過 React `useRef` 鎖定狀態，完美解決玩家手動送出與倒數自動收卷衝突的問題。

---

## 畫面展示 (Screenshots)

| 大螢幕 LIVE 畫面 | 玩家手機操作畫面 | 主持人控制面板 |
| :---: | :---: | :---: |
| <img src="https://myppt.cc/u1FLS" width="250"/> | <img src="https://myppt.cc/Jaitn" width="150"/> | <img src="https://myppt.cc/Vy7ll" width="250"/> |
| <img src="放入你的大螢幕截圖網址" width="250"/> | <img src="放入你的手機版截圖網址" width="150"/> | <img src="放入你的主持人面板截圖網址" width="250"/> |

---

## 技術架構 (Tech Stack)

### Frontend (前端)
- **React** - 組件化開發與狀態管理
- **Tailwind CSS** - 高效的 Utility-first RWD 切版
- **HTML5 Canvas** - 渲染賽博龐克風格的「駭客任務數字雨」動態背景
- **HTML5 Audio API** - 實作主持人氣氛音樂 DJ 控制台

### Backend (後端)
- **Python**
- **FastAPI** - 建立高效能的非同步 API
- **WebSockets** - 處理所有玩家狀態同步、題目推播與即時算分
- **Uvicorn** - ASGI 伺服器

---

## 如何在本地端運行 (Local Setup)

### 1. 啟動後端伺服器
請確認已安裝 Python 環境，進入 `backend` 資料夾：
```bash
cd backend
pip install fastapi uvicorn websockets
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
伺服器將會運行在 ws://localhost:8000/ws

### 2. 啟動前端介面
這是一個純靜態前端專案，無需 npm install。
推薦使用 VS Code 的 Live Server 擴充套件，直接在專案根目錄開啟 index.html。

- 玩家端：直接訪問 http://localhost:5500
- 大螢幕端：訪問 http://localhost:5500/?role=display
- 主持人端：訪問 http://localhost:5500/?role=host

## 核心機制說明
心跳保活 (Ping-Pong)：針對行動裝置螢幕休眠容易斷線的問題，實作了每 20 秒發送 Ping 的機制，加上斷線自動重試，確保計分不中斷。

狀態機驅動 (State Machine)：前端 UI 完全由後端派發的 gameState 驅動（login -> waiting -> stage_X -> result），確保百人畫面絕對同步。
