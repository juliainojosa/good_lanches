const express = require("express");
const cors    = require("cors");
const mysql   = require("mysql2/promise");
const codigos = {};
const dadosTemp = {};
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── CREDENCIAIS DO ADMIN ────────────────────────────────────────────────────
const ADMIN_USER = "admin";
const ADMIN_PASS = "goodlanches2025";

// ─── POOL MYSQL ──────────────────────────────────────────────────────────────
const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: "goodlanches",
    ssl: process.env.DB_HOST ? { rejectUnauthorized: true } : undefined
});

// Testa conexão ao iniciar
(async () => {
    try {
        await db.query("SELECT 1");
        console.log("✅ Conectado ao MySQL");
    } catch (e) {
        console.error("❌ Erro ao conectar ao MySQL:", e.message);
        process.exit(1);
    }
})();

// ─── HELPER ──────────────────────────────────────────────────────────────────
function isAdmin(usuario, senha) {
    return usuario === ADMIN_USER && senha === ADMIN_PASS;
}

// ─── TESTE ───────────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("Servidor funcionando 🚀"));

// ════════════════════════════════════════════════════════════════════════════
//  AUTH ADMIN
// ════════════════════════════════════════════════════════════════════════════
app.post("/admin/login", (req, res) => {
    const { usuario, senha } = req.body;
    if (isAdmin(usuario, senha)) return res.json({ ok: true });
    res.status(401).json({ erro: "Credenciais inválidas" });
});

// ════════════════════════════════════════════════════════════════════════════
//  CARDÁPIO — PÚBLICO
// ════════════════════════════════════════════════════════════════════════════
app.get("/cardapio", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM cardapio WHERE ativo = 1 ORDER BY categoria, id"
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ erro: "Erro ao buscar cardápio" });
    }
});

// ════════════════════════════════════════════════════════════════════════════
//  CARDÁPIO — ADMIN
// ════════════════════════════════════════════════════════════════════════════
app.get("/admin/cardapio", async (req, res) => {
    const { usuario, senha } = req.query;
    if (!isAdmin(usuario, senha)) return res.status(401).json({ erro: "Não autorizado" });

    try {
        const [rows] = await db.query("SELECT * FROM cardapio ORDER BY categoria, id");
        res.json(rows);
    } catch (e) {
        res.status(500).json({ erro: "Erro ao buscar cardápio" });
    }
});

app.post("/admin/cardapio", async (req, res) => {
    const { usuario, senha, item } = req.body;
    if (!isAdmin(usuario, senha)) return res.status(401).json({ erro: "Não autorizado" });

    const { categoria, nome, descricao, preco, imagem } = item;
    if (!nome || !categoria || preco === undefined) {
        return res.status(400).json({ erro: "Dados incompletos" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO cardapio (categoria, nome, descricao, preco, imagem, ativo) VALUES (?, ?, ?, ?, ?, 1)",
            [categoria, nome, descricao || null, parseFloat(preco), imagem || null]
        );
        res.json({ ok: true, id: result.insertId });
    } catch (e) {
        res.status(500).json({ erro: "Erro ao inserir item" });
    }
});

app.put("/admin/cardapio/:id", async (req, res) => {
    const { usuario, senha, item } = req.body;
    if (!isAdmin(usuario, senha)) return res.status(401).json({ erro: "Não autorizado" });

    const { categoria, nome, descricao, preco, imagem } = item;
    try {
        await db.query(
            "UPDATE cardapio SET categoria=?, nome=?, descricao=?, preco=?, imagem=? WHERE id=?",
            [categoria, nome, descricao || null, parseFloat(preco), imagem || null, req.params.id]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ erro: "Erro ao atualizar item" });
    }
});

app.patch("/admin/cardapio/:id/arquivar", async (req, res) => {
    const { usuario, senha } = req.body;
    if (!isAdmin(usuario, senha)) return res.status(401).json({ erro: "Não autorizado" });

    try {
        await db.query("UPDATE cardapio SET ativo = NOT ativo WHERE id = ?", [req.params.id]);
        const [[item]] = await db.query("SELECT ativo FROM cardapio WHERE id = ?", [req.params.id]);
        res.json({ ok: true, ativo: !!item.ativo });
    } catch (e) {
        res.status(500).json({ erro: "Erro ao arquivar item" });
    }
});

app.delete("/admin/cardapio/:id", async (req, res) => {
    const { usuario, senha } = req.body;
    if (!isAdmin(usuario, senha)) return res.status(401).json({ erro: "Não autorizado" });

    try {
        await db.query("DELETE FROM cardapio WHERE id = ?", [req.params.id]);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ erro: "Erro ao excluir item" });
    }
});

// ════════════════════════════════════════════════════════════════════════════
//  USUÁRIOS — VERIFICAÇÃO POR CÓDIGO
// ════════════════════════════════════════════════════════════════════════════

app.post("/enviar-codigo", (req, res) => {
    const { nome, sobrenome, telefone } = req.body;

    if (!nome || !sobrenome || !telefone) {
        return res.status(400).json({ erro: "Dados incompletos" });
    }

    const codigo = Math.floor(1000 + Math.random() * 9000);

    // 🔥 SALVA TUDO
    codigos[telefone] = codigo;
    dadosTemp[telefone] = { nome, sobrenome };

    console.log("Código gerado:", codigo);

    res.json({ ok: true, codigo });
});


app.post("/verificar-codigo", async (req, res) => {
    const { telefone, codigo } = req.body;

    if (codigos[telefone] != codigo) {
        return res.status(400).json({ erro: "Código inválido" });
    }

    delete codigos[telefone];

    try {
        const [[existente]] = await db.query(
            "SELECT * FROM usuarios WHERE telefone = ?", [telefone]
        );

        let usuario;

        if (existente) {
            usuario = existente;
        } else {
            const { nome, sobrenome } = dadosTemp[telefone];
            const [result] = await db.query(
                "INSERT INTO usuarios (nome, sobrenome, telefone) VALUES (?, ?, ?)",
                [nome, sobrenome, telefone]
            );
            usuario = { id: result.insertId, nome, sobrenome, telefone };
        }

        delete dadosTemp[telefone];
        res.json({ usuario });
    } catch (e) {
        console.error(e);
        res.status(500).json({ erro: "Erro ao verificar código" });
    }
});

// ════════════════════════════════════════════════════════════════════════════
//  PEDIDOS
// ════════════════════════════════════════════════════════════════════════════
app.post("/salvar-pedido", async (req, res) => {
    const { telefone, pedido } = req.body;

    try {
        const [[usuario]] = await db.query(
            "SELECT id FROM usuarios WHERE telefone = ?", [telefone]
        );

        if (!usuario) return res.status(400).json({ erro: "Usuário não encontrado" });

        await db.query(
            "INSERT INTO pedidos (usuario_id, total, itens) VALUES (?, ?, ?)",
            [usuario.id, pedido.total, JSON.stringify(pedido.itens)]
        );

        res.json({ mensagem: "Pedido salvo com sucesso" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ erro: "Erro ao salvar pedido" });
    }
});

app.get("/pedidos/:telefone", async (req, res) => {
    try {
        const [[usuario]] = await db.query(
            "SELECT id FROM usuarios WHERE telefone = ?", [req.params.telefone]
        );

        if (!usuario) return res.json({ pedidos: [] });

        const [pedidos] = await db.query(
            `SELECT total, itens,
                DATE_FORMAT(criado_em, '%d/%m/%Y %H:%i') AS data
             FROM pedidos
             WHERE usuario_id = ?
             ORDER BY criado_em DESC
             LIMIT 5`,
            [usuario.id]
        );

        res.json({ pedidos });
    } catch (e) {
        console.error(e);
        res.status(500).json({ erro: "Erro ao buscar pedidos" });
    }
});
app.get("/categorias", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categorias ORDER BY nome");
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao buscar categorias" });
  }
});
// ─── START ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Servidor rodando na porta " + PORT);
});