const API = "https://good-lanches-backend.onrender.com";
let carrinho = [];
let pedidoPendente = null;
let desconto = 0;

/* =========================
   LOCAL STORAGE
========================= */
function salvarCarrinho() {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function carregarCarrinho() {
    const dados = localStorage.getItem("carrinho");
    if (dados) carrinho = JSON.parse(dados);
}

window.addEventListener("load", () => {
    carregarCarrinho();
    atualizarCarrinho();
    carregarCardapio();
});

/* =========================
   CARDÁPIO DINÂMICO (Node)
========================= */
async function carregarCardapio() {
    try {
        const resposta = await fetch(API + "/cardapio");
        const produtos = await resposta.json();

        const trad = document.getElementById("lista-tradicionais");
        const doces = document.getElementById("lista-doces");
        const bebidas = document.getElementById("lista-bebidas");

        if (trad) trad.innerHTML = "";
        if (doces) doces.innerHTML = "";
        if (bebidas) bebidas.innerHTML = "";

        produtos.forEach(produto => {
            const descricaoHtml = produto.descricao ? `<p>${produto.descricao}</p>` : "";

            const card = `
    <div class="item-card ${produto.categoria}">
                    <img src="${produto.imagem}" alt="${produto.nome}"
                         onerror="this.style.background='#eee';this.removeAttribute('src')">
                    <div class="item-info">
                        <h4>${produto.nome}</h4>
                        ${descricaoHtml}
                        <div class="item-footer">
                            <span class="preco">R$ ${parseFloat(produto.preco).toFixed(2)}</span>
                            <button class="btn-add"
                                onclick="addToCart('${produto.nome.replace(/'/g, "\\'")}', ${produto.preco})">
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            `;

            if (produto.categoria === "tradicionais" && trad) trad.innerHTML += card;
            else if (produto.categoria === "doces" && doces) doces.innerHTML += card;
            else if (produto.categoria === "bebidas" && bebidas) bebidas.innerHTML += card;
        });
    } catch (e) {
        console.error("Erro ao carregar cardápio:", e);
    }
}

/* =========================
   AÇÕES DO CARRINHO
========================= */
function addToCart(nomeProduto, precoProduto) {
    const itemExistente = carrinho.find(item => item.nome === nomeProduto);
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ nome: nomeProduto, preco: precoProduto, quantidade: 1 });
    }
    atualizarCarrinho();
}

function aumentarQuantidade(index) {
    carrinho[index].quantidade++;
    atualizarCarrinho();
}

function diminuirQuantidade(index) {
    if (carrinho[index].quantidade > 1) {
        carrinho[index].quantidade--;
    } else {
        carrinho.splice(index, 1);
    }
    atualizarCarrinho();
}

function removerItem(index) {
    carrinho.splice(index, 1);
    atualizarCarrinho();
}

/* =========================
   ATUALIZAR CARRINHO
========================= */
function atualizarCarrinho() {
    const extra = document.getElementById("cart-extra");
    const lista = document.getElementById("cart-items");
    const totalEl = document.getElementById("cart-total-value");
    const totalHeader = document.getElementById("cart-total-header");
    const badge = document.getElementById("cart-badge");
    const barra = document.getElementById("barraCarrinho");
    const textoQtd = document.getElementById("textoQuantidadeItens");
    const textoTotal = document.getElementById("textoValorTotal");

    lista.innerHTML = "";

    let total = 0;
    let totalItens = 0;
    let taxaEntrega = 0;

    const tipo = getTipoEntrega();
    if (tipo === "Delivery") {
        const bairroSel = document.getElementById("bairro")?.value;
        if (bairroSel && taxas[bairroSel]) taxaEntrega = taxas[bairroSel];
    }

    if (carrinho.length === 0) {
        if (lista) lista.innerHTML = `<p class="empty-msg">O carrinho está vazio.</p>`;
        if (extra) extra.style.display = "none";
        if (barra) barra.classList.remove("visivel");
        document.body.classList.remove("com-carrinho");
        if (badge) badge.style.display = "none";
        if (totalEl) totalEl.innerText = "R$ 0,00";
        if (totalHeader) totalHeader.innerText = "R$ 0,00";

        salvarCarrinho();
        return;
    }

    if (extra) extra.style.display = "block";
    barra.classList.add("visivel");
    document.body.classList.add("com-carrinho");
    badge.style.display = "flex";

    carrinho.forEach((item, index) => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;
        totalItens += item.quantidade;

        lista.innerHTML += `
            <div class="cart-item">
                <div class="info-produto">
                    <strong>${item.nome}</strong>
                    <span class="preco-item">R$ ${subtotal.toFixed(2)}</span>
                </div>
                <div class="controle-quantidade">
                    <button onclick="diminuirQuantidade(${index})">-</button>
                    <span>${item.quantidade}</span>
                    <button onclick="aumentarQuantidade(${index})">+</button>
                    <button class="btn-remover" onclick="removerItem(${index})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    const taxaEl = document.getElementById("taxa-entrega");
    if (taxaEl) taxaEl.innerText = "Taxa: R$ " + taxaEntrega.toFixed(2);

    total += taxaEntrega;
    if (desconto === "frete") total -= taxaEntrega;
    else total -= desconto;
    if (total < 0) total = 0;

    totalEl.innerText = `R$ ${total.toFixed(2)}`;
    totalHeader.innerText = `R$ ${total.toFixed(2)}`;
    textoTotal.innerText = "R$ " + total.toFixed(2);
    badge.innerText = totalItens > 9 ? "9+" : totalItens;
    textoQtd.innerText = totalItens + " item(s)";

    salvarCarrinho();
}

/* =========================
   ABRIR / FECHAR CARRINHO
========================= */
function toggleCart() {
    document.getElementById("cart-sidebar").classList.toggle("open");
}

/* =========================
   PEDIDO
========================= */
function enviarPedido() {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
        document.getElementById("login-modal").style.display = "flex";
        return;
    }
    enviarPedidoWhatsApp();
}

async function enviarPedidoWhatsApp() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    let mensagem = `━━━━━━━━━━━━━━━\n`;
    mensagem += `GOOD LANCHES\n`;
    mensagem += `━━━━━━━━━━━━━━━\n\n`;
    mensagem += `[CLIENTE]\n`;
    mensagem += `Nome: ${usuario.nome}\n`;
    mensagem += `Telefone: ${usuario.telefone}\n\n`;

    const tipoEntrega = getTipoEntrega();
    mensagem += `[ENTREGA]\nTipo: ${tipoEntrega}\n`;

    let total = 0;
    let taxaEntrega = 0;
    const bairro = document.getElementById("bairro")?.value || "";

    if (tipoEntrega === "Delivery" && taxas[bairro]) taxaEntrega = taxas[bairro];

    if (tipoEntrega === "Delivery") {
        mensagem += `Bairro: ${bairro}\n`;
        mensagem += `Taxa: R$ ${taxaEntrega.toFixed(2)}\n`;
    }

    if (desconto) {
        if (desconto === "frete") mensagem += `Cupom: FRETE GRATIS\n`;
        else mensagem += `Desconto: R$ ${desconto}\n`;
    }

    const formaPagamento = getFormaPagamento();
    mensagem += `Pagamento: ${formaPagamento}\n`;

    if (formaPagamento === "Dinheiro") {
        const troco = document.getElementById("troco")?.value;
        if (troco) mensagem += `Troco para: R$ ${troco}\n`;
    }

    mensagem += `\n━━━━━━━━━━━━━━━\n[ITENS DO PEDIDO]\n━━━━━━━━━━━━━━━\n`;

    carrinho.forEach(item => {
        const sub = item.preco * item.quantidade;
        total += sub;
        mensagem += `- ${item.nome}\n  ${item.quantidade}x | R$ ${sub.toFixed(2)}\n`;
    });

    const observacao = document.getElementById("observacaoPedido")?.value.trim();
    if (observacao) mensagem += `\n[OBSERVACAO]\n${observacao}\n`;

    total += taxaEntrega;
    if (desconto) {
        if (desconto === "frete") total -= taxaEntrega;
        else total -= desconto;
    }
    if (total < 0) total = 0;

    mensagem += `\n━━━━━━━━━━━━━━━\n[TOTAL]\nR$ ${total.toFixed(2)}\n━━━━━━━━━━━━━━━`;

    // ✅ Guarda pedido pendente para salvar ao voltar do WhatsApp
    pedidoPendente = {
        telefone: usuario.telefone,
        pedido: { itens: [...carrinho], total: total }
    };

    const numero = "5581984065536";
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
}

/* =========================
   SALVAR AO VOLTAR DO WHATSAPP
========================= */
document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible" && pedidoPendente) {
        try {
            await fetch(API + "/salvar-pedido", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pedidoPendente)
            });
        } catch (erro) {
            console.error("Erro ao salvar pedido:", erro);
        }

        pedidoPendente = null;
        carrinho = [];
        desconto = 0;

        const cupomInput = document.getElementById("cupom");
        const cupomMsg = document.getElementById("cupom-msg");
        if (cupomInput) cupomInput.value = "";
        if (cupomMsg) cupomMsg.innerText = "";

        const obs = document.getElementById("observacaoPedido");
        if (obs) obs.value = "";

        const retirada = document.querySelector('input[name="entrega"][value="Retirada"]');
        if (retirada) {
            retirada.checked = true;
            document.getElementById("area-entrega").style.display = "none";
        }

        const pix = document.querySelector('input[name="pagamento"][value="Pix"]');
        if (pix) {
            pix.checked = true;
            document.getElementById("troco-area").style.display = "none";
        }

        atualizarCarrinho();
        document.getElementById("cart-sidebar").classList.remove("open");
    }
});

/* =========================
   LOGIN
========================= */
function fazerLogin() {
    const nome = document.getElementById("nomeCliente").value.trim();
    const telefone = document.getElementById("telefoneCliente").value.trim();
    if (!nome || !telefone) { alert("Preencha todos os campos!"); return; }
    localStorage.setItem("usuario", JSON.stringify({ nome, telefone }));
    document.getElementById("login-modal").style.display = "none";
}

async function enviarCodigo() {
    const nome = document.getElementById("nomeCliente").value.trim();
    const sobrenome = document.getElementById("sobrenomeCliente").value.trim();
    const telefone = document.getElementById("telefoneCliente").value.trim();
    if (!nome || !sobrenome || !telefone) { alert("Preencha todos os campos!"); return; }
    try {
        const resposta = await fetch(API + "/enviar-codigo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, sobrenome, telefone })
        });
        const data = await resposta.json();
        if (!resposta.ok) { alert("Erro ao enviar código"); return; }

        document.getElementById("area-codigo").style.display = "block";

        // 👇 MOSTRA O CÓDIGO PRO USUÁRIO
        // 👇 MOSTRA O CÓDIGO PRO USUÁRIO
const msg = document.getElementById("codigo-msg");
msg.style.display = "block";
msg.innerText = "Seu código de verificação é: " + data.codigo;
    }
     catch (erro) {
        alert("Erro de conexão com o servidor!");
        console.error(erro);
    }}

async function confirmarCodigo() {
        const telefone = document.getElementById("telefoneCliente").value.trim();
        const codigo = document.getElementById("codigoCliente").value.trim();
        if (!codigo) { alert("Digite o código!"); return; }
        try {
            const resposta = await fetch(API + "/verificar-codigo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ telefone, codigo })
            });
            const data = await resposta.json();
            if (!resposta.ok) { alert(data.erro); return; }
            localStorage.setItem("usuario", JSON.stringify(data.usuario));
            document.getElementById("login-modal").style.display = "none";
            alert("Login feito com sucesso!");
        } catch (erro) {
            alert("Erro de conexão com o servidor!");
            console.error(erro);
        }
    }

    /* =========================
       MENU SCROLL
    ========================= */
    const linksMenu = document.querySelectorAll(".menu-categorias a");
    let clicandoMenu = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !clicandoMenu) {
                linksMenu.forEach(link => link.classList.remove("ativo"));
                const id = entry.target.getAttribute("id");
                const linkAtivo = document.querySelector(`.menu-categorias a[href="#${id}"]`);
                if (linkAtivo) linkAtivo.classList.add("ativo");
            }
        });
    }, { rootMargin: "-40% 0px -40% 0px" });

    document.querySelectorAll("main[id]").forEach(secao => observer.observe(secao));

    linksMenu.forEach(link => {
        link.addEventListener("click", () => {
            clicandoMenu = true;
            linksMenu.forEach(l => l.classList.remove("ativo"));
            link.classList.add("ativo");
            setTimeout(() => { clicandoMenu = false; }, 500);
        });
    });

    /* =========================
       ENTREGA E PAGAMENTO
    ========================= */
    function getTipoEntrega() {
        const s = document.querySelector('input[name="entrega"]:checked');
        return s ? s.value : "Retirada";
    }

    const taxas = {
        "Boa Viagem / Centro": 15,
        "Jaboatão": 5,
        "Prazeres": 8,
        "Piedade": 10,
        "Candeias": 12,
    };

    document.querySelectorAll('input[name="entrega"]').forEach(radio => {
        radio.addEventListener("change", () => {
            const area = document.getElementById("area-entrega");
            area.style.display = getTipoEntrega() === "Delivery" ? "block" : "none";
            atualizarCarrinho();
        });
    });

    document.getElementById("bairro")?.addEventListener("change", atualizarCarrinho);

    function getFormaPagamento() {
        const s = document.querySelector('input[name="pagamento"]:checked');
        return s ? s.value : "Pix";
    }

    document.querySelectorAll('input[name="pagamento"]').forEach(radio => {
        radio.addEventListener("change", () => {
            const trocoArea = document.getElementById("troco-area");
            trocoArea.style.display = getFormaPagamento() === "Dinheiro" ? "block" : "none";
        });
    });

    /* =========================
       CUPOM
    ========================= */
    const cupons = { "PRIMEIRA10": 10, "DESC5": 5, "FRETEGRATIS": "frete" };

    function aplicarCupom() {
        const input = document.getElementById("cupom");
        const msg = document.getElementById("cupom-msg");
        const codigo = input.value.trim().toUpperCase();

        if (!codigo || !cupons[codigo]) {
            msg.innerText = "Cupom inválido ❌"; msg.style.color = "red";
            desconto = 0; atualizarCarrinho(); return;
        }
        if (cupons[codigo] === "frete") {
            desconto = "frete"; msg.innerText = "Frete grátis aplicado 🚚"; msg.style.color = "green";
        } else {
            desconto = cupons[codigo]; msg.innerText = `Desconto de R$ ${desconto} aplicado ✅`; msg.style.color = "green";
        }
        atualizarCarrinho();
    }

    /* =========================
       ÁREA DO USUÁRIO
    ========================= */
    function toggleUser() {
        document.getElementById("user-sidebar").classList.toggle("open");
    }

    async function abrirUsuario() {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (!usuario) { document.getElementById("login-modal").style.display = "flex"; return; }

        document.getElementById("user-nome").innerText =
            usuario.nome + " " + (usuario.sobrenome || "");
        document.getElementById("user-telefone").innerText = usuario.telefone;

        const lista = document.getElementById("lista-pedidos");
        const icone = document.getElementById("icone-pedidos");
        lista.style.display = "none";
        if (icone) icone.style.transform = "rotate(0deg)";

        toggleUser();
        carregarPedidos(usuario.telefone);
    }

    async function carregarPedidos(telefone) {
        try {
            const resposta = await fetch(`${API}/pedidos/${telefone}`);
            const data = await resposta.json();
            const lista = document.getElementById("lista-pedidos");

            if (!data.pedidos || data.pedidos.length === 0) {
                lista.innerHTML = `<p style="color:#999;font-size:0.9rem;margin-top:8px;">Nenhum pedido ainda 🍕</p>`;
            } else {
                lista.innerHTML = "";
                data.pedidos.forEach(pedido => {
                    lista.innerHTML += `
                    <div style="margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:8px;">
                        <p><strong>Data:</strong> ${pedido.data}</p>
                        <p><strong>Total:</strong> R$ ${parseFloat(pedido.total).toFixed(2)}</p>
                    </div>`;
                });
            }
        } catch (erro) {
            document.getElementById("lista-pedidos").innerHTML =
                `<p style="color:red;font-size:0.9rem;">Erro ao carregar pedidos.</p>`;
        }
    }

    function togglePedidos() {
        const lista = document.getElementById("lista-pedidos");
        const icone = document.getElementById("icone-pedidos");
        const aberto = lista.style.display === "block";
        lista.style.display = aberto ? "none" : "block";
        if (icone) icone.style.transform = aberto ? "rotate(0deg)" : "rotate(180deg)";
    }

    function fecharUsuario() {
        document.getElementById("user-sidebar").classList.remove("open");
    }

    function logout() {
        localStorage.removeItem("usuario");
        alert("Você saiu!");
        fecharUsuario();
    }


    // valida código
    function validarCodigo() {
        const codigoDigitado = document.getElementById("codigoCliente").value;

        if (codigoDigitado == codigoGerado) {
            alert("Login realizado com sucesso!");

            document.getElementById("login-modal").style.display = "none";

            // salva usuário
            localStorage.setItem("usuario", JSON.stringify({
                nome: document.getElementById("nomeCliente").value,
                sobrenome: document.getElementById("sobrenomeCliente").value,
                telefone: document.getElementById("telefoneCliente").value
            }));

        } else {
            alert("Código incorreto!");
        }
    }