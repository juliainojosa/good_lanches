let auth = {};

/* =========================
   LOGIN
========================= */
async function login() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha   = document.getElementById("senha").value.trim();

    if (!usuario || !senha) {
        alert("Preencha usuário e senha!");
        return;
    }

    const res = await fetch(API + "/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, senha })
    });

    const data = await res.json();

    if (res.ok && data.ok) {
        auth = { usuario, senha };
        localStorage.setItem("auth", JSON.stringify(auth));

        document.getElementById("loginBox").style.display = "none";
        document.getElementById("painel").style.display   = "block";

        carregar();
    } else {
        alert(data.erro || "Usuário ou senha incorretos!");
    }
}

function logout() {
    localStorage.removeItem("auth");
    auth = {};
    document.getElementById("painel").style.display   = "none";
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("senha").value = "";
}

function toggleSenha() {
    const input = document.getElementById("senha");
    const icon  = document.getElementById("iconeSenha");
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

/* =========================
   SESSÃO SALVA
========================= */
window.onload = async () => {
    const saved = localStorage.getItem("auth");
    if (!saved) return;

    auth = JSON.parse(saved);

    const res = await fetch(API + "/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auth)
    });

    if (res.ok) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("painel").style.display   = "block";
        carregar();
    } else {
        localStorage.removeItem("auth");
    }
};

/* =========================
   LISTAR ITENS
========================= */
async function carregar() {
    const res = await fetch(`http://localhost:3000/admin/cardapio?usuario=${auth.usuario}&senha=${auth.senha}`);
    const dados = await res.json();
    const lista = document.getElementById("lista");

    lista.innerHTML = "";

    if (!dados.length) {
        lista.innerHTML = `<p style="color:#999;">Nenhum item cadastrado ainda.</p>`;
        return;
    }

    dados.forEach(item => {
        const div = document.createElement("div");
        div.className = "admin-item " + (item.ativo == 1 ? "" : "inativo");

        div.innerHTML = `
            <div class="admin-item-info">
                <div>
                    <label>Nome</label>
                    <input value="${escapar(item.nome)}" id="nome-${item.id}">
                </div>
                <div>
                    <label>Preço</label>
                    <input type="number" step="0.01" value="${item.preco}" id="preco-${item.id}">
                </div>
                <div>
                    <label>Categoria</label>
                    <select id="categoria-${item.id}">
                        <option value="tradicionais" ${item.categoria === 'tradicionais' ? 'selected' : ''}>Pizzas Tradicionais</option>
                        <option value="doces"        ${item.categoria === 'doces'        ? 'selected' : ''}>Pizzas Doces</option>
                        <option value="bebidas"      ${item.categoria === 'bebidas'      ? 'selected' : ''}>Bebidas</option>
                    </select>
                </div>
                <div>
                    <label>Imagem</label>
                    <input value="${escapar(item.imagem || '')}" id="imagem-${item.id}">
                </div>
                <div style="grid-column: 1 / -1;">
                    <label>Descrição</label>
                    <textarea id="descricao-${item.id}">${escapar(item.descricao || '')}</textarea>
                </div>
            </div>

            <div class="admin-actions">
                <button class="btn-save" onclick="salvar(event, ${item.id})">
                    <i class="fa fa-check"></i> Salvar
                </button>
                <button class="btn-archive" onclick="arquivar(${item.id})">
                    <i class="fa fa-box-archive"></i> ${item.ativo == 1 ? "Arquivar" : "Ativar"}
                </button>
                <button class="btn-delete" onclick="confirmarExclusao(${item.id})">
                    <i class="fa fa-trash"></i> Excluir
                </button>
            </div>
        `;

        lista.appendChild(div);
    });
}

/* =========================
   ADICIONAR
========================= */
async function adicionar() {
    const nome      = document.getElementById("nome").value.trim();
    const categoria = document.getElementById("categoria").value;
    const preco     = document.getElementById("preco").value;
    const imagem    = document.getElementById("imagem").value.trim();
    const descricao = document.getElementById("descricao").value.trim();

    if (!nome || !categoria || !preco) {
        alert("Preencha ao menos nome, categoria e preço!");
        return;
    }

    const res = await fetch(API + "/admin/cardapio", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            usuario: auth.usuario,
            senha: auth.senha,
            item: {
                nome,
                categoria,
                descricao,
                preco: parseFloat(preco),
                imagem
            }
        })
    });

    const data = await res.json();

    if (res.ok) {
        mostrarToast("Item adicionado com sucesso! ✅");
        document.getElementById("nome").value      = "";
        document.getElementById("categoria").value = "";
        document.getElementById("preco").value     = "";
        document.getElementById("imagem").value    = "";
        document.getElementById("descricao").value = "";
        document.getElementById("preview").style.display = "none";
        carregar();
    } else {
        alert("Erro: " + (data.erro || "desconhecido"));
    }
}

/* =========================
   SALVAR EDIÇÃO
========================= */
async function salvar(event, id) {
    const btn = event.currentTarget;
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = "Salvando...";
    btn.disabled = true;

    const res = await fetch(API + `/admin/cardapio/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            usuario: auth.usuario,
            senha: auth.senha,
            item: {
                nome: document.getElementById(`nome-${id}`).value,
                preco: document.getElementById(`preco-${id}`).value,
                categoria: document.getElementById(`categoria-${id}`).value,
                imagem: document.getElementById(`imagem-${id}`).value,
                descricao: document.getElementById(`descricao-${id}`).value
            }
        })
    });

    const data = await res.json();

    if (data.ok) {
        mostrarToast("Item atualizado! ✅");
        btn.innerHTML = "✔ Salvo";
    } else {
        alert("Erro ao salvar: " + (data.erro || "desconhecido"));
        btn.innerHTML = textoOriginal;
    }

    setTimeout(() => {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }, 1500);
}

/* =========================
   ARQUIVAR / ATIVAR
========================= */
async function arquivar(id) {
    const res = await fetch(API + `/admin/cardapio/${id}/arquivar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auth)
    });

    const data = await res.json();
    mostrarToast(data.ativo ? "Item ativado! ✅" : "Item arquivado! 📦");
    carregar();
}

/* =========================
   EXCLUIR
========================= */
function confirmarExclusao(id) {
    if (confirm("Tem certeza que deseja EXCLUIR este item permanentemente?")) excluir(id);
}

async function excluir(id) {
    const res = await fetch(API + `/admin/cardapio/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auth)
    });

    const data = await res.json();

    if (data.ok) {
        mostrarToast("Item excluído!");
        carregar();
    } else {
        alert("Erro ao excluir: " + (data.erro || "desconhecido"));
    }
}

/* =========================
   PREVIEW DE IMAGEM
========================= */
function previewImagem() {
    const url = document.getElementById("imagem").value.trim();
    const img = document.getElementById("preview");

    if (url) {
        img.src = url;
        img.style.display = "block";
    } else {
        img.style.display = "none";
    }
}

/* =========================
   HELPERS
========================= */
function escapar(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function mostrarToast(mensagem) {
    const toast = document.getElementById("toast");
    toast.innerText = mensagem;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}