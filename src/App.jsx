import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Users,
  Trophy,
  Timer,
  Send,
  ShieldAlert,
} from "lucide-react";

// === 核心修正：Canvas 動態數學雨背景 ===
const MathCanvasBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // === 這裡修正了！！！ ===
    const canvas = canvasRef.current; // 必須使用 .current 取得 HTML 元素
    if (!canvas) return;
    const ctx = canvas.getContext("2d"); // 取得繪圖上下文

    // 設置 Canvas 尺寸為視窗大小
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // 數學符號與公式池
    const mathSymbols = [
      "∑",
      "∫",
      "∬",
      "∭",
      "∂",
      "∇",
      "∆",
      "π",
      "∞",
      "√",
      "∛",
      "∝",
      "∊",
      "∉",
      "⊆",
      "⊂",
      "f(x)",
      "dy/dx",
      "lim",
      "log",
      "sin",
      "cos",
      "tan",
      "θ",
      "λ",
      "μ",
      "σ",
      "Ω",
      "e=mc²",
      "a²+b²=c²",
      "eⁱᵟ+1=0",
      "x=∬f(x,y)dxdy",
      "∇×E=-∂B/∂t",
      "∮B·dL=μ₀I",
      "作答",
      "數學",
      "怪物",
      "特務",
      "01",
    ];

    // 字體大小設置
    const fontSize = 16;
    const columns = Math.ceil(canvas.width / (fontSize * 0.8)); // 根據寬度計算列數

    // 每一列的當前 Y 軸位置陣列
    const drops = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * canvas.height * -1; // 隨機初始高度，讓它們錯開
    }

    // 繪製函數
    const draw = () => {
      // 繪製半透明黑色背景，製造尾跡效果
      ctx.fillStyle = "rgba(10, 10, 10, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "Courier New", monospace`;

      for (let i = 0; i < drops.length; i++) {
        // 隨機挑選符號
        const text =
          mathSymbols[Math.floor(Math.random() * mathSymbols.length)];

        // 設置螢光綠，並根據景深調整透明度
        // 這裡稍微簡化景深計算，讓它看起來更穩定
        const opacity = Math.random() * 0.2 + 0.1; // 0.1 ~ 0.3 的透明度
        ctx.fillStyle = `rgba(0, 255, 65, ${opacity})`;

        // 繪製文字
        ctx.fillText(text, i * fontSize * 0.8, drops[i]);

        // 更新位置 (向下移動)
        drops[i] += 2; // 固定速度，看起來比較舒服

        // 如果符號掉出螢幕，則重置回頂部，並加上一點隨機性
        if (drops[i] > canvas.height) {
          drops[i] = fontSize * -5;
        }
      }
    };

    // 動畫循環
    const interval = setInterval(draw, 33); // 約 30 FPS

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

// === 主程式 (App) ===
export default function App() {
  const [gameState, setGameState] = useState("login"); // login, waiting, playing, result
  const [nickname, setNickname] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 模擬收到後端計時廣播
  const startTimer = (seconds) => {
    setTimeLeft(seconds);
    setIsSubmitted(false);
    setGameState("playing");
    // 如果之前有計時器，先清除 (防止疊加)
    if (window.gameTimer) clearInterval(window.gameTimer);

    window.gameTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(window.gameTimer);
          setGameState("result");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (nickname.trim()) setGameState("waiting");
  };

  const submitAnswer = (e) => {
    e.preventDefault();
    if (!answer) return;
    setIsSubmitted(true);
    // WebSocket 邏輯將放在這裡
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#0A0A0A] text-[#00FF41] font-mono relative overflow-hidden flex items-center justify-center p-4">
      {/* 修正後的動態背景 */}
      <MathCanvasBackground />

      {/* 主視窗容器：手機全滿，電腦版置中且最大寬度限制 */}
      <div className="relative z-10 w-full max-w-full md:max-w-3xl lg:max-w-4xl h-full md:h-[85vh] bg-black/85 md:border md:border-[#00FF41]/30 md:rounded-2xl flex flex-col shadow-[0_0_40px_rgba(0,255,65,0.15)] backdrop-blur-[2px]">
        {/* Navbar */}
        <div className="flex items-center justify-between p-4 border-b border-[#00FF41]/30 bg-black/50 md:rounded-t-2xl relative z-20">
          <div className="flex items-center gap-2">
            <Terminal size={24} className="animate-pulse" />
            <span className="font-bold tracking-widest text-lg md:text-2xl drop-shadow-[0_0_5px_#00FF41]">
              MATH_MONSTER
            </span>
          </div>
          {gameState !== "login" && (
            <div className="flex gap-4 items-center bg-black/50 px-3 py-1 rounded-full border border-[#00FF41]/20">
              <div className="flex items-center gap-1.5">
                <Users size={16} className="text-[#00FF41]/70" />
                <span className="md:text-lg text-[#00FF41]/90">12</span>
              </div>
              <div className="h-4 w-[1px] bg-[#00FF41]/20"></div>
              <div className="flex items-center gap-1.5 text-yellow-400">
                <Trophy size={16} />
                <span className="md:text-lg font-bold">{score}</span>
              </div>
            </div>
          )}
        </div>

        {/* 遊戲主要內容區塊 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col justify-center relative z-10">
          {gameState === "login" && (
            <div className="w-full max-w-sm mx-auto space-y-10 py-10">
              <div className="text-center space-y-3">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight drop-shadow-[0_0_10px_#00FF41]">
                  系統登入
                </h1>
                <p className="text-[#00FF41]/70 md:text-xl font-light">
                  請輸入您的特務代號以同步連線
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-5">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="CODE_NAME"
                  className="w-full bg-transparent border-2 border-[#00FF41] rounded-xl p-5 text-center text-2xl md:text-3xl outline-none focus:bg-[#00FF41]/10 focus:shadow-[0_0_15px_rgba(0,255,65,0.3)] transition-all placeholder:text-[#00FF41]/30"
                  maxLength={10}
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full bg-[#00FF41] text-black font-bold text-2xl md:text-3xl p-5 rounded-xl hover:bg-[#00cc33] active:scale-95 transition-all shadow-[0_4px_0_#008822] active:translate-y-0.5 active:shadow-none"
                >
                  INITIALIZE
                </button>
              </form>
            </div>
          )}

          {gameState === "waiting" && (
            <div className="text-center space-y-10 w-full max-w-2xl mx-auto py-10">
              <ShieldAlert
                size={80}
                className="mx-auto animate-pulse text-[#00FF41]"
              />
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                等待主機發送
                <br />
                安全驗證題目...
              </h2>
              <div className="bg-[#00FF41]/10 p-8 rounded-2xl border border-[#00FF41]/30 shadow-inner">
                <p className="text-xl md:text-2xl mb-5 text-[#00FF41]/80">
                  目前已連線特務：
                </p>
                <div className="flex flex-wrap justify-center gap-3.5">
                  {["你", "玩家A", "玩家B", "特務X", "數學大師", "Cipher"].map(
                    (name, i) => (
                      <span
                        key={i}
                        className={`px-5 py-2.5 bg-black border ${
                          name === "你"
                            ? "border-yellow-400 text-yellow-400"
                            : "border-[#00FF41]/50"
                        } rounded-full md:text-xl flex items-center gap-2`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            name === "你"
                              ? "bg-yellow-400 animate-pulse"
                              : "bg-[#00FF41]"
                          }`}
                        ></div>
                        {name}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {gameState === "playing" && (
            <div className="w-full max-w-3xl mx-auto flex flex-col h-full justify-between gap-10 py-6">
              <div className="text-center space-y-8">
                <div className="flex justify-center items-center gap-3 text-4xl md:text-6xl font-bold text-red-500 bg-red-950/30 w-fit mx-auto px-6 py-2 rounded-full border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <Timer size={48} className="md:w-16 md:h-16 animate-pulse" />
                  <span className="tabular-nums">{timeLeft}s</span>
                </div>
                <div className="bg-[#00FF41]/5 p-8 md:p-12 rounded-2xl border-2 border-[#00FF41]/30 text-2xl md:text-5xl leading-snug shadow-inner relative">
                  <div className="absolute top-2 left-3 text-xs text-[#00FF41]/30">
                    QUESTION_DATA
                  </div>
                  連續三個整數，加起來等於99。
                </div>
              </div>

              {!isSubmitted ? (
                <form onSubmit={submitAnswer} className="mt-auto space-y-5">
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="在此輸入演算結果..."
                    className="w-full bg-black/50 border-2 border-[#00FF41] rounded-xl p-6 md:p-8 text-center text-3xl md:text-5xl outline-none focus:bg-[#00FF41]/10 focus:shadow-[0_0_20px_rgba(0,255,65,0.2)] placeholder:text-[#00FF41]/20 placeholder:text-2xl"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#00FF41] text-black font-bold text-2xl md:text-3xl p-6 md:p-8 rounded-xl hover:bg-[#00cc33] active:scale-95 transition-all shadow-[0_5px_0_#008822] active:translate-y-0.5 active:shadow-none flex justify-center items-center gap-3"
                  >
                    <Send size={28} /> 送出核心數據
                  </button>
                </form>
              ) : (
                <div className="mt-auto text-center p-10 bg-[#00FF41]/15 rounded-2xl border-2 border-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.1)]">
                  <p className="text-3xl md:text-5xl font-bold animate-pulse">
                    數據已傳送，等待系統結算...
                  </p>
                </div>
              )}
            </div>
          )}

          {gameState === "result" && (
            <div className="text-center space-y-10 w-full max-w-2xl mx-auto py-10">
              <h2 className="text-5xl md:text-7xl font-bold mb-4 tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                回合結束
              </h2>
              <div className="bg-black/60 p-10 rounded-2xl border-2 border-[#00FF41]/50 space-y-8 shadow-xl relative">
                <div className="absolute top-3 left-4 text-xs text-[#00FF41]/30">
                  DECISION_LOG
                </div>
                <p className="text-3xl md:text-5xl">
                  正確演算路徑：
                  <br />
                  <span className="font-bold text-white bg-[#00FF41]/20 px-4 py-1 rounded">
                    32, 33, 34
                  </span>
                </p>
                <div className="h-px w-full bg-[#00FF41]/20"></div>
                {isSubmitted && answer === "32,33,34" ? (
                  <p className="text-4xl md:text-6xl text-yellow-400 font-bold drop-shadow-[0_0_15px_rgba(250,204,21,0.7)] animate-bounce">
                    +2.5 分！
                  </p>
                ) : (
                  <p className="text-3xl md:text-5xl text-red-500 font-bold">
                    驗證失敗 / 未能及時送出
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 開發測試用：模擬主持人控制板 (小幅優化樣式) */}
      <div className="fixed bottom-4 right-4 z-50 group">
        <div className="absolute bottom-full mb-3 right-0 bg-black/95 border border-[#00FF41]/50 p-5 rounded-2xl hidden group-hover:block w-72 md:w-80 shadow-2xl backdrop-blur-sm">
          <p className="text-[#00FF41] text-sm mb-3 font-sans font-bold border-b border-[#00FF41]/30 pb-2">
            Host 控制面板 (測試用)
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setGameState("login")}
              className="bg-gray-800 text-white p-2.5 rounded-lg text-sm hover:bg-gray-700 transition-colors"
            >
              回登入
            </button>
            <button
              onClick={() => setGameState("waiting")}
              className="bg-gray-800 text-white p-2.5 rounded-lg text-sm hover:bg-gray-700 transition-colors"
            >
              準備畫面
            </button>
            <button
              onClick={() => startTimer(30)}
              className="bg-blue-700 text-white p-3 rounded-lg text-sm hover:bg-blue-600 col-span-2 font-bold transition-all hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            >
              發送題目 (30秒)
            </button>
          </div>
        </div>
        <button className="bg-black/50 hover:bg-[#00FF41]/20 text-[#00FF41] p-4 rounded-full backdrop-blur-sm transition-all shadow-lg border border-[#00FF41]/30 hover:scale-110">
          <Terminal size={24} />
        </button>
      </div>
    </div>
  );
}
