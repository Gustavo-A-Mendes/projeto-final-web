// Configuração do AWS Cognito:
const poolData = {
    UserPoolId: "us-east-1_lx4uauG61",
    ClientId: "4m4pllmlt8rtc8sul5nhnrnf0e",
};

// Configuração da API Gateway
const API_BASE_URL =
    "https://d5p7mnyje4.execute-api.us-east-1.amazonaws.com/v1"; // Substitua pela sua URL da API

// ================================================================================
// Variáveis de controle de fluxo do cognito:
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
let currentUser = null;
let userRole = null;
let pendingConfirmationEmail = null;
let pendingAction = null;

// ================================================================================
// Dados simulados para demonstração (arquivos "materiais.json" e "movimentacoes.json"):
let materiais = [];
// carregarDadosJSON("./materiais.json").then((dados) => {
//     materiais = dados;
// });

let movimentacoes = [];
// carregarDadosJSON('./movimentacoes.json').then(dados => {
//     movimentacoes = dados;
// })

const usuarios = [];
// carregarDadosJSON('./usuarios.json').then(dados => {
//     usuarios = dados;
// })

// ================================================================================
// Funções de persistência de dados (temporário, enquanto eu não integrar o backend):

// Substituir as funções de persistência local por chamadas à API
async function saveDataToStorage() {
    // Esta função não é mais necessária com API
    console.log("Dados salvos via API");
}

async function loadDataFromStorage() {
    try {
        console.log("teste: ");
        console.log(currentUser)
        // Carregar materiais da API
        const materiaisResponse = await fetch(`${API_BASE_URL}/materiais`, {
            method: "GET",
            Authorization: `Bearer ${currentUser.getSignInUserSession().idToken.jwtToken}`
        });

        if (materiaisResponse.ok) {
            materiais = await materiaisResponse.json();
            console.log("Materiais carregados da API:", materiais.length);
        }

        // Carregar movimentações da API
        const movimentacoesResponse = await fetch(`${API_BASE_URL}/movimentacoes`, {
            method: "GET",
            Authorization: `Bearer ${currentUser.getSignInUserSession().idToken.jwtToken}`
        });
        if (movimentacoesResponse.ok) {
            movimentacoes = await movimentacoesResponse.json();
            console.log(
                "Movimentações carregadas da API:",
                movimentacoes.length
            );
        }
    } catch (error) {
        console.error("Erro ao carregar dados da API:", error);
    }
}

function clearStorage() {
    localStorage.removeItem("laboratorio_materiais");
    localStorage.removeItem("laboratorio_movimentacoes");
    localStorage.removeItem("laboratorio_usuarios");
    console.log("Dados limpos do localStorage");
}

// ================================================================================
// Navegação
function navigate(hash) {
    document.querySelectorAll(".screen").forEach((screen) => {
        screen.classList.remove("active");
    });

    const currentScreen = document.getElementById(hash.replace("#", ""));
    if (currentScreen) {
        currentScreen.classList.add("active");
    }

    window.location.hash = hash;
}

// ================================================================================
// Verificar autenticação e grupos:
function checkAuth() {
    // Verificar se o usuário está autenticado:
    const cognitoUser = userPool.getCurrentUser();

    if (cognitoUser) {
        cognitoUser.getSession((err, session) => {
            if (err) {
                // retorna ao login
                navigate("login");
                return;
            }

            if (session.isValid()) {
                currentUser = cognitoUser;

                // Verificar os grupos do usuário:
                getUserGroups(session)
                    .then((groups) => {
                        console.log("Grupos do usuário:", groups);
                        // Verificar se é admin baseado nos grupos
                        userRole = groups.includes("Administrador")
                            ? "admin"
                            : "user";
                        console.log("Role determinado:", userRole);

                        // Obter atributos do usuário:
                        cognitoUser.getUserAttributes((err, attributes) => {
                            if (!err && attributes) {
                                const emailAttr = attributes.find(
                                    (attr) => attr.Name === "email"
                                );
                                const nameAttr = attributes.find(
                                    (attr) => attr.Name === "name"
                                );

                                const userName = nameAttr
                                    ? nameAttr.Value
                                    : emailAttr
                                    ? emailAttr.Value
                                    : "Usuário";
                                document.getElementById(
                                    "user-name"
                                ).textContent = userName;
                                document.getElementById(
                                    "admin-name"
                                ).textContent = userName;

                                // Atualizar informações do perfil
                                updateProfileInfo(
                                    emailAttr ? emailAttr.Value : "",
                                    userName
                                );

                                // Forçar refresh dos dados:
                                loadDataFromStorage();
                            }

                            // Acesso ao dashboard designado ao grupo:
                            navigate(
                                userRole === "admin"
                                    ? "dashboard-admin"
                                    : "dashboard-user"
                            );
                            loadDashboardData();
                        });
                    })
                    .catch((error) => {
                        console.error("Erro ao obter grupos:", error);

                        // Fallback: usar role baseado no email
                        cognitoUser.getUserAttributes((err, attributes) => {
                            if (!err && attributes) {
                                const emailAttr = attributes.find(
                                    (attr) => attr.Name === "email"
                                );
                                userRole =
                                    emailAttr &&
                                    emailAttr.Value.includes("admin")
                                        ? "admin"
                                        : "user";
                                console.log("Role fallback:", userRole);

                                const nameAttr = attributes.find(
                                    (attr) => attr.Name === "name"
                                );
                                const userName = nameAttr
                                    ? nameAttr.Value
                                    : emailAttr
                                    ? emailAttr.Value
                                    : "Usuário";
                                document.getElementById(
                                    "user-name"
                                ).textContent = userName;
                                document.getElementById(
                                    "admin-name"
                                ).textContent = userName;

                                updateProfileInfo(
                                    emailAttr ? emailAttr.Value : "",
                                    userName
                                );

                                loadDataFromStorage();
                                navigate(
                                    userRole === "admin"
                                        ? "dashboard-admin"
                                        : "dashboard-user"
                                );
                                loadDashboardData();
                            }
                        });
                    });
            } else {
                navigate("login");
            }
        });
    } else {
        navigate("login");
    }
}

// Função para obter grupos do usuário:
function getUserGroups(session) {
    try {
        // Obter grupos do token de acesso:
        const accessToken = session.getAccessToken().getJwtToken();
        const payload = JSON.parse(atob(accessToken.split(".")[1]));

        // Grupos estão no campo 'cognito:groups'
        const groups = payload["cognito:groups"] || [];
        console.log("Grupos encontrados:", groups);
        return Promise.resolve(groups);
    } catch (error) {
        console.error("Erro ao decodificar token:", error);
        return Promise.resolve([]);
    }
}

// Atualizar informações do perfil
function updateProfileInfo(email, name) {
    document.getElementById("profile-name").textContent = name;
    document.getElementById("profile-email").textContent = email;
    document.getElementById("profile-role").textContent =
        userRole === "admin" ? "Administrador" : "Usuário Comum";

    // Contar movimentações ativas do usuário
    const activeMovements = movimentacoes.filter(
        (mov) => mov.usuario === name && mov.status === "Em uso"
    ).length;

    document.getElementById("profile-active-movements").textContent =
        activeMovements;
}

// ================================================================================
// TELAS

// Login:
document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    showLoading("login-loading", true);
    clearAlert("login-alert");

    // Obtem token de acesso do usuário:
    const authenticationData = {
        Username: email,
        Password: password,
    };

    const authenticationDetails =
        new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

    const userData = {
        Username: email,
        Pool: userPool,
    };

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
            showLoading("login-loading", false);
            currentUser = cognitoUser;

            // Verificar grupos e redirecionar
            checkAuth();
        },
        onFailure: (err) => {
            showLoading("login-loading", false);
            showAlert("login-alert", "Erro no login: " + err.message, "error");
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
            showLoading("login-loading", false);
            showAlert(
                "login-alert",
                "Nova senha necessária. Entre em contato com o administrador.",
                "info"
            );
        },
    });
});

// Cadastro:
document.getElementById("cadastro-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("cadastro-nome").value;
    const email = document.getElementById("cadastro-email").value;
    const password = document.getElementById("cadastro-password").value;

    showLoading("cadastro-loading", true);
    clearAlert("cadastro-alert");

    // recolhe os dados de cadastro para o Cognito:
    const attributeList = [];

    const dataEmail = {
        Name: "email",
        Value: email,
    };

    const dataName = {
        Name: "name",
        Value: nome,
    };

    const attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(
        dataEmail
    );
    const attributeName = new AmazonCognitoIdentity.CognitoUserAttribute(
        dataName
    );

    attributeList.push(attributeEmail);
    attributeList.push(attributeName);

    userPool.signUp(email, password, attributeList, null, (err, result) => {
        showLoading("cadastro-loading", false);

        if (err) {
            showAlert(
                "cadastro-alert",
                "Erro no cadastro: " + err.message,
                "error"
            );
            return;
        }

        // Adicionar usuário à lista local
        usuarios.push({
            email: email,
            nome: nome,
            status: "Pendente",
            ultimoAcesso: "Nunca",
            movimentacoesAtivas: 0,
        });
        saveDataToStorage();

        pendingConfirmationEmail = email;
        showAlert(
            "cadastro-alert",
            "Cadastro realizado! Verifique seu email para o código de confirmação.",
            "success"
        );

        // Direciona para a tela de confirmação:
        setTimeout(() => {
            navigate("confirmacao");
        }, 2000);
    });
});

// Confirmação:
document.getElementById("confirmacao-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const codigo = document.getElementById("confirmacao-codigo").value;

    if (!pendingConfirmationEmail) {
        showAlert(
            "confirmacao-alert",
            "Erro: Email de confirmação não encontrado.",
            "error"
        );
        return;
    }

    showLoading("confirmacao-loading", true);
    clearAlert("confirmacao-alert");

    const userData = {
        Username: pendingConfirmationEmail,
        Pool: userPool,
    };

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.confirmRegistration(codigo, true, (err, result) => {
        showLoading("confirmacao-loading", false);

        if (err) {
            showAlert(
                "confirmacao-alert",
                "Erro na confirmação: " + err.message,
                "error"
            );
            return;
        }

        // Atualizar status do usuário
        const usuario = usuarios.find(
            (u) => u.email === pendingConfirmationEmail
        );
        if (usuario) {
            usuario.status = "Confirmado";
            saveDataToStorage();
        }

        showAlert(
            "confirmacao-alert",
            "Conta confirmada com sucesso! Você pode fazer login agora.",
            "success"
        );

        // Redireciona para a tela de login:
        setTimeout(() => {
            navigate("login");
            pendingConfirmationEmail = null;
        }, 2000);
    });
});

// Reenviar código:
function reenviarCodigo() {
    if (!pendingConfirmationEmail) {
        showAlert("confirmacao-alert", "Erro: Email não encontrado.", "error");
        return;
    }

    const userData = {
        Username: pendingConfirmationEmail,
        Pool: userPool,
    };

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
            showAlert(
                "confirmacao-alert",
                "Erro ao reenviar código: " + err.message,
                "error"
            );
            return;
        }

        showAlert(
            "confirmacao-alert",
            "Código reenviado com sucesso!",
            "success"
        );
    });
}

// Logout:
function logout() {
    if (currentUser) {
        currentUser.signOut();
    }
    currentUser = null;
    userRole = null;
    navigate("login");
}

// Troca de abas
function switchTab(tabName) {
    document.querySelectorAll(".tab").forEach((tab) => {
        tab.classList.remove("active");
    });

    document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
    });

    event.target.classList.add("active");
    document.getElementById("tab-" + tabName).classList.add("active");

    // Carregar dados específicos da aba
    if (tabName === "usuarios" && userRole === "admin") {
        loadUsuarios();
    }
}

// ================================================================================
// Carregar dados do dashboard:
function loadDashboardData() {
    if (userRole === "admin") {
        loadEstoque();
        loadMovimentacoes();
        loadUsuarios();
    } else {
        loadMateriais();
        loadHistoricoUsuario();
    }
}

// Carregar materiais para seleção:
function loadMateriais() {
    const select = document.getElementById("material-select");
    select.innerHTML = '<option value="">Selecione um material...</option>';

    materiais.forEach((material) => {
        if (material.quantidade > 0) {
            const option = document.createElement("option");
            option.value = material.id;
            option.textContent = `${material.nome} (${material.quantidade} ${material.unidade} disponível)`;
            select.appendChild(option);
        }
    });
}

// Carregar estoque (admin):
function loadEstoque() {
    const tbody = document.getElementById("estoque-tbody");
    tbody.innerHTML = "";

    materiais.forEach((material) => {
        const row = document.createElement("tr");
        const status =
            material.quantidade > 10
                ? "Disponível"
                : material.quantidade > 0
                ? "Baixo Estoque"
                : "Esgotado";
        const statusClass =
            material.quantidade > 10
                ? "success"
                : material.quantidade > 0
                ? "warning"
                : "error";

        row.innerHTML = `
                    <td>${material.id}</td>
                    <td>${material.nome}</td>
                    <td>${material.categoria}</td>
                    <td>${material.quantidade} ${material.unidade}</td>
                    <td>${material.descricao}</td>
                    <td><span class="alert-${statusClass}" style="padding: 4px 8px; border-radius: 4px; font-size: 12px;">${status}</span></td>
                `;
        tbody.appendChild(row);
    });
}

// Carregar movimentações (admin):
function loadMovimentacoes() {
    const tbody = document.getElementById("movimentacoes-tbody");
    tbody.innerHTML = "";

    movimentacoes.forEach((mov) => {
        const row = document.createElement("tr");
        const statusClass =
            mov.status === "Devolvido" ? "status-returned" : "status-active";

        row.innerHTML = `
            <td>${new Date(mov.data).toLocaleDateString("pt-BR")}</td>
            <td>${mov.usuario}</td>
            <td>${mov.material}</td>
            <td>${mov.quantidade}</td>
            <td>${mov.finalidade}</td>
            <td><span class="status-badge ${statusClass}">${
            mov.status
        }</span></td>
            <td>
                ${
                    mov.status === "Em uso"
                        ? `<button class="btn-success" onclick="returnMaterial(${mov.id})">Devolver</button>`
                        : '<span style="color: #666;">-</span>'
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Carregar histórico do usuário:
function loadHistoricoUsuario() {
    const tbody = document.getElementById("historico-tbody");
    tbody.innerHTML = "";

    const userName = document.getElementById("user-name").textContent;
    const userMovs = movimentacoes.filter((mov) => mov.usuario === userName);

    console.log("Carregando histórico para:", userName);
    console.log("Movimentações encontradas:", userMovs.length);

    if (userMovs.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="5" style="text-align: center; color: #666;">Nenhuma movimentação encontrada</td></tr>';
        return;
    }

    // Ordenar por data (mais recente primeiro)
    userMovs.sort((a, b) => new Date(b.data) - new Date(a.data));

    userMovs.forEach((mov) => {
        const row = document.createElement("tr");
        const statusClass =
            mov.status === "Devolvido" ? "status-returned" : "status-active";

        row.innerHTML = `
            <td>${new Date(mov.data).toLocaleDateString("pt-BR")}</td>
            <td>${mov.material}</td>
            <td>${mov.quantidade}</td>
            <td>${mov.finalidade}</td>
            <td><span class="status-badge ${statusClass}">${
            mov.status
        }</span></td>
            <td>
                ${
                    mov.status === "Em uso"
                        ? `<button class="btn-success" onclick="returnMaterial(${mov.id})">Devolver</button>`
                        : '<span style="color: #666;">-</span>'
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Carregar usuários (admin)
// Carregar usuários diretamente do Cognito (admin)
async function loadUsuarios() {
    const tbody = document.getElementById("usuarios-tbody");
    tbody.innerHTML =
        '<tr><td colspan="6" style="text-align: center; color: #666;">Carregando usuários...</td></tr>';

    try {
        // Buscar usuários do Cognito
        const params = {
            UserPoolId: poolData.UserPoolId,
            Limit: 60, // Máximo de usuários por página
        };

        const result = await cognitoIdentityServiceProvider
            .listUsers(params)
            .promise();
        tbody.innerHTML = "";

        if (result.Users.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="6" style="text-align: center; color: #666;">Nenhum usuário encontrado</td></tr>';
            return;
        }

        // Processar cada usuário
        for (const user of result.Users) {
            const email =
                user.Attributes.find((attr) => attr.Name === "email")?.Value ||
                "N/A";
            const name =
                user.Attributes.find((attr) => attr.Name === "name")?.Value ||
                email;
            const status =
                user.UserStatus === "CONFIRMED"
                    ? "Confirmado"
                    : user.UserStatus === "UNCONFIRMED"
                    ? "Pendente"
                    : user.UserStatus;

            // Contar movimentações ativas
            const activeMovements = movimentacoes.filter(
                (mov) =>
                    (mov.usuario === name || mov.usuario === email) &&
                    mov.status === "Em uso"
            ).length;

            const lastLogin = user.UserLastModifiedDate
                ? new Date(user.UserLastModifiedDate).toLocaleDateString(
                      "pt-BR"
                  )
                : "Nunca";

            const row = document.createElement("tr");
            const statusClass =
                status === "Confirmado" ? "status-confirmed" : "status-pending";

            row.innerHTML = `
                <td>${name}</td>
                <td>${email}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>${activeMovements}</td>
                <td>${lastLogin}</td>
                <td>
                    ${
                        activeMovements === 0 &&
                        email !== currentUser?.getUsername()
                            ? `<button class="btn-danger" onclick="deleteUserFromCognito('${email}', '${name}')">Excluir</button>`
                            : activeMovements > 0
                            ? '<span style="color: #666;">Tem materiais pendentes</span>'
                            : '<span style="color: #666;">Usuário atual</span>'
                    }
                </td>
            `;
            tbody.appendChild(row);
        }
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        tbody.innerHTML =
            '<tr><td colspan="6" style="text-align: center; color: #f00;">Erro ao carregar usuários. Verifique as permissões.</td></tr>';

        if (error.code === "NotAuthorizedException") {
            showAlert(
                "usuarios-alert",
                "Erro: Sem permissão para listar usuários. Configure as credenciais de administrador.",
                "error"
            );
        } else {
            showAlert(
                "usuarios-alert",
                `Erro ao carregar usuários: ${error.message}`,
                "error"
            );
        }
    }
}

// Atualizar função de cadastrar material para usar API
document.getElementById("material-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const nome = document.getElementById("material-nome").value;
        const categoria = document.getElementById("material-categoria").value;
        const quantidade = Number.parseInt(
            document.getElementById("material-quantidade").value
        );
        const unidade = document.getElementById("material-unidade").value;
        const descricao = document.getElementById("material-descricao").value;

        const novoMaterial = {
            nome,
            categoria,
            quantidade,
            unidade,
            descricao,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/materiais`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentUser.getSignInUserSession().idToken.jwtToken}`,
                },
                body: JSON.stringify(novoMaterial),
            });

            if (response.ok) {
                const materialCriado = await response.json();
                materiais.push(materialCriado);

                showAlert(
                    "cadastrar-alert",
                    "Material cadastrado com sucesso!",
                    "success"
                );
                document.getElementById("material-form").reset();

                loadEstoque();
                loadMateriais();
            } else {
                throw new Error("Erro ao cadastrar material");
            }
        } catch (error) {
            console.error("Erro ao cadastrar material:", error);
            showAlert(
                "cadastrar-alert",
                "Erro ao cadastrar material. Tente novamente.",
                "error"
            );
        }
    });

// Atualizar função de registrar retirada para usar API
document.getElementById("retirada-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const materialId = Number.parseInt(
            document.getElementById("material-select").value
        );
        const quantidade = Number.parseInt(
            document.getElementById("quantidade-retirada").value
        );
        const finalidade = document.getElementById("finalidade").value;
        const tempoUso = Number.parseInt(
            document.getElementById("tempo-uso").value
        );
        const observacoes = document.getElementById("observacoes").value;

        const material = materiais.find((m) => m.id === materialId);

        if (!material) {
            showAlert("retirada-alert", "Material não encontrado.", "error");
            return;
        }

        if (quantidade > material.quantidade) {
            showAlert(
                "retirada-alert",
                "Quantidade solicitada maior que disponível em estoque.",
                "error"
            );
            return;
        }

        const userName = document.getElementById("user-name").textContent;
        const novaMovimentacao = {
            usuario: userName,
            materialId: materialId,
            materialNome: material.nome,
            quantidade,
            finalidade,
            observacoes: observacoes || "",
            tempoUso: tempoUso,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/movimentacoes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentUser.getSignInUserSession().idToken.jwtToken}`,
                },
                body: JSON.stringify(novaMovimentacao),
            });

            if (response.ok) {
                const movimentacaoCriada = await response.json();

                // Atualizar dados locais
                movimentacoes.push(movimentacaoCriada);

                // Atualizar estoque local
                material.quantidade -= quantidade;

                showAlert(
                    "retirada-alert",
                    "Retirada registrada com sucesso!",
                    "success"
                );
                document.getElementById("retirada-form").reset();

                loadMateriais();
                loadHistoricoUsuario();
                updateProfileInfo(
                    document.getElementById("profile-email").textContent,
                    userName
                );

                if (userRole === "admin") {
                    loadEstoque();
                    loadMovimentacoes();
                }
            } else {
                throw new Error("Erro ao registrar retirada");
            }
        } catch (error) {
            console.error("Erro ao registrar retirada:", error);
            showAlert(
                "retirada-alert",
                "Erro ao registrar retirada. Tente novamente.",
                "error"
            );
        }
    });

// Atualizar função de devolver material para usar API
async function returnMaterial(movimentacaoId) {
    const movimentacao = movimentacoes.find((m) => m.id === movimentacaoId);
    if (!movimentacao) {
        alert("Movimentação não encontrada.");
        return;
    }

    if (movimentacao.status === "Devolvido") {
        alert("Material já foi devolvido.");
        return;
    }

    if (
        !confirm(
            `Confirmar devolução de ${movimentacao.quantidade} ${movimentacao.material}?`
        )
    ) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/movimentacoes/${movimentacaoId}/devolver`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentUser.getSignInUserSession().idToken.jwtToken}`,
                },
            }
        );

        if (response.ok) {
            const movimentacaoAtualizada = await response.json();

            // Atualizar dados locais
            const index = movimentacoes.findIndex(
                (m) => m.id === movimentacaoId
            );
            if (index > -1) {
                movimentacoes[index] = movimentacaoAtualizada;
            }

            // Atualizar estoque local
            const material = materiais.find(
                (m) => m.nome === movimentacao.material
            );
            if (material) {
                material.quantidade += movimentacao.quantidade;
            }

            // Recarregar dados
            if (userRole === "admin") {
                loadEstoque();
                loadMovimentacoes();
            } else {
                loadMateriais();
                loadHistoricoUsuario();
                updateProfileInfo(
                    document.getElementById("profile-email").textContent,
                    document.getElementById("user-name").textContent
                );
            }

            alert("Material devolvido com sucesso!");
        } else {
            throw new Error("Erro ao devolver material");
        }
    } catch (error) {
        console.error("Erro ao devolver material:", error);
        alert("Erro ao devolver material. Tente novamente.");
    }
}

// Deletar conta do usuário
function deleteUserAccount() {
    const userName = document.getElementById("user-name").textContent;
    const userEmail = document.getElementById("profile-email").textContent;

    // Verificar se há movimentações pendentes
    const activeMovements = movimentacoes.filter(
        (mov) => mov.usuario === userName && mov.status === "Em uso"
    );

    if (activeMovements.length > 0) {
        showModal(
            "Não é possível excluir conta",
            "Você possui materiais que ainda não foram devolvidos. Devolva todos os materiais antes de excluir sua conta.",
            `<strong>Materiais pendentes:</strong>
            <ul>
                ${activeMovements
                    .map(
                        (mov) => `<li>${mov.material} (${mov.quantidade})</li>`
                    )
                    .join("")}
            </ul>`,
            null
        );
        return;
    }

    showModal(
        "⚠️ Excluir Conta",
        "Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.",
        "<strong>Consequências:</strong><br>• Sua conta será permanentemente removida<br>• Você perderá acesso ao sistema<br>• Seu histórico será mantido para fins de auditoria",
        () => executeSelfDeleteAccount(userEmail, userName)
    );
}

// Deletar usuário:
async function executeSelfDeleteAccount(email, nome) {
    try {
        showAlert("perfil-alert", "Excluindo conta...", "info");

        // Usuário pode deletar a própria conta
        await currentUser.deleteUser((err, result) => {
            if (err) {
                console.error("Erro ao excluir própria conta:", err);
                showAlert(
                    "perfil-alert",
                    `Erro ao excluir conta: ${err.message}`,
                    "error"
                );
                return;
            }

            // Marcar movimentações como de usuário excluído
            movimentacoes.forEach((mov) => {
                if (mov.usuario === nome || mov.usuario === email) {
                    mov.usuarioExcluido = true;
                }
            });

            saveDataToStorage();

            showAlert(
                "perfil-alert",
                "Conta excluída com sucesso. Você será desconectado.",
                "success"
            );

            setTimeout(() => {
                logout();
            }, 2000);
        });
    } catch (error) {
        console.error("Erro ao excluir própria conta:", error);
        showAlert(
            "perfil-alert",
            "Erro ao excluir conta. Tente novamente.",
            "error"
        );
    }
}

// Deletar usuário do Cognito
async function deleteUserFromCognito(email, nome) {
    // Verificar se há movimentações pendentes
    const activeMovements = movimentacoes.filter(
        (mov) =>
            (mov.usuario === nome || mov.usuario === email) &&
            mov.status === "Em uso"
    );

    if (activeMovements.length > 0) {
        showModal(
            "Não é possível excluir usuário",
            `O usuário ${nome} possui materiais que ainda não foram devolvidos.`,
            `<strong>Materiais pendentes:</strong>
            <ul>
                ${activeMovements
                    .map(
                        (mov) => `<li>${mov.material} (${mov.quantidade})</li>`
                    )
                    .join("")}
            </ul>`,
            null
        );
        return;
    }

    showModal(
        "⚠️ Excluir Usuário",
        `Tem certeza que deseja excluir o usuário ${nome}?`,
        "<strong>Consequências:</strong><br>• A conta será permanentemente removida do Cognito<br>• O usuário perderá acesso ao sistema<br>• O histórico será mantido para fins de auditoria",
        () => executeDeleteUserFromCognito(email, nome)
    );
}

// Executar exclusão real do usuário no Cognito
async function executeDeleteUserFromCognito(email, nome) {
    try {
        showAlert("usuarios-alert", "Excluindo usuário...", "info");

        const params = {
            UserPoolId: poolData.UserPoolId,
            Username: email,
        };

        await cognitoIdentityServiceProvider.adminDeleteUser(params).promise();

        // Remover das movimentações locais (manter histórico mas marcar como usuário excluído)
        movimentacoes.forEach((mov) => {
            if (mov.usuario === nome || mov.usuario === email) {
                mov.usuarioExcluido = true;
            }
        });

        saveDataToStorage();

        showAlert(
            "usuarios-alert",
            `Usuário ${nome} excluído com sucesso do Cognito.`,
            "success"
        );

        // Recarregar lista de usuários
        setTimeout(() => {
            loadUsuarios();
        }, 1000);
    } catch (error) {
        console.error("Erro ao excluir usuário do Cognito:", error);

        let errorMessage = "Erro ao excluir usuário. ";

        if (error.code === "NotAuthorizedException") {
            errorMessage +=
                "Sem permissão para excluir usuários. Configure as credenciais de administrador.";
        } else if (error.code === "UserNotFoundException") {
            errorMessage += "Usuário não encontrado no Cognito.";
        } else {
            errorMessage += error.message;
        }

        showAlert("usuarios-alert", errorMessage, "error");
    }
}

// Modal functions
function showModal(title, message, details, confirmCallback) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-message").textContent = message;
    document.getElementById("modal-details").innerHTML = details || "";

    const confirmBtn = document.getElementById("modal-confirm-btn");
    if (confirmCallback) {
        confirmBtn.style.display = "inline-block";
        pendingAction = confirmCallback;
    } else {
        confirmBtn.style.display = "none";
        pendingAction = null;
    }

    document.getElementById("confirmation-modal").style.display = "block";
}

function closeModal() {
    document.getElementById("confirmation-modal").style.display = "none";
    pendingAction = null;
}

function confirmAction() {
    if (pendingAction) {
        pendingAction();
        pendingAction = null;
    }
    closeModal();
}

// ================================================================================
// FUNÇÕES AUXILIARES:

function showAlert(elementId, message, type) {
    const alertElement = document.getElementById(elementId);
    alertElement.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function clearAlert(elementId) {
    document.getElementById(elementId).innerHTML = "";
}

function showLoading(elementId, show) {
    const loadingElement = document.getElementById(elementId);
    if (show) {
        loadingElement.style.display = "block";
    } else {
        loadingElement.style.display = "none";
    }
}

// Função de debug
function debugData() {
    console.log("=== DEBUG DE DADOS ===");
    console.log(
        "Usuário atual:",
        currentUser ? currentUser.getUsername() : "Nenhum"
    );
    console.log("Role do usuário:", userRole);
    console.log("Total de materiais:", materiais.length);
    console.log("Materiais:", materiais);
    console.log("Total de movimentações:", movimentacoes.length);
    console.log("Movimentações:", movimentacoes);
    console.log("Total de usuários:", usuarios.length);
    console.log("Usuários:", usuarios);
    console.log(
        "LocalStorage materiais:",
        localStorage.getItem("laboratorio_materiais")
    );
    console.log(
        "LocalStorage movimentações:",
        localStorage.getItem("laboratorio_movimentacoes")
    );
    console.log(
        "LocalStorage usuários:",
        localStorage.getItem("laboratorio_usuarios")
    );

    alert(`Debug concluído! Verifique o console do navegador.
    
Resumo:
- Materiais: ${materiais.length}
- Movimentações: ${movimentacoes.length}
- Usuários: ${usuarios.length}
- Role: ${userRole}
- Usuário: ${currentUser ? currentUser.getUsername() : "Nenhum"}`);
}

// Inicialização:
window.addEventListener("load", () => {
    // Carregar dados salvos
    loadDataFromStorage();

    const hash = window.location.hash || "#login";

    if (hash === "#login" || hash === "#cadastro" || hash === "#confirmacao") {
        navigate(hash);
    } else {
        checkAuth();
    }
});

window.addEventListener("hashchange", () => {
    const hash = window.location.hash;

    if (hash === "#login" || hash === "#cadastro" || hash === "#confirmacao") {
        navigate(hash);
    }
});

// Fechar modal ao clicar fora dele
window.addEventListener("click", (event) => {
    const modal = document.getElementById("confirmation-modal");
    if (event.target === modal) {
        closeModal();
    }
});

setTimeout(() => {
    loadMateriais();
}, 1000);

async function carregarDadosJSON(caminhoArquivo) {
    try {
        const resposta = await fetch(caminhoArquivo);
        if (!resposta.ok) {
            throw new Error(
                `Erro ao carregar o arquivo: ${resposta.statusText}`
            );
        }

        const dados = await resposta.json();
        // console.log(dados);
        return await dados;
    } catch (error) {
        console.error(`Ocorreu um erro: ${error.message}`);
        return null;
    }
}
