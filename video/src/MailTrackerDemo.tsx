/**
 * Mail Tracker — 25-second launch video
 * 750 frames @ 30 fps, 1920 × 1080
 *
 * Scene breakdown (with 20-frame fade transitions):
 *  1. CinematicHook    170 frames  (5.7s)
 *  2. LogoReveal       160 frames  (5.3s)
 *  3. GmailCompose     120 frames  (4.0s)
 *  4. OpenMoment       230 frames  (7.7s)
 *  5. UseCaseScene     130 frames  (4.3s)
 *  6. InstallScene     150 frames  (5.0s)
 *  7. FinalSlide        80 frames  (2.7s)
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Series,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  ink: "#050507",
  bg: "#09090b",
  surface: "#18181b",
  surface2: "#1f1f23",
  border: "#27272a",
  text: "#fafafa",
  text2: "#a1a1aa",
  text3: "#71717a",
  accent: "#6366f1",
  accentLight: "#818cf8",
  accentPale: "#c7d2fe",
  green: "#34d399",
  amber: "#fbbf24",
  blue: "#60a5fa",
  red: "#f87171",
  gmailBg: "#202124",
  gmailSurface: "#2c2d30",
  gmailCompose: "#404040",
  gmailText: "#e8eaed",
  gmailDim: "#9aa0a6",
  gmailBlue: "#1a73e8",
  chromeTabs: "#2d2e31",
  chromeBar: "#202124",
};

const FONT = "'Inter', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif";
const GFONT = "'Google Sans', 'Roboto', Arial, sans-serif";
const MONO = "'SF Mono', 'Fira Code', Consolas, monospace";

// ─────────────────────────────────────────────────────────────────────────────
// Primitive helpers
// ─────────────────────────────────────────────────────────────────────────────

const Logo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", flexShrink: 0 }}>
    <rect width="100" height="100" rx="20" fill="#6366f1" />
    <path d="M20 35c0-3 2-5 5-5h50c3 0 5 2 5 5v30c0 3-2 5-5 5H25c-3 0-5-2-5-5V35z" fill="none" stroke="white" strokeWidth="5" />
    <path d="M22 33l28 22 28-22" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="75" cy="28" r="12" fill="#34d399" />
  </svg>
);

const WordReveal: React.FC<{
  text: string;
  from: number;
  stagger?: number;
  wrapStyle?: React.CSSProperties;
  wordStyle?: React.CSSProperties;
}> = ({ text, from, stagger = 5, wrapStyle = {}, wordStyle = {} }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const fontSize = typeof wordStyle.fontSize === "number" ? wordStyle.fontSize : 16;
  const wordGap = `${Math.round(fontSize * 0.28)}px`;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: wordGap, justifyContent: "center", ...wrapStyle }}>
      {words.map((word, i) => {
        const f = frame - from - i * stagger;
        const op = interpolate(f, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        const y = interpolate(f, [0, 14], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
        const blur = interpolate(f, [0, 10], [8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <span key={i} style={{ display: "inline-block", opacity: op, transform: `translateY(${y}px)`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined, ...wordStyle }}>
            {word}
          </span>
        );
      })}
    </div>
  );
};

const StarField: React.FC<{ opacity?: number; count?: number }> = ({ opacity = 1, count = 140 }) => {
  const frame = useCurrentFrame();
  const stars = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      x: (i * 173.737) % 1920,
      y: (i * 337.331) % 1080,
      r: 0.5 + (i % 5) * 0.38,
      baseOp: 0.05 + (i % 7) * 0.055,
      phase: (i * 1.6180339) % (Math.PI * 2),
    })),
    [count]
  );
  return (
    <AbsoluteFill style={{ opacity }}>
      {stars.map((s, i) => {
        const t = 0.5 + 0.5 * Math.sin(frame * 0.038 + s.phase);
        return (
          <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: "50%", background: "#fff", opacity: s.baseOp * t }} />
        );
      })}
    </AbsoluteFill>
  );
};

const Glow: React.FC<{ color: string; size?: number; x?: string; y?: string }> = ({ color, size = 800, x = "50%", y = "50%" }) => (
  <div style={{ position: "absolute", left: x, top: y, width: size, height: size, transform: "translate(-50%, -50%)", borderRadius: "50%", background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, pointerEvents: "none" }} />
);

const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.6 }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 35%, rgba(0,0,0,0.9) 100%)", opacity: strength, pointerEvents: "none" }} />
);

const LetterboxBars: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 52, background: "#000", zIndex: 200, opacity }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 52, background: "#000", zIndex: 200, opacity }} />
  </>
);

const FadeScene: React.FC<{ children: React.ReactNode; duration: number }> = ({ children, duration }) => {
  const frame = useCurrentFrame();
  const FADE = 18;
  const fadeIn = interpolate(frame, [0, FADE], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const fadeOut = interpolate(frame, [duration - FADE, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  return <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>{children}</AbsoluteFill>;
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 — CinematicHook
// ─────────────────────────────────────────────────────────────────────────────
const CinematicHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const barOp = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line3From = Math.round(1.5 * fps);
  const line3Op = interpolate(frame, [line3From, line3From + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line3Y = interpolate(frame, [line3From, line3From + 18], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: "#f0f4ff", justifyContent: "center", alignItems: "center" }}>
      <LetterboxBars opacity={barOp} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, zIndex: 10 }}>
        <WordReveal text="Every email you send" from={8} stagger={2} wordStyle={{ fontSize: 102, fontWeight: 800, fontFamily: FONT, color: "#111827", letterSpacing: "-4px", lineHeight: 1 }} />
        <WordReveal text="is a question mark." from={Math.round(0.75 * fps)} stagger={2} wordStyle={{ fontSize: 102, fontWeight: 800, fontFamily: FONT, letterSpacing: "-4px", lineHeight: 1, background: "linear-gradient(90deg, #3730a3 0%, #6366f1 55%, #4f46e5 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }} />
        <div style={{ marginTop: 16, opacity: line3Op, transform: `translateY(${line3Y}px)`, fontFamily: FONT, fontSize: 36, color: "#6b7280", fontWeight: 400, letterSpacing: "-0.5px" }}>
          Did they open it? Did they care?
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 2 — LogoReveal
// ─────────────────────────────────────────────────────────────────────────────
const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSpring = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 110 }, durationInFrames: Math.round(1.4 * fps) });
  const logoOp = interpolate(frame, [8, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleFrom = Math.round(0.85 * fps);
  const subtitleFrom = Math.round(1.6 * fps);
  const glowPulse = 0.45 + 0.55 * Math.sin((frame / fps) * Math.PI * 0.9);
  const particles = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({
      angle: (i / 28) * Math.PI * 2 + (i % 3) * 0.18,
      dist: 130 + (i % 6) * 30,
      size: 3 + (i % 4) * 1.5,
      color: ["#6366f1", "#818cf8", "#34d399", "#a5b4fc", "#c7d2fe"][i % 5],
    })),
    []
  );
  const pSpring = spring({ frame: frame - 5, fps, config: { damping: 14, stiffness: 85 }, durationInFrames: Math.round(1.8 * fps) });

  return (
    <AbsoluteFill style={{ background: "#f0f4ff", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 28 }}>
      <Glow color={`rgba(99,102,241,${0.12 * glowPulse})`} size={1000} />
      <AbsoluteFill>
        {particles.map((p, i) => {
          const pp = Math.max(0, Math.min(pSpring * 1.4 - i * 0.018, 1));
          const dist = p.dist * pp;
          const pOp = interpolate(pp, [0, 0.25, 0.65, 1], [0, 1, 0.5, 0]);
          return (
            <div key={i} style={{ position: "absolute", left: 960 + Math.cos(p.angle) * dist - p.size / 2, top: 540 + Math.sin(p.angle) * dist - p.size / 2, width: p.size, height: p.size, borderRadius: "50%", background: p.color, opacity: pOp, boxShadow: `0 0 ${p.size * 3}px ${p.color}` }} />
          );
        })}
      </AbsoluteFill>
      <div style={{ transform: `scale(${logoSpring})`, opacity: logoOp, filter: `drop-shadow(0 0 ${64 * glowPulse}px rgba(99,102,241,${0.75 * glowPulse})) drop-shadow(0 0 ${140 * glowPulse}px rgba(99,102,241,${0.25 * glowPulse}))`, zIndex: 10 }}>
        <Logo size={130} />
      </div>
      <WordReveal text="Mail Tracker" from={titleFrom} stagger={4} wordStyle={{ fontSize: 90, fontWeight: 800, fontFamily: FONT, letterSpacing: "-3px", background: "linear-gradient(135deg, #4338ca 0%, #6366f1 40%, #4f46e5 75%, #3730a3 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }} />
      <WordReveal text="Email Tracker that actually works." from={subtitleFrom} stagger={2} wordStyle={{ fontSize: 30, fontWeight: 400, fontFamily: FONT, color: "#6b7280", letterSpacing: "-0.4px" }} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 3 — GmailCompose (light theme)
// ─────────────────────────────────────────────────────────────────────────────

const GL = {
  bg: "#ffffff",
  sidebar: "#ffffff",
  searchBg: "#f1f3f4",
  tabBlue: "#1a73e8",
  chromeBg: "#dee1e6",
  chromeTab: "#ffffff",
  text: "#202124",
  dim: "#5f6368",
  border: "#e0e0e0",
  composeBg: "#ffffff",
  composeHeader: "#404040",
};

const GmailComposeWindow: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const composeIn = spring({ frame: frame - 8, fps, config: { damping: 18, stiffness: 95 }, durationInFrames: Math.round(1.2 * fps) });
  const windowY = interpolate(composeIn, [0, 1], [90, 0]);
  const windowOp = interpolate(frame, [8, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const EMAIL_BODY = "Hi John,\n\nFollowing up on our call — attaching the Q1 proposal as discussed.\n\nLooking forward to your thoughts!\n\nBest,\nSamrath";
  const typingStart = Math.round(0.7 * fps);
  const typingEnd = Math.round(1.9 * fps);
  const charsVisible = Math.floor(interpolate(frame, [typingStart, typingEnd], [0, EMAIL_BODY.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  const visibleText = EMAIL_BODY.slice(0, charsVisible);
  const showCursor = frame >= typingStart && frame <= typingEnd + 8 && Math.floor(frame * 0.07) % 2 === 0;

  const badgeStart = typingEnd + 5;
  const badgeOp = interpolate(frame, [badgeStart, badgeStart + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badgeY = interpolate(frame, [badgeStart, badgeStart + 14], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const sendHoverStart = Math.round(2.5 * fps);
  const sendClickFrame = Math.round(2.9 * fps);
  const sentFrame = Math.round(3.2 * fps);
  const sendHoverP = interpolate(frame, [sendHoverStart, sendHoverStart + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sendClickScale = interpolate(frame, [sendClickFrame, sendClickFrame + 6, sendClickFrame + 12], [1, 0.93, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isSent = frame >= sentFrame;
  const sentOp = interpolate(frame, [sentFrame, sentFrame + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const dismissStart = sentFrame + 20;
  const dismissY = interpolate(frame, [dismissStart, dismissStart + 22], [0, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  const dismissOp = interpolate(frame, [dismissStart, dismissStart + 35], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sendBg = sendHoverP > 0.5 ? "#1557b0" : "#1a73e8";

  return (
    <div style={{ width: 560, background: GL.composeBg, borderRadius: "8px 8px 0 0", overflow: "hidden", transform: `translateY(${windowY + dismissY}px)`, opacity: windowOp * dismissOp, boxShadow: "0 8px 40px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.08)" }}>
      {/* Header */}
      <div style={{ height: 40, background: "#404040", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
        <span style={{ fontFamily: GFONT, fontSize: 14, color: "#ffffff", fontWeight: 400 }}>New Message</span>
        <div style={{ display: "flex", gap: 14 }}>
          {["─", "⤢", "✕"].map((ic, i) => (
            <span key={i} style={{ color: "#ffffff", opacity: 0.7, fontSize: i === 2 ? 14 : 12, fontFamily: GFONT }}>{ic}</span>
          ))}
        </div>
      </div>
      {/* To */}
      <div style={{ padding: "8px 16px", borderBottom: `1px solid ${GL.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: GFONT, fontSize: 14, color: GL.dim, width: 26 }}>To</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#e8f0fe", border: "1px solid #c5d4f6", borderRadius: 20, padding: "3px 10px 3px 5px" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1a73e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>J</span>
          </div>
          <span style={{ fontFamily: GFONT, fontSize: 13, color: "#1a73e8" }}>john@company.com</span>
        </div>
      </div>
      {/* Subject */}
      <div style={{ padding: "8px 16px", borderBottom: `1px solid ${GL.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: GFONT, fontSize: 14, color: GL.dim, width: 52 }}>Subject</span>
        <span style={{ fontFamily: GFONT, fontSize: 14, color: GL.text }}>Q1 Partnership Proposal</span>
      </div>
      {/* Body */}
      <div style={{ padding: "12px 16px", minHeight: 160, background: "#ffffff" }}>
        <pre style={{ fontFamily: GFONT, fontSize: 14, color: GL.text, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {visibleText}
          {showCursor && <span style={{ display: "inline-block", width: 1.5, height: 16, background: GL.text, marginLeft: 1, verticalAlign: "text-bottom" }} />}
        </pre>
      </div>
      {/* Mail Tracker badge */}
      <div style={{ background: "rgba(232,240,254,0.95)", borderTop: "1px solid #c5d4f6", padding: "7px 16px", display: "flex", alignItems: "center", gap: 7, opacity: badgeOp, transform: `translateY(${badgeY}px)` }}>
        <Logo size={14} />
        <span style={{ fontFamily: GFONT, fontSize: 12, color: "#1a73e8", fontWeight: 600 }}>Mail Tracker</span>
        <span style={{ fontFamily: GFONT, fontSize: 12, color: GL.dim }}>·</span>
        <span style={{ fontFamily: GFONT, fontSize: 12, color: "#137333", fontWeight: 500 }}>✓ Tracking pixel will be injected on send</span>
        <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 7px rgba(52,211,153,0.9)" }} />
      </div>
      {/* Toolbar */}
      <div style={{ background: "#f2f6fc", borderTop: `1px solid ${GL.border}`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        {!isSent ? (
          <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", transform: `scale(${sendClickScale})`, boxShadow: sendHoverP > 0.5 ? "0 1px 8px rgba(26,115,232,0.4)" : "none" }}>
            <div style={{ background: sendBg, padding: "8px 22px", fontFamily: GFONT, fontSize: 14, fontWeight: 500, color: "white" }}>Send</div>
            <div style={{ background: sendBg, padding: "8px 9px", borderLeft: "1px solid rgba(255,255,255,0.2)", fontFamily: GFONT, fontSize: 11, color: "white" }}>▾</div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: GFONT, fontSize: 14, color: "#137333", fontWeight: 500, opacity: sentOp }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#137333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Message sent
          </div>
        )}
        <div style={{ display: "flex", gap: 16, marginLeft: 8, opacity: 0.5 }}>
          {["A", "≡", "📎", "🔗"].map((ic, i) => (
            <span key={i} style={{ fontFamily: GFONT, fontSize: 14, color: GL.dim }}>{ic}</span>
          ))}
        </div>
        <div style={{ marginLeft: "auto", opacity: 0.4 }}><span style={{ fontSize: 16, color: GL.dim }}>🗑</span></div>
      </div>
    </div>
  );
};


const GmailCompose: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Whole-scene cinematic zoom toward compose window (bottom-right)
  // Phase 1: gentle pull-in as scene opens (0 → 0.4s)
  // Phase 2: zoom into compose during typing (0.5s → 2.2s)
  // Phase 3: hold tight on compose through send
  const sceneZoom = interpolate(
    frame,
    [0, Math.round(0.4 * fps), Math.round(0.7 * fps), Math.round(2.2 * fps)],
    [0.92, 1.0, 1.0, 1.28],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  const sidebarItems = [
    { icon: "📥", label: "Inbox", count: 212 },
    { icon: "⭐", label: "Starred" },
    { icon: "🕐", label: "Snoozed" },
    { icon: "📤", label: "Sent" },
    { icon: "📝", label: "Drafts", count: 15 },
    { icon: "🛒", label: "Purchases" },
  ];
  const emailRows = [
    { from: "Google", subject: "Security alert for your account", preview: "A new sign-in on Windows", time: "10:42 AM", unread: true, color: "#4285f4", opened: false },
    { from: "GitHub", subject: "Your pull request was merged", preview: "feat: add tracking pixel · main", time: "9:15 AM", unread: true, color: "#24292e", opened: true },
    { from: "Stripe", subject: "Payment received · $249.00", preview: "Thank you for your payment", time: "Yesterday", unread: false, color: "#635bff", opened: true },
    { from: "Notion", subject: "Weekly digest · 3 updates", preview: "Your workspace activity this week", time: "Mon", unread: false, color: "#000000", opened: false },
    { from: "Linear", subject: "Issue assigned: MT-142", preview: "Add open-rate analytics dashboard", time: "Sun", unread: false, color: "#5e6ad2", opened: true },
  ];

  return (
    <AbsoluteFill style={{ background: GL.bg, transform: `scale(${sceneZoom})`, transformOrigin: "100% 100%" }}>
      {/* Chrome tab bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 36, background: GL.chromeBg, display: "flex", alignItems: "flex-end", padding: "0 0 0 70px", zIndex: 30 }}>
        <div style={{ display: "flex", gap: 6, marginRight: 12, alignItems: "center", paddingBottom: 6 }}>
          {["#f87171", "#fbbf24", "#34d399"].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
        </div>
        {/* Active tab */}
        <div style={{ height: 30, background: "#ffffff", borderRadius: "8px 8px 0 0", padding: "0 16px", display: "flex", alignItems: "center", gap: 8, minWidth: 220, boxShadow: "0 1px 0 #dee1e6" }}>
          <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
            <path d="M24 24L4 12h40L24 24z" fill="#EA4335"/>
            <path d="M4 12v24h40V12L24 24 4 12z" fill="#FBBC05" opacity="0.2"/>
            <path d="M4 36l20-12 20 12H4z" fill="#34A853" opacity="0.2"/>
            <rect x="2" y="10" width="44" height="28" rx="2" stroke="#DADCE0" strokeWidth="1" fill="none"/>
            <path d="M4 12l20 12 20-12" stroke="#EA4335" strokeWidth="2" fill="none"/>
          </svg>
          <span style={{ fontSize: 13, color: "#202124", fontFamily: FONT, fontWeight: 400 }}>Gmail - Inbox (212)</span>
          <span style={{ fontSize: 11, color: "#5f6368", marginLeft: 8 }}>✕</span>
        </div>
        <div style={{ marginLeft: 4, marginBottom: 5, width: 24, height: 24, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#5f6368", fontSize: 16 }}>+</span>
        </div>
      </div>

      {/* Chrome address bar */}
      <div style={{ position: "absolute", top: 36, left: 0, right: 0, height: 46, background: "#f1f3f4", display: "flex", alignItems: "center", padding: "0 14px", gap: 12, zIndex: 30, borderBottom: "1px solid #dee1e6" }}>
        <div style={{ display: "flex", gap: 8, color: "#5f6368", fontSize: 16 }}>
          <span>←</span><span style={{ opacity: 0.4 }}>→</span><span style={{ fontSize: 13 }}>↺</span>
        </div>
        <div style={{ flex: 1, maxWidth: 640, height: 32, background: "#ffffff", borderRadius: 16, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #dfe1e5" }}>
          <span style={{ fontSize: 12, color: "#34d399" }}>🔒</span>
          <span style={{ fontFamily: FONT, fontSize: 13, color: "#202124" }}>mail.google.com</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Logo size={16} />
          </div>
          <span style={{ color: "#5f6368", fontSize: 18 }}>⋮</span>
        </div>
      </div>

      {/* Gmail page body */}
      <div style={{ position: "absolute", top: 82, left: 0, right: 0, bottom: 0, display: "flex" }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: GL.sidebar, padding: "10px 0", flexShrink: 0 }}>
          {/* Compose button */}
          <div style={{ margin: "4px 14px 8px", padding: "14px 20px", background: "#c2e7ff", borderRadius: 18, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <span style={{ fontSize: 18 }}>✏</span>
            <span style={{ fontFamily: GFONT, fontSize: 14, color: "#001d35", fontWeight: 500 }}>Compose</span>
          </div>
          {sidebarItems.map((item, i) => (
            <div key={i} style={{ padding: "8px 14px 8px 20px", display: "flex", alignItems: "center", gap: 14, background: i === 0 ? "#d3e3fd" : "transparent", borderRadius: "0 20px 20px 0", marginRight: 14 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontFamily: GFONT, fontSize: 16, color: i === 0 ? "#041e49" : "#202124", fontWeight: i === 0 ? 700 : 400 }}>{item.label}</span>
              {item.count && (
                <span style={{ marginLeft: "auto", fontFamily: GFONT, fontSize: 15, color: i === 0 ? "#041e49" : "#202124", fontWeight: 700 }}>{item.count}</span>
              )}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, background: "#ffffff", display: "flex", flexDirection: "column" }}>
          {/* Search bar */}
          <div style={{ padding: "10px 20px", borderBottom: `1px solid ${GL.border}` }}>
            <div style={{ height: 44, background: GL.searchBg, borderRadius: 22, padding: "0 20px", display: "flex", alignItems: "center", gap: 12, maxWidth: 720 }}>
              <span style={{ color: GL.dim, fontSize: 18 }}>🔍</span>
              <span style={{ fontFamily: GFONT, fontSize: 16, color: GL.dim }}>Search mail</span>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${GL.border}`, padding: "0 16px" }}>
            {[
              { label: "Primary", active: true },
              { label: "Promotions", active: false },
              { label: "Social", active: false },
              { label: "Updates", active: false },
            ].map((tab, i) => (
              <div key={i} style={{ padding: "14px 20px", fontFamily: GFONT, fontSize: 16, color: tab.active ? GL.tabBlue : GL.dim, fontWeight: tab.active ? 600 : 400, borderBottom: tab.active ? `3px solid ${GL.tabBlue}` : "3px solid transparent", cursor: "pointer" }}>
                {tab.label}
              </div>
            ))}
          </div>
          {/* Email rows */}
          {emailRows.map((row, i) => (
            <div key={i} style={{ padding: "0 20px", display: "flex", alignItems: "center", gap: 14, height: 60, borderBottom: `1px solid ${GL.border}`, background: row.opened ? "rgba(16,185,129,0.04)" : "#ffffff", borderLeft: row.opened ? "3px solid rgba(16,185,129,0.5)" : "3px solid transparent" }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid #bdc1c6`, flexShrink: 0 }} />
              <span style={{ fontSize: 16, flexShrink: 0 }}>☆</span>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: row.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{row.from[0]}</span>
              </div>
              <span style={{ fontFamily: GFONT, fontSize: 16, fontWeight: row.unread ? 700 : 400, color: GL.text, minWidth: 130, flexShrink: 0 }}>{row.from}</span>
              <span style={{ fontFamily: GFONT, fontSize: 16, fontWeight: row.unread ? 600 : 400, color: GL.text, marginRight: 4 }}>{row.subject}</span>
              <span style={{ fontFamily: GFONT, fontSize: 15, color: GL.dim }}>– {row.preview}</span>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {row.opened && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 12, padding: "2px 8px" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
                    <span style={{ fontFamily: GFONT, fontSize: 11, color: "#059669", fontWeight: 600 }}>opened</span>
                  </div>
                )}
                <span style={{ fontFamily: GFONT, fontSize: 14, color: GL.dim, fontWeight: row.unread ? 700 : 400 }}>{row.time}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Compose window overlay, bottom-right */}
      <div style={{ position: "absolute", bottom: 0, right: 80, zIndex: 20 }}>
        <GmailComposeWindow frame={frame} fps={fps} />
      </div>

    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 4 — OpenMoment (iPhone → wireframe → MacBook)
// ─────────────────────────────────────────────────────────────────────────────
const OpenMoment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timing
  const DEVICES_IN    = 8;
  const LABEL_IN      = 18;
  const MAIL_NOTIF_IN = 32;
  const EMAIL_OPEN    = Math.round(1.8 * fps);
  const LINES_START   = Math.round(2.2 * fps);
  const LINES_END     = Math.round(3.3 * fps);
  const PACKET_1      = Math.round(2.5 * fps);
  const PACKET_2      = Math.round(2.75 * fps);
  const PACKET_3      = Math.round(3.0 * fps);
  const TRACKER_NOTIF = Math.round(3.6 * fps);
  const CARD_IN       = Math.round(4.1 * fps);

  // "3 hours later" label — fades in and stays visible
  const labelOp = interpolate(
    frame,
    [LABEL_IN, LABEL_IN + 18],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // Device panels entrance
  const devicesSpring = spring({ frame: frame - DEVICES_IN, fps, config: { damping: 18, stiffness: 90 }, durationInFrames: Math.round(1.1 * fps) });
  const devicesOp = interpolate(frame, [DEVICES_IN, DEVICES_IN + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Apple Mail notification slide in on phone
  const notifSpring = spring({ frame: frame - MAIL_NOTIF_IN, fps, config: { damping: 22, stiffness: 180 }, durationInFrames: Math.round(0.7 * fps) });
  const notifSlideY = interpolate(notifSpring, [0, 1], [-80, 0]);
  const notifOp = interpolate(frame, [EMAIL_OPEN - 6, EMAIL_OPEN + 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Phone screen: after email open, show Mail open view
  const emailViewOp = interpolate(frame, [EMAIL_OPEN, EMAIL_OPEN + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Wireframe lines draw
  const line1P = interpolate(frame, [LINES_START, LINES_END], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const line2P = interpolate(frame, [LINES_START + 6, LINES_END], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const line3P = interpolate(frame, [LINES_START + 12, LINES_END], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });


  // Data packets
  const p1 = interpolate(frame, [PACKET_1, PACKET_1 + Math.round(0.9 * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const p2 = interpolate(frame, [PACKET_2, PACKET_2 + Math.round(0.9 * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const p3 = interpolate(frame, [PACKET_3, PACKET_3 + Math.round(0.9 * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

  // MacBook notification
  const macNotifSpring = spring({ frame: frame - TRACKER_NOTIF, fps, config: { damping: 22, stiffness: 160 }, durationInFrames: Math.round(0.8 * fps) });
  const macNotifSlideY = interpolate(macNotifSpring, [0, 1], [-120, 0]);
  const macNotifOp = interpolate(frame, [TRACKER_NOTIF, TRACKER_NOTIF + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const glowFlash = interpolate(frame, [TRACKER_NOTIF, TRACKER_NOTIF + 20, TRACKER_NOTIF + 50], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Detail card (unused after redesign but kept for cardOp timing ref)
  const cardSpring = spring({ frame: frame - CARD_IN, fps, config: { damping: 18, stiffness: 90 }, durationInFrames: Math.round(1.0 * fps) });
  const cardOp = interpolate(frame, [CARD_IN, CARD_IN + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cardY = interpolate(cardSpring, [0, 1], [40, 0]);

  // Camera pan: after notification arrives, pan right to reveal Slack/Discord
  const cameraPan = interpolate(frame, [CARD_IN, CARD_IN + 45], [0, -1150], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // Right-side wireframe: MacBook → Slack, MacBook → Discord
  const NR_START = CARD_IN;
  const nr1P = interpolate(frame, [NR_START,     NR_START + 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const nr2P = interpolate(frame, [NR_START + 8, NR_START + 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const nrp1 = interpolate(frame, [NR_START + 14, NR_START + 14 + Math.round(0.85*fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const nrp2 = interpolate(frame, [NR_START + 26, NR_START + 26 + Math.round(0.85*fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

  // Slack/Discord entrance opacity
  const slackOp   = interpolate(frame, [CARD_IN + 16, CARD_IN + 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const discordOp = interpolate(frame, [CARD_IN + 28, CARD_IN + 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const floatA = Math.sin(frame * 0.036) * 5;
  const floatB = Math.sin(frame * 0.036 + 1.2) * 5;

  // Bezier path helpers
  const bez = (t: number, p0: number, p1c: number, p2c: number, p3: number) => {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1c + 3 * mt * t * t * p2c + t * t * t * p3;
  };

  // Path endpoints: iPhone right edge ~510, MacBook left edge ~1410, both centered vertically
  const x0 = 510, y0 = 540, x3 = 1410, y3 = 540;
  // Three branches
  const m = { x1: 760, y1: 450, x2: 1060, y2: 630 }; // center wavy
  const u = { x1: 720, y1: 370, x2: 1100, y2: 370 };  // upper
  const l = { x1: 720, y1: 710, x2: 1100, y2: 710 };  // lower

  const PATH_LEN = 980;

  const pkt1 = { x: bez(p1, x0, m.x1, m.x2, x3), y: bez(p1, y0, m.y1, m.y2, y3) };
  const pkt2 = { x: bez(p2, x0, u.x1, u.y1, x3), y: bez(p2, y0, u.x1, u.y1, y3) };
  const pkt3 = { x: bez(p3, x0, l.x1, l.y1, x3), y: bez(p3, y0, l.x1, l.y1, y3) };

  return (
    <AbsoluteFill style={{ background: "#f0f4ff", overflow: "hidden" }}>
      {/* Radial glow fixed to viewport center */}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Wide pan container — pans camera right to reveal Slack/Discord */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 3100, height: 1080, transform: `translateX(${cameraPan}px)` }}>

      {/* "3 hours later" */}
      <div style={{ position: "absolute", top: 86, left: 960, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 18, opacity: labelOp, zIndex: 5 }}>
        <div style={{ width: 90, height: 1, background: "linear-gradient(to right, transparent, rgba(99,102,241,0.35))" }} />
        <span style={{ fontFamily: FONT, fontSize: 14, color: "#4b5563", letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap", fontWeight: 600 }}>
          3 hours later · John opens his email
        </span>
        <div style={{ width: 90, height: 1, background: "linear-gradient(to left, transparent, rgba(99,102,241,0.35))" }} />
      </div>

      {/* ── LEFT: John's iPhone 15 Pro ── */}
      <div style={{ position: "absolute", left: 160, top: "50%", transform: `translateY(-50%) scale(${devicesSpring})`, opacity: devicesOp, zIndex: 10 }}>
        {/* iPhone outer frame */}
        <div style={{ width: 310, height: 660, background: "#2c2c2e", borderRadius: 62, border: "3px solid #48484a", boxShadow: "0 40px 100px rgba(0,0,0,0.75), inset 0 0 0 2px rgba(255,255,255,0.09)", position: "relative", overflow: "hidden" }}>
          {/* Screen inset */}
          <div style={{ position: "absolute", top: 5, left: 5, right: 5, bottom: 5, background: "#000", borderRadius: 58, overflow: "hidden" }}>
            {/* Wallpaper — light iOS */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #e0e8ff 0%, #f0e8ff 50%, #e8f4ff 100%)" }} />
            {/* Status bar */}
            <div style={{ position: "relative", zIndex: 3, height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px 0 26px" }}>
              <span style={{ fontFamily: FONT, fontSize: 17, color: "#111827", fontWeight: 600 }}>9:41</span>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#111827", letterSpacing: 2 }}>●●●●</span>
                <span style={{ fontSize: 13, color: "#111827", marginLeft: 4 }}>⬛</span>
              </div>
            </div>
            {/* Dynamic Island */}
            <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", width: 124, height: 36, background: "#000", borderRadius: 18, zIndex: 5 }} />
            {/* App icons (faint) */}
            <div style={{ position: "absolute", top: 84, left: 0, right: 0, padding: "0 18px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, opacity: 0.45 }}>
              {["#ef4444","#3b82f6","#22c55e","#f59e0b","#8b5cf6","#06b6d4","#ec4899","#14b8a6"].map((color, i) => (
                <div key={i} style={{ width: 52, height: 52, borderRadius: 14, background: color }} />
              ))}
            </div>

            {/* Apple Mail notification — slides in */}
            {frame >= MAIL_NOTIF_IN && (
              <div style={{ position: "absolute", top: 16, left: 10, right: 10, background: "rgba(28,28,30,0.97)", borderRadius: 22, padding: "14px 15px", boxShadow: "0 10px 35px rgba(0,0,0,0.55)", transform: `translateY(${notifSlideY}px)`, opacity: notifOp, zIndex: 10 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {/* Apple Mail blue icon */}
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: "#0a84ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="26" height="19" viewBox="0 0 36 26" fill="none">
                      <rect x="1" y="1" width="34" height="24" rx="3" stroke="white" strokeWidth="2" fill="none"/>
                      <path d="M2 3l16 11 16-11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontFamily: FONT, fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Mail</span>
                      <span style={{ fontFamily: FONT, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>now</span>
                    </div>
                    <div style={{ fontFamily: FONT, fontSize: 16, color: "rgba(255,255,255,0.97)", fontWeight: 700, marginBottom: 2 }}>Samrath</div>
                    <div style={{ fontFamily: FONT, fontSize: 15, color: "rgba(255,255,255,0.82)", fontWeight: 500, marginBottom: 2 }}>Q1 Partnership Proposal</div>
                    <div style={{ fontFamily: FONT, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Hi John, Following up on our call...</div>
                  </div>
                </div>
              </div>
            )}

            {/* Apple Mail open view */}
            <div style={{ position: "absolute", inset: 0, background: "#ffffff", opacity: emailViewOp, zIndex: 8, borderRadius: 58, overflow: "hidden" }}>
              <div style={{ height: 64, background: "#ffffff", display: "flex", alignItems: "flex-end", padding: "0 20px 10px", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ color: "#0a84ff", fontFamily: FONT, fontSize: 17, fontWeight: 500 }}>‹ Inbox</span>
              </div>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Q1 Partnership Proposal</div>
                <div style={{ fontFamily: FONT, fontSize: 14, color: "#9ca3af", marginBottom: 16 }}>From: Samrath</div>
                <div style={{ fontFamily: FONT, fontSize: 15, color: "#374151", lineHeight: 1.65 }}>
                  {"Hi John,\n\nFollowing up on our call — attaching the Q1 proposal as discussed.\n\nBest,\nSamrath"}
                </div>
              </div>
            </div>
          </div>
          {/* Side buttons */}
          <div style={{ position: "absolute", right: -3.5, top: 160, width: 3.5, height: 78, background: "#48484a", borderRadius: "0 3px 3px 0" }} />
          <div style={{ position: "absolute", left: -3.5, top: 138, width: 3.5, height: 52, background: "#48484a", borderRadius: "3px 0 0 3px" }} />
          <div style={{ position: "absolute", left: -3.5, top: 206, width: 3.5, height: 52, background: "#48484a", borderRadius: "3px 0 0 3px" }} />
        </div>
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <div style={{ fontFamily: FONT, fontSize: 24, color: "#111827", fontWeight: 700 }}>John's iPhone</div>
        </div>
      </div>

      {/* ── CENTER + RIGHT: Wireframe SVG ── */}
      <svg width={3100} height={1080} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 5 }}>
        <defs>
          <filter id="glow2">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <marker id="arrowR" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="rgba(99,102,241,0.7)" />
          </marker>
        </defs>
        {/* Dot grid — left zone */}
        {Array.from({ length: 7 }, (_, row) =>
          Array.from({ length: 18 }, (_, col) => (
            <circle key={`L${row}-${col}`} cx={520 + col * 52} cy={360 + row * 54} r={1.5} fill="rgba(99,102,241,0.18)" />
          ))
        )}
        {/* Dot grid — right zone (MacBook → notifications) */}
        {Array.from({ length: 7 }, (_, row) =>
          Array.from({ length: 22 }, (_, col) => (
            <circle key={`R${row}-${col}`} cx={1840 + col * 56} cy={280 + row * 74} r={1.5} fill="rgba(99,102,241,0.13)" />
          ))
        )}
        {/* Left-zone nodes */}
        {frame >= LINES_START && (
          <>
            <circle cx={x0} cy={y0} r={8} fill="none" stroke="rgba(99,102,241,0.7)" strokeWidth={2} />
            <circle cx={x0} cy={y0} r={4} fill="#6366f1" />
            <circle cx={x3} cy={y3} r={8} fill="none" stroke="rgba(16,185,129,0.7)" strokeWidth={2} />
            <circle cx={x3} cy={y3} r={4} fill="#10b981" />
          </>
        )}
        {/* Left-zone bezier lines (iPhone → MacBook) */}
        <path d={`M ${x0} ${y0} C ${m.x1} ${m.y1}, ${m.x2} ${m.y2}, ${x3} ${y3}`} fill="none" stroke="rgba(99,102,241,0.75)" strokeWidth={2} strokeDasharray={PATH_LEN} strokeDashoffset={PATH_LEN * (1 - line1P)} filter="url(#glow2)" />
        <path d={`M ${x0} ${y0} C ${u.x1} ${u.y1}, ${u.x2} ${u.y1}, ${x3} ${y3}`} fill="none" stroke="rgba(99,102,241,0.45)" strokeWidth={1.5} strokeDasharray={PATH_LEN} strokeDashoffset={PATH_LEN * (1 - line2P)} />
        <path d={`M ${x0} ${y0} C ${l.x1} ${l.y1}, ${l.x2} ${l.y1}, ${x3} ${y3}`} fill="none" stroke="rgba(99,102,241,0.45)" strokeWidth={1.5} strokeDasharray={PATH_LEN} strokeDashoffset={PATH_LEN * (1 - line3P)} />
        {/* Left-zone data packets */}
        {p1 > 0 && p1 < 1 && <circle cx={pkt1.x} cy={pkt1.y} r={6} fill="#6366f1" filter="url(#glow2)" opacity={1} />}
        {p2 > 0 && p2 < 1 && <circle cx={pkt2.x} cy={pkt2.y} r={5} fill="#818cf8" filter="url(#glow2)" opacity={0.9} />}
        {p3 > 0 && p3 < 1 && <circle cx={pkt3.x} cy={pkt3.y} r={5} fill="#818cf8" filter="url(#glow2)" opacity={0.9} />}
        {/* Right-zone hub node (MacBook right edge) */}
        {frame >= CARD_IN && (
          <>
            <circle cx={1820} cy={540} r={10} fill="none" stroke="rgba(99,102,241,0.6)" strokeWidth={2} />
            <circle cx={1820} cy={540} r={5} fill="#6366f1" filter="url(#glow2)" />
          </>
        )}
        {/* Right-zone bezier lines — MacBook → Slack (upper) */}
        <path d="M 1820 540 C 1920 460, 2000 356, 2065 356" fill="none" stroke="rgba(99,102,241,0.75)" strokeWidth={2} strokeDasharray={500} strokeDashoffset={500 * (1 - nr1P)} filter="url(#glow2)" markerEnd="url(#arrowR)" />
        {/* Right-zone bezier lines — MacBook → Discord (lower) */}
        <path d="M 1820 540 C 1960 580, 2180 552, 2560 552" fill="none" stroke="rgba(99,102,241,0.55)" strokeWidth={1.5} strokeDasharray={800} strokeDashoffset={800 * (1 - nr2P)} markerEnd="url(#arrowR)" />
        {/* Right-zone endpoint nodes */}
        {nr1P >= 0.9 && <><circle cx={2065} cy={356} r={7} fill="none" stroke="rgba(74,21,75,0.7)" strokeWidth={2} /><circle cx={2065} cy={356} r={3.5} fill="#4A154B" /></>}
        {nr2P >= 0.9 && <><circle cx={2560} cy={552} r={7} fill="none" stroke="rgba(88,101,242,0.7)" strokeWidth={2} /><circle cx={2560} cy={552} r={3.5} fill="#5865F2" /></>}
        {/* Right-zone data packets */}
        {nrp1 > 0 && nrp1 < 1 && <circle cx={bez(nrp1,1820,1920,2000,2065)} cy={bez(nrp1,540,460,356,356)} r={6} fill="#4A154B" filter="url(#glow2)" opacity={0.9} />}
        {nrp2 > 0 && nrp2 < 1 && <circle cx={bez(nrp2,1820,1960,2180,2560)} cy={bez(nrp2,540,580,552,552)} r={6} fill="#5865F2" filter="url(#glow2)" opacity={0.9} />}
        {/* "alerted via" label on right path */}
        {frame >= CARD_IN && (
          <text x={1925} y={482} fontFamily={FONT} fontSize="12" fill="rgba(99,102,241,0.75)" fontWeight="600" textAnchor="middle" opacity={nr1P}>alerted via</text>
        )}
      </svg>

      {/* ── RIGHT: Samrath's MacBook ── */}
      <div style={{ position: "absolute", left: 1390, top: "50%", transform: `translateY(-50%) scale(${devicesSpring})`, opacity: devicesOp, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "stretch", width: 420 }}>
        {/* Green glow flash */}
        {glowFlash > 0.01 && (
          <div style={{ position: "absolute", inset: -70, borderRadius: "50%", background: `radial-gradient(circle, rgba(52,211,153,${0.28 * glowFlash}) 0%, transparent 70%)`, pointerEvents: "none", zIndex: -1 }} />
        )}

        {/* macOS notification — slides in from top, sits above MacBook */}
        <div style={{ height: 90, position: "relative", marginBottom: 10 }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(36,36,40,0.97)", borderRadius: 16, padding: "13px 14px", boxShadow: "0 10px 50px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.07)", transform: `translateY(${macNotifSlideY}px)`, opacity: macNotifOp }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, overflow: "hidden", flexShrink: 0 }}><Logo size={36} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontFamily: FONT, fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>Mail Tracker</span>
                  <span style={{ fontFamily: FONT, fontSize: 11, color: "rgba(255,255,255,0.38)" }}>now</span>
                </div>
                <div style={{ fontFamily: FONT, fontSize: 13, color: "rgba(255,255,255,0.92)", fontWeight: 600, marginBottom: 2 }}>Email Opened</div>
                <div style={{ fontFamily: FONT, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>john@company.com opened "Q1 Partnership Proposal"</div>
              </div>
            </div>
          </div>
        </div>

        {/* MacBook screen */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #d1d5db", overflow: "hidden", boxShadow: `0 8px 32px rgba(99,102,241,0.12), 0 0 30px rgba(16,185,129,${0.15 * glowFlash})` }}>
          {/* macOS menubar */}
          <div style={{ height: 26, background: "#ececec", display: "flex", alignItems: "center", padding: "0 14px", borderBottom: "1px solid #d1d5db" }}>
            <span style={{ fontSize: 12, color: "#374151", fontFamily: FONT, fontWeight: 700, marginRight: 14 }}>🍎</span>
            <span style={{ fontSize: 11, color: "#374151", fontFamily: FONT, marginRight: 14 }}>Mail Tracker</span>
            <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: FONT }}>File  Edit  View</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#6b7280", fontFamily: FONT }}>Thu 2:47 PM</span>
          </div>
          {/* App body */}
          <div style={{ padding: "14px 16px", background: "#ffffff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Logo size={20} />
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#111827", letterSpacing: "-0.3px" }}>Mail Tracker</span>
            </div>
            {[
              { subject: "Q1 Partnership Proposal", email: "john@company.com", opens: frame >= TRACKER_NOTIF ? 1 : 0, highlight: true },
              { subject: "Series A Pitch Deck", email: "cto@startup.io", opens: 7, highlight: false },
            ].map((row, i) => (
              <div key={i} style={{ padding: "10px 12px", background: row.highlight ? "rgba(16,185,129,0.06)" : "#f9fafb", border: `1px solid ${row.highlight ? "rgba(16,185,129,0.25)" : "#e5e7eb"}`, borderRadius: 9, marginBottom: 7, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{row.subject}</div>
                  <div style={{ fontFamily: FONT, fontSize: 10, color: "#9ca3af" }}>{row.email}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {row.highlight && frame >= TRACKER_NOTIF && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px rgba(16,185,129,0.7)" }} />}
                  <span style={{ fontFamily: FONT, fontSize: 20, fontWeight: 800, color: row.opens > 0 ? "#059669" : "#9ca3af", letterSpacing: "-0.5px" }}>{row.opens}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12, textAlign: "right" }}>
          <div style={{ fontFamily: FONT, fontSize: 16, color: "#111827", fontWeight: 700 }}>Samrath's MacBook</div>
          <div style={{ fontFamily: FONT, fontSize: 14, color: "#6b7280", marginTop: 4 }}>Mail Tracker · Real-time</div>
        </div>
      </div>

      {/* ── RIGHT ZONE: Slack + Discord windows (positioned in pan container) ── */}
      {(() => { return (
          <>
            {/* ── Slack label + window — at x:2060 in pan space ── */}
            <div style={{ position: "absolute", left: 2060, top: 196, opacity: slackOp, transform: `translateY(${floatA}px)`, zIndex: 12, display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <svg width="20" height="20" viewBox="0 0 54 54" fill="none"><path d="M19.5 33.5a4 4 0 1 1-4-4h4v4zm2 0a4 4 0 0 1 8 0v10a4 4 0 0 1-8 0V33.5z" fill="#E01E5A"/><path d="M19.5 19.5a4 4 0 1 1 4-4v4h-4zm0 2a4 4 0 0 1 0 8H9.5a4 4 0 0 1 0-8H19.5z" fill="#36C5F0"/><path d="M33.5 19.5a4 4 0 1 1 4 4h-4v-4zm-2 0a4 4 0 0 1-8 0V9.5a4 4 0 0 1 8 0V19.5z" fill="#2EB67D"/><path d="M33.5 33.5a4 4 0 1 1-4 4v-4h4zm0-2a4 4 0 0 1 0-8h10a4 4 0 0 1 0 8H33.5z" fill="#ECB22E"/></svg>
              <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: "#1d1c1d" }}>Slack</span>
              <span style={{ fontFamily: FONT, fontSize: 13, color: "#6b7280", fontWeight: 400 }}>notification</span>
            </div>
            <div style={{ position: "absolute", left: 2060, top: 240, width: 500, borderRadius: 14, overflow: "hidden", boxShadow: "0 28px 80px rgba(0,0,0,0.24), 0 0 0 1px rgba(0,0,0,0.09)", opacity: slackOp, transform: `translateY(${floatA}px)`, zIndex: 11 }}>
              {/* macOS titlebar */}
              <div style={{ height: 32, background: "#3F0E40", display: "flex", alignItems: "center", padding: "0 14px", gap: 8 }}>
                {["#ff5f57","#febc2e","#28c840"].map((c,i) => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}
                <span style={{ fontFamily: FONT, fontSize: 12, color: "rgba(255,255,255,0.5)", marginLeft: 10 }}>Slack — Acme Corp</span>
              </div>
              <div style={{ display: "flex", height: 200 }}>
                {/* Channel sidebar */}
                <div style={{ width: 210, background: "#3F0E40", padding: "12px 0", flexShrink: 0, display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "0 16px 8px", fontFamily: FONT, fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Channels</div>
                  {["general","alerts","sales","engineering"].map((ch, i) => (
                    <div key={ch} style={{ padding: "5px 16px", display: "flex", alignItems: "center", gap: 7, background: i === 0 ? "rgba(255,255,255,0.16)" : "transparent", margin: i === 0 ? "0 8px 0 0" : "0", borderRadius: i === 0 ? "0 6px 6px 0" : 0 }}>
                      <span style={{ fontFamily: FONT, fontSize: 14, color: i === 0 ? "#ffffff" : "rgba(255,255,255,0.5)", fontWeight: i === 0 ? 700 : 400 }}># {ch}</span>
                      {i === 0 && <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.8)" }} />}
                    </div>
                  ))}
                </div>
                {/* Main message area */}
                <div style={{ flex: 1, background: "#ffffff", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "11px 18px 9px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: "#1d1c1d" }}># general</span>
                  </div>
                  <div style={{ flex: 1, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: "#4A154B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Logo size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: "#1d1c1d" }}>Mail Tracker Bot</span>
                        <span style={{ fontFamily: FONT, fontSize: 10, color: "#616061", background: "#e8e8e8", padding: "2px 7px", borderRadius: 4, fontWeight: 700, letterSpacing: "0.04em" }}>APP</span>
                        <span style={{ fontFamily: FONT, fontSize: 12, color: "#97979a" }}>2:47 PM</span>
                      </div>
                      <div style={{ borderLeft: "4px solid #2EB67D", background: "#f8f8f8", borderRadius: "0 8px 8px 0", padding: "11px 15px" }}>
                        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: "#1d1c1d", marginBottom: 4 }}>🟢 Email Opened</div>
                        <div style={{ fontFamily: FONT, fontSize: 13, color: "#616061", lineHeight: 1.6 }}>
                          <span style={{ color: "#1264a3", fontWeight: 600 }}>john@company.com</span> just opened<br />
                          <span style={{ fontStyle: "italic", color: "#1d1c1d" }}>"Q1 Partnership Proposal"</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Discord label + window — at x:2570 in pan space ── */}
            <div style={{ position: "absolute", left: 2570, top: 386, opacity: discordOp, transform: `translateY(${floatB}px)`, zIndex: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="22" height="22" viewBox="0 0 71 55" fill="none"><path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.2.2 0 0 0-.2.1 40.8 40.8 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.6 37.6 0 0 0 25.4.5a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.5 4.9a.2.2 0 0 0-.1.1C1.5 18.1-1 31 .3 43.7a.2.2 0 0 0 .1.2 58.8 58.8 0 0 0 17.7 8.9.2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.8a.2.2 0 0 1 .2 0c11.6 5.3 24.1 5.3 35.6 0a.2.2 0 0 1 .2 0l1.1.8a.2.2 0 0 1 0 .4 36 36 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47 47 0 0 0 3.6 5.9.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.8-8.9.2.2 0 0 0 .1-.2c1.5-15.3-2.5-28.6-10.5-40.4a.2.2 0 0 0-.1-.2zM23.7 36c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.4 3.3 6.4 7.2 0 4-2.9 7.2-6.4 7.2zm23.7 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.4 3.3 6.4 7.2 0 4-2.8 7.2-6.4 7.2z" fill="#5865F2"/></svg>
              <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: "#1d1c1d" }}>Discord</span>
              <span style={{ fontFamily: FONT, fontSize: 13, color: "#6b7280", fontWeight: 400 }}>notification</span>
            </div>
            <div style={{ position: "absolute", left: 2570, top: 430, width: 500, borderRadius: 14, overflow: "hidden", boxShadow: "0 28px 80px rgba(0,0,0,0.38), 0 0 0 1px rgba(0,0,0,0.22)", opacity: discordOp, transform: `translateY(${floatB}px)`, zIndex: 11 }}>
              {/* macOS titlebar */}
              <div style={{ height: 32, background: "#1e1f22", display: "flex", alignItems: "center", padding: "0 14px", gap: 8 }}>
                {["#ff5f57","#febc2e","#28c840"].map((c,i) => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}
                <span style={{ fontFamily: FONT, fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 10 }}>Discord — Mail Tracker Server</span>
              </div>
              <div style={{ display: "flex", height: 200 }}>
                {/* Server icons strip */}
                <div style={{ width: 58, background: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 8, flexShrink: 0 }}>
                  {[
                    { bg: "#5865F2", el: <Logo size={26} />, active: true },
                    { bg: "#2EB67D", el: <span style={{ color:"white", fontSize:15, fontWeight:800 }}>A</span>, active: false },
                    { bg: "#ED4245", el: <span style={{ color:"white", fontSize:15, fontWeight:800 }}>D</span>, active: false },
                  ].map((s,i) => (
                    <div key={i} style={{ width: 42, height: 42, borderRadius: s.active ? 14 : "50%", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", outline: s.active ? "3px solid #5865F2" : "none", outlineOffset: 3 }}>{s.el}</div>
                  ))}
                </div>
                {/* Channel list */}
                <div style={{ width: 170, background: "#2b2d31", padding: "10px 0", flexShrink: 0 }}>
                  <div style={{ padding: "0 12px 7px", fontFamily: FONT, fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Text Channels</div>
                  {["general","alerts","logs","sales"].map((ch,i) => (
                    <div key={ch} style={{ padding: "5px 12px", display: "flex", alignItems: "center", gap: 6, background: i === 1 ? "rgba(255,255,255,0.11)" : "transparent", borderRadius: 5, margin: "1px 6px" }}>
                      <span style={{ fontFamily: FONT, fontSize: 14, color: i === 1 ? "#ffffff" : "rgba(255,255,255,0.35)", fontWeight: i === 1 ? 600 : 400 }}># {ch}</span>
                      {i === 1 && <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.8)" }} />}
                    </div>
                  ))}
                </div>
                {/* Message area */}
                <div style={{ flex: 1, background: "#313338", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "10px 16px 9px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                    <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: "#ffffff" }}># alerts</span>
                  </div>
                  <div style={{ flex: 1, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#5865F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Logo size={26} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: "#5865F2" }}>MailTrackerBot</span>
                        <span style={{ fontFamily: FONT, fontSize: 10, color: "white", background: "#5865F2", padding: "2px 7px", borderRadius: 4, fontWeight: 700, letterSpacing: "0.05em" }}>BOT</span>
                        <span style={{ fontFamily: FONT, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Today at 2:47 PM</span>
                      </div>
                      <div style={{ borderLeft: "4px solid #10b981", background: "#2b2d31", borderRadius: "0 8px 8px 0", padding: "11px 15px" }}>
                        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>🟢 Email Opened</div>
                        <div style={{ fontFamily: FONT, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                          <span style={{ color: "#00b0f4", fontWeight: 600 }}>john@company.com</span> just opened<br />
                          <span style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>"Q1 Partnership Proposal"</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      </div>{/* end pan container */}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 5 — Use Cases
// ─────────────────────────────────────────────────────────────────────────────
const UseCaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cases = [
    {
      icon: "🤝",
      title: "Sales Teams",
      desc: "Know the moment your prospect opens the proposal. Follow up while you're top of mind.",
      accent: "#6366f1",
      accentBg: "rgba(99,102,241,0.06)",
      accentBorder: "rgba(99,102,241,0.18)",
    },
    {
      icon: "🚀",
      title: "Founders",
      desc: "Track investor interest in real-time. See exactly who's reading your pitch deck right now.",
      accent: "#059669",
      accentBg: "rgba(16,185,129,0.06)",
      accentBorder: "rgba(16,185,129,0.2)",
    },
    {
      icon: "💼",
      title: "Freelancers",
      desc: "Stop guessing if the client saw your quote. Follow up at exactly the right moment.",
      accent: "#d97706",
      accentBg: "rgba(251,191,36,0.06)",
      accentBorder: "rgba(251,191,36,0.22)",
    },
    {
      icon: "📬",
      title: "Anyone Who Emails",
      desc: "If it matters whether they read it — recruiters, journalists, anyone — Mail Tracker has you covered.",
      accent: "#0284c7",
      accentBg: "rgba(96,165,250,0.06)",
      accentBorder: "rgba(96,165,250,0.2)",
    },
  ];

  const headingOp = interpolate(frame, [8, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headingY  = interpolate(frame, [8, 26], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: "#f0f4ff", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 44 }}>
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)", backgroundSize: "54px 54px", opacity: 0.4 }} />
      <Glow color="rgba(99,102,241,0.07)" size={1000} />

      {/* Heading */}
      <div style={{ opacity: headingOp, transform: `translateY(${headingY}px)`, textAlign: "center" }}>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: "#6366f1", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Who is it for?</div>
        <div style={{ fontFamily: FONT, fontSize: 68, fontWeight: 800, letterSpacing: "-2.5px", lineHeight: 1, background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 40%, #6366f1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Built for everyone<br />who sends emails that matter.
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, width: 1040 }}>
        {cases.map((c, i) => {
          const cardFrom = Math.round((0.55 + i * 0.18) * fps);
          const cardOp = interpolate(frame, [cardFrom, cardFrom + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const cardY  = interpolate(frame, [cardFrom, cardFrom + 22], [34, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          return (
            <div key={i} style={{ background: c.accentBg, border: `1px solid ${c.accentBorder}`, borderRadius: 20, padding: "28px 30px", opacity: cardOp, transform: `translateY(${cardY}px)`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 34, marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{c.title}</div>
              <div style={{ fontFamily: FONT, fontSize: 15, color: "#4b5563", lineHeight: 1.65 }}>{c.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 6 — Install Steps
// ─────────────────────────────────────────────────────────────────────────────
const InstallScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { num: "01", label: "Clone the repo", cmd: "git clone github.com/samrathreddy/mail-tracker", hint: "open source" },
    { num: "02", label: "Install dependencies", cmd: "pnpm install", hint: "" },
    { num: "03", label: "Deploy to Cloudflare", cmd: "pnpm run deploy", hint: "Workers + KV · free tier" },
    { num: "04", label: "Load Chrome Extension", cmd: "chrome://extensions → Load unpacked → extension/", hint: "Gmail auto-inject" },
  ];

  const headingOp = interpolate(frame, [8, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headingY  = interpolate(frame, [8, 26], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: "#f0f4ff", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 48 }}>
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)", backgroundSize: "54px 54px", opacity: 0.4 }} />
      <Glow color="rgba(99,102,241,0.07)" size={1000} />

      {/* Heading */}
      <div style={{ opacity: headingOp, transform: `translateY(${headingY}px)`, textAlign: "center" }}>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: "#6366f1", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Setup</div>
        <div style={{ fontFamily: FONT, fontSize: 80, fontWeight: 800, color: "#111827", letterSpacing: "-3px", lineHeight: 1 }}>Up and running<br />in 5 minutes.</div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 860 }}>
        {steps.map((s, i) => {
          const stepFrom = Math.round((0.6 + i * 0.2) * fps);
          const stepOp = interpolate(frame, [stepFrom, stepFrom + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const stepX  = interpolate(frame, [stepFrom, stepFrom + 20], [-28, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, opacity: stepOp, transform: `translateX(${stepX}px)` }}>
              {/* Step number */}
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: "#6366f1", fontWeight: 700 }}>{s.num}</span>
              </div>
              {/* Command card */}
              <div style={{ flex: 1, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "14px 22px", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 2px 10px rgba(99,102,241,0.06)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONT, fontSize: 11, color: "#9ca3af", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.09em" }}>{s.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: 15, color: "#059669", fontWeight: 600 }}>{s.cmd}</div>
                </div>
                {s.hint && (
                  <div style={{ fontFamily: FONT, fontSize: 12, color: "#6b7280", background: "#f3f4f6", padding: "4px 10px", borderRadius: 6, flexShrink: 0 }}>{s.hint}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      {(() => {
        const noteFrom = Math.round(2.0 * fps);
        const noteOp = interpolate(frame, [noteFrom, noteFrom + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div style={{ opacity: noteOp, fontFamily: FONT, fontSize: 14, color: "#9ca3af", textAlign: "center" }}>
            Optionally set <span style={{ color: "#6b7280", fontFamily: MONO }}>DASHBOARD_PASSWORD</span> · <span style={{ color: "#6b7280", fontFamily: MONO }}>SLACK_WEBHOOK_URL</span> · <span style={{ color: "#6b7280", fontFamily: MONO }}>DISCORD_WEBHOOK_URL</span>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 7 — Final Slide
// ─────────────────────────────────────────────────────────────────────────────
const FinalSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSpring = spring({ frame: frame - 6, fps, config: { damping: 13, stiffness: 100 }, durationInFrames: Math.round(1.2 * fps) });
  const glowPulse = 0.45 + 0.55 * Math.sin((frame / fps) * Math.PI * 0.85);
  const titleFrom  = Math.round(0.65 * fps);
  const tagFrom    = Math.round(1.15 * fps);
  const ctaFrom    = Math.round(1.7 * fps);
  const ctaOp = interpolate(frame, [ctaFrom, ctaFrom + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaY  = interpolate(frame, [ctaFrom, ctaFrom + 20], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: "#f0f4ff", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 20 }}>
      <Glow color={`rgba(99,102,241,${0.14 * glowPulse})`} size={1100} />
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.14) 1px, transparent 1px)", backgroundSize: "54px 54px", opacity: 0.35 }} />

      <div style={{ transform: `scale(${logoSpring})`, filter: `drop-shadow(0 0 ${68 * glowPulse}px rgba(99,102,241,${0.78 * glowPulse})) drop-shadow(0 0 ${150 * glowPulse}px rgba(99,102,241,${0.28 * glowPulse}))`, zIndex: 10 }}>
        <Logo size={110} />
      </div>

      <WordReveal text="Mail Tracker" from={titleFrom} stagger={12} wordStyle={{ fontSize: 90, fontWeight: 800, fontFamily: FONT, letterSpacing: "-3px", background: "linear-gradient(135deg, #4338ca 0%, #6366f1 40%, #4f46e5 75%, #3730a3 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }} />
      <WordReveal text="Open Source Mail Tracker. No data leaves your Cloudflare." from={tagFrom} stagger={3} wordStyle={{ fontSize: 24, fontWeight: 400, fontFamily: FONT, color: "#6b7280", letterSpacing: "-0.3px" }} />

      <div style={{ opacity: ctaOp, transform: `translateY(${ctaY}px)`, marginTop: 10, display: "flex", gap: 14, alignItems: "center" }}>
        {/* GitHub CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 26px", background: "#111827", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
          <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "#ffffff" }}>github.com/samrathreddy/mail-tracker</span>
        </div>
        {/* Pill badges */}
        <div style={{ display: "flex", gap: 8 }}>
          {["Cloudflare Workers", "Chrome Extension"].map((tag) => (
            <div key={tag} style={{ padding: "8px 14px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 999, fontFamily: FONT, fontSize: 13, color: "#4338ca", fontWeight: 500 }}>{tag}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
const DURATIONS = { hook: 170, logo: 160, gmail: 120, open: 230, usecase: 130, install: 210, final: 170 };
const OVERLAP = 20;

export const MailTrackerDemo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={DURATIONS.hook} premountFor={fps}>
          <FadeScene duration={DURATIONS.hook}><CinematicHook /></FadeScene>
        </Series.Sequence>
        <Series.Sequence offset={-OVERLAP} durationInFrames={DURATIONS.logo} premountFor={fps}>
          <FadeScene duration={DURATIONS.logo}><LogoReveal /></FadeScene>
        </Series.Sequence>
        <Series.Sequence offset={-OVERLAP} durationInFrames={DURATIONS.gmail} premountFor={fps}>
          <FadeScene duration={DURATIONS.gmail}><GmailCompose /></FadeScene>
        </Series.Sequence>
        <Series.Sequence offset={-OVERLAP} durationInFrames={DURATIONS.open} premountFor={fps}>
          <FadeScene duration={DURATIONS.open}><OpenMoment /></FadeScene>
        </Series.Sequence>
        <Series.Sequence offset={-OVERLAP} durationInFrames={DURATIONS.usecase} premountFor={fps}>
          <FadeScene duration={DURATIONS.usecase}><UseCaseScene /></FadeScene>
        </Series.Sequence>
        <Series.Sequence offset={-OVERLAP} durationInFrames={DURATIONS.install} premountFor={fps}>
          <FadeScene duration={DURATIONS.install}><InstallScene /></FadeScene>
        </Series.Sequence>
        <Series.Sequence offset={-OVERLAP} durationInFrames={DURATIONS.final} premountFor={fps}>
          <FadeScene duration={DURATIONS.final}><FinalSlide /></FadeScene>
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
