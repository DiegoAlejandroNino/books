import { useState, useRef, useCallback, useEffect } from "react";

const API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const LEVEL_INFO = {
  A1: "Principiante absoluto. Oraciones muy simples.",
  A2: "Elemental. Frases cotidianas simples.",
  B1: "Intermedio. Párrafos fluidos con variedad.",
  B2: "Intermedio alto. Lenguaje natural y rico.",
  C1: "Avanzado. Prosa sofisticada y académica.",
  C2: "Maestría. Estilo literario completo.",
};

const LEVEL_FULL = {
  A1: "Absolute beginner. Very simple sentences, present tense only, max 500 basic words. Short sentences of 5-8 words.",
  A2: "Elementary. Simple daily sentences, present and simple past tense, common vocabulary up to 1000 words.",
  B1: "Intermediate. Flowing paragraphs, mixed tenses, varied vocabulary, some idiomatic expressions.",
  B2: "Upper-intermediate. Natural language, rich vocabulary, complex structures, passive voice, conditionals.",
  C1: "Advanced. Sophisticated prose, academic vocabulary, literary register, nuanced expression.",
  C2: "Mastery. Full literary style, metaphors, erudite vocabulary, complex syntax.",
};

const GENRES = [
  { value: "adventure", label: "🗺️", name: "Aventura" },
  { value: "mystery", label: "🔍", name: "Misterio" },
  { value: "romance", label: "💛", name: "Romance" },
  { value: "science fiction", label: "🚀", name: "Sci-Fi" },
  { value: "fable", label: "🦊", name: "Fábula" },
  { value: "fantasy", label: "🧙", name: "Fantasía" },
  { value: "slice of life", label: "☕", name: "Cotidiano" },
  { value: "thriller", label: "😰", name: "Thriller" },
];

const SUGGESTIONS = [
  "The Little Prince", "Harry Potter", "The Alchemist",
  "Animal Farm", "1984", "The Great Gatsby",
  "Pride and Prejudice", "Don Quixote",
];

// ── Loading Overlay ──
function LoadingOverlay({ visible, phase, title }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(18,16,12,0.96)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(12px)",
      animation: "fadeIn 0.3s ease",
    }}>
      {/* Animated book icon */}
      <div style={{ marginBottom: 32, position: "relative" }}>
        <div style={{
          width: 80, height: 80,
          background: "linear-gradient(135deg, #c17d3a, #e8a84e)",
          borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36,
          boxShadow: "0 0 40px rgba(193,125,58,0.4)",
          animation: "glowPulse 2s ease-in-out infinite, bookFloat 3s ease-in-out infinite",
        }}>📖</div>
        {/* Orbiting dots */}
        {[0,1,2].map(i => (
          <div key={i} style={{
            position: "absolute",
            width: 8, height: 8,
            borderRadius: "50%",
            background: i === 0 ? "#c17d3a" : i === 1 ? "#e8a84e" : "#f0c87a",
            top: "50%", left: "50%",
            marginTop: -4, marginLeft: -4,
            transformOrigin: `${40 + i*8}px 0`,
            animation: `spin ${1.2 + i*0.3}s linear infinite`,
            opacity: 0.8,
          }} />
        ))}
      </div>

      {/* Loading text */}
      <div style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 20, fontWeight: 600,
        color: "#f0e8d8", marginBottom: 8,
        textAlign: "center", padding: "0 32px",
        animation: "fadeUp 0.5s ease 0.2s both",
      }}>{title || "Preparando tu lectura..."}</div>

      <div style={{
        fontSize: 13, color: "#9e8e7a",
        textAlign: "center", padding: "0 40px",
        lineHeight: 1.6,
        animation: "fadeUp 0.5s ease 0.35s both",
      }}>{phase}</div>

      {/* Progress bar */}
      <div style={{
        width: 200, height: 3,
        background: "#2a2018",
        borderRadius: 2, marginTop: 32,
        overflow: "hidden",
        animation: "fadeUp 0.5s ease 0.4s both",
      }}>
        <div style={{
          height: "100%",
          background: "linear-gradient(90deg, #c17d3a, #e8a84e)",
          borderRadius: 2,
          animation: "shimmer 1.5s ease-in-out infinite",
          backgroundSize: "200% 100%",
        }} />
      </div>
    </div>
  );
}

// ── Splash Screen ──
function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "#12100c",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 0,
    }}>
      <div style={{
        fontSize: 64, marginBottom: 20,
        animation: "inkDrop 0.8s cubic-bezier(.22,.68,0,1.2) 0.3s both",
      }}>📖</div>
      <div style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 32, fontWeight: 700, color: "#f0e8d8",
        letterSpacing: "-0.5px",
        animation: "fadeUp 0.7s ease 0.7s both",
      }}>ReadEnglish</div>
      <div style={{
        fontSize: 13, color: "#9e8e7a", marginTop: 8,
        animation: "fadeUp 0.7s ease 0.9s both",
      }}>Aprende leyendo · Traduce tocando</div>
      <div style={{
        position: "absolute", bottom: 48,
        display: "flex", gap: 6,
        animation: "fadeIn 0.5s ease 1.5s both",
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: i === 1 ? 20 : 6, height: 6,
            borderRadius: 3,
            background: i === 1 ? "#c17d3a" : "#3d3020",
            transition: "all 0.3s",
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Bottom Sheet (drawer) ──
function BottomSheet({ visible, onClose, children, title }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />
      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        zIndex: 41,
        background: "#1a1410",
        borderRadius: "20px 20px 0 0",
        paddingBottom: `max(24px, env(safe-area-inset-bottom, 24px))`,
        maxHeight: "85vh",
        overflowY: "auto",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.4s cubic-bezier(.32,.72,0,1)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, background: "#3d3020", borderRadius: 2 }} />
        </div>
        {title && (
          <div style={{
            padding: "8px 20px 16px",
            fontFamily: "'Playfair Display', serif",
            fontSize: 18, fontWeight: 600, color: "#f0e8d8",
            borderBottom: "1px solid #2a2018",
            marginBottom: 16,
          }}>{title}</div>
        )}
        {children}
      </div>
    </>
  );
}

// ── Tooltip ──
function Tooltip({ tooltip }) {
  if (!tooltip.visible) return null;
  const isPhrase = tooltip.text?.includes(" ");
  return (
    <div className="animate-tooltipIn" style={{
      position: "fixed",
      bottom: `max(80px, calc(80px + env(safe-area-inset-bottom, 0px)))`,
      left: "50%", transform: "translateX(-50%)",
      width: "min(320px, calc(100vw - 32px))",
      background: "#1a1410",
      borderRadius: 16,
      padding: "16px 18px",
      zIndex: 90,
      boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(193,125,58,0.2)",
    }}>
      <div style={{
        fontSize: 10, color: "#9e8e7a", marginBottom: 6,
        textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500,
      }}>
        {isPhrase ? "🔤 Frase" : "📝 Palabra"}
      </div>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 15, color: "#f0e8d8", fontStyle: "italic",
        marginBottom: 10, paddingBottom: 10,
        borderBottom: "1px solid #2a2018", lineHeight: 1.4,
      }}>"{tooltip.text}"</div>
      {tooltip.loading ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #c17d3a", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, color: "#9e8e7a" }}>Traduciendo...</span>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 19, color: "#e8a84e", fontWeight: 600, letterSpacing: "-0.3px" }}>{tooltip.translation}</div>
          {tooltip.type && <div style={{ fontSize: 11, color: "#6b5e4a", marginTop: 4 }}>({tooltip.type})</div>}
        </>
      )}
    </div>
  );
}

// ── Book Card ──
function BookCard({ book, active, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className="ripple"
      style={{
        padding: "14px 16px",
        cursor: "pointer",
        borderLeft: `3px solid ${active ? "#c17d3a" : "transparent"}`,
        background: active ? "rgba(193,125,58,0.08)" : "transparent",
        transition: "all 0.2s ease",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ fontSize: 14, color: "#d8c8b0", fontWeight: 500, marginBottom: 3, lineHeight: 1.3, fontFamily: "'Playfair Display', serif" }}>
        {book.title}
      </div>
      <div style={{ fontSize: 11, color: "#9e8e7a", marginBottom: 6, fontStyle: "italic" }}>
        {book.author}{book.year ? ` · ${book.year}` : ""}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <span style={{ background: "#2a2018", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 600, color: "#e8a84e" }}>{book.level}</span>
        {book.source === "real_book"
          ? <span style={{ background: "rgba(46,125,50,0.15)", borderRadius: 6, padding: "2px 7px", fontSize: 10, color: "#7ec88a" }}>📚 real</span>
          : <span style={{ background: "#2a2018", borderRadius: 6, padding: "2px 7px", fontSize: 10, color: "#9e8e7a" }}>{book.genre}</span>
        }
      </div>
    </div>
  );
}

// ── Empty State ──
function EmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "100%", padding: "40px 32px",
      textAlign: "center",
    }}>
      <div className="book-float" style={{ fontSize: 72, marginBottom: 24, opacity: 0.6 }}>📚</div>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 22, fontWeight: 600, color: "#6b5f4e", marginBottom: 12,
      }}>Tu biblioteca está vacía</div>
      <div style={{ fontSize: 14, color: "#9e8e7a", lineHeight: 1.8, maxWidth: 280 }}>
        Toca <strong style={{ color: "#c17d3a" }}>✨ Crear</strong> para una historia original<br />
        o <strong style={{ color: "#c17d3a" }}>🔎 Buscar</strong> para adaptar un libro real
      </div>
    </div>
  );
}

// ── Main App ──
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [books, setBooks] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [level, setLevel] = useState("A2");
  const [genre, setGenre] = useState("adventure");
  const [mode, setMode] = useState("generate");
  const [bookQuery, setBookQuery] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState("");
  const [loadingTitle, setLoadingTitle] = useState("");
  const [fontSize, setFontSize] = useState(17);
  const [tooltip, setTooltip] = useState({ visible: false, text: "", translation: "", type: "", loading: false });
  const [status, setStatus] = useState("Listo para comenzar");
  const [sheetOpen, setSheetOpen] = useState(false);       // bottom sheet for create/search
  const [libraryOpen, setLibraryOpen] = useState(false);   // bottom sheet for library
  const [view, setView] = useState("home");                 // "home" | "reading"
  const [bookTransition, setBookTransition] = useState(false);
  const readerRef = useRef(null);

  const wordCount = currentBook?.paragraphs?.join(" ").split(/\s+/).length ?? 0;
  const readMin = Math.ceil(wordCount / 150);

  const openBook = useCallback((book) => {
    setBookTransition(true);
    setTimeout(() => {
      setCurrentBook(book);
      setView("reading");
      setBookTransition(false);
      setLibraryOpen(false);
      setStatus("Toca cualquier palabra para traducirla");
      if (readerRef.current) readerRef.current.scrollTop = 0;
    }, 350);
  }, []);

  const generateBook = async () => {
    setSheetOpen(false);
    setGenerating(true);
    setLoadingTitle("Escribiendo tu historia...");
    setLoadingPhase(`Historia de ${GENRES.find(g=>g.value===genre)?.name} · Nivel ${level}`);

    const prompt = `Write a short English story for a language learner at ${level} level.
Level guidance: ${LEVEL_FULL[level]}
Genre: ${genre}
Requirements:
- 5-7 paragraphs of 70-100 words each
- Vocabulary and grammar strictly appropriate for ${level}
- Engaging complete story with beginning, middle, and end
- Invent a creative title and believable English author name
Respond ONLY with raw JSON, no markdown:
{"title":"...","author":"...","level":"${level}","genre":"${genre}","source":"generated","paragraphs":["...","..."]}`;

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const raw = data.content[0].text.trim().replace(/```json|```/g, "").trim();
      const book = { ...JSON.parse(raw), id: Date.now() };
      setBooks(prev => [book, ...prev]);
      setTimeout(() => openBook(book), 400);
      setStatus(`"${book.title}" listo`);
    } catch {
      setStatus("Error al generar. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  };

  const searchBook = async () => {
    if (!bookQuery.trim()) return;
    setSheetOpen(false);
    setGenerating(true);
    setLoadingTitle(`Adaptando "${bookQuery}"`);
    setLoadingPhase(`Creando versión nivel ${level} del libro...`);

    const prompt = `You are a language learning assistant. The student wants to read "${bookQuery}" adapted to ${level} English level.
Level guidance: ${LEVEL_FULL[level]}
Your task:
1. Identify the real book "${bookQuery}" (author, year, genre).
2. Write a detailed READING ADAPTATION in English at ${level} level. 10-14 paragraphs of 80-120 words each.
3. Use ONLY vocabulary and grammar structures appropriate for ${level}.
4. Keep the spirit, tone, and key moments of the original book.
Respond ONLY with raw JSON, no markdown:
{"title":"...","author":"...","year":1950,"level":"${level}","genre":"...","source":"real_book","originalLanguage":"...","synopsis":"...","paragraphs":["...","..."]}`;

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 3500, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const raw = data.content[0].text.trim().replace(/```json|```/g, "").trim();
      const book = { ...JSON.parse(raw), id: Date.now() };
      setBooks(prev => [book, ...prev]);
      setBookQuery("");
      setTimeout(() => openBook(book), 400);
      setStatus(`"${book.title}" adaptado`);
    } catch {
      setStatus("Error al buscar el libro.");
    } finally {
      setGenerating(false);
    }
  };

  // Touch-based text selection for mobile
  const handleSelectionEnd = useCallback(async () => {
    // Small delay to let selection finalize
    await new Promise(r => setTimeout(r, 50));
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text || text.length < 1 || text.length > 300) {
      setTooltip(t => ({ ...t, visible: false }));
      return;
    }
    setTooltip({ visible: true, text, translation: "", type: "", loading: true });

    const isPhrase = text.includes(" ");
    const prompt = isPhrase
      ? `Translate to Spanish. Reply ONLY raw JSON no markdown:\n{"translation":"...","type":"frase"}\nText: "${text}"`
      : `Translate to Spanish. Reply ONLY raw JSON no markdown:\n{"translation":"...","type":"noun/verb/adjective/adverb/etc"}\nWord: "${text}"`;

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 120, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const raw = data.content[0].text.trim().replace(/```json|```/g, "").trim();
      const result = JSON.parse(raw);
      setTooltip(t => ({ ...t, loading: false, translation: result.translation, type: result.type || "" }));
    } catch {
      setTooltip(t => ({ ...t, loading: false, translation: "Error al traducir", type: "" }));
    }
  }, []);

  useEffect(() => {
    const hide = (e) => {
      if (!e.target.closest("#translation-tooltip")) {
        const sel = window.getSelection();
        if (!sel || sel.toString().trim().length === 0) {
          setTooltip(t => ({ ...t, visible: false }));
        }
      }
    };
    document.addEventListener("mousedown", hide);
    document.addEventListener("touchstart", hide);
    return () => {
      document.removeEventListener("mousedown", hide);
      document.removeEventListener("touchstart", hide);
    };
  }, []);

  if (showSplash) return <SplashScreen onDone={() => setShowSplash(false)} />;

  return (
    <div style={{
      height: "100%", width: "100%",
      background: "#faf7f0",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      paddingTop: "env(safe-area-inset-top, 0px)",
    }}>
      <LoadingOverlay visible={generating} phase={loadingPhase} title={loadingTitle} />

      {/* ── TOP BAR ── */}
      <div style={{
        background: "#1a1410",
        padding: "12px 16px",
        display: "flex", alignItems: "center",
        gap: 10, flexShrink: 0,
        borderBottom: "1px solid #2a2018",
        minHeight: 56,
      }}>
        {view === "reading" && (
          <button
            onClick={() => setView("home")}
            style={{
              background: "transparent", border: "none",
              color: "#c17d3a", fontSize: 22, cursor: "pointer",
              padding: "4px 8px 4px 0", lineHeight: 1,
              display: "flex", alignItems: "center",
            }}
          >‹</button>
        )}

        {view === "home" && (
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#f0e8d8" }}>
            📖 ReadEnglish
          </div>
        )}

        {view === "reading" && currentBook && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 14, fontWeight: 600, color: "#f0e8d8",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{currentBook.title}</div>
            <div style={{ fontSize: 10, color: "#9e8e7a" }}>
              {currentBook.level} · {readMin} min · {wordCount} palabras
            </div>
          </div>
        )}

        <div style={{ marginLeft: view === "reading" ? 0 : "auto", display: "flex", gap: 8, flexShrink: 0 }}>
          {view === "reading" && (
            <>
              <button onClick={() => setFontSize(f => Math.max(f-1, 13))} style={iconBtn}>A−</button>
              <button onClick={() => setFontSize(f => Math.min(f+1, 24))} style={iconBtn}>A+</button>
            </>
          )}
          {books.length > 0 && (
            <button
              onClick={() => setLibraryOpen(true)}
              style={{
                ...iconBtn,
                background: "rgba(193,125,58,0.15)",
                color: "#c17d3a", fontWeight: 600,
                padding: "6px 12px", fontSize: 11,
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <span>📚</span> <span>{books.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── HOME VIEW ── */}
      {view === "home" && (
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "24px 20px",
          animation: "fadeIn 0.35s ease",
        }}>
          {/* Level selector */}
          <div className="animate-fadeUp" style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9e8e7a", marginBottom: 10 }}>
              Tu nivel de inglés (CEFR)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6 }}>
              {["A1","A2","B1","B2","C1","C2"].map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className="ripple"
                  style={{
                    padding: "10px 4px",
                    background: level === l ? "#c17d3a" : "#f0ebe0",
                    border: "none",
                    borderRadius: 10,
                    color: level === l ? "#fff" : "#6b5e4a",
                    fontWeight: level === l ? 700 : 400,
                    fontSize: 12, cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(.22,.68,0,1.2)",
                    transform: level === l ? "scale(1.05)" : "scale(1)",
                    boxShadow: level === l ? "0 4px 12px rgba(193,125,58,0.4)" : "none",
                  }}
                >{l}</button>
              ))}
            </div>
            <div style={{
              fontSize: 11, color: "#9e8e7a", marginTop: 8, lineHeight: 1.5,
              background: "#f0ebe0", borderRadius: 8, padding: "8px 12px",
            }}>
              {LEVEL_INFO[level]}
            </div>
          </div>

          {/* Genre grid */}
          <div className="animate-fadeUp delay-1" style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9e8e7a", marginBottom: 10 }}>
              Género
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {GENRES.map(g => (
                <button
                  key={g.value}
                  onClick={() => setGenre(g.value)}
                  className="ripple"
                  style={{
                    padding: "12px 6px",
                    background: genre === g.value ? "#1a1410" : "#f0ebe0",
                    border: `2px solid ${genre === g.value ? "#c17d3a" : "transparent"}`,
                    borderRadius: 12,
                    color: genre === g.value ? "#f0e8d8" : "#6b5e4a",
                    fontSize: 11, cursor: "pointer",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 4,
                    transition: "all 0.2s cubic-bezier(.22,.68,0,1.2)",
                    transform: genre === g.value ? "scale(1.04)" : "scale(1)",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{g.label}</span>
                  <span style={{ fontWeight: 500 }}>{g.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="animate-fadeUp delay-2" style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <button
              onClick={generateBook}
              disabled={generating}
              className="ripple"
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #c17d3a, #a8612a)",
                border: "none",
                color: "#fff",
                borderRadius: 14,
                padding: "16px 12px",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                boxShadow: "0 4px 20px rgba(193,125,58,0.4)",
                transition: "all 0.2s",
                opacity: generating ? 0.6 : 1,
              }}
            >
              <span style={{ fontSize: 22 }}>✨</span>
              <span>Crear historia</span>
            </button>
            <button
              onClick={() => { setMode("search"); setSheetOpen(true); }}
              disabled={generating}
              className="ripple"
              style={{
                flex: 1,
                background: "#f0ebe0",
                border: "none",
                color: "#2c2416",
                borderRadius: 14,
                padding: "16px 12px",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                transition: "all 0.2s",
                opacity: generating ? 0.6 : 1,
              }}
            >
              <span style={{ fontSize: 22 }}>🔎</span>
              <span>Buscar libro</span>
            </button>
          </div>

          {/* Recent books */}
          {books.length > 0 && (
            <div className="animate-fadeUp delay-3">
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9e8e7a", marginBottom: 10 }}>
                Leídos recientemente
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {books.slice(0, 3).map(b => (
                  <div
                    key={b.id}
                    onClick={() => openBook(b)}
                    className="ripple"
                    style={{
                      background: "#1a1410",
                      borderRadius: 12,
                      padding: "12px 14px",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 12,
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{
                      width: 40, height: 48,
                      background: "linear-gradient(135deg, #2a2018, #3d3020)",
                      borderRadius: 6,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                    }}>
                      {b.source === "real_book" ? "📚" : "✨"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 13, fontWeight: 600, color: "#d8c8b0",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{b.title}</div>
                      <div style={{ fontSize: 11, color: "#9e8e7a", marginTop: 2 }}>{b.author}</div>
                    </div>
                    <span style={{
                      background: "#2a2018", borderRadius: 6,
                      padding: "3px 8px", fontSize: 11, fontWeight: 600, color: "#e8a84e", flexShrink: 0,
                    }}>{b.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {books.length === 0 && (
            <div className="animate-fadeUp delay-3" style={{
              textAlign: "center", padding: "32px 20px",
              color: "#9e8e7a", fontSize: 13, lineHeight: 1.8,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>📖</div>
              Elige tu nivel y género, luego toca<br />
              <strong style={{ color: "#c17d3a" }}>✨ Crear historia</strong> para comenzar
            </div>
          )}
        </div>
      )}

      {/* ── READING VIEW ── */}
      {view === "reading" && (
        <div
          ref={readerRef}
          onMouseUp={handleSelectionEnd}
          onTouchEnd={handleSelectionEnd}
          style={{
            flex: 1, overflowY: "auto",
            padding: "28px 20px",
            paddingBottom: `calc(100px + env(safe-area-inset-bottom, 0px))`,
            animation: bookTransition ? "pageFlip 0.4s ease" : "fadeIn 0.5s ease",
          }}
        >
          {!currentBook ? <EmptyState /> : (
            <>
              {/* Book header */}
              {currentBook.source === "real_book" && currentBook.synopsis && (
                <div className="animate-fadeUp" style={{
                  background: "#f0ebe0",
                  borderRadius: 12, padding: "12px 16px",
                  marginBottom: 24, fontSize: 13, color: "#5a5040", lineHeight: 1.6,
                  borderLeft: "3px solid #c17d3a",
                }}>
                  <span style={{ fontWeight: 600, color: "#2c2416" }}>Sinopsis: </span>
                  {currentBook.synopsis}
                </div>
              )}

              <h1 className="animate-fadeUp delay-1" style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26, fontWeight: 700, color: "#1a1208",
                marginBottom: 6, lineHeight: 1.25,
              }}>{currentBook.title}</h1>

              <p className="animate-fadeUp delay-2" style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 13, color: "#9e8e7a",
                marginBottom: 20, fontStyle: "italic",
              }}>
                by {currentBook.author}{currentBook.year ? ` (${currentBook.year})` : ""}
              </p>

              <div className="animate-fadeUp delay-2" style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap" }}>
                <span style={{ background: "#1a1208", color: "#f0e8d8", borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 600 }}>{currentBook.level}</span>
                {currentBook.source === "real_book"
                  ? <span style={{ background: "rgba(46,125,50,0.12)", color: "#2d6a4f", borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 500 }}>📚 Adaptación</span>
                  : <span style={{ background: "#f0ebe0", color: "#6b4a1a", borderRadius: 6, padding: "3px 9px", fontSize: 11 }}>{currentBook.genre}</span>
                }
                <span style={{ background: "#f0ebe0", color: "#9e9080", borderRadius: 6, padding: "3px 9px", fontSize: 11 }}>~{readMin} min · {wordCount} words</span>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #e0d8cc", marginBottom: 28 }} />

              {currentBook.paragraphs?.map((p, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: fontSize, lineHeight: 2,
                    marginBottom: 24, textAlign: "justify",
                    color: "#2c2416", userSelect: "text",
                    animation: `fadeUp 0.5s ease ${0.1 + i * 0.04}s both`,
                  }}
                >{p}</p>
              ))}

              <hr style={{ border: "none", borderTop: "1px solid #e0d8cc", margin: "32px 0 16px" }} />
              <p style={{ fontSize: 12, color: "#9e8e7a", textAlign: "center", fontStyle: "italic", marginBottom: 32 }}>
                💡 Selecciona cualquier palabra o frase para traducirla
              </p>
            </>
          )}
        </div>
      )}

      {/* ── STATUS BAR ── */}
      <div style={{
        background: "#1a1410",
        borderTop: "1px solid #2a2018",
        padding: `10px 16px`,
        paddingBottom: `max(10px, env(safe-area-inset-bottom, 10px))`,
        display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: generating ? "#c17d3a" : currentBook ? "#2d6a4f" : "#4a4030",
          flexShrink: 0,
          animation: generating ? "pulse 1s ease-in-out infinite" : "none",
          transition: "background 0.3s",
        }} />
        <span style={{ fontSize: 11, color: "#9e8e7a", flex: 1 }}>{status}</span>
      </div>

      {/* ── TOOLTIP ── */}
      {tooltip.visible && (
        <div id="translation-tooltip">
          <Tooltip tooltip={tooltip} />
        </div>
      )}

      {/* ── SEARCH BOTTOM SHEET ── */}
      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="🔎 Buscar un libro real">
        <div style={{ padding: "0 20px 8px" }}>
          <input
            value={bookQuery}
            onChange={e => setBookQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchBook()}
            placeholder="Ej: El Principito, 1984, Harry Potter…"
            autoFocus
            style={{
              width: "100%", background: "#12100c",
              border: "1px solid #3d3020", color: "#f0e8d8",
              borderRadius: 10, padding: "12px 14px",
              fontSize: 15, outline: "none",
              boxSizing: "border-box", fontFamily: "inherit",
            }}
          />
          <div style={{ marginTop: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#6b5e4a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Sugerencias rápidas
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setBookQuery(s)}
                  className="ripple"
                  style={{
                    background: bookQuery === s ? "#c17d3a" : "#2a2018",
                    border: "none", color: bookQuery === s ? "#fff" : "#c8b89a",
                    borderRadius: 8, padding: "6px 10px",
                    fontSize: 12, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >{s}</button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#6b5e4a", marginBottom: 16, lineHeight: 1.5, background: "#12100c", borderRadius: 8, padding: "8px 12px" }}>
            Claude creará una adaptación extensa del libro real en inglés nivel <strong style={{ color: "#c17d3a" }}>{level}</strong>.
          </div>
          <button
            onClick={searchBook}
            disabled={!bookQuery.trim()}
            className="ripple"
            style={{
              width: "100%",
              background: bookQuery.trim() ? "linear-gradient(135deg, #c17d3a, #a8612a)" : "#2a2018",
              border: "none",
              color: bookQuery.trim() ? "#fff" : "#6b5040",
              borderRadius: 12, padding: 14,
              fontSize: 15, fontWeight: 600, cursor: bookQuery.trim() ? "pointer" : "not-allowed",
              boxShadow: bookQuery.trim() ? "0 4px 20px rgba(193,125,58,0.35)" : "none",
              transition: "all 0.3s cubic-bezier(.22,.68,0,1.2)",
            }}
          >
            🔎 Adaptar al nivel {level}
          </button>
        </div>
      </BottomSheet>

      {/* ── LIBRARY BOTTOM SHEET ── */}
      <BottomSheet visible={libraryOpen} onClose={() => setLibraryOpen(false)} title={`📚 Biblioteca (${books.length})`}>
        <div>
          {books.map(b => (
            <BookCard
              key={b.id}
              book={b}
              active={currentBook?.id === b.id}
              onSelect={() => openBook(b)}
            />
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}

const iconBtn = {
  background: "rgba(255,255,255,0.06)",
  border: "none",
  color: "#c8b89a",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12, cursor: "pointer",
  transition: "all 0.2s",
};
