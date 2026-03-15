// app.js - Lógica Principal do Sistema FONACON
// Utiliza Firebase Realtime Database V9 Compat

// Estado Global
let currentUser = null; // { id, nome, email, perfil }

// Elementos da UI (Login)
const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('loginForm');

// Elementos da UI (App)
const userRoleBadge = document.getElementById('userRoleBadge');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const sidebarNav = document.getElementById('sidebarNav');
const logoutBtn = document.getElementById('logoutBtn');
const pageTitle = document.getElementById('pageTitle');
const topbarActions = document.getElementById('topbarActions');
const contentArea = document.getElementById('contentArea');
const toast = document.getElementById('toast');

// Utils
function showToast(msg, type = 'success') {
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    setTimeout(() => { toast.className = 'toast hidden'; }, 4000);
}

// ==========================================
// MOCK DATA DE INITIALIZAÇÃO
// ==========================================
async function seedDatabase() {
    const usersRef = db.ref('users');
    usersRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            console.log("Semeando banco de dados inicial (Realtime Database)...");

            // Criar Admin
            db.ref('users/admin_123').set({
                nome: 'Administrador FONACON',
                email: 'admin@fonacon.com.br',
                senha: 'admin',
                perfil: 'Admin'
            });

            // Criar Membros
            db.ref('users/membro_1').set({
                nome: 'João da Silva (Procurador)',
                email: 'joao@fonacon.com.br',
                senha: '123',
                perfil: 'Membro'
            });

            db.ref('users/membro_2').set({
                nome: 'Maria Souza (Procuradora)',
                email: 'maria@fonacon.com.br',
                senha: '123',
                perfil: 'Membro'
            });

            // Criar Documento Exemplo
            const newDocRef = db.ref('documents').push();
            newDocRef.set({
                titulo: 'Enunciado 01/2026 - Uso de IA',
                conteudo: 'Proposta: O uso de Inteligência Artificial para elaboração de peças processuais deve ser precedido de validação humana e seguir diretrizes de segurança da informação institucional.',
                status: 'Ativo',
                data_criacao: firebase.database.ServerValue.TIMESTAMP
            });
        }
    });
}

seedDatabase().catch(err => console.error("Erro no Seed:", err));


// ==========================================
// AUTENTICAÇÃO E ROTEAMENTO
// ==========================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    try {
        const usersRef = db.ref('users');
        usersRef.once('value', (snapshot) => {
            let found = false;
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data.email === email && data.senha === senha) {
                    currentUser = { id: childSnapshot.key, ...data };
                    found = true;
                }
            });

            if (found) {
                initApp();
                showToast('Login realizado com sucesso!');
            } else {
                showToast('E-mail ou senha inválidos!', 'error');
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        showToast('Erro ao conectar com servidor.', 'error');
    }
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    loginView.classList.add('active');
    appView.classList.remove('active');
    document.getElementById('email').value = '';
    document.getElementById('senha').value = '';
});

function initApp() {
    loginView.classList.remove('active');
    appView.classList.add('active');

    userName.textContent = currentUser.nome;
    userAvatar.textContent = currentUser.nome.charAt(0).toUpperCase();
    userRoleBadge.textContent = currentUser.perfil;
    userRoleBadge.style.backgroundColor = currentUser.perfil === 'Admin' ? 'var(--danger)' : 'var(--accent-yellow)';
    userRoleBadge.style.color = currentUser.perfil === 'Admin' ? 'white' : 'var(--primary-blue)';

    buildMenu();
    navigate('dashboard');
}

function buildMenu() {
    sidebarNav.innerHTML = '';

    const dashboardItem = document.createElement('div');
    dashboardItem.className = 'nav-item active';
    dashboardItem.innerHTML = '📊 Dashboard Geral';
    dashboardItem.onclick = () => { setActiveMenu(dashboardItem); navigate('dashboard'); };
    sidebarNav.appendChild(dashboardItem);

    if (currentUser.perfil === 'Membro') {
        const docAtivosItem = document.createElement('div');
        docAtivosItem.className = 'nav-item';
        docAtivosItem.innerHTML = 'ðŸ„ Docs em DeliberaÃ§Ã£o';
        docAtivosItem.onclick = () => { setActiveMenu(docAtivosItem); navigate('docs-deliberacao'); };
        sidebarNav.appendChild(docAtivosItem);
    }

    if (currentUser.perfil === 'Admin') {
        const gestaoItem = document.createElement('div');
        gestaoItem.className = 'nav-item';
        gestaoItem.innerHTML = '⚙️ Gestão de Documentos';
        gestaoItem.onclick = () => { setActiveMenu(gestaoItem); navigate('admin-docs'); };
        sidebarNav.appendChild(gestaoItem);

        const membrosItem = document.createElement('div');
        membrosItem.className = 'nav-item';
        membrosItem.innerHTML = '👥 Controle de Membros';
        membrosItem.onclick = () => { setActiveMenu(membrosItem); navigate('admin-membros'); };
        sidebarNav.appendChild(membrosItem);
    }

    const docEncerradosItem = document.createElement('div');
    docEncerradosItem.className = 'nav-item';
    docEncerradosItem.innerHTML = '✅ Documentos Deliberados';
    docEncerradosItem.onclick = () => { setActiveMenu(docEncerradosItem); navigate('docs-encerrados'); };
    sidebarNav.appendChild(docEncerradosItem);
}

function setActiveMenu(element) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

function navigate(route, params = null) {
    topbarActions.innerHTML = '';
    contentArea.innerHTML = '<div style="text-align:center; padding: 2rem;">Carregando...</div>';

    switch (route) {
        case 'dashboard':
            pageTitle.textContent = 'Dashboard';
            renderDashboard();
            break;
        case 'docs-deliberacao':
            pageTitle.textContent = 'Documentos em Deliberação';
            renderDocsDeliberacao();
            break;
        case 'votar-documento':
            renderAreaVoto(params);
            break;
        case 'docs-encerrados':
            pageTitle.textContent = 'Documentos Deliberados';
            renderDocsEncerrados();
            break;
        case 'resultados-documento':
            renderResultadoDocumento(params);
            break;
        case 'admin-docs':
            pageTitle.textContent = 'Gestão de Documentos';
            renderAdminDocs();
            break;
        case 'admin-membros':
            pageTitle.textContent = 'Controle de Membros';
            renderAdminMembros();
            break;
        default:
            contentArea.innerHTML = '<h2>Página Não encontrada</h2>';
    }
}

// ==========================================
// VIEWS RENDERERS
// ==========================================

async function renderDashboard() {
    let html = `
        <div class="welcome-card">
            <h2>Bem-vindo(a), ${currentUser.nome.split(' ')[0]}!</h2>
            <p>Este é o ambiente virtual de votações do FONACON. Aqui Você pode deliberar eletronicamente sobre os enunciados e propostas referentes ao Fórum.</p>
        </div>
        <div class="stats-grid" id="statsGrid">Carregando métricas...</div>
    `;
    contentArea.innerHTML = html;

    try {
        db.ref('documents').once('value', async (docsSnap) => {
            let total = 0;
            let ativos = 0;
            let encerrados = 0;

            docsSnap.forEach(doc => {
                total++;
                if (doc.val().status === 'Ativo') ativos++;
                if (doc.val().status === 'Encerrado') encerrados++;
            });

            let votosMembro = 0;
            let docsPendentes = 0;

            if (currentUser.perfil === 'Membro') {
                const votesSnap = await db.ref('votes').once('value');
                votesSnap.forEach(v => {
                    if (v.val().id_usuario === currentUser.id) votosMembro++;
                });
                docsPendentes = ativos - votosMembro;
            }

            const gridHTML = currentUser.perfil === 'Membro' ? `
                <div class="stat-card"><div class="stat-value" style="color:var(--danger)">${docsPendentes < 0 ? 0 : docsPendentes}</div><div class="stat-label">Pendentes para Voto</div></div>
                <div class="stat-card"><div class="stat-value" style="color:var(--secondary-green)">${votosMembro}</div><div class="stat-label">Votos Realizados</div></div>
                <div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total de Enunciados</div></div>
            ` : `
                <div class="stat-card"><div class="stat-value" style="color:var(--accent-yellow)">${ativos}</div><div class="stat-label">Docs. Ativos (Em Votação)</div></div>
                <div class="stat-card"><div class="stat-value" style="color:var(--secondary-green)">${encerrados}</div><div class="stat-label">Docs. Encerrados</div></div>
                <div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total Geral de Documentos</div></div>
            `;

            document.getElementById('statsGrid').innerHTML = gridHTML;
        });
    } catch (err) {
        document.getElementById('statsGrid').innerHTML = 'Erro ao carregar métricas.';
    }
}

async function renderDocsDeliberacao() {
    try {
        // Obter votos do usuario
        const myVotes = new Set();
        const votesSnap = await db.ref('votes').once('value');
        votesSnap.forEach(v => {
            if (v.val().id_usuario === currentUser.id) {
                myVotes.add(v.val().id_documento);
            }
        });

        db.ref('documents').once('value', (docsSnap) => {
            let docsList = [];
            docsSnap.forEach(doc => {
                if (doc.val().status === 'Ativo' && !myVotes.has(doc.key)) {
                    docsList.push({ id: doc.key, ...doc.val() });
                }
            });

            if (docsList.length === 0) {
                contentArea.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-muted)">Nenhum documento pendente de Votação para Você no momento. Parabéns!</div>';
                return;
            }

            let html = '<div class="document-list">';
            docsList.forEach(doc => {
                html += `
                    <div class="document-item">
                        <div class="doc-info">
                            <h3>${doc.titulo}</h3>
                            <div class="doc-meta">
                                <span class="status-badge status-ativo">Aberto para Votos</span>
                                <span>Liberado pelo Admin</span>
                            </div>
                        </div>
                        <button class="btn btn-secondary" onclick="navigate('votar-documento', '${doc.id}')">Acessar e Votar</button>
                    </div>
                `;
            });
            html += '</div>';
            contentArea.innerHTML = html;
        });

    } catch (err) {
        contentArea.innerHTML = 'Erro ao carregar documentos.';
    }
}

async function renderAreaVoto(docId) {
    try {
        db.ref('documents/' + docId).once('value', (docSnap) => {
            if (!docSnap.exists()) {
                contentArea.innerHTML = 'Documento Não encontrado.';
                return;
            }
            const data = docSnap.val();
            pageTitle.textContent = `Votação: ${data.titulo}`;

            let pdfViewer = '';
            if(data.pdf_base64) {
                pdfViewer = `
                <div style="margin-top: 1rem; border: 1px solid var(--border-color); border-radius: 6px; overflow:hidden;">
                    <div style="background:var(--bg-light); padding: 0.5rem; text-align:center; font-weight:600; border-bottom: 1px solid var(--border-color);">
                        📋 Anexo: ${data.pdf_name || 'Documento PDF'}
                    </div>
                    <iframe src="${data.pdf_base64}" style="width:100%; height:500px; border:none;" title="PDF Viewer"></iframe>
                </div>`;
            }

            let html = `
                <div>
                    <h3 style="color:var(--primary-blue)">Leia com Atenção o inteiro teor do documento abaixo:</h3>
                    ${data.conteudo ? `<div class="vote-content">${data.conteudo}</div>` : ''}
                    
                    ${pdfViewer}

                    <div class="vote-panel">
                        <h3 style="margin-bottom:1rem; color:var(--primary-blue)">Registre seu Voto</h3>
                        <p style="margin-bottom:1rem; font-size:0.9rem; color:var(--text-muted)">Atenção: A escolha da opção é irreversível após o envio e contabilizada nominalmente pelo seu perfil.</p>
                        
                        <div class="vote-actions" id="voteButtonGroup">
                            <button class="vote-btn favoravel" data-opcao="Favorável">👍 Favorável</button>
                            <button class="vote-btn contrario" data-opcao="Contrário">👎 Contrário</button>
                            <button class="vote-btn ressalva" data-opcao="Ressalva">✋ Com Ressalva</button>
                        </div>

                        <div class="justificativa-area hidden" id="justArea">
                            <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Justificativa (Obrigatória para Ressalva / Opcional para os demais)</label>
                            <textarea id="justificativaText" rows="4" placeholder="Digite sua motivação aqui..."></textarea>
                        </div>

                        <button class="btn btn-primary btn-block" id="btnConfirmarVoto" disabled>Confirmar Meu Voto</button>
                    </div>
                </div>
            `;
            contentArea.innerHTML = html;

            let selectedOption = null;
            const btns = document.querySelectorAll('.vote-btn');
            const justArea = document.getElementById('justArea');
            const justText = document.getElementById('justificativaText');
            const btnConfirm = document.getElementById('btnConfirmarVoto');

            btns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    btns.forEach(b => b.classList.remove('selected'));
                    const t = e.target;
                    t.classList.add('selected');
                    selectedOption = t.getAttribute('data-opcao');

                    justArea.classList.remove('hidden');
                    btnConfirm.disabled = false;

                    if (selectedOption === 'Ressalva') {
                        justText.setAttribute('required', 'true');
                    } else {
                        justText.removeAttribute('required');
                    }
                });
            });

            btnConfirm.addEventListener('click', async () => {
                if (selectedOption === 'Ressalva' && justText.value.trim() === '') {
                    alert("Justificativa é Obrigatória para voto com Ressalva.");
                    return;
                }

                btnConfirm.disabled = true;
                btnConfirm.textContent = "Processando...";

                // REGRA CRÃTICA - RestriÃ§Ã£o de unicidade no Realtime Database:
                // Ao usar o path 'votes/userId_docId', garantimos fisicamente que cada Usuário crie apenas um node de voto por doc.
                const voteKey = `${currentUser.id}_${docId}`;
                const voteRef = db.ref('votes/' + voteKey);

                voteRef.transaction((currentData) => {
                    if (currentData === null) {
                        // Nao existe, vamos salvar
                        return {
                            id_usuario: currentUser.id,
                            nome_usuario: currentUser.nome,
                            id_documento: docId,
                            opcao: selectedOption,
                            justificativa: justText.value.trim(),
                            data_hora: firebase.database.ServerValue.TIMESTAMP
                        };
                    } else {
                        // Ja existe
                        return undefined; // Aborta transacao
                    }
                }, (error, committed, snapshot) => {
                    if (error) {
                        showToast("Erro ao registrar voto.", "error");
                        btnConfirm.disabled = false;
                        btnConfirm.textContent = "Confirmar Meu Voto";
                    } else if (!committed) {
                        showToast("Você já registrou um voto para este documento!", "error");
                        btnConfirm.disabled = false;
                        btnConfirm.textContent = "Confirmar Meu Voto";
                    } else {
                        showToast("Voto computado com sucesso!");
                        navigate('docs-deliberacao');
                    }
                });
            });
        });

    } catch (err) {
        contentArea.innerHTML = 'Erro ao carregar detalhes para votar.';
    }
}

// ==========================================
// OUTRAS VIEWS (Encerrados, Admin, Resultados)
// ==========================================

async function renderDocsEncerrados() {
    topbarActions.innerHTML = `<button class="btn btn-secondary" onclick="window.print()">ðŸ–¨ï¸ Exportar PDF</button>`;

    try {
        db.ref('documents').once('value', (docsSnap) => {
            let html = '<div class="document-list">';
            let empty = true;

            docsSnap.forEach(doc => {
                if (doc.val().status === 'Encerrado') {
                    empty = false;
                    const data = doc.val();
                    html += `
                        <div class="document-item">
                            <div class="doc-info">
                                <h3>${data.titulo}</h3>
                                <div class="doc-meta">
                                    <span class="status-badge status-encerrado">Votação Encerrada</span>
                                </div>
                            </div>
                            <button class="btn btn-primary" onclick="navigate('resultados-documento', '${doc.key}')">Ver relatório Final</button>
                        </div>
                    `;
                }
            });

            if (empty) {
                html += '<div style="color:var(--text-muted); text-align:center; padding: 2rem;">Nenhum documento encerrado no momento.</div>';
            }

            html += '</div>';
            contentArea.innerHTML = html;
        });
    } catch (err) {
        contentArea.innerHTML = 'Erro ao carregar documentos encerrados.';
    }
}

async function renderResultadoDocumento(docId) {
    topbarActions.innerHTML = `<button class="btn btn-secondary" onclick="window.print()">ðŸ–¨ï¸ Imprimir Resultado</button>`;

    try {
        db.ref('documents/' + docId).once('value', (docSnap) => {
            const data = docSnap.val();
            pageTitle.textContent = `Resultado: ${data.titulo}`;

            db.ref('votes').once('value', (votosSnap) => {
                let consolidador = { 'Favorável': 0, 'Contrário': 0, 'Ressalva': 0 };
                let votosList = [];

                votosSnap.forEach(v => {
                    const vd = v.val();
                    if (vd.id_documento === docId) {
                        consolidador[vd.opcao]++;
                        votosList.push(vd);
                    }
                });

                votosList.sort((a, b) => a.nome_usuario.localeCompare(b.nome_usuario));

                let html = `
                    <div style="margin-bottom: 2rem;">
                        <h3 style="margin-bottom: 1rem;">Painel Consolidado de Votos</h3>
                        <div class="stats-grid">
                            <div class="stat-card" style="border-top: 4px solid var(--secondary-green)">
                                <div class="stat-value" style="color:var(--secondary-green)">${consolidador['Favorável']}</div><div class="stat-label">Votos Favoráveis</div>
                            </div>
                            <div class="stat-card" style="border-top: 4px solid var(--danger)">
                                <div class="stat-value" style="color:var(--danger)">${consolidador['Contrário']}</div><div class="stat-label">Votos Contrários</div>
                            </div>
                            <div class="stat-card" style="border-top: 4px solid var(--accent-yellow)">
                                <div class="stat-value" style="color:var(--accent-yellow)">${consolidador['Ressalva']}</div><div class="stat-label">Com Ressalvas</div>
                            </div>
                        </div>
                    </div>

                    <div class="data-table-wrapper">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Procurador / Membro</th>
                                    <th>Voto Computado</th>
                                    <th>Justificativa Apresentada</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                if (votosList.length === 0) {
                    html += `<tr><td colspan="3" style="text-align:center;">Nenhum voto registrado.</td></tr>`;
                }

                votosList.forEach(v => {
                    html += `
                        <tr>
                            <td style="font-weight:500;">${v.nome_usuario}</td>
                            <td><span class="badge" style="background-color: ${v.opcao === 'Favorável' ? 'var(--secondary-green)' : (v.opcao === 'Contrário' ? 'var(--danger)' : 'var(--accent-yellow)')}; color: white; padding: 0.3rem 0.6rem;">${v.opcao}</span></td>
                            <td style="font-size:0.85rem; color:var(--text-muted);">${v.justificativa ? v.justificativa : '-'}</td>
                        </tr>
                    `;
                });

                html += `</tbody></table></div>`;
                contentArea.innerHTML = html;
            });
        });

    } catch (err) {
        contentArea.innerHTML = 'Erro ao carregar os resultados.';
    }
}

// ==== ADMIN MODALS ====
async function renderAdminDocs() {
    topbarActions.innerHTML = `<button class="btn btn-success" onclick="abrirModalDoc()">+ Publicar Novo Documento</button>`;

    try {
        db.ref('documents').once('value', (snap) => {
            let html = '<div class="data-table-wrapper"><table class="data-table"><thead><tr><th>ID/Título</th><th>Status</th><th>Ações</th></tr></thead><tbody>';

            // Ordena localmente pra reverter (mais novos primeiro)
            let docsArray = [];
            snap.forEach(doc => { docsArray.push({ id: doc.key, ...doc.val() }); });
            docsArray.sort((a, b) => b.data_criacao - a.data_criacao);

            docsArray.forEach(data => {
                const badge = data.status === 'Ativo' ? '<span class="status-badge status-ativo">Em Votação</span>' : '<span class="status-badge status-encerrado">Encerrado</span>';
                const actionBtn = data.status === 'Ativo' ?
                    `<button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size:0.8rem;" onclick="encerrarVotacao('${data.id}')">🛑 Encerrar</button>` :
                    `<button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size:0.8rem;" onclick="navigate('resultados-documento', '${data.id}')">📊 Ver Resultado</button>`;

                html += `
                    <tr>
                        <td><strong>${data.titulo}</strong></td>
                        <td>${badge}</td>
                        <td>${actionBtn}</td>
                    </tr>
                `;
            });
            html += '</tbody></table></div>';

            html += `
                <div id="modalNovoDoc" class="modal-overlay hidden">
                    <div class="modal-content">
                        <h2 style="margin-bottom:1rem;">Novo Documento para Votação</h2>
                        <div class="form-group">
                            <label>Título (Ex: Enunciado 02/2026)</label>
                            <input type="text" id="novoDocTitulo" required>
                        </div>
                        <div class="form-group">
                            <label>Conteúdo Integral (Opcional se houver PDF)</label>
                            <textarea id="novoDocConteudo" rows="4" style="width:100%; padding:0.8rem; border:1px solid var(--border-color); border-radius:6px;"></textarea>
                        </div>
                        <div class="form-group" style="margin-top:1rem;">
                            <label>Anexar Arquivo PDF (Tamanho Máximo: 2MB)</label>
                            <input type="file" id="novoDocPDF" accept="application/pdf" style="display:block; margin-top:0.5rem;"/>
                            <small style="color:var(--text-muted)">O arquivo será armazenado com segurança para leitura imersiva da classe.</small>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:2rem;">
                            <button class="btn btn-logout" onclick="document.getElementById('modalNovoDoc').classList.add('hidden')">Cancelar</button>
                            <button class="btn btn-primary" onclick="salvarNovoDoc(false)" style="background:var(--secondary-green)">Apenas Publicar</button>
                            <button class="btn btn-primary" onclick="salvarNovoDoc(true)">Publicar e Convocar Membros</button>
                        </div>
                    </div>
                </div>
            `;
            contentArea.innerHTML = html;
        });
    } catch (err) {
        contentArea.innerHTML = "Erro ao carregar Gestão de docs.";
    }
}

window.abrirModalDoc = () => { 
    document.getElementById('modalNovoDoc').classList.remove('hidden');
    document.getElementById('novoDocTitulo').value = '';
    document.getElementById('novoDocConteudo').value = '';
    document.getElementById('novoDocPDF').value = '';
}

window.salvarNovoDoc = async (bConvocar) => {
    const titulo = document.getElementById('novoDocTitulo').value;
    const cont = document.getElementById('novoDocConteudo').value;
    const fileInput = document.getElementById('novoDocPDF');
    
    if (!titulo && (!cont && fileInput.files.length === 0)) { 
        showToast("Preencha título e anexe conteúdo ou PDF", "error"); 
        return; 
    }

    try {
        let pdfBase64 = null;
        let pdfName = null;
        
        if(fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if(file.size > 2 * 1024 * 1024) {
                showToast("Erro: Arquivo excede 2MB.", "error"); return;
            }
            pdfName = file.name;
            const reader = new FileReader();
            pdfBase64 = await new Promise((resolve) => {
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        }

        const newRef = db.ref('documents').push();
        await newRef.set({
            titulo: titulo,
            conteudo: cont,
            pdf_base64: pdfBase64,
            pdf_name: pdfName,
            status: 'Ativo',
            data_criacao: firebase.database.ServerValue.TIMESTAMP
        });
        document.getElementById('modalNovoDoc').classList.add('hidden');
        
        if (bConvocar) {
            showToast("✓ Documento publicado! E-mails de convocação disparados aos membros (Mock).", "success");
        } else {
            showToast("✓ Documento publicado silenciosamente.", "success");
        }
        
        renderAdminDocs();
    } catch (e) { showToast("Erro salvar documento.", "error"); }
}

window.encerrarVotacao = async (docId) => {
    if (confirm("Deseja realmente encerrar a Votação para este documento? Ninguém mais poderá votar.")) {
        try {
            await db.ref('documents/' + docId).update({ status: 'Encerrado' });
            showToast("Votação encerrada com sucesso!");
            renderAdminDocs();
        } catch (e) { showToast("Erro ao encerrar.", "error"); }
    }
}

// ==== MEMBROS E CONTROLE DE BASE ====
async function renderAdminMembros() {
    topbarActions.innerHTML = `<button class="btn btn-success" onclick="abrirModalAddMembro()">+ Novo Membro</button>`;

    try {
        db.ref('users').once('value', (snap) => {
            let html = `<p style="margin-bottom:1.5rem; color:var(--text-muted)">Controle total da base de usuários.</p> 
            <div class="data-table-wrapper"><table class="data-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th style="text-align:right">Ações</th></tr></thead><tbody>`;

            snap.forEach(usr => {
                const data = usr.val();
                const badge = data.perfil === 'Admin' ? `<span class="badge" style="background:var(--danger);color:white">Admin</span>` : `<span class="badge" style="background:var(--primary-blue);color:white">Membro</span>`;
                html += `<tr>
                    <td><strong>${data.nome}</strong></td>
                    <td>${data.email}</td>
                    <td>${badge}</td>
                    <td style="text-align:right">
                        <button class="btn btn-secondary" style="font-size:0.75rem; padding:0.3rem 0.6rem;" onclick="resetarSenhaMembro('${usr.key}')">Reset Senha</button>
                        <button class="btn btn-danger" style="font-size:0.75rem; padding:0.3rem 0.6rem;" onclick="excluirMembro('${usr.key}')">Excluir</button>
                    </td>
                </tr>`;
            });
            html += '</tbody></table></div>';
            
            // Modal de Adição de Membro
            html += `
                <div id="modalAddMembro" class="modal-overlay hidden">
                    <div class="modal-content" style="max-width: 400px;">
                        <h2 style="margin-bottom:1rem; color:var(--primary-blue)">Cadastrar Novo Membro</h2>
                        <div class="form-group">
                            <label>Nome Completo</label>
                            <input type="text" id="addMemNome" required>
                        </div>
                        <div class="form-group">
                            <label>E-mail de Acesso</label>
                            <input type="email" id="addMemEmail" required>
                        </div>
                        <div class="form-group">
                            <label>Senha Inicial</label>
                            <input type="text" id="addMemSenha" required>
                        </div>
                        <div class="form-group">
                            <label>Perfil (Nível de Acesso)</label>
                            <select id="addMemPerfil" style="width:100%; padding:0.8rem; border-radius:6px; font-family:inherit;">
                                <option value="Membro">Membro</option>
                                <option value="Admin">Administrador</option>
                            </select>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:2rem;">
                            <button class="btn btn-logout" onclick="document.getElementById('modalAddMembro').classList.add('hidden')">Cancelar</button>
                            <button class="btn btn-primary" onclick="salvarNovoMembro()">Finalizar Cadastro</button>
                        </div>
                    </div>
                </div>
            `;
            
            contentArea.innerHTML = html;
        });
    } catch (err) {
        contentArea.innerHTML = "Erro ao carregar membros.";
    }
}

window.abrirModalAddMembro = () => { document.getElementById('modalAddMembro').classList.remove('hidden'); }

window.salvarNovoMembro = async () => {
    const nome = document.getElementById('addMemNome').value.trim();
    const email = document.getElementById('addMemEmail').value.trim();
    const senha = document.getElementById('addMemSenha').value.trim();
    const perfil = document.getElementById('addMemPerfil').value;

    if(!nome || !email || !senha) { showToast("Preencha todos os campos do membro.", "error"); return; }

    try {
        const newRef = db.ref('users').push(); // Cria um hash único aleatorio
        await newRef.set({
            nome: nome,
            email: email,
            senha: senha,
            perfil: perfil
        });
        showToast("✓ Membro adicionado com sucesso!", "success");
        renderAdminMembros();
    } catch(err) {
        showToast("Erro ao adicionar membro.", "error");
    }
}

window.resetarSenhaMembro = async (userId) => {
    const nova = prompt("Digite a NOVA SENHA para este usuário:");
    if(!nova || nova.trim() === '') return;
    
    try {
        await db.ref('users/' + userId).update({ senha: nova.trim() });
        showToast("Senha redefinida com sucesso!");
    } catch(e) { showToast("Erro ao redefinir senha.", "error"); }
}

window.excluirMembro = async (userId) => {
    if(confirm("ATENÇÃO: Deseja realmente excluir este membro definitivamente do sistema?")) {
        try {
            await db.ref('users/' + userId).remove();
            showToast("Membro removido da base de dados.");
            renderAdminMembros();
        } catch(e) { showToast("Erro ao excluir.", "error"); }
    }
}



