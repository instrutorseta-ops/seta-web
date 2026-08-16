import { useState } from "react";
import { supabase } from "./supabaseClient";

const ORANGE = "#F4762A";
const GRAPHITE = "#2B2B33";

const mockInstructor = { name: "Rafael Almeida", credential: "SP-000000" };

const mockStudents = [
  { id: 1, initials: "MC", name: "Marina Costa", info: "hoje, 14h - 3h de 8h restantes", color: ORANGE, tag: null },
  { id: 2, initials: "JP", name: "Joao Pedro", info: "amanha, 9h", color: "#5B3E8E", tag: { text: "pacote ok", bg: "#EAF3DE", fg: "#27500A" } },
  { id: 3, initials: "LS", name: "Luiza Santos", info: "IA sugere lembrete extra", color: "#0F6E56", tag: { text: "risco de falta", bg: "#FAEEDA", fg: "#854F0B" } },
];

const mockNearbyInstructors = [
  { id: 1, initials: "RA", name: "Rafael Almeida", info: "2,3 km - R$ 70/h", rating: "4.9", color: ORANGE },
  { id: 2, initials: "CF", name: "Carla Ferreira", info: "3,1 km - R$ 65/h", rating: "4.8", color: "#0F6E56" },
];

const initialConversations = [
  {
    id: 1,
    initials: "MC",
    name: "Marina Costa",
    color: ORANGE,
    handledBy: "ia",
    needsAttention: false,
    lastInfo: "confirmou aula de quinta, 10h",
    messages: [
      { from: "aluno", text: "quero remarcar a aula de quinta" },
      { from: "ia", text: "sem problema, tenho sexta 9h ou 15h livres. qual prefere?" },
    ],
  },
  {
    id: 2,
    initials: "JP",
    name: "Joao Pedro",
    color: "#5B3E8E",
    handledBy: "ia",
    needsAttention: true,
    lastInfo: "pergunta fora do escopo - precisa de voce",
    messages: [
      { from: "aluno", text: "voce da aula tambem pra quem tem medo de direcao em rodovia?" },
      { from: "ia", text: "essa eu não sei responder por voce, vou avisar o instrutor." },
    ],
  },
  {
    id: 3,
    initials: "LS",
    name: "Luiza Santos",
    color: "#0F6E56",
    handledBy: "instrutor",
    needsAttention: false,
    lastInfo: "voce respondeu ha 2h",
    messages: [
      { from: "aluno", text: "posso levar meu proprio carro na aula?" },
      { from: "instrutor", text: "pode sim, so me avisa antes pra eu confirmar o seguro" },
    ],
  },
];

const timeSlots = ["08:00", "10:00", "14:00", "16:00"];

function PhoneFrame({ children }) {
  return (
    <div
      style={{
        width: 340,
        margin: "0 auto",
        background: "var(--surface-2, #fff)",
        border: "0.5px solid var(--border, #ddd)",
        borderRadius: 32,
        overflow: "hidden",
        minHeight: 560,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}

function Header({ eyebrow, title, dark = true }) {
  return (
    <div style={{ background: dark ? GRAPHITE : ORANGE, padding: "18px 20px" }}>
      <p style={{ fontSize: 13, color: dark ? "#B4B2A9" : "#FDE3D1", margin: "0 0 2px" }}>{eyebrow}</p>
      <p style={{ fontSize: 16, color: "#FFFFFF", fontWeight: 500, margin: 0 }}>{title}</p>
    </div>
  );
}

function BottomNav({ active, onChange, items }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "12px 0", borderTop: "0.5px solid var(--border, #eee)", marginTop: "auto" }}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
          aria-label={item.key}
        >
          <i className={`ti ${item.icon}`} style={{ fontSize: 20, color: active === item.key ? ORANGE : "#9c9c9c" }} />
        </button>
      ))}
    </div>
  );
}

function PrimaryButton({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: 13,
        borderRadius: 12,
        background: ORANGE,
        color: "#FFFFFF",
        border: "none",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function AvatarUpload({ hasPhoto, onSetPhoto, size = 84 }) {
  return (
    <div
      onClick={() => onSetPhoto(true)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        margin: "0 auto 8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        cursor: "pointer",
        background: hasPhoto ? "linear-gradient(135deg,#F0997B,#D85A30)" : "rgba(244,118,42,0.06)",
        border: hasPhoto ? "2px solid #fff" : "2px dashed #F0997B",
      }}
    >
      <i className={hasPhoto ? "ti ti-user" : "ti ti-camera"} style={{ fontSize: size * 0.32, color: hasPhoto ? "#fff" : "#D85A30" }} />
      <div
        style={{
          position: "absolute",
          bottom: -2,
          right: -2,
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: "50%",
          background: hasPhoto ? "#fff" : ORANGE,
          border: hasPhoto ? "2px solid #fff" : "2px solid #fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className={hasPhoto ? "ti ti-pencil" : "ti ti-plus"} style={{ fontSize: size * 0.15, color: hasPhoto ? ORANGE : "#fff" }} />
      </div>
    </div>
  );
}

function InstructorRegisterReal({ onRegistered, onBack }) {
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [credentialCode, setCredentialCode] = useState("");
  const [credentialState, setCredentialState] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    if (!fullName || !cpf || !phone || !credentialCode || !credentialState) {
      setStatus("error");
      setErrorMsg("Preencha todos os campos antes de continuar.");
      return;
    }
    setStatus("saving");
    setErrorMsg("");

    // 1. Cria o usuário base
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .insert({
        role: "instrutor",
        full_name: fullName,
        cpf,
        phone_whatsapp: phone,
      })
      .select()
      .single();

    if (userError) {
      setStatus("error");
      setErrorMsg("Erro ao salvar cadastro: " + userError.message);
      return;
    }

    // 2. Cria o registro específico de instrutor, ligado ao usuário acima
    const { error: instructorError } = await supabase.from("instructors").insert({
      user_id: userRow.id,
      detran_credential_code: credentialCode,
      detran_state: credentialState.toUpperCase(),
    });

    if (instructorError) {
      setStatus("error");
      setErrorMsg("Erro ao salvar credencial: " + instructorError.message);
      return;
    }

    setStatus("idle");
    onRegistered(userRow);
  };

  return (
    <PhoneFrame>
      <Header eyebrow="cadastro real" title="dados do instrutor" />
      <div style={{ padding: 20, flex: 1 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 12, color: "#666", padding: 0, marginBottom: 12, cursor: "pointer" }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 14, verticalAlign: -2 }} /> voltar
        </button>

        <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>nome completo</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="seu nome" style={{ width: "100%", marginBottom: 12, boxSizing: "border-box" }} />

        <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>cpf</label>
        <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="somente números" style={{ width: "100%", marginBottom: 12, boxSizing: "border-box" }} />

        <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>whatsapp</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+5511999999999" style={{ width: "100%", marginBottom: 12, boxSizing: "border-box" }} />

        <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>credencial detran</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input value={credentialCode} onChange={(e) => setCredentialCode(e.target.value)} placeholder="SP-000000" style={{ flex: 1.4, boxSizing: "border-box" }} />
          <input value={credentialState} onChange={(e) => setCredentialState(e.target.value)} placeholder="UF" maxLength={2} style={{ flex: 0.6, boxSizing: "border-box" }} />
        </div>

        {status === "error" && (
          <p style={{ fontSize: 12, color: "#A32D2D", marginBottom: 12 }}>{errorMsg}</p>
        )}

        <PrimaryButton onClick={handleSubmit} style={{ opacity: status === "saving" ? 0.6 : 1 }}>
          {status === "saving" ? "salvando..." : "salvar cadastro real"}
        </PrimaryButton>
      </div>
    </PhoneFrame>
  );
}

function RoleSelect({ onSelect }) {
  return (
    <PhoneFrame>
      <div style={{ background: ORANGE, padding: "32px 20px 40px", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, background: "#fff", borderRadius: 16, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-arrow-forward-up" style={{ fontSize: 28, color: ORANGE }} />
        </div>
        <p style={{ fontWeight: 500, fontSize: 18, margin: 0, color: "#fff" }}>seta</p>
        <p style={{ fontSize: 12, margin: "4px 0 0", color: "#FDE3D1" }}>instrutor autonomo</p>
      </div>
      <div style={{ padding: 20 }}>
        <p style={{ fontSize: 13, color: "#666", textAlign: "center", margin: "0 0 16px" }}>como voce quer entrar?</p>
        <button
          onClick={() => onSelect("instructor")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 14, marginBottom: 10, borderRadius: 14, border: "none", background: "rgba(244,118,42,0.10)", cursor: "pointer" }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 10, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-steering-wheel" style={{ fontSize: 18, color: "#fff" }} />
          </div>
          <span style={{ textAlign: "left" }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#4A1B0C" }}>sou instrutor</span>
            <span style={{ display: "block", fontSize: 12, color: "#993C1D" }}>quero dar aulas</span>
          </span>
        </button>
        <button
          onClick={() => onSelect("student")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, border: "0.5px solid #ccc", background: "#fafafa", cursor: "pointer" }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fff", border: "0.5px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-user" style={{ fontSize: 18, color: "#666" }} />
          </div>
          <span style={{ textAlign: "left" }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 500 }}>sou aluno</span>
            <span style={{ display: "block", fontSize: 12, color: "#666" }}>quero aprender a dirigir</span>
          </span>
        </button>
      </div>
    </PhoneFrame>
  );
}

function ConversationView({ conv, onBack, onTakeover }) {
  return (
    <>
      <div style={{ background: "#0F6E56", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }} aria-label="voltar">
            <i className="ti ti-arrow-left" style={{ fontSize: 18, color: "#fff" }} />
          </button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: conv.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: "#fff" }}>
            {conv.initials}
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#fff" }}>{conv.name}</p>
        </div>
        <span style={{ fontSize: 10, background: "rgba(255,255,255,0.18)", color: "#fff", padding: "4px 9px", borderRadius: 20, fontWeight: 500 }}>
          {conv.handledBy === "ia" ? "IA respondendo" : "voce respondendo"}
        </span>
      </div>

      <div style={{ padding: "16px 20px", background: "#F1EFE8", flex: 1 }}>
        {conv.messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "aluno" ? "flex-start" : "flex-end", marginBottom: 10 }}>
            <div
              style={{
                background: m.from === "aluno" ? "#fff" : m.from === "ia" ? "#0F6E56" : ORANGE,
                color: m.from === "aluno" ? "#333" : "#fff",
                padding: "10px 14px",
                borderRadius: m.from === "aluno" ? "14px 14px 14px 2px" : "14px 14px 2px 14px",
                fontSize: 12,
                maxWidth: "85%",
              }}
            >
              {m.from !== "aluno" && <span style={{ opacity: 0.8 }}>{m.from === "ia" ? "IA: " : "voce: "}</span>}
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 20 }}>
        {conv.handledBy === "ia" ? (
          <PrimaryButton onClick={() => onTakeover(conv.id)}>
            <i className="ti ti-hand-stop" style={{ fontSize: 16, verticalAlign: -3, marginRight: 6 }} />
            assumir esta conversa
          </PrimaryButton>
        ) : (
          <input placeholder="responder como instrutor..." style={{ width: "100%", boxSizing: "border-box", padding: 11, borderRadius: 10, border: "0.5px solid #ccc" }} />
        )}
      </div>
    </>
  );
}

function InstructorDashboard({ tab, setTab, onLogout, hasPhoto, onSetPhoto, conversations, onTakeover }) {
  const [openConvId, setOpenConvId] = useState(null);
  const openConv = conversations.find((c) => c.id === openConvId);

  return (
    <PhoneFrame>
      {tab === "messages" && openConv ? (
        <ConversationView conv={openConv} onBack={() => setOpenConvId(null)} onTakeover={(id) => onTakeover(id)} />
      ) : (
        <>
          <Header eyebrow={`ola, ${mockInstructor.name.split(" ")[0]}`} title={tab === "messages" ? "conversas com alunos" : "seus alunos"} />
          {tab === "home" && (
            <div style={{ padding: "16px 20px", flex: 1 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                <div style={{ flex: 1, background: "rgba(244,118,42,0.10)", borderRadius: 12, padding: 12, textAlign: "center" }}>
                  <p style={{ fontSize: 20, fontWeight: 500, margin: 0, color: "#993C1D" }}>6</p>
                  <p style={{ fontSize: 11, color: "#993C1D", margin: 0 }}>aulas hoje</p>
                </div>
                <div style={{ flex: 1, background: "#EAF3DE", borderRadius: 12, padding: 12, textAlign: "center" }}>
                  <p style={{ fontSize: 20, fontWeight: 500, margin: 0, color: "#27500A" }}>R$ 840</p>
                  <p style={{ fontSize: 11, color: "#27500A", margin: 0 }}>essa semana</p>
                </div>
              </div>
              {mockStudents.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 11, borderRadius: 12, marginBottom: 8, background: s.tag?.text === "risco de falta" ? "#FAEEDA" : "#f7f7f7" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: "#fff" }}>{s.initials}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{s.name}</p>
                    <p style={{ fontSize: 11, color: "#666", margin: 0 }}>{s.info}</p>
                  </div>
                  {s.tag && (
                    <span style={{ fontSize: 10, background: s.tag.bg, color: s.tag.fg, padding: "3px 8px", borderRadius: 20, fontWeight: 500 }}>{s.tag.text}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {tab === "packages" && (
            <div style={{ padding: "16px 20px", flex: 1 }}>
              <div style={{ border: "0.5px solid #ddd", borderRadius: 14, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>aula avulsa</span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>R$ 70</span>
                </div>
                <p style={{ fontSize: 11, color: "#666", margin: "6px 0 0" }}>1 hora - sem compromisso</p>
              </div>
              <div style={{ border: `2px solid ${ORANGE}`, borderRadius: 14, padding: 14, background: "rgba(244,118,42,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#4A1B0C" }}>pacote 5h</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#4A1B0C" }}>R$ 330</span>
                </div>
                <p style={{ fontSize: 11, color: "#993C1D", margin: "6px 0 0" }}>mais popular</p>
              </div>
            </div>
          )}
          {tab === "messages" && (
            <div style={{ padding: "14px 20px", flex: 1 }}>
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setOpenConvId(c.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: 11, borderRadius: 12, marginBottom: 8, background: c.needsAttention ? "#FAEEDA" : "#f7f7f7", cursor: "pointer" }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: "#fff" }}>{c.initials}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: c.needsAttention ? "#412402" : "#000" }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: c.needsAttention ? "#633806" : "#666", margin: 0 }}>{c.lastInfo}</p>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      padding: "3px 7px",
                      borderRadius: 20,
                      fontWeight: 500,
                      background: c.handledBy === "ia" ? "rgba(15,110,86,0.12)" : "rgba(244,118,42,0.12)",
                      color: c.handledBy === "ia" ? "#0F6E56" : "#993C1D",
                    }}
                  >
                    {c.handledBy === "ia" ? "IA" : "voce"}
                  </span>
                </div>
              ))}
            </div>
          )}
          {tab === "profile" && (
            <div style={{ padding: "20px", flex: 1, textAlign: "center" }}>
              <AvatarUpload hasPhoto={hasPhoto} onSetPhoto={onSetPhoto} />
              <p style={{ fontSize: 12, color: hasPhoto ? "#666" : "#993C1D", margin: "0 0 20px" }}>
                {hasPhoto ? "toque para trocar a foto" : "adicionar foto de perfil"}
              </p>
              <p style={{ fontSize: 13, color: "#666", textAlign: "left" }}>credencial: {mockInstructor.credential}</p>
              <button onClick={onLogout} style={{ marginTop: 12, background: "none", border: "0.5px solid #ccc", borderRadius: 10, padding: 10, fontSize: 13, cursor: "pointer", width: "100%" }}>
                trocar de perfil
              </button>
            </div>
          )}
        </>
      )}
      <BottomNav
        active={tab}
        onChange={(key) => {
          setTab(key);
          setOpenConvId(null);
        }}
        items={[
          { key: "home", icon: "ti-home" },
          { key: "packages", icon: "ti-package" },
          { key: "messages", icon: "ti-message-circle" },
          { key: "profile", icon: "ti-user" },
        ]}
      />
    </PhoneFrame>
  );
}

function StudentHome({ onBook, onLogout }) {
  const [credential, setCredential] = useState("");
  return (
    <PhoneFrame>
      <Header eyebrow="encontrar" title="seu instrutor" />
      <div style={{ padding: "16px 20px", flex: 1 }}>
        <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px" }}>ja tem um instrutor? insira a credencial</p>
        <input
          value={credential}
          onChange={(e) => setCredential(e.target.value)}
          placeholder="numero da credencial (ex: SP-000000)"
          style={{ width: "100%", marginBottom: 10, boxSizing: "border-box", padding: 10, borderRadius: 8, border: "0.5px solid #ccc" }}
        />
        <PrimaryButton onClick={() => onBook(mockNearbyInstructors[0])} style={{ marginBottom: 20 }}>
          vincular instrutor
        </PrimaryButton>
        <p style={{ fontSize: 11, color: "#999", textAlign: "center", margin: "0 0 14px" }}>ou busque por perto</p>
        {mockNearbyInstructors.map((inst) => (
          <div key={inst.id} onClick={() => onBook(inst)} style={{ display: "flex", alignItems: "center", gap: 10, padding: 11, borderRadius: 12, marginBottom: 8, background: "#f7f7f7", cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: inst.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: "#fff" }}>{inst.initials}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{inst.name}</p>
              <p style={{ fontSize: 11, color: "#666", margin: 0 }}>{inst.info}</p>
            </div>
            <span style={{ fontSize: 11, color: "#854F0B", fontWeight: 500 }}>★ {inst.rating}</span>
          </div>
        ))}
      </div>
      <BottomNav active="home" onChange={() => {}} items={[
        { key: "home", icon: "ti-home" },
        { key: "calendar", icon: "ti-calendar" },
        { key: "chat", icon: "ti-message-circle" },
        { key: "profile", icon: "ti-user" },
      ]} />
    </PhoneFrame>
  );
}

function BookingScreen({ instructor, onConfirm, onBack }) {
  const [selected, setSelected] = useState(timeSlots[2]);
  return (
    <PhoneFrame>
      <Header eyebrow="agendar aula" title={instructor.name} />
      <div style={{ padding: "16px 20px", flex: 1 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 12, color: "#666", padding: 0, marginBottom: 12, cursor: "pointer" }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 14, verticalAlign: -2 }} /> voltar
        </button>
        <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px" }}>quinta-feira, 21 de agosto</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {timeSlots.map((slot) => (
            <span
              key={slot}
              onClick={() => setSelected(slot)}
              style={{
                padding: "9px 13px",
                borderRadius: 12,
                fontSize: 13,
                cursor: "pointer",
                background: selected === slot ? ORANGE : "transparent",
                color: selected === slot ? "#fff" : "#333",
                border: selected === slot ? "none" : "0.5px solid #ccc",
                fontWeight: selected === slot ? 500 : 400,
              }}
            >
              {slot}
            </span>
          ))}
        </div>
        <div style={{ background: "#f7f7f7", borderRadius: 12, padding: 14, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "#666" }}>duracao</span>
            <span style={{ fontSize: 12, fontWeight: 500 }}>1 hora</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#666" }}>valor</span>
            <span style={{ fontSize: 12, fontWeight: 500 }}>R$ 70,00</span>
          </div>
        </div>
        <PrimaryButton onClick={onConfirm}>confirmar aula</PrimaryButton>
      </div>
    </PhoneFrame>
  );
}

function ConfirmationScreen({ instructor, time, onDone }) {
  return (
    <PhoneFrame>
      <div style={{ background: "#EAF3DE", padding: "40px 20px", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#639922", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-check" style={{ fontSize: 28, color: "#fff" }} />
        </div>
        <p style={{ fontSize: 16, fontWeight: 500, margin: 0, color: "#173404" }}>aula confirmada</p>
      </div>
      <div style={{ padding: 20, flex: 1 }}>
        <p style={{ fontSize: 13, color: "#666", textAlign: "center" }}>
          com {instructor.name}, quinta as {time}. voce recebe um lembrete no whatsapp 1h antes.
        </p>
        <PrimaryButton onClick={onDone} style={{ marginTop: 20 }}>
          voltar ao inicio
        </PrimaryButton>
      </div>
    </PhoneFrame>
  );
}

export default function SetaApp() {
  const [role, setRole] = useState(null);
  const [instructorFlow, setInstructorFlow] = useState("register"); // register | dashboard
  const [registeredInstructor, setRegisteredInstructor] = useState(null);
  const [instructorTab, setInstructorTab] = useState("home");
  const [screen, setScreen] = useState("home");
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [confirmedTime, setConfirmedTime] = useState("14:00");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [conversations, setConversations] = useState(initialConversations);

  const reset = () => {
    setRole(null);
    setScreen("home");
    setInstructorTab("home");
    setInstructorFlow("register");
  };

  const takeoverConversation = (id) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, handledBy: "instrutor", needsAttention: false } : c)));
  };

  return (
    <div style={{ padding: "1.5rem 0", fontFamily: "var(--font-sans, sans-serif)" }}>
      {!role && <RoleSelect onSelect={setRole} />}

      {role === "instructor" && instructorFlow === "register" && (
        <InstructorRegisterReal
          onBack={reset}
          onRegistered={(userRow) => {
            setRegisteredInstructor(userRow);
            setInstructorFlow("dashboard");
          }}
        />
      )}

      {role === "instructor" && instructorFlow === "dashboard" && (
        <InstructorDashboard
          tab={instructorTab}
          setTab={setInstructorTab}
          onLogout={reset}
          hasPhoto={hasPhoto}
          onSetPhoto={setHasPhoto}
          conversations={conversations}
          onTakeover={takeoverConversation}
        />
      )}

      {role === "student" && screen === "home" && (
        <StudentHome
          onBook={(inst) => {
            setSelectedInstructor(inst);
            setScreen("booking");
          }}
          onLogout={reset}
        />
      )}

      {role === "student" && screen === "booking" && (
        <BookingScreen
          instructor={selectedInstructor}
          onBack={() => setScreen("home")}
          onConfirm={() => setScreen("confirmed")}
        />
      )}

      {role === "student" && screen === "confirmed" && (
        <ConfirmationScreen instructor={selectedInstructor} time={confirmedTime} onDone={() => setScreen("home")} />
      )}
    </div>
  );
}
